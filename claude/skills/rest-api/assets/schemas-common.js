// src/schemas/common.js
//
// Shapes that appear in more than one contract live here exactly once. Reuse
// the *same object* (not a copy) — the OpenAPI generator dedupes by identity
// and emits each named schema once under components/schemas.

// ---------------------------------------------------------------- primitives

const uuid = { type: 'string', format: 'uuid' };
const timestamp = { type: 'string', format: 'date-time' };
const nullableTimestamp = { type: ['string', 'null'], format: 'date-time' };

// A :id path parameter. Spread into a contract's `params`.
const uuidParam = {
  type: 'object',
  required: ['id'],
  properties: { id: uuid },
};

// ---------------------------------------------------------------- pagination

const paginationQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    offset: { type: 'integer', minimum: 0, default: 0 },
  },
};

const paginationMeta = {
  type: 'object',
  required: ['total', 'limit', 'offset'],
  properties: {
    total: { type: 'integer', minimum: 0 },
    limit: { type: 'integer' },
    offset: { type: 'integer' },
  },
};

// Build a list query by extending the shared pagination block:
//   query: listQuery({ status: { type: 'string', enum: ['active', 'disabled'] } })
function listQuery(properties = {}, { sortable = [] } = {}) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...paginationQuery.properties,
      ...(sortable.length && {
        sort: {
          type: 'string',
          description: `Comma-separated fields; prefix with \`-\` for descending. Allowed: ${sortable.join(', ')}.`,
          pattern: `^-?(${sortable.join('|')})(,-?(${sortable.join('|')}))*$`,
        },
      }),
      ...properties,
    },
  };
}

// ------------------------------------------------------------------ response

// Marker consumed by the OpenAPI generator: emit the shared error response for
// each status instead of an inline schema.
//
//   responses: { 200: userResponse, ...errors(400, 401, 404) }
const ERROR_RESPONSE = { __error: true };

function errors(...statuses) {
  return Object.fromEntries(statuses.map((status) => [status, ERROR_RESPONSE]));
}

// Explicit description or a non-default envelope for a success response.
function response(schema, description) {
  return { __response: true, schema, description };
}

// 204 has no body. `null` says so.
const noContent = null;

module.exports = {
  uuid,
  timestamp,
  nullableTimestamp,
  uuidParam,
  paginationQuery,
  paginationMeta,
  listQuery,
  ERROR_RESPONSE,
  errors,
  response,
  noContent,
};
