// tests/openapi.contract.test.js
//
// The gates that keep docs/openapi.yaml honest. Each of these failing is a red
// build, not a TODO:
//
//   1. Coverage  — every route express actually serves is declared and
//                  documented, and the spec invents nothing.
//   2. Freshness — the committed YAML is byte-identical to what the generator
//                  produces right now.
//   3. Rigour    — every operation is identified and declares its failures.
//
// Coverage is checked against express's own route table, not against the
// registry the spec is built from. Comparing the spec to its own source would
// prove nothing.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

// The route registry is mutable module state, so every reference to it must
// resolve to the same module instance. Vite's ESM transform and the CJS
// `require` inside src/lib/spec.js do not share a module graph — importing
// apiRouter directly would hand this test a second, empty registry and the
// coverage assertions would pass vacuously. createRequire pins everything to
// Node's CJS loader, the same graph the app itself is built in.
const require = createRequire(import.meta.url);

const { buildProjectSpec, toYaml, SPEC_PATH } = require('../src/lib/spec.js');
const { registry, listMountedRoutes } = require('../src/lib/apiRouter.js');
const { expressPathToOpenApi } = require('../src/lib/openapi.js');
const routeModules = require('../src/routes/index.js');

const spec = buildProjectSpec();
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

const key = ({ method, path }) => `${method.toUpperCase()} ${expressPathToOpenApi(path)}`;

const mountedKeys = listMountedRoutes(routeModules).map(key).sort();
const registryKeys = registry.map(key).sort();

const operations = Object.entries(spec.paths).flatMap(([p, item]) =>
  Object.entries(item)
    .filter(([method]) => HTTP_METHODS.includes(method))
    .map(([method, op]) => ({ key: `${method.toUpperCase()} ${p}`, op }))
);
const specKeys = operations.map((o) => o.key).sort();

describe('OpenAPI coverage', () => {
  it('declares every route express serves — a bare router.get() bypasses validation', () => {
    expect(mountedKeys.filter((k) => !registryKeys.includes(k))).toEqual([]);
  });

  it('serves every route the registry declares', () => {
    expect(registryKeys.filter((k) => !mountedKeys.includes(k))).toEqual([]);
  });

  it('documents every route it serves', () => {
    expect(mountedKeys.filter((k) => !specKeys.includes(k))).toEqual([]);
  });

  it('documents no route that does not exist', () => {
    expect(specKeys.filter((k) => !mountedKeys.includes(k))).toEqual([]);
  });
});

describe('OpenAPI freshness', () => {
  it('matches the committed file — run `npm run openapi:generate`', () => {
    const committed = fs.existsSync(SPEC_PATH) ? fs.readFileSync(SPEC_PATH, 'utf8') : '';
    expect(toYaml(spec)).toBe(committed);
  });
});

describe('contract rigour', () => {
  it('gives every operation a unique operationId', () => {
    const ids = operations.map(({ op }) => op.operationId);
    expect(ids.filter(Boolean)).toHaveLength(ids.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares at least one 4xx response per operation', () => {
    const missing = operations
      .filter(({ op }) => !Object.keys(op.responses).some((s) => Number(s) >= 400 && Number(s) < 500))
      .map(({ key: k }) => k);
    expect(missing).toEqual([]);
  });

  it('declares a JSON schema for every request body', () => {
    const bad = operations
      .filter(({ op }) => op.requestBody && !op.requestBody.content?.['application/json']?.schema)
      .map(({ key: k }) => k);
    expect(bad).toEqual([]);
  });

  it('bounds the limit parameter on every collection endpoint', () => {
    const unbounded = operations
      .filter(({ op }) => op.parameters?.some((p) => p.name === 'limit' && p.schema.maximum === undefined))
      .map(({ key: k }) => k);
    expect(unbounded).toEqual([]);
  });
});
