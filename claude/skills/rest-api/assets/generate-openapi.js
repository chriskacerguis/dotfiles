#!/usr/bin/env node
// bin/generate-openapi.js  —  npm run openapi:generate
//
// Writes docs/openapi.yaml from the live route registry. That file is a build
// artifact: never hand-edit it — change the schema and re-run this.
//
// package.json:
//   "openapi:generate": "node bin/generate-openapi.js",
//   "openapi:check":    "npm run openapi:generate && git diff --exit-code docs/openapi.yaml",
//   "openapi:lint":     "npx @redocly/cli lint docs/openapi.yaml"
//
// The document itself is defined in src/lib/spec.js, so the contract test can
// rebuild exactly what this script writes.

const fs = require('node:fs');
const path = require('node:path');
const { buildProjectSpec, toYaml, SPEC_PATH, registry } = require('../src/lib/spec');

fs.mkdirSync(path.dirname(SPEC_PATH), { recursive: true });
fs.writeFileSync(SPEC_PATH, toYaml(buildProjectSpec()));

process.stdout.write(`docs/openapi.yaml written — ${registry.length} operations\n`);
