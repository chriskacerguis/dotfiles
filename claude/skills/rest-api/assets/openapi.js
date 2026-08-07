// src/lib/openapi.js
//
// Turns the route registry + the JSON Schemas that already validate requests
// into an OpenAPI 3.1 document. Nothing here is hand-written prose: if an
// endpoint's behaviour changes, its schema changes, and the spec follows.
//
//   const spec = buildSpec({ info, servers, registry, namedSchemas });
//
// Shared schema objects passed in `namedSchemas` are emitted once under
// components/schemas and $ref'd everywhere they appear. Matching is by object
// identity, so reuse the same exported object rather than copying its shape.

const { registry } = require('./apiRouter');

const STATUS_TEXT = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No content',
  400: 'Bad request — the request failed schema validation',
  401: 'Authentication required or credentials invalid',
  403: 'Authenticated but not permitted to perform this operation',
  404: 'Resource not found',
  405: 'Method not allowed',
  409: 'Conflict with the current state of the resource',
  410: 'Gone',
  412: 'Precondition failed',
  413: 'Request body too large',
  415: 'Unsupported media type — expected application/json',
  422: 'Unprocessable content — a business rule rejected the request',
  429: 'Rate limit exceeded',
  500: 'Internal server error',
  502: 'Bad gateway',
  503: 'Service unavailable',
};

const ERROR_SCHEMA = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', description: 'Human-readable description of the failure.' },
        code: { type: 'string', description: 'Stable machine-readable error code.' },
        details: {
          type: 'array',
          description: 'Field-level failures, present on validation errors.',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

// Keywords whose values are themselves schemas, or maps/arrays of schemas.
const SCHEMA_VALUE_KEYS = ['items', 'not', 'if', 'then', 'else', 'additionalProperties', 'contains'];
const SCHEMA_MAP_KEYS = ['properties', 'patternProperties', '$defs', 'definitions'];
const SCHEMA_LIST_KEYS = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];

