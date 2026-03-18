#!/usr/bin/env node

/**
 * validate-specs.js
 *
 * Validates feature specification YAML files against:
 * 1. JSON Schema (structure and types)
 * 2. ID uniqueness (no duplicate story IDs or requirement IDs within a feature)
 * 3. Prefix consistency (all requirement IDs use the declared prefix)
 * 4. Sequential numbering (IDs are sequential without gaps)
 * 5. Cross-feature uniqueness (no two features share the same prefix)
 *
 * Usage:
 *   node scripts/validate-specs.js docs/features/*/spec.yaml
 *   node scripts/validate-specs.js docs/features/shopping-cart/spec.yaml
 *   node scripts/validate-specs.js --all  # finds all spec.yaml under docs/features/
 *
 * Dependencies (peer):
 *   npm install ajv ajv-formats yaml
 *
 * Exit codes:
 *   0 = all valid
 *   1 = validation errors found
 *   2 = usage error (no files, missing deps)
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, basename, dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Dependency loading with helpful error messages
// ---------------------------------------------------------------------------

let Ajv, addFormats, YAML;
try {
  ({ default: Ajv } = await import("ajv"));
  ({ default: addFormats } = await import("ajv-formats"));
  YAML = await import("yaml");
} catch (err) {
  console.error(
    "Missing dependencies. Install them with:\n  npm install ajv ajv-formats yaml\n"
  );
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Schema loading
// ---------------------------------------------------------------------------

const SCHEMA_PATH = resolve(
  import.meta.dirname,
  "..",
  "skills",
  "needs-features",
  "schemas",
  "feature-spec.schema.json"
);

if (!existsSync(SCHEMA_PATH)) {
  console.error(`Schema not found at: ${SCHEMA_PATH}`);
  process.exit(2);
}

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf-8"));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function findSpecFiles(args) {
  if (args.includes("--all")) {
    const featuresDir = resolve("docs", "features");
    if (!existsSync(featuresDir)) {
      console.error(`No docs/features/ directory found.`);
      process.exit(2);
    }
    const files = [];
    for (const slug of readdirSync(featuresDir)) {
      const specPath = join(featuresDir, slug, "spec.yaml");
      if (existsSync(specPath)) {
        files.push(specPath);
      }
    }
    if (files.length === 0) {
      console.error("No spec.yaml files found under docs/features/.");
      process.exit(2);
    }
    return files;
  }

  if (args.length === 0) {
    console.error(
      "Usage:\n" +
        "  node scripts/validate-specs.js docs/features/*/spec.yaml\n" +
        "  node scripts/validate-specs.js --all\n"
    );
    process.exit(2);
  }

  return args;
}

// ---------------------------------------------------------------------------
// Validation logic
// ---------------------------------------------------------------------------

