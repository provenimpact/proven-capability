---
name: proven-needs
description: Intent-driven state transition workflow for evolving software systems. Declare a desired state, evaluate it against reality and constraints, then execute the minimal valid transition. Use when asked to implement a feature, fix something, update dependencies, improve quality, or make any change to the system. This is the single entry point -- it observes current state, classifies the intent, evaluates feasibility against constraints, derives a transition plan, and orchestrates the appropriate needs-* capabilities. Also use when asked about the development workflow, how features are organized, or the overall process.
---

## Purpose

Continuously evolve a software system by declaring a desired state, evaluating it against the current state and constraints, then executing the minimal valid transition to make it true. Both maintenance and feature work are state changes, not task accumulation.

## Scope

- Use this skill as the single entry point for system changes and workflow questions.
- The orchestrator derives the transition plan and loads the `needs-*` skills that perform capability work.
- The orchestrator does not create feature-scoped delivery artifacts directly. `needs-features`, `needs-design`, `needs-tasks`, `needs-tests`, and `needs-implementation` own those artifacts.
- The orchestrator does directly manage transition bookkeeping in `docs/state-log.adoc` and confirmed project-wide constraint declarations in `docs/constraints.yaml`.
- Only the orchestrator may compare, group, or sequence work across multiple feature packages. Feature capabilities operate within a single feature package.

## State Transition Loop

```
Observe -> Declare -> Evaluate -> Derive -> Execute -> Validate -> Approve -> Repeat
```

1. **Observe** -- capture the current state.
2. **Declare** -- accept the desired state.
3. **Evaluate** -- test feasibility against current state and constraints.
4. **Derive** -- determine the minimal transition plan.
5. **Execute** -- run the required capabilities and direct orchestrator-owned updates.
6. **Validate** -- verify the desired state appears to be true.
7. **Approve** -- record the result according to the transition risk rules.
8. **Repeat** -- declare the next desired state.

Low-risk transitions may auto-execute after a concise notice. Medium-risk and high-risk transitions require approval before execution.

## Capability Map

### Invoking a capability

1. Load the capability skill by name.
2. Pass the feature or project context that the capability needs.
3. Let the capability run its own observe -> evaluate -> execute cycle.
4. Validate the capability's output before moving to the next step.
5. If a capability references another skill, load that skill before continuing.

Do not perform capability work without first loading the capability skill. The capability skills contain the artifact formats, quality checks, and domain-specific rules.

### Feature-scoped capabilities

| Capability | Skill | Domain |
|---|---|---|
| Features | `needs-features` | Create or update `spec.yaml` |
| Design | `needs-design` | Create or update feature design artifacts |
| Tasks | `needs-tasks` | Create or update `tasks.yaml` |
| Tests | `needs-tests` | Derive tests for a single task before implementation |
| Implementation | `needs-implementation` | Write and verify code for one feature |

### Project-wide capabilities

| Capability | Skill | Domain |
|---|---|---|
| ADRs | `needs-adr` | Record technology decisions |
| Architecture | `needs-architecture` | Document current system architecture |
| Dependencies | `needs-dependencies` | Manage dependency versions and vulnerabilities |
| Security | `needs-security` | Assess and remediate security posture |
| Compliance | `needs-compliance` | Verify license and policy compliance |

### Supporting skills

| Skill | Purpose |
|---|---|
| `ears-requirements` | EARS methodology reference for writing requirements |

## Reference Map

- [`references/feature-decomposition.md`](references/feature-decomposition.md): Read when turning one user intent into one or more feature packages.
- [`references/workflow-details.md`](references/workflow-details.md): Read when you need plan templates, execution-mode details, task-DAG traversal rules, or divergence handling.
- [`references/constraints-spec.md`](references/constraints-spec.md): Read when creating or updating `docs/constraints.yaml`.
- [`references/state-log-spec.md`](references/state-log-spec.md): Read when creating, updating, resuming, or closing `docs/state-log.adoc` entries.
- [`references/feature-package-conventions.md`](references/feature-package-conventions.md): Read when reasoning about slugs, artifact status, provenance, or staleness.
- [`references/bootstrap.md`](references/bootstrap.md): Read only when the user explicitly asks to adopt proven-needs in a project.
- [`references/example-session.adoc`](references/example-session.adoc): Read when you need a worked example of the full workflow.

