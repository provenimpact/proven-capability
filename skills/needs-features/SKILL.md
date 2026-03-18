---
name: needs-features
description: Create and maintain Gherkin feature files that serve as user stories, specifications, and executable tests in one artifact. Use when the proven-needs orchestrator determines that a feature needs behavioral scenarios created or updated. Operates within a single feature package at docs/features/<slug>/. Feature files explain WHY (user perspective), define WHAT (testable behavior), and serve as VERIFY (executable via Cucumber).
---

## Prerequisites

This skill is invoked by the `proven-needs` orchestrator, which provides the feature context (slug, intent, current state).

## Observe

Assess the current state of feature files for this feature.

### 1. Check feature directory

Look for `docs/features/<slug>/`. If the directory does not exist, note that this is a new feature -- no feature files exist yet.

### 2. Read existing feature files

If `docs/features/<slug>/*.feature` files exist:
- Count total `.feature` files
- Extract all `Feature:` names and descriptions
- Extract all scenario tags (e.g., `@PROD-001`, `@CART-001`)
- Count total scenarios and scenario outlines
- Note the feature-level tags

### 3. Read constraints

Read `docs/constraints.adoc`. Identify any constraints relevant to feature quality (e.g., quality constraints about testability, completeness).

### 4. Detect test infrastructure

Scan the project for:
- **Cucumber runner:** `@cucumber/cucumber`, `cucumber-js`, or equivalent in the project's language
- **Step definitions:** existing step files in `docs/features/<slug>/steps/` or project-wide step directories
- **Support files:** world definitions, hooks, custom parameter types
- **Naming conventions:** how existing step files are named and organized

### 5. Report observation

Return to the orchestrator:
```
Feature: <slug>
Feature files: {exists: true/false, count: N, scenarios: N, tags: [...]}
Step definitions: {exists: true/false, count: N}
Test runner: <cucumber-js / other>
```

## Evaluate

Given the desired state from the orchestrator, determine what action is needed.

### 1. Does the desired state require new feature files?

- If no feature files exist and the intent requires them → create feature files
- If feature files exist but the intent adds new functionality → add scenarios
- If feature files exist but the intent modifies existing behavior → modify scenarios
- If feature files exist and fully cover the desired state → no action needed

### 2. Check constraints

Verify that proposed scenarios would not violate any constraints:
- Scenarios must be testable (quality constraint)
- Scenarios must not duplicate constraint-level requirements (cross-cutting requirements belong in `docs/constraints.adoc`, not feature files)
- Each scenario must be scoped to this one feature (must not require knowledge of other features)

### 3. Report evaluation

Return to the orchestrator:
```
Action: create / add / modify / none
Scenarios to create: N
Scenarios to modify: [list]
Constraint issues: [list or none]
```

## Execute

### Prefix assignment

Before writing feature files, determine the spec ID prefix for this feature. The prefix is a 2-5 character uppercase code derived from the feature slug:

- `product-browsing` → `PROD`
- `shopping-cart` → `CART`
- `checkout` → `CHK`
- `user-authentication` → `AUTH`
- `password-reset-sms` → `PRS`

Present the proposed prefix to the user for confirmation before proceeding.

### Creating feature files for a new feature

#### 1. Analyze the intent

Read the intent (desired state) provided by the orchestrator. Identify:
- The main functionality requested
- Who the users are (roles)
- What problems they want solved
- Any specific requirements mentioned

#### 2. Decompose into features and scenarios

Group related behavior into Gherkin `Feature:` blocks. Each `.feature` file should represent a cohesive capability area (e.g., catalog browsing, product search, cart management).

Each scenario must:
- Describe one specific, testable behavior
- Be independent of other scenarios (no ordering dependencies)
- Be scoped entirely within this feature package (no cross-feature dependencies)
- Cover a single path (happy path, edge case, or error -- not multiple)

Common decomposition patterns:

| Capability Area | Typical Feature Files |
|---|---|
| Authentication | `login.feature`, `registration.feature`, `password-reset.feature` |
| CRUD Operations | `create-<entity>.feature`, `list-<entity>.feature`, `update-<entity>.feature` |
| User Settings | `view-settings.feature`, `update-settings.feature` |
| E-commerce | `product-catalog.feature`, `product-search.feature`, `cart-management.feature` |

#### 3. Write each feature file

Every `.feature` file follows this structure:

