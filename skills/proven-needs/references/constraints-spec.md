# Constraints Specification

Read this file when you need to create, modify, validate, or explain `docs/constraints.yaml`.

## File and Validation

- File: `docs/constraints.yaml`
- Schema: `skills/proven-needs/schemas/constraints.schema.json`
- Validation: `python skills/proven-needs/scripts/validate-constraints.py docs/constraints.yaml`

See `references/constraints.yaml` for the canonical e-commerce example.

## Structure

`docs/constraints.yaml` is a schema-validated YAML document with these core fields:

- `$id`
- `version`
- `last_updated`
- `categories[]`
- `categories[].name`
- `categories[].constraints[]`
- `categories[].constraints[].id`
- `categories[].constraints[].text`

Project examples may also include schema-supported metadata such as `added` or `rationale`. Follow the schema instead of inventing new fields.

Constraint IDs are unique across the whole file. Keep them sequential.

## Lifecycle

- **Add:** user confirms a new project-wide constraint. Bump the version using SemVer according to the schema rules used by the project.
- **Modify:** user explicitly tightens or relaxes an existing constraint. Bump the version according to the impact.
- **Remove:** user explicitly removes a constraint. Warn about the enforcement loss and bump the version accordingly.

Update `last_updated` whenever the file changes.

## Ownership Rule

The orchestrator may update `docs/constraints.yaml` directly when the user confirms a project-wide constraint declaration.

Capability skills enforce constraints during their Evaluate phase. Some project-wide capabilities may also record approved exceptions or related metadata in `docs/constraints.yaml` when their own skill instructions require it.

Do not invent or relax constraints without explicit user confirmation.

## Enforcement Expectations

Every capability checks the constraints relevant to its domain. At minimum:

- `needs-features` checks requirement quality and avoids duplicating project-wide constraints.
- `needs-design` checks architecture constraints.
- `needs-tasks` preserves traceability required by downstream work.
- `needs-tests` checks testing-related quality constraints.
- `needs-implementation` checks quality, architecture, and performance constraints.
- `needs-dependencies` checks security and version constraints.
- `needs-security` checks security constraints.
- `needs-compliance` checks licensing and policy constraints.

A constraint violation blocks the transition unless the user explicitly chooses to update the constraint.
