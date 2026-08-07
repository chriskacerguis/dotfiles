// src/lib/apiRouter.js
//
// A thin wrapper over express.Router that records every route in one registry.
// It exists for two reasons, both of them DRY:
//
//   1. validate(contract) can never be forgotten — declaring a route wires it.
//   2. bin/generate-openapi.js and the contract test read the registry directly,
//      so the spec is derived from the real route table instead of a
//      hand-maintained list that can drift.
//
//   // src/routes/users.js
//   const { createRouter } = require('../lib/apiRouter');
//   const schemas = require('../schemas/users');
//   const users = require('../controllers/users');
//
//   const api = createRouter('/api/users', { tag: 'Users' });
//   api.get('/', schemas.listUsers, users.list);
//   api.post('/', schemas.createUser, users.create);
//   api.get('/:id', schemas.getUser, users.get);
//
//   module.exports = api;

const express = require('express');
const validate = require('../middleware/validate');

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

// Every route in the process, in declaration order:
//   { method, path, contract }  — path is the full express path, e.g. /api/users/:id
const registry = [];

function joinPath(basePath, path) {
  const base = basePath.replace(/\/+$/, '');
  if (!path || path === '/') return base || '/';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function createRouter(basePath, { tag, security } = {}) {
  if (!basePath?.startsWith('/')) throw new TypeError('createRouter(basePath) must start with "/"');

  const router = express.Router({ mergeParams: true });
  const api = { basePath, router };

  for (const method of METHODS) {
    api[method] = function define(path, contract, ...handlers) {
      if (!contract || typeof contract !== 'object') {
        throw new TypeError(`${method.toUpperCase()} ${joinPath(basePath, path)}: missing schema contract`);
      }
      if (handlers.length === 0) {
        throw new TypeError(`${method.toUpperCase()} ${joinPath(basePath, path)}: missing handler`);
      }

      const fullPath = joinPath(basePath, path);
      if (registry.some((r) => r.method === method && r.path === fullPath)) {
        throw new Error(`Duplicate route: ${method.toUpperCase()} ${fullPath}`);
      }

      registry.push({
        method,
        path: fullPath,
        contract: {
          tags: tag ? [tag] : undefined,
          ...(security && { security }),
          ...contract,
        },
      });

      router[method](path, validate(contract), ...handlers);
      return api; // chainable
    };
  }

  return api;
}

// Enumerate the routes actually mounted on the express routers, derived from
// express's own route table rather than from the registry.
//
// The contract test compares this against the registry, and that comparison is
// only meaningful because the two are independent: a route declared with a bare
// `router.get(...)` bypasses createRouter, so it shows up here and *not* in the
// registry — an undocumented, unvalidated endpoint, and a failing build.
function listMountedRoutes(routeModules) {
  const found = [];

  for (const { basePath, router } of routeModules) {
    for (const layer of router.stack) {
      if (!layer.route) continue;

      const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const routePath of paths) {
        if (typeof routePath !== 'string') {
          throw new Error(`Route under ${basePath} uses a non-string path; it cannot be documented`);
        }
        for (const method of Object.keys(layer.route.methods)) {
          if (METHODS.includes(method)) found.push({ method, path: joinPath(basePath, routePath) });
        }
      }
    }
  }

  return found;
}

module.exports = { createRouter, registry, listMountedRoutes, METHODS };