function validateFile(filePath) {
  const errors = [];
  const label = filePath;

  // --- Parse YAML ---
  let doc;
  try {
    const raw = readFileSync(filePath, "utf-8");
    doc = YAML.parse(raw);
  } catch (err) {
    errors.push(`${label}: YAML parse error: ${err.message}`);
    return errors;
  }

  // --- JSON Schema validation ---
  const valid = validateSchema(doc);
  if (!valid) {
    for (const err of validateSchema.errors) {
      const path = err.instancePath || "(root)";
      errors.push(`${label}: schema: ${path} ${err.message}`);
    }
    // If schema fails, structural checks may crash -- return early
    return errors;
  }

  const { feature, prefix, stories } = doc;

  // --- Story ID uniqueness ---
  const storyIds = new Set();
  for (const story of stories) {
    if (storyIds.has(story.id)) {
      errors.push(`${label}: duplicate story ID: ${story.id}`);
    }
    storyIds.add(story.id);
  }

  // --- Requirement ID uniqueness and prefix consistency ---
  const reqIds = new Set();
  for (const story of stories) {
    for (const req of story.requirements) {
      // Check prefix
      const expectedPrefix = req.id.split("-")[0];
      if (expectedPrefix !== prefix) {
        errors.push(
          `${label}: requirement ${req.id} uses prefix "${expectedPrefix}" but feature declares prefix "${prefix}"`
        );
      }

      // Check uniqueness
      if (reqIds.has(req.id)) {
        errors.push(`${label}: duplicate requirement ID: ${req.id}`);
      }
      reqIds.add(req.id);
    }
  }

  // --- Sequential story IDs ---
  const storyNums = stories.map((s) => parseInt(s.id.replace("US-", ""), 10));
  for (let i = 0; i < storyNums.length; i++) {
    if (storyNums[i] !== i + 1) {
      errors.push(
        `${label}: story ID gap or out of order: expected US-${String(i + 1).padStart(3, "0")} but found ${stories[i].id}`
      );
    }
  }

  // --- Sequential requirement IDs (across the whole feature) ---
  const allReqNums = [];
  for (const story of stories) {
    for (const req of story.requirements) {
      const num = parseInt(req.id.split("-")[1], 10);
      allReqNums.push({ id: req.id, num });
    }
  }
  // Requirements should be in order (ascending) across the file
  for (let i = 1; i < allReqNums.length; i++) {
    if (allReqNums[i].num <= allReqNums[i - 1].num) {
      errors.push(
        `${label}: requirement IDs not in ascending order: ${allReqNums[i - 1].id} followed by ${allReqNums[i].id}`
      );
    }
  }
  // Check for gaps
  if (allReqNums.length > 0) {
    const expectedStart = 1;
    for (let i = 0; i < allReqNums.length; i++) {
      if (allReqNums[i].num !== expectedStart + i) {
        errors.push(
          `${label}: requirement ID gap: expected ${prefix}-${String(expectedStart + i).padStart(3, "0")} but found ${allReqNums[i].id}`
        );
        break; // report first gap only
      }
    }
  }

  // --- EARS type consistency (basic pattern checks) ---
  for (const story of stories) {
    for (const req of story.requirements) {
      const text = req.text.trim();
      const type = req.ears_type;

      switch (type) {
        case "ubiquitous":
          // Should start with "The" (system shall...)
          if (!/^The\s/i.test(text)) {
            errors.push(
              `${label}: ${req.id}: ears_type is "ubiquitous" but text does not start with "The ...". Expected pattern: "The <system> shall <response>."`
            );
          }
          break;

        case "event-driven":
          // Should start with "When"
          if (!/^When\s/i.test(text)) {
            errors.push(
              `${label}: ${req.id}: ears_type is "event-driven" but text does not start with "When ...". Expected pattern: "When <trigger>, the <system> shall <response>."`
            );
          }
          break;

        case "state-driven":
          // Should start with "While" or "During"
          if (!/^(While|During)\s/i.test(text)) {
            errors.push(
              `${label}: ${req.id}: ears_type is "state-driven" but text does not start with "While ..." or "During ...". Expected pattern: "While <state>, the <system> shall <response>."`
            );
          }
          break;

        case "unwanted-behavior":
          // Should start with "If"
          if (!/^If\s/i.test(text)) {
            errors.push(
              `${label}: ${req.id}: ears_type is "unwanted-behavior" but text does not start with "If ...". Expected pattern: "If <condition>, then the <system> shall <response>."`
            );
          }
          break;

        case "optional-feature":
          // Should start with "Where"
          if (!/^Where\s/i.test(text)) {
            errors.push(
              `${label}: ${req.id}: ears_type is "optional-feature" but text does not start with "Where ...". Expected pattern: "Where <feature>, the <system> shall <response>."`
            );
          }
          break;

        case "complex":
          // Should contain at least two of: Where, While, When, If
          {
            const keywords = ["Where", "While", "When", "If"].filter((kw) =>
              new RegExp(`\\b${kw}\\b`, "i").test(text)
            );
            if (keywords.length < 2) {
              errors.push(
                `${label}: ${req.id}: ears_type is "complex" but text contains fewer than 2 EARS keywords (Where/While/When/If). Complex requirements combine multiple conditions.`
              );
            }
          }
          break;
      }

      // All requirements should contain "shall"
      if (!/\bshall\b/i.test(text)) {
        errors.push(
          `${label}: ${req.id}: requirement text does not contain "shall". EARS requirements use "the <system> shall <response>" form.`
        );
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Cross-file validation
// ---------------------------------------------------------------------------

function validateCrossFile(results) {
  const errors = [];
  const prefixes = new Map(); // prefix -> filePath

  for (const [filePath, doc] of results) {
    if (!doc) continue;

    const { prefix, feature } = doc;

    if (prefixes.has(prefix)) {
      const otherFile = prefixes.get(prefix);
      errors.push(
        `Cross-file: prefix "${prefix}" is used by both "${feature}" (${filePath}) and ${otherFile}`
      );
    } else {
      prefixes.set(prefix, `${feature} (${filePath})`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const files = findSpecFiles(args);

let totalErrors = 0;
const parsedDocs = [];

for (const filePath of files) {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    totalErrors++;
    continue;
  }

  const errors = validateFile(filePath);

  if (errors.length === 0) {
    console.log(`PASS  ${filePath}`);
    // Parse again for cross-file checks
    const raw = readFileSync(filePath, "utf-8");
    parsedDocs.push([filePath, YAML.parse(raw)]);
  } else {
    console.log(`FAIL  ${filePath}`);
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
    totalErrors += errors.length;
    // Still try to parse for cross-file checks
    try {
      const raw = readFileSync(filePath, "utf-8");
      parsedDocs.push([filePath, YAML.parse(raw)]);
    } catch {
      parsedDocs.push([filePath, null]);
    }
  }
}

// Cross-file checks
if (parsedDocs.length > 1) {
  const crossErrors = validateCrossFile(parsedDocs);
  if (crossErrors.length > 0) {
    console.log(`\nCross-file issues:`);
    for (const err of crossErrors) {
      console.log(`  - ${err}`);
    }
    totalErrors += crossErrors.length;
  }
}

// Summary
console.log(
  `\n${files.length} file(s) checked. ${totalErrors === 0 ? "All valid." : `${totalErrors} error(s) found.`}`
);

process.exit(totalErrors === 0 ? 0 : 1);