```gherkin
@<feature-slug>
Feature: <Descriptive Name>
  As a <role>,
  I want <goal>,
  so that <benefit>.

  Background:
    Given <common precondition shared by all scenarios>

  @<PREFIX>-<NNN>
  Scenario: <Descriptive behavior statement>
    Given <precondition>
    When <action>
    Then <observable outcome>

  @<PREFIX>-<NNN>
  Scenario Outline: <Parameterized behavior>
    Given <precondition>
    When <action with "<parameter>">
    Then <expected> outcome is observed

    Examples:
      | parameter | expected |
      | value1    | result1  |
      | value2    | result2  |
```

**Key structural rules:**

1. **Feature-level tag:** Every file gets `@<feature-slug>` as the first tag (e.g., `@product-browsing`).

2. **Feature description:** The `Feature:` block includes the user story narrative (As a / I want / So that). This replaces the user story document. A feature file may contain scenarios from multiple original user stories -- the Feature description captures the primary user motivation.

3. **Spec ID tags:** Every scenario gets a `@<PREFIX>-<NNN>` tag (e.g., `@PROD-001`). This is the spec requirement ID. IDs are sequential within the feature package, not within a single file. One spec ID may appear on multiple scenarios (e.g., happy path + edge case for the same requirement).

4. **Background:** Use `Background:` for preconditions shared by all scenarios in the file. Common for test data setup.

5. **Data tables:** Use Gherkin data tables for structured test data. Prefer tables over multiple `Given` steps when setting up multiple entities.

6. **Scenario Outlines:** Use `Scenario Outline:` with `Examples:` tables when the same behavior needs testing with multiple inputs. Each row in the Examples table generates a separate test run.

7. **Rule keyword (optional):** Gherkin supports the `Rule:` keyword (since Gherkin v6) for grouping scenarios under a business rule within a feature file. Use `Rule:` when a feature file has many scenarios that cluster around distinct business rules. Each `Rule:` can have its own `Background:`. This is optional -- flat scenario lists are fine for most features.

#### 4. Writing effective scenarios

**Given (precondition):**
- Describe the state of the system before the action
- Use past tense or present state ("the following products exist", "the user is logged in")
- Set up test data using data tables when multiple entities are needed

**When (action):**
- Describe the user action or system event that triggers the behavior
- Use present tense ("I visit", "the user clicks", "the system receives")
- One action per scenario (if you need multiple When steps, consider splitting the scenario)

**Then (outcome):**
- Describe the observable result
- Must be externally verifiable -- the black-box litmus test applies:
  > Could a tester who has never seen the source code verify this using only the system's user interface or public APIs?
- Use "should" for expectations ("I should see", "the system should display")

**And / But:**
- Use `And` to chain steps of the same type
- Use `But` for negative assertions ("But I should not see 'deleted item'")

#### 5. Black-box constraint

Scenarios must ONLY describe externally observable behavior. They must NOT reference:
- Internal architecture, components, or modules
- Database schemas, tables, or queries
- API endpoint paths or HTTP methods
- Programming languages, frameworks, or libraries
- Internal data structures or algorithms

Scenarios MUST describe:
- What the user or external actor observes
- What inputs produce what outputs
- Observable system states and transitions
- Error messages and feedback presented to the user

**The step definitions (glue code) handle the internal mapping.** The `.feature` file stays technology-agnostic.

#### 6. Check for constraint-level requirements

While writing scenarios, check each one:
- Does this behavior apply only to this feature? → Keep as a scenario
- Would this behavior apply to other features too? → Flag to the orchestrator as a potential constraint

Example: "The system shall enforce minimum password security requirements" applies to registration, password reset, and any future password feature → flag as a potential constraint.

#### 7. Error and edge case coverage

For each happy-path scenario, consider:
- What happens with empty/missing data? → Write a scenario
- What happens with invalid input? → Write a scenario
- What happens at boundaries (zero items, max items)? → Write a scenario
- What happens when an external dependency fails? → Write a scenario

Tag error/edge scenarios with the same spec ID as the happy path they relate to.

#### 8. Write skeleton step definitions

After creating `.feature` files, generate skeleton step definitions so the scenarios can be wired up during implementation.

Step definition files go in `docs/features/<slug>/steps/`:

```javascript
// docs/features/<slug>/steps/<name>.steps.js
import { Given, When, Then } from "@cucumber/cucumber";

Given("the following products exist:", async function (dataTable) {
  // TODO: implement during needs-implementation
});

When("I visit the product catalog", async function () {
  // TODO: implement during needs-implementation
});

Then("I should see {int} products", async function (count) {
  // TODO: implement during needs-implementation
});
```

