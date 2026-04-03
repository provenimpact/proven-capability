# Workflow Details

Read this file when you need detailed execution behavior that would otherwise bloat the core orchestrator instructions.

## Plan Output

For medium-risk and high-risk transitions, present a concise plan that includes:

- The desired state being pursued
- The feature packages or project-wide domains in scope
- The capabilities planned in dependency order
- Capabilities being skipped because artifacts are already current
- Post-implementation work such as `needs-architecture`
- The risk level and expected artifacts affected

Use a compact format such as:

```text
Transition plan to achieve "Users can reset password via SMS":

Feature: user-authentication (extend existing)
1. needs-features
2. needs-design
3. needs-tasks
4. needs-implementation
5. needs-architecture (post-implementation)

Skipping: needs-tests (TDD not adopted)
Risk: High
Estimated artifacts: spec.yaml, design.adoc, tasks.yaml, code
```

## Execution Mode

Execution mode only applies after a medium-risk or high-risk transition has been approved.

- **Autonomous:** continue through the approved plan without pausing between capabilities.
- **Interactive:** pause after each capability and ask whether to continue.
- Default to **Interactive** if the user does not state a preference.
- Low-risk transitions do not require a separate execution-mode prompt; they auto-execute after a concise notice.

## Task-DAG Execution

When `needs-tasks` produces a task graph with `depends_on` edges:

1. Topologically sort the graph.
2. Identify root tasks with no dependencies.
3. A task becomes ready only when all of its dependencies are complete.
4. Ready tasks may run in parallel.
5. When TDD is enabled, invoke `needs-tests` for a ready task immediately before invoking `needs-implementation` for that task.
6. Preserve the per-task traceability expected by `needs-tests` and `needs-implementation`.

## Design Divergence Handling

After `needs-implementation` finishes, require a divergence report.

For each divergence:

1. Present the difference between the design and the implementation.
2. Include the implementation rationale.
3. Ask the user whether to update the design or fix the code.
4. If the user chooses to update the design, invoke `needs-design` in reconciliation mode.
5. If the user chooses to fix the code, invoke `needs-implementation` for the targeted correction.

Do not proceed to final validation until every reported divergence has been resolved one way or the other.

## Failure and Pause Handling

- If a capability fails validation, stop and ask how to proceed.
- If a constraint violation is discovered mid-transition, stop and offer the minimal options: revise, update the constraint, or abort.
- If the user stops mid-transition, mark the transition `Partial` and fill in `:capabilities-remaining:`.
- If you resume work from an `In Progress` or `Partial` state-log entry, reconcile the current repository state before continuing the old plan.
