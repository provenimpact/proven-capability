# Feature Package Conventions

Read this file when you need the formal rules for feature package layout, status, provenance, and staleness.

## Layout

Feature-scoped work lives under `docs/features/<slug>/`.

Typical artifacts:

- `spec.yaml`
- `design.adoc`
- `tasks.yaml`

Capability skills may create additional feature-local artifacts such as contracts or data-model documents when their own instructions call for them.

## Slug Rules

- Use stable kebab-case slugs derived from the feature's primary purpose.
- Do not rename feature directories casually. Treat the slug as stable identity.

Examples:

- `product-browsing`
- `shopping-cart`
- `user-authentication`

## Derived Status

Treat feature status as derived from its artifacts, not as an in-band field inside `spec.yaml`.

| Artifacts present | Derived status |
|---|---|
| `spec.yaml` only | Specified |
| `spec.yaml` + current `design.adoc` | Designed |
| `spec.yaml` + current `design.adoc` + current `tasks.yaml` | Planned |
| Implementation complete and verified | Implemented |

## Provenance and Staleness

- `spec.yaml` uses SemVer.
- `design.adoc` tracks `:source-spec-version:`.
- `tasks.yaml` tracks `source_design_version`, `source_spec_version`, or both, depending on the artifacts used to produce it.
- At least one provenance field must be present in `tasks.yaml`.

Common staleness checks:

- `spec.yaml` changed since `design.adoc` last recorded `:source-spec-version:`.
- `tasks.yaml` has no provenance fields.
- `design.adoc` changed after the `source_design_version` recorded in `tasks.yaml`.
- `spec.yaml` changed after the `source_spec_version` recorded in `tasks.yaml`.
- Implementation changed system structure and `docs/architecture.adoc` no longer reflects reality.

## Formats and Dates

- Specifications use YAML.
- Design artifacts use AsciiDoc.
- Tasks use YAML.
- Dates use `YYYY-MM-DD`.

## Requirements Rule

Feature specifications use EARS for behavioral requirements.

- Requirements must describe externally observable behavior.
- Internal architecture, component placement, and technology choices belong in design artifacts or ADRs.
- The `ears-requirements` skill provides the methodology reference.