## Workflow

### 1. Observe current state

Build the current state model at the level needed for the request.

- If the user is only asking about the workflow or process, use lightweight observation instead of a full repository scan.
- Read `docs/constraints.yaml` if it exists. If it does not exist, note that no project constraints are defined yet.
- Inspect `docs/features/` and note which feature packages and artifacts exist.
- Read `docs/adrs/` and determine whether there is an accepted ADR for TDD or automated testing.
- Check `docs/architecture.adoc` and note whether it exists and whether it appears current.
- Read recent entries in `docs/state-log.adoc`. Pay particular attention to `:result: In Progress` and `:result: Partial` entries; propose resuming or explicitly closing them before starting unrelated work.
- Analyze the codebase enough to understand the current implementation reality: project type, dependency graph, quality signals, security posture, and code structure.
- Summarize the current state concisely, including any obvious staleness.

### 2. Accept desired state

Treat the user's request as a desired state to achieve.

Classify the intent into one or more of these types:

| Intent type | Signals | Example |
|---|---|---|
| Feature evolution | User-facing capability with a user journey | "Users can reset password via SMS" |
| Constraint declaration | Universal rule, system-as-subject, future-proof | "All API endpoints must enforce rate limiting" |
| Artifact maintenance | Sync or refresh existing artifacts | "The spec is in sync with current intent" |
| Dependency maintenance | Packages, versions, vulnerabilities, licenses | "No dependencies have known vulnerabilities" |
| Architecture evolution | System structure or technology change | "Authentication uses OAuth2 instead of sessions" |
| Quality improvement | Tests, coverage, lint, type quality | "All API endpoints have integration tests" |
| Documentation | Architecture or workflow documentation | "The architecture doc reflects the current system" |

#### Constraint declaration rule

Treat the intent as a constraint when all of these are true:

1. It has universal scope (`all`, `every`, `never`, `must always`, `no X may`).
2. The subject is the system, not a specific user journey.
3. There is no clear user role, action, and benefit.
4. It should apply to future features as well as current ones.

If the intent is a project-wide constraint:

- Propose the target category in `docs/constraints.yaml`.
- Ask the user to confirm.
- On confirmation, update `docs/constraints.yaml` directly, validate it, and record the transition in `docs/state-log.adoc`.
- Do not create a feature package for a pure constraint declaration.
- If the user also wants remediation, derive a follow-up transition for the implementation work.

If the intent might be either a constraint or a feature-specific requirement, ask the user which meaning they want.

#### TDD decision check

When the orchestrator encounters feature evolution for the first time, or when the user explicitly asks about testing:

- If there is no accepted ADR for TDD or automated testing, ask whether the project should adopt it.
- If the user chooses yes, invoke `needs-adr` to record the decision.
- Only include `needs-tests` in transition plans when there is an accepted ADR that enables it.

### 3. Decompose feature work

For feature evolution intents, use the two-pass decomposition workflow in [`references/feature-decomposition.md`](references/feature-decomposition.md).

- Derive transient stories and linked requirements before final feature grouping.
- Present the proposed grouping or mapping to the user and wait for confirmation.
- Only after confirmation should the orchestrator invoke `needs-features` for each final feature package.
- If derivation surfaces a cross-cutting rule, propose promoting it into `docs/constraints.yaml` instead of duplicating it in feature specs.
- Only the orchestrator may compare work across feature packages. Downstream feature capabilities must stay single-feature scoped.

### 4. Evaluate feasibility

For every feature or project-wide change in scope, determine whether the transition is feasible and what preconditions are missing.

