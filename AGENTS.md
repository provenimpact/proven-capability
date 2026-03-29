# Agents

This is the **proven-needs** skill definition repository. It contains the skill definitions, examples, and documentation for the intent-driven state transition workflow.

## Working on this repo

When editing skills in this repository:

- **Keep the README in sync.** The `README.md` must accurately reflect the workflow, skills, and artifact lifecycle defined in `skills/proven-needs/SKILL.md`. When the state transition model, skill descriptions, or artifact table changes, update the README to match.
- **Maintain example consistency.** All example files use the same e-commerce scenario. Feature names, spec ID tags (e.g., `@PROD-001`), and design references must be consistent across all examples. The canonical scenario definitions are in `skills/needs-features/references/example.adoc`.
- **Git-based version tracking.** Feature files (`.feature`) use git-based change detection instead of explicit version attributes. Design and task artifacts still use `:version:` and `:source-design-version:` attributes. When modifying templates, follow this convention.
- **Cross-reference accuracy.** Skills reference each other by name (e.g., "create scenarios using the `needs-features` capability"). When renaming a skill or changing its responsibilities, search all other skills for references.
- **Observe/evaluate/execute pattern.** Every capability skill (needs-*) follows the three-phase pattern: Observe (assess current state in this domain), Evaluate (does the desired state require action? do constraints allow it?), Execute (make the minimum changes). Maintain this structure when adding or modifying capabilities.
- **Feature-scoped artifacts.** Feature capabilities (needs-features, needs-design, needs-tasks, needs-implementation) operate within a single feature package at `docs/features/<slug>/`. They must not read or depend on other feature packages. Project-wide capabilities (needs-adr, needs-architecture, needs-dependencies, needs-security, needs-compliance) operate at the project level.
- **Constraint enforcement.** Every capability checks relevant constraints from `docs/constraints.adoc` during its Evaluate phase. Constraint violations block transitions unless the user explicitly updates the constraint.
- **Orchestrator responsibility.** The `proven-needs` skill is the single entry point. It handles intent classification, feature decomposition, feasibility evaluation, transition planning, and capability invocation. Individual capabilities do not independently decide pipeline ordering -- the orchestrator derives it.
- **Gherkin as the requirement language.** Feature specifications use Gherkin's Given/When/Then syntax. Each `.feature` file is simultaneously a user story, a specification, and an executable test. Step definitions (glue code) live within the feature package at `docs/features/<slug>/steps/`.
