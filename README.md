# proven-needs

Intent-driven state transition workflow for evolving software systems.

Declare a **desired state**, evaluate it against **reality** and **constraints**, then execute the **minimal valid transition** to make it true. Both feature work and maintenance use the same mechanism.

## How It Works

```mermaid
flowchart TD
    START((User declares<br/>desired state)) --> OBSERVE

    subgraph LOOP ["State Transition Loop"]
        OBSERVE["1. Observe<br/><i>Capture current state:<br/>artifacts, codebase, deps, security</i>"]
        DECLARE["2. Declare<br/><i>Classify intent &amp; decompose<br/>into features</i>"]
        EVALUATE["3. Evaluate<br/><i>Check feasibility, constraints,<br/>staleness</i>"]
        DERIVE["4. Derive<br/><i>Build minimal transition plan<br/>from capability graph</i>"]
        EXECUTE["5. Execute<br/><i>Invoke capabilities in<br/>dependency order</i>"]
        VALIDATE["6. Validate<br/><i>Verify desired state is true,<br/>constraints hold</i>"]

        OBSERVE --> DECLARE
        DECLARE --> EVALUATE
        EVALUATE -->|Feasible| DERIVE
        EVALUATE -->|Violation| BLOCK
        DERIVE --> EXECUTE
        EXECUTE --> VALIDATE
        VALIDATE -->|Achieved| LOG
        VALIDATE -->|Not achieved| OBSERVE
    end

    BLOCK["Constraint Violation<br/><i>Revise, update constraint,<br/>or abort</i>"] -->|Revised| EVALUATE
    LOG["Record in<br/>state-log.adoc"] --> NEXT
    NEXT((Declare next<br/>desired state)) --> OBSERVE

    style START fill:#4CAF50,color:#fff,stroke:none
    style NEXT fill:#4CAF50,color:#fff,stroke:none
    style BLOCK fill:#f44336,color:#fff,stroke:none
    style LOG fill:#2196F3,color:#fff,stroke:none
```

1. **Observe** current state (artifacts, codebase, dependencies, security posture)
2. **Declare** desired state ("Users can reset password via SMS", "No vulnerable dependencies")
3. **Evaluate** feasibility against constraints
4. **Derive** the minimal transition plan (which capabilities to invoke)
5. **Execute** the transition
6. **Validate** the desired state is now true

The system figures out what needs to happen. You declare what must be true.

### Capability Invocation

During the **Execute** phase, the orchestrator invokes capabilities in dependency order. The pipeline is not rigid -- the orchestrator derives what is needed dynamically and can skip steps whose artifacts are already current.

```mermaid
flowchart LR
    subgraph feature ["Feature Pipeline (per feature package)"]
        direction LR
        FEATURES["needs-features<br/><i>WHY + WHAT + VERIFY</i>"]
        DESIGN["needs-design<br/><i>HOW</i>"]
        TASKS["needs-tasks<br/><i>WORK</i>"]
        IMPL["needs-implementation<br/><i>CODE</i>"]

        FEATURES --> DESIGN
        DESIGN --> TASKS
        FEATURES -.->|fallback| TASKS
        TASKS --> IMPL
        FEATURES --> IMPL
        DESIGN -.->|fallback| IMPL
    end

    subgraph project ["Project-Wide (independent)"]
        direction LR
        ADR["needs-adr"]
        ARCH["needs-architecture"]
        DEPS["needs-dependencies"]
        SUPPLY["needs-supply-review"]
        SEC["needs-security"]
        COMP["needs-compliance"]
    end

    INTENT((Orchestrator<br/>proven-needs)) --> feature
    INTENT --> project

    DESIGN -.->|tech decisions| ADR
    SEC -.->|delegates fixes| DEPS
    DEPS -.->|new dep detected| SUPPLY
    IMPL -.->|divergences| INTENT
    INTENT -.->|update design| DESIGN
    INTENT -.->|fix code| IMPL

    CONSTRAINTS[("docs/constraints.adoc<br/><i>Checked at every step</i>")] -.->|enforced| feature
    CONSTRAINTS -.->|enforced| project

    style INTENT fill:#4CAF50,color:#fff,stroke:none
    style CONSTRAINTS fill:#FF9800,color:#fff,stroke:none
```

**Key relationships:**
- **Solid arrows** = primary dependency (required upstream artifact)
- **Dotted arrows** = optional or fallback paths
- `needs-features` is always invoked -- every feature gets Gherkin scenarios that serve as stories, specs, and executable tests
- `needs-design` requires `.feature` files
- `needs-tasks` prefers design but can derive tasks directly from `.feature` files
- `needs-implementation` prefers tasks but can work scenario-by-scenario from design alone. Gherkin scenarios are the acceptance gate -- all must pass.
- `needs-design` can trigger `needs-adr` creation for technology decisions (lateral invocation)
- `needs-security` delegates dependency vulnerability fixes to `needs-dependencies`
- `needs-dependencies` flags new dependencies for `needs-supply-review` evaluation
- After implementation, divergences between design and code are reported to the orchestrator. The user decides per-divergence whether to update the design or fix the code.

