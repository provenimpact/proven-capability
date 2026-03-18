# Agents

This is the **proven-needs** skill definition repository. It contains the skill definitions, examples, and documentation for the intent-driven state transition workflow.

## Working on this repo

When editing skills in this repository:

- **Keep the README in sync.** The `README.md` must accurately reflect the workflow, skills, and artifact lifecycle defined in `skills/proven-needs/SKILL.md`. When the state transition model, skill descriptions, or artifact table changes, update the README to match.
- **Maintain example consistency.** All example files use the same e-commerce scenario. Feature names, requirement ID prefixes (e.g., `PROD`, `CART`, `CHK`), and design references must be consistent across all examples. The canonical scenario definitions are in the `skills/needs-features/references/*.spec.yaml` files.
- **Schema-validated specs.** Feature specifications use YAML validated by a JSON schema (`skills/needs-features/schemas/feature-spec.schema.json`). When modifying the spec format, update the schema, the validation script (`scripts/validate-specs.js`), and all example YAML files.
- **Version tracking.** `spec.yaml` uses SemVer. Design tracks `:source-spec-version:` and tasks track `:source-design-version:` and `:source-spec-version:`. When modifying templates, follow this convention.
- **Cross-reference accuracy.** Skills reference each other by name (e.g., "create stories and requirements using the `needs-features` capability"). When renaming a skill or changing its responsibilities, search all other skills for references.
- **Observe/evaluate/execute pattern.** Every capability skill (needs-*) follows the three-phase pattern: Observe (assess current state in this domain), Evaluate (does the desired state require action? do constraints allow it?), Execute (make the minimum changes). Maintain this structure when adding or modifying capabilities.
- **Feature-scoped artifacts.** Feature capabilities (needs-features, needs-design, needs-tasks, needs-tests, needs-implementation) operate within a single feature package at `docs/features/<slug>/`. They must not read or depend on other feature packages. Project-wide capabilities (needs-adr, needs-architecture, needs-dependencies, needs-security, needs-compliance) operate at the project level.
- **Constraint enforcement.** Every capability checks relevant constraints from `docs/constraints.adoc` during its Evaluate phase. Constraint violations block transitions unless the user explicitly updates the constraint.
- **Orchestrator responsibility.** The `proven-needs` skill is the single entry point. It handles intent classification, feature decomposition, feasibility evaluation, transition planning, and capability invocation. Individual capabilities do not independently decide pipeline ordering -- the orchestrator derives it.
- **EARS as the requirement language.** Feature specifications use EARS (Easy Approach to Requirements Syntax) for requirements. Each requirement in `spec.yaml` has a unique ID, an EARS-typed text, and a black-box verification description. The `ears-requirements` skill provides the methodology reference.
- **Tests are opt-in.** The `needs-tests` capability is only included in transition plans when the project has an accepted ADR recording the decision to use TDD/automated testing. The orchestrator prompts for this decision when appropriate.
