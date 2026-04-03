# Feature Decomposition

Read this file when one user intent may map to multiple features or when new requirements must be distributed across existing features.

## Core Rule

Use a two-pass approach:

1. Derive transient stories and linked requirements as working output.
2. Confirm the final feature grouping or mapping with the user.
3. Only then create or update the real feature packages.

Do not create a real `spec.yaml` during the draft pass.

## Greenfield Path

When no feature packages exist yet:

1. Draft transient stories and linked requirements from the user's desired state.
2. Group them by cohesion:
   - shared entities or data
   - shared user journey
   - independent value delivery
3. Present the proposed feature split to the user.
4. After confirmation, invoke `needs-features` for each final feature slug and distribute the stories and requirements into those feature packages.

## Evolution Path

When feature packages already exist:

1. Draft transient stories and linked requirements from the new intent.
2. Classify each story as one of:
   - extends an existing feature
   - belongs in a new feature
   - modifies existing requirements in place
3. Present the proposed mapping to the user.
4. After confirmation, invoke `needs-features` on the affected feature packages.

## Constraint Surfacing

While drafting requirements, watch for rules that are cross-cutting rather than feature-scoped.

If a rule would apply to multiple current or future features:

1. Flag it as a possible project-wide constraint.
2. Explain why it is broader than the current feature.
3. Ask whether it should live in `docs/constraints.yaml` instead of the feature spec.

## Proposal Format

Use a compact proposal that shows the candidate feature packages, the stories assigned to each, and the reasoning for the grouping.

Example:

```text
Based on your intent, I propose 3 features:

Feature 1: product-browsing
  - View Product Catalog
  - Search Products
  Reason: shared product data and catalog UI

Feature 2: shopping-cart
  - Add to Cart
  - View Cart
  Reason: shared cart state and cart data

Feature 3: checkout
  - Checkout Process
  Reason: separate payment journey
```

Only the orchestrator may perform this cross-feature reasoning. The downstream feature capabilities remain single-feature scoped.
