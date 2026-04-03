# State Log Specification

Read this file when you need to create, update, resume, or close entries in `docs/state-log.adoc`.

## File and Purpose

- File: `docs/state-log.adoc`
- Purpose: append-only audit trail of declared state transitions

Create the file if it does not exist yet.

## Entry Conventions

- Number transitions sequentially as `TRANSITION-001`, `TRANSITION-002`, and so on.
- Keep the newest transition first.
- Create an entry as `:result: In Progress` before execution begins.
- Update that same entry when the transition is achieved, stopped, or fails.

## Standard Fields

Use these fields when they apply:

- `:date:`
- `:intent:`
- `:type:`
- `:risk:`
- `:features:`
- `:desired-state:`
- `:prior-state:`
- `:capabilities-planned:`
- `:capabilities-invoked:`
- `:capabilities-remaining:`
- `:constraints-checked:`
- `:result:`
- `:artifacts-modified:`

`capabilities-remaining` is used when the transition stops before everything in `capabilities-planned` is complete.

## Result Values

- `In Progress`: execution has started and the transition is still open.
- `Achieved`: the desired state was reached and recorded.
- `Partial`: the user intentionally stopped the transition or only part of the plan completed.
- `Failed`: execution could not continue because of an error, blocker, or unresolved violation.

## Update Rules

### Start of transition

Before the first capability runs, or before a direct orchestrator-owned write:

- Create a new `In Progress` entry.
- Fill in every field already known.
- Leave `:capabilities-invoked:`, `:capabilities-remaining:`, `:constraints-checked:`, and `:artifacts-modified:` blank until they are known.

### Achieved

When the transition succeeds:

- Set `:result: Achieved`.
- Fill in `:capabilities-invoked:`.
- Fill in `:constraints-checked:`.
- Fill in `:artifacts-modified:`.
- Omit `:capabilities-remaining:` unless some planned work was intentionally deferred.

### Partial

When the user stops or defers work:

- Set `:result: Partial`.
- Fill in `:capabilities-invoked:`.
- Fill in `:capabilities-remaining:` with the planned but unfinished work.
- Record whatever constraint checks and modified artifacts are already known.

### Failed

When execution cannot continue:

- Set `:result: Failed`.
- Fill in `:capabilities-invoked:` with the work that actually completed.
- Fill in `:capabilities-remaining:` if some planned work never ran.
- Record the relevant constraint checks and artifacts modified before the failure.

## Minimal Example

```asciidoc
== TRANSITION-003
:date: 2026-02-23
:intent: Users can reset their password via SMS
:type: Feature evolution
:risk: High
:features: user-authentication (extended)
:desired-state: SMS password reset is available alongside email reset
:prior-state: user-authentication has email reset only
:capabilities-planned: needs-features, needs-design, needs-tasks, needs-implementation
:capabilities-invoked: needs-features, needs-design, needs-tasks, needs-implementation
:constraints-checked: Security (pass), Architecture (pass), Quality (pass)
:result: Achieved
:artifacts-modified: docs/features/user-authentication/spec.yaml, docs/features/user-authentication/design.adoc, docs/features/user-authentication/tasks.yaml, source code
```
