---
name: needs-tests
description: Derive and generate tests from feature specifications. Use when the proven-needs orchestrator determines that a feature needs test coverage. This is an opt-in capability -- it is only invoked when the project has adopted TDD/automated testing via an ADR decision. Operates within a single feature package at docs/features/<slug>/. Translates the black-box verification descriptions in spec.yaml into executable test cases, using the project's existing test framework and conventions.
---

## Prerequisites

This skill is invoked by the `proven-needs` orchestrator, which provides the feature context (slug, intent, current state).

**This capability is opt-in.** It is only available when the project has an accepted ADR recording the decision to use TDD or automated testing. The orchestrator checks for this ADR before including `needs-tests` in transition plans. If no such ADR exists, the orchestrator prompts the user to decide whether to adopt TDD for the project, and if confirmed, creates the ADR via `needs-adr` before proceeding.

## Observe

Assess the current state of tests for this feature.

### 1. Read feature spec

Read `docs/features/<slug>/spec.yaml`. Extract all requirement IDs, EARS requirement texts, types, and verification descriptions.

**If missing:** Report to the orchestrator that the spec is missing. Tests cannot be derived without specifications -- the verification descriptions in the spec are the primary source for test cases.

### 2. Read feature design

Read `docs/features/<slug>/design.adoc`. Extract system design sections, interface contracts, and data model information. These inform test setup, fixtures, and integration points.

**If missing:** Note that tests will be limited to black-box behavioral tests without internal structure guidance.

### 3. Read existing tests

Scan the project's test directories for existing test files related to this feature:
- Match by feature slug in file/directory names
- Match by requirement ID references in test descriptions
- Check for existing test infrastructure (helpers, fixtures, factories)

### 4. Read constraints

Read `docs/constraints.yaml`. Identify quality constraints relevant to testing (coverage thresholds, test requirements).

### 5. Analyze test infrastructure

Detect the project's test framework and conventions:
- **JavaScript/TypeScript:** Jest, Vitest, Mocha, Playwright, Cypress
- **Rust:** built-in test framework, integration test conventions
- **Go:** testing package, testify
- **Python:** pytest, unittest
- **Ruby:** RSpec, Minitest

Note: test file locations, naming conventions, assertion style, existing fixtures/helpers.

### 6. Report observation

Return to the orchestrator:
```
Feature: <slug>
Spec: {exists: true, version: "X.Y.Z", requirement-count: N}
Design: {exists: true/false}
Existing tests: {count: N, req-ids-covered: [...], req-ids-missing: [...]}
Test framework: <framework>
Coverage constraints: [list or none]
```

## Evaluate

Given the desired state from the orchestrator, determine what action is needed.

### 1. Does the desired state require test changes?

| Condition | Action |
|---|---|
| No tests exist for this feature | Generate full test suite |
| Tests exist but spec has been updated (new/modified requirements) | Generate tests for new requirements, update tests for modified requirements |
| Tests exist and cover all current requirement IDs | Tests appear current. Report to orchestrator. |
| Tests exist but some requirement IDs are not covered | Generate tests for uncovered requirements |

### 2. Check constraints

- Quality constraints: coverage thresholds that must be met
- Are there requirements for specific test types (unit, integration, e2e)?

### 3. Report evaluation

Return to the orchestrator:
```
Action: generate / update / none
Requirements to test: N (new: N, modified: N, uncovered: N)
Constraint requirements: [coverage threshold, test type requirements]
```

## Execute

### Test derivation strategy

```mermaid
flowchart TD
    SPEC["spec.yaml<br/>requirements"] --> TYPE{"EARS<br/>type?"}

    TYPE -->|Ubiquitous| T1["Unconditional assertions<br/>(test across states,<br/>on load, after nav)"]
    TYPE -->|Event-driven| T2["Trigger event -> assert response<br/>(valid + invalid triggers)"]
    TYPE -->|State-driven| T3["Enter state -> assert behavior<br/>(test entry/exit boundaries)"]
    TYPE -->|Unwanted| T4["Trigger error -> assert<br/>recovery/handling"]
    TYPE -->|Optional| T5["Enable feature -> assert behavior<br/>Disable -> assert absence"]
    TYPE -->|Complex| T6["Set preconditions + trigger<br/>-> assert response<br/>(test each clause combo)"]
```

Each EARS type maps to a natural test structure:

| EARS Type | Test Pattern | What to Verify |
|---|---|---|
| Ubiquitous | Assert unconditionally | Behavior present in multiple states and contexts |
| Event-driven | Arrange -> Act -> Assert | Trigger produces expected response |
| State-driven | Enter state -> Assert | Behavior active in state, inactive outside |
| Unwanted behavior | Trigger error -> Assert recovery | System handles error gracefully |
| Optional feature | Toggle feature -> Assert presence/absence | Behavior follows feature flag |
| Complex | Set preconditions + trigger -> Assert | Response correct for the specific combination |

### Generating tests

For each requirement in the spec:

#### 1. Read the requirement and its verification

The `verification` field in the spec describes how to test the requirement in black-box terms. Use this as the test's behavioral description.

#### 2. Determine test scope

| Design Available? | Test Scope |
|---|---|
| Yes | Use design to identify test setup (data models, API endpoints, component interfaces) |
| No | Write pure black-box tests (UI interactions or public API calls only) |

#### 3. Write the test

Follow the project's conventions for:
- File naming and location
- Test description style
- Assertion library
- Fixture/factory patterns
- Setup and teardown

**Each test must:**
- Reference the requirement ID in the test description (e.g., `it("PROD-001: displays products in a grid or list format")`)
- Test exactly what the verification description says
- Be independently runnable (no dependency on other tests)
- Use the project's existing test data setup patterns

#### 4. Group tests by story

Organize test files by feature, with describe blocks mapping to stories:

```javascript
// tests/features/product-browsing/catalog.test.js

describe("US-001: View Product Catalog", () => {
  it("PROD-001: displays products in a grid or list format", () => {
    // Test implementation
  });

  it("PROD-002: shows name, price, and image for each product", () => {
    // Test implementation
  });

  it("PROD-003: filters products by selected category", () => {
    // Test implementation
  });
});
```

### Test-first mode (TDD)

When `needs-tests` is invoked before `needs-implementation`:

1. Generate test files with full test implementations (setup, assertions, expectations)
2. Tests will FAIL because the production code doesn't exist yet -- this is expected and correct
3. Mark tests as pending/skipped if the test framework supports it, OR leave them failing
4. During `needs-implementation`, the implementation task is to make these tests pass

### Test-after mode

When `needs-tests` is invoked after `needs-implementation`:

1. Generate test files that verify the existing implementation
2. Tests should PASS immediately if the implementation is correct
3. Any failing tests indicate implementation gaps or bugs

### Updating tests for modified requirements

1. Identify which requirement IDs changed in the spec
2. Find the corresponding tests
3. Update the test descriptions and assertions to match the new requirement text
4. If a requirement was removed, remove its test (or mark as deprecated)
5. If a requirement was added, generate a new test

## Quality Checklist

Before finalizing, verify:
- Every requirement ID from the spec has at least one test
- Test descriptions reference requirement IDs for traceability
- Tests are independently runnable (no ordering dependencies)
- Tests follow the project's conventions
- Test data setup is realistic and representative
- Error cases from unwanted-behavior requirements have tests
- Tests pass (test-after mode) or fail expectedly (test-first mode)

## Reference

See `references/example.adoc` for a complete example showing how feature requirements become executable tests.