function expressPathToOpenApi(path) {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function pathParamNames(path) {
  return [...path.matchAll(/:([A-Za-z0-9_]+)/g)].map((m) => m[1]);
}

function createSerializer(namedSchemas) {
  // Object identity → component name.
  const names = new Map();
  for (const [name, schema] of Object.entries(namedSchemas)) {
    if (schema && typeof schema === 'object') names.set(schema, name);
  }

  function walk(node, isRoot = false) {
    if (node === null || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map((item) => walk(item));

    if (!isRoot && names.has(node)) {
      return { $ref: `#/components/schemas/${names.get(node)}` };
    }

    const out = {};
    for (const [key, value] of Object.entries(node)) {
      if (SCHEMA_MAP_KEYS.includes(key) && value && typeof value === 'object') {
        out[key] = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
      } else if (SCHEMA_LIST_KEYS.includes(key) && Array.isArray(value)) {
        out[key] = value.map((v) => walk(v));
      } else if (SCHEMA_VALUE_KEYS.includes(key)) {
        out[key] = typeof value === 'object' ? walk(value) : value;
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  return {
    schema: (node) => walk(node, false),
    components: () =>
      Object.fromEntries(Object.entries(namedSchemas).map(([name, schema]) => [name, walk(schema, true)])),
  };
}

// { data: <payload>, meta?: <meta> } — the envelope is applied here so no
// contract ever has to spell it out.
function envelope(dataSchema, metaSchema) {
  return {
    type: 'object',
    required: ['data'],
    properties: {
      data: dataSchema,
      ...(metaSchema && { meta: metaSchema }),
    },
  };
}

function jsonContent(schema) {
  return { content: { 'application/json': { schema } } };
}

// A parameter carries its own `description`, so lift it out of the schema copy
// rather than emitting the same prose twice.
function parameter(name, location, required, schema, serialize) {
  const serialized = serialize(schema);
  if (serialized.$ref) return { name, in: location, required, schema: serialized };

  const { description, ...rest } = serialized;
  return { name, in: location, required, ...(description && { description }), schema: rest };
}

function buildParameters(contract, path, serialize) {
  const parameters = [];
  const declared = contract.params?.properties ?? {};

  for (const name of pathParamNames(path)) {
    const schema = declared[name];
    if (!schema) {
      throw new Error(`Path parameter ":${name}" in ${path} is not declared in the contract's \`params\``);
    }
    parameters.push(parameter(name, 'path', true, schema, serialize));
  }

  const query = contract.query?.properties ?? {};
  const requiredQuery = contract.query?.required ?? [];
  for (const [name, schema] of Object.entries(query)) {
    parameters.push(parameter(name, 'query', requiredQuery.includes(name), schema, serialize));
  }

  return parameters;
}

function buildResponses(contract, serialize, usedErrorStatuses) {
  const responses = {};

  for (const [statusKey, value] of Object.entries(contract.responses ?? {})) {
    const status = Number(statusKey);

    if (value === null || status === 204) {
      responses[status] = { description: STATUS_TEXT[status] ?? 'No content' };
      continue;
    }

    if (value?.__error) {
      usedErrorStatuses.add(status);
      responses[status] = { $ref: `#/components/responses/Error${status}` };
      continue;
    }

    const payload = value?.__response ? value.schema : value;
    const description = value?.__response ? value.description : undefined;

    responses[status] = {
      description: description ?? STATUS_TEXT[status] ?? 'Success',
      ...jsonContent(envelope(serialize(payload), contract.meta && serialize(contract.meta))),
      ...(status === 201 && {
        headers: {
          Location: {
            description: 'URL of the newly created resource.',
            schema: { type: 'string', format: 'uri-reference' },
          },
        },
      }),
    };
  }

  if (Object.keys(responses).length === 0) {
    throw new Error(`Contract "${contract.operationId ?? contract.summary}" declares no responses`);
  }
  return responses;
}

function buildSpec({
  info,
  servers = [],
  tags = [],
  securitySchemes = {},
  security = [],
  namedSchemas = {},
  routes = registry,
} = {}) {
  if (!info?.title || !info?.version) throw new TypeError('buildSpec requires info.title and info.version');

  const serializer = createSerializer(namedSchemas);
  const serialize = serializer.schema;
  const usedErrorStatuses = new Set();
  const paths = {};

  // Deterministic output: paths alphabetical, methods in conventional order.
  // Without this the diff in review is noise rather than signal.
  const METHOD_ORDER = ['get', 'post', 'put', 'patch', 'delete'];
  const sorted = [...routes].sort(
    (a, b) => a.path.localeCompare(b.path) || METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method)
  );

  for (const { method, path, contract } of sorted) {
    const specPath = expressPathToOpenApi(path);
    paths[specPath] ??= {};

    const operation = {
      operationId: contract.operationId,
      summary: contract.summary,
      ...(contract.description && { description: contract.description }),
      ...(contract.tags && { tags: contract.tags }),
      ...(contract.deprecated && { deprecated: true }),
      ...(contract.public && { security: [] }),
      ...(contract.security && { security: contract.security }),
    };

    if (!operation.operationId) throw new Error(`${method.toUpperCase()} ${path}: contract needs an operationId`);
    if (!operation.summary) throw new Error(`${method.toUpperCase()} ${path}: contract needs a summary`);

    const parameters = buildParameters(contract, path, serialize);
    if (parameters.length) operation.parameters = parameters;

    if (contract.body) {
      operation.requestBody = {
        required: true,
        ...jsonContent(serialize(contract.body)),
      };
    }

    operation.responses = buildResponses(contract, serialize, usedErrorStatuses);
    paths[specPath][method] = operation;
  }

  const errorResponses = {};
  for (const status of [...usedErrorStatuses].sort((a, b) => a - b)) {
    errorResponses[`Error${status}`] = {
      description: STATUS_TEXT[status] ?? 'Error',
      ...jsonContent({ $ref: '#/components/schemas/Error' }),
    };
  }

  return {
    openapi: '3.1.0',
    info: {
      ...info,
      description: [
        info.description,
        'Successful responses are wrapped in `{ "data": ... }`; failures are `{ "error": { "message": ... } }`.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
    ...(servers.length && { servers }),
    ...(tags.length && { tags }),
    ...(security.length && { security }),
    paths,
    components: {
      schemas: { Error: ERROR_SCHEMA, ...serializer.components() },
      ...(Object.keys(errorResponses).length && { responses: errorResponses }),
      ...(Object.keys(securitySchemes).length && { securitySchemes }),
    },
  };
}

module.exports = { buildSpec, expressPathToOpenApi, ERROR_SCHEMA, STATUS_TEXT };