Independent features can be processed concurrently.

### Artifact Traceability

Each capability reads upstream artifacts and writes its own. The two diagrams below separate ownership (writes) from dependencies (reads) for clarity.

#### Artifact Ownership (writes)

Each capability owns and produces specific artifacts. `state-log.adoc` is managed by the orchestrator.

```mermaid
flowchart LR
    subgraph feature ["Feature Pipeline"]
        NF["needs-features"] --> FEAT[("*.feature files<br/>+ skeleton step defs")]
        NADR["needs-adr"] --> ADRS[("docs/adrs/")]
        ND["needs-design"] --> DESIGN[("design.adoc<br/>data-model.adoc<br/>contracts/")]
        NT["needs-tasks"] --> TASKS[("tasks.adoc")]
        NI["needs-implementation"] --> CODE[("source code<br/>+ step definitions")]
    end

    subgraph project ["Project-wide"]
        NARCH["needs-architecture"] --> ARCH[("architecture.adoc")]
        NDEPS["needs-dependencies"] --> DEPS[("package manifests<br/>lockfiles")]
        NSUPPLY["needs-supply-review"] --> REVIEWS[("docs/supply-reviews/<br/>*.adoc")]
        NSEC["needs-security"] --> CODE2[("source code")]
        NCOMP["needs-compliance"] --> DEPS2[("package manifests")]
    end

    style feature fill:transparent,stroke:#555,stroke-width:1px
    style project fill:transparent,stroke:#555,stroke-width:1px
```

#### Artifact Dependencies (reads)

Solid lines are primary inputs; dashed lines are fallback or optional inputs. All capabilities also read `docs/constraints.adoc` during their Evaluate phase (omitted for clarity).

```mermaid
flowchart RL
    subgraph artifacts ["Artifacts"]
        FEAT[("*.feature files")]
        ADRS[("docs/adrs/")]
        DESIGN[("design.adoc<br/>data-model.adoc<br/>contracts/")]
        TASKS[("tasks.adoc")]
        CODE[("source code")]
        DEPS[("package manifests<br/>lockfiles")]
    end

    subgraph feature ["Feature Pipeline"]
        ND["needs-design"]
        NT["needs-tasks"]
        NI["needs-implementation"]
    end

    subgraph project ["Project-wide"]
        NARCH["needs-architecture"]
        NDEPS["needs-dependencies"]
        NSUPPLY["needs-supply-review"]
        NSEC["needs-security"]
        NCOMP["needs-compliance"]
    end

    %% ── Feature reads (solid = primary) ───────────────────────
    FEAT -->|reads| ND
    DESIGN -->|reads| NT
    TASKS -->|reads| NI
    FEAT -->|reads| NI

    %% ── Feature reads (dashed = fallback / optional) ──────────
    FEAT -.->|fallback| NT
    DESIGN -.->|fallback| NI
    ADRS -.->|reads| ND

    %% ── Project-wide reads ────────────────────────────────────
    DESIGN -.->|reads| NARCH
    ADRS -.->|reads| NARCH
    CODE -.->|reads| NARCH
    DEPS -->|reads| NDEPS
    DEPS -->|reads| NSUPPLY
    CODE -->|reads| NSEC
    DEPS -.->|reads| NSEC
    DEPS -->|reads| NCOMP

    style artifacts fill:transparent,stroke:#555,stroke-width:1px
    style feature fill:transparent,stroke:#555,stroke-width:1px
    style project fill:transparent,stroke:#555,stroke-width:1px
```

| Capability | Reads | Writes |
|---|---|---|
| `needs-features` | `constraints.adoc` | `*.feature` files, skeleton step definitions |
| `needs-design` | `*.feature` files, ADRs, `constraints.adoc`, `architecture.adoc` | `design.adoc`, `data-model.adoc`, `contracts/` |
| `needs-tasks` | `design.adoc` (or `*.feature` files as fallback), `constraints.adoc` | `tasks.adoc` |
| `needs-implementation` | `tasks.adoc` (or `design.adoc` as fallback), `*.feature` files, `constraints.adoc`, ADRs | source code, step definitions |
| `needs-adr` | existing ADRs | `docs/adrs/*.adoc`, `index.adoc` |
| `needs-architecture` | all feature designs, ADRs, `docs/constraints.adoc`, codebase | `docs/architecture.adoc` |
| `needs-dependencies` | package manifests, `docs/constraints.adoc` | package manifests, lockfiles |
| `needs-supply-review` | package manifests, `docs/supply-reviews/`, `docs/constraints.adoc`, external sources (deps.dev, registries, GitHub) | `docs/supply-reviews/*.adoc`, `docs/supply-reviews/_index.adoc` |
| `needs-security` | codebase, dependencies, config, `docs/constraints.adoc` | source code, config |
| `needs-compliance` | dependencies, `docs/constraints.adoc` | dependencies, `docs/constraints.adoc` |

