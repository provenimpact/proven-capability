#!/usr/bin/env node

/**
 * validate-constraints.js
 *
 * Validates project constraints YAML file against:
 * 1. JSON Schema (structure and types)
 * 2. Constraint ID uniqueness (no duplicates across categories)
 * 3. Sequential constraint IDs (C-001, C-002, ... without gaps)
 * 4. Category name uniqueness
 *
 * Usage:
 *   node scripts/validate-constraints.js docs/constraints.yaml
 *   node scripts/validate-constraints.js --default  # validates docs/constraints.yaml
 *
 * Dependencies (peer):
 *   npm install ajv ajv-formats yaml
 *
 * Exit codes:
 *   0 = valid
 *   1 = validation errors found
 *   2 = usage error
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

let Ajv, addFormats, YAML;
try {
  ({ default: Ajv } = await import("ajv"));
  ({ default: addFormats } = await import("ajv-formats"));
  YAML = await import("yaml");
} catch {
  console.error(
    "Missing dependencies. Install them with:\n  npm install ajv ajv-formats yaml\n"
  );
  process.exit(2);
}

const SCHEMA_PATH = resolve(
  import.meta.dirname,
  "..",
  "skills",
  "proven-needs",
  "schemas",
  "constraints.schema.json"
);

if (!existsSync(SCHEMA_PATH)) {
  console.error(`Schema not found at: ${SCHEMA_PATH}`);
  process.exit(2);
}

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf-8"));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

// Determine file path
const args = process.argv.slice(2);
let filePath;
if (args.includes("--default") || args.length === 0) {
  filePath = resolve("docs", "constraints.yaml");
} else {
  filePath = args[0];
}

if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(2);
}

const errors = [];

// Parse YAML
let doc;
try {
  const raw = readFileSync(filePath, "utf-8");
  doc = YAML.parse(raw);
} catch (err) {
  console.error(`YAML parse error: ${err.message}`);
  process.exit(1);
}

// Schema validation
const valid = validateSchema(doc);
if (!valid) {
  for (const err of validateSchema.errors) {
    const path = err.instancePath || "(root)";
    errors.push(`schema: ${path} ${err.message}`);
  }
  // Early return -- structural checks may crash
  console.log(`FAIL  ${filePath}`);
  for (const err of errors) console.log(`  - ${err}`);
  console.log(`\n${errors.length} error(s) found.`);
  process.exit(1);
}

// Category name uniqueness
const categoryNames = new Set();
for (const cat of doc.categories) {
  if (categoryNames.has(cat.name)) {
    errors.push(`duplicate category name: "${cat.name}"`);
  }
  categoryNames.add(cat.name);
}

// Constraint ID uniqueness and sequential check
const allIds = [];
for (const cat of doc.categories) {
  for (const c of cat.constraints) {
    allIds.push({ id: c.id, category: cat.name });
  }
}

const idSet = new Set();
for (const { id, category } of allIds) {
  if (idSet.has(id)) {
    errors.push(`duplicate constraint ID: ${id} (in category "${category}")`);
  }
  idSet.add(id);
}

// Sequential numbering check (C-001, C-002, ...)
const nums = allIds.map(({ id }) => parseInt(id.replace("C-", ""), 10));
for (let i = 0; i < nums.length; i++) {
  if (nums[i] !== i + 1) {
    errors.push(
      `constraint ID gap or out of order: expected C-${String(i + 1).padStart(3, "0")} but found ${allIds[i].id}`
    );
    break;
  }
}

if (errors.length === 0) {
  console.log(`PASS  ${filePath}`);
  console.log(
    `  ${allIds.length} constraint(s) across ${doc.categories.length} categories.`
  );
} else {
  console.log(`FAIL  ${filePath}`);
  for (const err of errors) console.log(`  - ${err}`);
}

console.log(
  `\n${errors.length === 0 ? "Valid." : `${errors.length} error(s) found.`}`
);
process.exit(errors.length === 0 ? 0 : 1);
