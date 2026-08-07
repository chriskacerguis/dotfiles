// src/middleware/validate.js
//
// Validates req.params / req.query / req.body against the same contract object
// that generates docs/openapi.yaml. If a schema is wrong, tests fail — which is
// what keeps the documentation honest.
//
//   router.get('/', validate(schemas.listUsers), users.list);
//
// After this middleware runs, the request is coerced (query strings become the
// declared types), defaulted (schema `default` values are filled in), and known
// to match the schema. A controller never re-checks input.

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { BadRequest, UnsupportedMediaType } = require('../lib/errors');

// Two instances on purpose. Path and query values arrive as strings and must be
// coerced; a JSON body already carries real types, and coercing it would let
// `{"limit": "10"}` through as a number — silently accepting a wrong contract.
const ajvInput = new Ajv({ allErrors: true, coerceTypes: true, useDefaults: true, strict: false });
const ajvBody = new Ajv({ allErrors: true, coerceTypes: false, useDefaults: true, strict: false });
addFormats(ajvInput);
addFormats(ajvBody);

// Compiled validators are cached per contract object, so a hot route compiles once.
const compiled = new WeakMap();

function compile(contract) {
  let entry = compiled.get(contract);
  if (!entry) {
    entry = {
      params: contract.params && ajvInput.compile(contract.params),
      query: contract.query && ajvInput.compile(contract.query),
      body: contract.body && ajvBody.compile(contract.body),
    };
    compiled.set(contract, entry);
  }
  return entry;
}

function toDetails(source, errors) {
  return errors.map((e) => ({
    field: `${source}${e.instancePath}`.replace(/\//g, '.') || source,
    message: e.message,
    ...(e.params?.allowedValues && { allowed: e.params.allowedValues }),
  }));
}

function validate(contract) {
  if (!contract) throw new TypeError('validate() requires a contract');

  return function validateRequest(req, res, next) {
    try {
      const validators = compile(contract);
      const details = [];

      if (validators.params) {
        const params = { ...req.params };
        if (!validators.params(params)) details.push(...toDetails('params', validators.params.errors));
        else Object.assign(req.params, params);
      }

      if (validators.query) {
        // Express 5 exposes req.query through a getter, so mutating the object
        // it returns is not guaranteed to stick. Replace the property outright.
        const query = { ...req.query };
        if (!validators.query(query)) {
          details.push(...toDetails('query', validators.query.errors));
        } else {
          Object.defineProperty(req, 'query', {
            value: query,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }

      if (contract.body) {
        if (req.body === undefined || !req.is('application/json')) {
          throw new UnsupportedMediaType('Expected Content-Type: application/json');
        }
        const body = req.body;
        if (!validators.body(body)) details.push(...toDetails('body', validators.body.errors));
      }

      if (details.length) {
        throw new BadRequest('Validation failed', { code: 'VALIDATION_ERROR', details });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;