- Check capability preconditions. For example: `needs-design` requires `spec.yaml`; `needs-tests` requires `spec.yaml` plus an accepted TDD ADR; `needs-implementation` requires at least one execution input such as `tasks.yaml`, `design.adoc`, or `spec.yaml`.
- Check constraints in `docs/constraints.yaml` and identify any blocker or required revision.
- Check staleness using the provenance rules in [`references/feature-package-conventions.md`](references/feature-package-conventions.md).
- If an artifact already satisfies the desired state, skip the capability that would regenerate it.
- If the transition is blocked, present the minimal options: revise the plan, update the constraint, or abort.

### 5. Derive transition plan

Derive the smallest plan that can make the desired state true.

- Determine which artifacts need creating or updating.
- Select the required capabilities and order them by dependency.
- Common paths include `needs-features -> needs-design -> needs-tasks -> needs-implementation`, `needs-features -> needs-design -> needs-implementation`, and `needs-features -> needs-implementation` when the user intentionally skips intermediate artifacts.
- `needs-tests` is never a bulk upfront phase. When TDD is enabled, invoke it per task just before that task enters implementation.
- Invoke `needs-architecture` only after all in-scope feature implementations are complete and only when the architecture document is missing or stale.
- Independent features may be processed in parallel.
- Classify the transition with the risk table below.

Execution behavior:

- **Low risk:** give a concise notice, then auto-execute unless the user explicitly asked for planning-only or review-only help.
- **Medium or high risk:** present the plan and ask for approval before execution.
- For approved medium-risk and high-risk transitions, ask whether execution should be **Autonomous** or **Interactive**. Default to **Interactive** if the user does not state a preference.

### 6. Execute transition

Before the first capability runs, or before the orchestrator performs a direct update to an orchestrator-owned artifact, create or update the `In Progress` state-log entry described in [`references/state-log-spec.md`](references/state-log-spec.md).

During execution:

- Maintain an explicit checklist of all planned capabilities and direct orchestrator-owned steps.
- For each capability, load the skill, pass the current context, wait for its report, and validate the output before proceeding.
- Re-check constraints and update the current state model after each step.
- Use [`references/workflow-details.md`](references/workflow-details.md) for task-DAG traversal, execution-mode details, and design-divergence handling.
- `needs-implementation` must produce a divergence report. If it does not, request the report before continuing.
- If the user stops the transition, update the current state-log entry to `:result: Partial` and fill in `:capabilities-invoked:` plus `:capabilities-remaining:`.
- If a capability fails validation or a constraint is violated mid-transition, stop and record the result according to the state-log rules.

### 7. Validate and record

After execution finishes:

- Re-observe the current state.
- Compare it to the original desired state.
- Verify that all relevant constraints still hold.
- Run the relevant verification commands when code changed, such as build, test, lint, and type-check commands.
- Run the relevant validation script for every modified structured artifact, including specs, tasks, constraints, and ADRs.
- Do not close a transition as `Achieved` until all reported design divergences are either reconciled in design or fixed in code.

If the desired state appears achieved:

- **Low risk:** record `:result: Achieved` and report the result.
- **Medium or high risk:** present the validation summary and ask the user whether to record `:result: Achieved`.

If the desired state is not achieved, or the user rejects the result, update the existing state-log entry to `Partial` or `Failed` as appropriate and explain the next options.

## Risk Classification and Approval

| Risk level | Execution rule | Typical examples |
|---|---|---|
| Low | Concise notice, then auto-execute unless the user asked for planning-only or review-only help | Patch dependency updates, metadata fixes, documentation-only syncs, design sync with unchanged requirement semantics |
| Medium | Present a summary and ask before execution | Minor dependency updates, non-breaking design refresh, targeted quality improvements |
| High | Present a full plan and require explicit approval | New features, breaking changes, architecture changes, major version bumps, constraint modifications, behavior-changing code work |

When in doubt, round risk upward.

## Adoption

When the user explicitly asks to adopt proven-needs in a project, read [`references/bootstrap.md`](references/bootstrap.md) and update `AGENTS.md` if needed.

Do not bootstrap automatically just because this skill was loaded.