## Entry Point

Load the `proven-needs` skill. It is the single orchestrator that accepts intents, classifies them, and invokes the appropriate capabilities.

```
I want users to be able to browse products, add them to cart, and checkout
```

The orchestrator will:
1. Decompose this into feature packages (product-browsing, shopping-cart, checkout)
2. Ask you to confirm the grouping
3. For each feature: create Gherkin scenarios, design, plan tasks, implement (scenarios must pass)
4. Resolve any design divergences (user decides: update design or fix code)
5. Record technology decisions as ADRs along the way
6. Update the architecture document when all features are implemented

## Core Concepts

### Desired State
A declarative statement of what must be true. Not a task list -- an intent.

- "Users can reset their password via SMS" (feature)
- "No dependencies have known vulnerabilities" (maintenance)
- "All API endpoints enforce rate limiting" (constraint)

### Constraints
Project-wide invariants that must not be violated. Defined in `docs/constraints.adoc`:

- License compliance rules
- Security policies
- Architecture boundaries
- Quality standards
- Performance SLAs

Cross-cutting requirements belong here, not in feature scenarios.

### Feature Packages
Self-contained units of work at `docs/features/<slug>/`:

```
docs/features/shopping-cart/
├── *.feature            # WHY + WHAT + VERIFY: Gherkin scenarios
├── steps/               # Cucumber step definitions (glue code)
├── design.adoc          # HOW: implementation blueprint
└── tasks.adoc           # WORK: phased task breakdown
```

Gherkin `.feature` files replace the traditional separation of user stories, specifications, and tests. Each `.feature` file contains:
- A `Feature:` description with As a / I want / So that (the user story)
- `Scenario:` blocks with Given/When/Then (the specification and executable test)
- `@<PREFIX>-<NNN>` tags on each scenario (spec requirement IDs for traceability)

Step definitions (glue code) live within the feature package at `docs/features/<slug>/steps/`.

Each feature is fully independent -- it can be specified, designed, and implemented without reading other features.

Features can be **archived** by adding the `@archived` tag. Archived features remain on disk as historical records but are skipped during intent classification.

### State Log
Append-only audit trail at `docs/state-log.adoc` recording every transition: what was intended, what changed, what was verified.

## Capabilities

### Feature-Scoped (operate within a feature package)

| Capability | Skill | What it does |
|---|---|---|
| Features | `needs-features` | Create Gherkin feature files (stories + specs + tests in one) |
| Design | `needs-design` | Create implementation blueprint (HOW) |
| Tasks | `needs-tasks` | Break design into phased coding units |
| Implementation | `needs-implementation` | Write and verify code + step definitions |

### Project-Wide (operate at the project level)

| Capability | Skill | What it does |
|---|---|---|
| ADRs | `needs-adr` | Record technology decisions |
| Architecture | `needs-architecture` | Document current system architecture |
| Dependencies | `needs-dependencies` | Manage and update dependency graph |
| Supply Review | `needs-supply-review` | Evaluate OSS dependencies against OpenSSF criteria |
| Security | `needs-security` | Assess and remediate security posture |
| Compliance | `needs-compliance` | Verify license and policy compliance |

Every capability follows the **observe/evaluate/execute** pattern:

```mermaid
flowchart TD
    O["Observe<br/><i>Read artifacts, codebase,<br/>constraints in this domain</i>"]
    E["Evaluate<br/><i>Does desired state require action?<br/>Do constraints allow it?</i>"]
    X["Execute<br/><i>Make the minimum changes.<br/>Create or update artifacts.</i>"]

    O --> E
    E -->|Action needed| X
    E -->|"Already current"| DONE["Report: no action needed"]
    E -->|"Constraint violation"| BLOCK["Report violation<br/>to orchestrator"]
    X --> VERIFY["Verify output"]
    VERIFY --> REPORT["Return result<br/>to orchestrator"]

    style DONE fill:#4CAF50,color:#fff,stroke:none
    style BLOCK fill:#f44336,color:#fff,stroke:none
    style REPORT fill:#2196F3,color:#fff,stroke:none
```

1. **Observe** -- assess current state in this domain
2. **Evaluate** -- does the desired state require action? do constraints allow it?
3. **Execute** -- make the minimum changes

## Artifact Lifecycle