> **Language note:** Step definitions must be in the same language as the project. The example above uses JavaScript with `@cucumber/cucumber` (cucumber-js). For TypeScript projects, use `.steps.ts` files with type annotations. For Java projects, use `cucumber-jvm`. For Ruby, use `cucumber-ruby`. The `.feature` files themselves are language-agnostic and work with any Cucumber implementation.

> **Configuration note:** Since feature files live in `docs/features/` (not the cucumber-js default of `features/`), the project needs a `cucumber.js` configuration file:
> ```javascript
> // cucumber.js
> export default {
>   paths: ['docs/features/**/*.feature'],
>   import: ['docs/features/**/steps/*.js'],
> }
> ```

**Step definition rules:**
- Use `TODO` markers for unimplemented steps -- implementation happens during `needs-implementation`
- Follow the project's existing step definition conventions if any exist
- Reuse existing step definitions where possible (Cucumber matches by regex/expression)
- Step definitions are NOT expected to pass before implementation
- Use regular `function()` expressions (not arrow functions) to access the Cucumber World via `this`

### Adding scenarios to an existing feature

1. Read existing `.feature` files and identify the next available spec ID (`<PREFIX>-<NNN>`).
2. Before adding, check for scenarios with substantially similar behavior. If a potential duplicate is found, present both to the user and ask whether to merge, replace, or keep both.
3. Assign the next sequential spec ID after the highest existing ID in the feature package.
4. Add scenarios to the appropriate existing `.feature` file, or create a new `.feature` file if the new behavior represents a distinct capability area.
5. Generate skeleton step definitions for any new steps.

### Modifying existing scenarios

1. Identify which scenarios the user wants to modify.
2. Present the proposed changes: show the current scenario alongside the new scenario.
3. Ask the user to confirm before applying.
4. Update step definitions if step text changed.

### Removing scenarios

1. Identify the scenarios to remove.
2. **Warn about downstream impact:** Removing scenarios may make the feature's design stale. Inform the user.
3. Ask the user to confirm.
4. Remove the scenarios. Do not renumber remaining spec ID tags (IDs are stable).
5. Remove orphaned step definitions (steps no longer referenced by any scenario).

### Syncing feature files

When the user modifies the intent or the orchestrator detects a need for updates:

#### 1. Change detection

Use `git diff` on the `.feature` files to identify what changed:
- **New scenarios** added
- **Modified scenarios** (changed Given/When/Then steps or tags)
- **Removed scenarios**

#### 2. Downstream impact

If `.feature` files change:
- `design.adoc` may become stale (if new scenarios require design changes)
- Step definitions may need updating (if step text changed)
- Implementation may need updating (if behavioral expectations changed)

Report the impact to the orchestrator.

## Organizing Feature Files

### File naming

Name `.feature` files after the capability area they describe:
- `product-catalog.feature` (not `us-001.feature` or `spec.feature`)
- `product-search.feature`
- `cart-management.feature`
- `checkout-payment.feature`

### Multiple perspectives in one feature file

A single `.feature` file can contain scenarios that address multiple user motivations. The `Feature:` description captures the primary motivation. If scenarios from different perspectives share the same capability area, they belong in the same file.

### Splitting feature files

Split a `.feature` file when:
- It exceeds ~20 scenarios (becomes hard to navigate)
- Scenarios clearly fall into distinct capability areas
- The `Background:` setup would need to differ between groups of scenarios

## Quality Checklist

Before finalizing, verify every item:
- Every `.feature` file has a `@<feature-slug>` tag
- Every `.feature` file has a `Feature:` description with As a / I want / So that
- Every scenario has a `@<PREFIX>-<NNN>` spec ID tag
- Scenario descriptions are clear and describe one specific behavior
- Given/When/Then steps follow the tense conventions (past/present state, present action, expected outcome)
- All scenarios pass the black-box litmus test (no internal implementation details)
- Error and edge cases are covered alongside happy paths
- No scenario spans multiple features
- Cross-cutting requirements have been flagged as potential constraints
- Skeleton step definitions exist for all steps
- `.feature` files parse correctly (valid Gherkin syntax)
- No duplicate spec IDs within the feature package

## Reference

See `references/example.adoc` for a complete example showing how a feature intent becomes Gherkin feature files.
