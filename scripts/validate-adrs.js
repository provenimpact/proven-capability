#!/usr/bin/env node

/**
 * validate-adrs.js
 *
 * Validates ADR YAML files against:
 * 1. JSON Schema (individual ADR files + index)
 * 2. ID uniqueness (no duplicate ADR IDs)
 * 3. Sequential ADR numbering (ADR-0001, ADR-0002, ...)
 * 4. Index consistency (index entries match individual files)
 * 5. Supersession integrity (superseded ADRs reference valid successors)
 * 6. Filename-ID consistency (file 0001-*.yaml must contain ADR-0001)
 *
 * Usage:
 *   node scripts/validate-adrs.js docs/adrs/
 *   node scripts/validate-adrs.js --default  # validates docs/adrs/
 *
 * Dependencies (peer):
 *   npm install ajv ajv-formats yaml
 *
 * Exit codes:
 *   0 = all valid
 *   1 = validation errors found
 *   2 = usage error
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

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

const ADR_SCHEMA_PATH = resolve(
  import.meta.dirname,
  "..",
  "skills",
  "needs-adr",
  "schemas",
  "adr.schema.json"
);
const INDEX_SCHEMA_PATH = resolve(
  import.meta.dirname,
  "..",
  "skills",
  "needs-adr",
  "schemas",
  "adr-index.schema.json"
);

for (const p of [ADR_SCHEMA_PATH, INDEX_SCHEMA_PATH]) {
  if (!existsSync(p)) {
    console.error(`Schema not found at: ${p}`);
    process.exit(2);
  }
}

const adrSchema = JSON.parse(readFileSync(ADR_SCHEMA_PATH, "utf-8"));
const indexSchema = JSON.parse(readFileSync(INDEX_SCHEMA_PATH, "utf-8"));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateAdr = ajv.compile(adrSchema);
const validateIndex = ajv.compile(indexSchema);

// Determine directory
const args = process.argv.slice(2);
let adrsDir;
if (args.includes("--default") || args.length === 0) {
  adrsDir = resolve("docs", "adrs");
} else {
  adrsDir = args[0];
}

if (!existsSync(adrsDir)) {
  console.error(`Directory not found: ${adrsDir}`);
  process.exit(2);
}

const errors = [];
const adrDocs = new Map(); // id -> {doc, filename}

// Discover files
const files = readdirSync(adrsDir).filter((f) => f.endsWith(".yaml"));
const indexFile = files.find((f) => f === "index.yaml");
const adrFiles = files.filter(
  (f) => f !== "index.yaml" && /^\d{4}-.+\.yaml$/.test(f)
);

if (adrFiles.length === 0) {
  console.error(`No ADR files found in ${adrsDir}`);
  process.exit(2);
}

// Validate individual ADR files
for (const filename of adrFiles) {
  const filePath = join(adrsDir, filename);
  let doc;

  try {
    const raw = readFileSync(filePath, "utf-8");
    doc = YAML.parse(raw);
  } catch (err) {
    errors.push(`${filename}: YAML parse error: ${err.message}`);
    continue;
  }

  const valid = validateAdr(doc);
  if (!valid) {
    for (const err of validateAdr.errors) {
      const path = err.instancePath || "(root)";
      errors.push(`${filename}: schema: ${path} ${err.message}`);
    }
    continue;
  }

  // Filename-ID consistency: 0001-*.yaml should contain ADR-0001
  const fileNum = filename.match(/^(\d{4})-/)?.[1];
  const idNum = doc.id.match(/^ADR-(\d{4})$/)?.[1];
  if (fileNum && idNum && fileNum !== idNum) {
    errors.push(
      `${filename}: file number ${fileNum} does not match ADR ID ${doc.id}`
    );
  }

  // Check for duplicate IDs
  if (adrDocs.has(doc.id)) {
    errors.push(
      `${filename}: duplicate ADR ID ${doc.id} (also in ${adrDocs.get(doc.id).filename})`
    );
  } else {
    adrDocs.set(doc.id, { doc, filename });
  }

  console.log(`PASS  ${filename} (${doc.id}: ${doc.status})`);
}

// Sequential numbering
const sortedIds = [...adrDocs.keys()].sort();
for (let i = 0; i < sortedIds.length; i++) {
  const expected = `ADR-${String(i + 1).padStart(4, "0")}`;
  if (sortedIds[i] !== expected) {
    errors.push(
      `ADR numbering gap: expected ${expected} but found ${sortedIds[i]}`
    );
    break;
  }
}

// Supersession integrity
for (const [id, { doc, filename }] of adrDocs) {
  if (doc.status === "Superseded") {
    if (!doc.superseded_by) {
      errors.push(
        `${filename}: status is "Superseded" but no superseded_by field`
      );
    } else if (!adrDocs.has(doc.superseded_by)) {
      errors.push(
        `${filename}: superseded_by references ${doc.superseded_by} which does not exist`
      );
    }
  }
  if (doc.superseded_by && doc.status !== "Superseded") {
    errors.push(
      `${filename}: has superseded_by field but status is "${doc.status}" (should be "Superseded")`
    );
  }
}

// Validate index if present
if (indexFile) {
  const indexPath = join(adrsDir, indexFile);
  let indexDoc;

  try {
    const raw = readFileSync(indexPath, "utf-8");
    indexDoc = YAML.parse(raw);
  } catch (err) {
    errors.push(`index.yaml: YAML parse error: ${err.message}`);
  }

  if (indexDoc) {
    const validIndex = validateIndex(indexDoc);
    if (!validIndex) {
      for (const err of validateIndex.errors) {
        const path = err.instancePath || "(root)";
        errors.push(`index.yaml: schema: ${path} ${err.message}`);
      }
    } else {
      console.log(`PASS  index.yaml`);

      // Cross-reference: every ADR file should be in the index
      const indexIds = new Set(indexDoc.decisions.map((d) => d.id));
      for (const [id, { filename }] of adrDocs) {
        if (!indexIds.has(id)) {
          errors.push(
            `index.yaml: missing entry for ${id} (file: ${filename})`
          );
        }
      }

      // Cross-reference: every index entry should have a file
      for (const entry of indexDoc.decisions) {
        if (!adrDocs.has(entry.id)) {
          errors.push(
            `index.yaml: entry ${entry.id} has no corresponding ADR file`
          );
        } else {
          // Verify consistency between index and file
          const adr = adrDocs.get(entry.id);
          if (entry.title !== adr.doc.title) {
            errors.push(
              `index.yaml: ${entry.id} title mismatch -- index: "${entry.title}" vs file: "${adr.doc.title}"`
            );
          }
          if (entry.status !== adr.doc.status) {
            errors.push(
              `index.yaml: ${entry.id} status mismatch -- index: "${entry.status}" vs file: "${adr.doc.status}"`
            );
          }
          if (entry.file !== adr.filename) {
            errors.push(
              `index.yaml: ${entry.id} file mismatch -- index: "${entry.file}" vs actual: "${adr.filename}"`
            );
          }
        }
      }
    }
  }
} else {
  errors.push(`index.yaml not found in ${adrsDir}`);
}

// Summary
const totalFiles = adrFiles.length + (indexFile ? 1 : 0);
console.log(
  `\n${totalFiles} file(s) checked. ${errors.length === 0 ? "All valid." : `${errors.length} error(s) found.`}`
);

if (errors.length > 0) {
  console.log("\nErrors:");
  for (const err of errors) console.log(`  - ${err}`);
}

process.exit(errors.length === 0 ? 0 : 1);