| Artifact | Location | Lifecycle |
|---|---|---|
| Constraints | `docs/constraints.adoc` | Stable, changes rarely |
| Feature files | `docs/features/<slug>/*.feature` | Living, tracked via git |
| Design | `docs/features/<slug>/design.adoc` | Living, synced with .feature files |
| Tasks | `docs/features/<slug>/tasks.adoc` | Ephemeral -- disposable once scenarios verify implementation |
| Step definitions | `docs/features/<slug>/steps/` | Living, synced with .feature files |
| ADRs | `docs/adrs/NNNN-title.adoc` | Permanent, append-only |
| Supply Reviews | `docs/supply-reviews/<package>.adoc` | Living, refreshed on staleness threshold (default 180 days) or version drift |
| Architecture | `docs/architecture.adoc` | Living, reflects current system |
| State Log | `docs/state-log.adoc` | Append-only audit trail |
| Code | project source | Living -- the actual system |

### Version Tracking and Staleness

Feature files (`.feature`) use git-based change detection instead of explicit version attributes. Staleness is detected by comparing modification dates:

```mermaid
flowchart LR
    F["*.feature files<br/><i>git history</i>"]
    D["design.adoc<br/>:version:"]
    T["tasks.adoc<br/>:source-design-version:"]

    F -->|staleness via git diff| D
    D -->|tracked by| T

    style F fill:#4CAF50,color:#fff,stroke:none
    style D fill:#FF9800,color:#fff,stroke:none
    style T fill:#9C27B0,color:#fff,stroke:none
```

When `.feature` files change, the design may become stale. When the design changes, tasks become stale. The orchestrator detects these cascades during the Evaluate phase and includes sync steps in the transition plan.

## Risk Classification

Transitions are auto-approved or require confirmation based on risk:

| Risk | Auto-approve? | Examples |
|---|---|---|
| **Low** | Yes | Patch dependency updates, metadata fixes |
| **Medium** | Propose, ask | Minor dependency updates, design syncs |
| **High** | Full plan, require approval | New features, architecture changes, code changes |

## Gherkin as Requirements

Behavioral specifications use Gherkin's Given/When/Then syntax. Each scenario is simultaneously a user requirement, an acceptance criterion, and an executable test:

```gherkin
@shopping-cart
Feature: Cart Management
  As a shopper,
  I want to add products to my cart and manage quantities,
  so that I can purchase multiple items at once.

  @CART-001
  Scenario: Add product to cart
    Given a product "Widget" exists
    When I add "Widget" to the cart
    Then the cart count should be 1
    And I should see a confirmation "Widget added to cart"

  @CART-002
  Scenario: Adding duplicate product increments quantity
    Given "Widget" is in my cart with quantity 1
    When I add "Widget" to the cart
    Then "Widget" should have quantity 2 in my cart
```

- `Feature:` description = the user story (As a / I want / So that)
- `Scenario:` = the specification + test (Given/When/Then)
- `@CART-001` = the spec requirement ID (for traceability)
- Scenarios are technology-agnostic -- step definitions handle the internal mapping

## Example

Given the intent: "I want an e-commerce site where users can browse products, add them to cart, and checkout"

The orchestrator produces:

```
docs/features/
├── product-browsing/
│   ├── product-catalog.feature  # @PROD-001 through @PROD-004
│   ├── product-search.feature   # @PROD-005 through @PROD-008
│   ├── steps/                   # Step definitions (glue code)
│   ├── design.adoc              # Frontend + API design
│   └── tasks.adoc               # 3 phases, 8 tasks
├── shopping-cart/
│   ├── cart-management.feature  # @CART-001 through @CART-005
│   ├── steps/                   # Step definitions (glue code)
│   ├── design.adoc              # CartService + UI design
│   └── tasks.adoc               # 3 phases, 9 tasks
└── checkout/
    ├── checkout-process.feature # @CHK-001 through @CHK-005
    ├── steps/                   # Step definitions (glue code)
    ├── design.adoc              # Payment flow design
    └── tasks.adoc               # 3 phases, 7 tasks

docs/adrs/
├── index.adoc
├── 0001-use-typescript.adoc
├── 0002-use-postgresql.adoc
└── 0003-use-stripe.adoc

docs/supply-reviews/
├── _index.adoc              # Audit summary (after full audit)
├── stripe.adoc              # Per-dependency review
├── next.adoc
└── react.adoc

docs/architecture.adoc
docs/constraints.adoc
docs/state-log.adoc
```

## What This Is Not

- **Not waterfall** -- the desired state is disposable; declare a new one each iteration
- **Not backlog-driven** -- work is derived each iteration, not accumulated in a backlog
- **Not uncontrolled** -- constraints anchor behavior and prevent regressions

## Reference

- [Example Session](skills/proven-needs/references/example-session.adoc) -- Full walkthrough of feature and maintenance intents
