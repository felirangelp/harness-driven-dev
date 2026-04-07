# Architecture

[Español](architecture.es.md)

## System Overview

Harness-Driven Development connects 4 components into an enforcement system.

```mermaid
graph TD
    YOU["You (the human)"] -->|"/start-issue, /close-issue, /status"| SKILLS
    
    subgraph Agent["Claude Code Agent"]
        CLAUDE_MD["CLAUDE.md<br/><i>Rules + context</i>"] -.->|"guides behavior"| SKILLS
        SKILLS["Skills<br/><i>Intelligent commands</i>"]
    end

    SKILLS -->|"invoke"| HARNESS["Harness Scripts<br/><i>Validation + enforcement</i>"]
    HARNESS -->|"interact with"| LINEAR["Linear API"]
    HARNESS -->|"interact with"| GITHUB["GitHub API"]

    HOOKS["Hooks<br/><i>Automatic triggers</i>"] -->|"activate"| HARNESS

    GIT["git commit / push"] -->|"triggers"| HOOKS
    CI["CI Failure"] -->|"triggers"| HOOKS

    style YOU fill:#58a6ff,color:#0d1117
    style SKILLS fill:#238636,color:#fff
    style HARNESS fill:#d29922,color:#0d1117
    style HOOKS fill:#f85149,color:#fff
    style CLAUDE_MD fill:#8b949e,color:#0d1117
    style LINEAR fill:#5e6ad2,color:#fff
    style GITHUB fill:#24292f,color:#fff
```

## The 4 Components

| Component | Who uses it | When it activates | What it does |
|-----------|------------|-------------------|-------------|
| **Skills** (recipes) | YOU invoke them | `/start-issue`, `/close-issue`, `/status` | Executes a recipe that calls the harness |
| **Harness** (scripts) | Skills invoke them, or hooks trigger them | When a skill needs it, or a hook fires | Verifies rules and runs validations |
| **Hooks** (triggers) | Activate AUTOMATICALLY | `git commit`, CI failure | Execute harness scripts automatically |
| **CLAUDE.md** (rules) | Agent reads at session start | Always — permanent context | Defines the rules everything respects |

## The Analogy

```
Think of a restaurant:

  CLAUDE.md  = The operations manual
               "This is how things are done here"

  SKILLS     = The menu recipes
               The chef (agent) knows how to execute them
               "/start-issue" = "prepare the order"
               "/close-issue" = "serve the plate"

  HARNESS    = Quality control
               Verifies the dish has everything
               "Salt? Correct temperature? Presentation?"

  HOOKS      = Automatic sensors
               The oven alarm, the timer, the thermometer
               They activate on their own
```

## 3 Communication Channels

```mermaid
graph LR
    subgraph Channel1["Channel 1: Webhook"]
        direction LR
        GH1["GitHub PR"] <-->|"native integration"| LN1["Linear Issue"]
    end

    subgraph Channel2["Channel 2: CI Bridge"]
        direction LR
        CI2["CI Failure"] -->|"ci_failure_bridge.py"| LN2["Linear Bug"]
    end

    subgraph Channel3["Channel 3: Harness"]
        direction LR
        AG3["Agent"] -->|"linear_client.py"| LN3["Linear Issue"]
    end

    style Channel1 fill:#161b22,color:#c9d1d9
    style Channel2 fill:#161b22,color:#c9d1d9
    style Channel3 fill:#161b22,color:#c9d1d9
```

| Channel | Direction | Mechanism | Actions |
| ------- | --------- | --------- | ------- |
| **Webhook** | Linear ↔ GitHub | Native integration | PR opened → In Progress, merged → Done |
| **CI Bridge** | GitHub → Linear | `ci_failure_bridge.py` | CI fails → auto-create bug (idempotent) |
| **Harness** | Agent → Linear | `linear_client.py` | Read issues, create branches, close with evidence |

## Gate System (close_issue.sh)

```mermaid
flowchart TD
    START["/close-issue DEMO-1"] --> G1{"Gate 1<br/>Tests passing?"}
    G1 -->|"npm test"| G1R{Result}
    G1R -->|PASS| G2{"Gate 2<br/>CI green?"}
    G1R -->|FAIL| BLOCKED["BLOCKED<br/>Fix failing tests"]

    G2 -->|"gh run list"| G2R{Result}
    G2R -->|PASS| G3{"Gate 3<br/>Acceptance criteria?"}
    G2R -->|FAIL| BLOCKED2["BLOCKED<br/>Fix CI pipeline"]

    G3 -->|"Linear API"| G3R{Result}
    G3R -->|PASS| CLOSE["ALL GATES PASSED"]
    G3R -->|FAIL| BLOCKED3["BLOCKED<br/>Complete criteria in Linear"]

    CLOSE --> EVIDENCE["Post evidence comment"]
    EVIDENCE --> DONE["Move issue to Done"]

    style START fill:#58a6ff,color:#0d1117
    style BLOCKED fill:#f85149,color:#fff
    style BLOCKED2 fill:#f85149,color:#fff
    style BLOCKED3 fill:#f85149,color:#fff
    style CLOSE fill:#238636,color:#fff
    style DONE fill:#238636,color:#fff
```

## 4 Layers of Enforcement

```mermaid
graph TB
    subgraph L1["Layer 1: Pre-commit (local)"]
        L1A["gitleaks"] --> L1B["check_issue_ref.sh"]
    end

    subgraph L2["Layer 2: CI (GitHub Actions)"]
        L2A["npm test"] --> L2B["gitleaks scan"]
        L2B --> L2C{"Pass?"}
        L2C -->|No| L2D["ci_failure_bridge.py → Linear bug"]
    end

    subgraph L3["Layer 3: Harness (Agent)"]
        L3A["close_issue.sh"] --> L3B["3 gates"]
        L3B --> L3C["Evidence + audit trail"]
    end

    subgraph L4["Layer 4: Webhook (GitHub → Linear)"]
        L4A["PR opened → In Progress"]
        L4B["PR merged → Done"]
    end

    L1 -->|"if bypassed (--no-verify)"| L2
    L2 -->|"before closing"| L3
    L3 -->|"on PR events"| L4

    style L1 fill:#238636,color:#fff
    style L2 fill:#d29922,color:#0d1117
    style L3 fill:#58a6ff,color:#0d1117
    style L4 fill:#8b949e,color:#0d1117
```

## Data Flow: End to End

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant CC as Claude Code
    participant Git as Git (local)
    participant GH as GitHub
    participant CI as GitHub Actions
    participant LN as Linear

    Note over Dev,LN: Phase 1: Start Issue
    Dev->>CC: /start-issue DEMO-1
    CC->>LN: linear_client.py get DEMO-1
    LN-->>CC: title, description, criteria
    CC->>Git: git checkout -b feat/DEMO-1-dark-mode
    CC->>LN: linear_client.py move DEMO-1 "In Progress"
    CC-->>Dev: "DEMO-1 started. Branch ready."

    Note over Dev,LN: Phase 2: Implement
    Dev->>CC: "implement dark mode"
    CC->>CC: writes code
    CC->>Git: git commit -m "feat: toggle\n\nRefs DEMO-1"
    Git->>Git: pre-commit: gitleaks scan
    Git->>Git: commit-msg: check_issue_ref.sh
    Git-->>CC: commit accepted
    CC->>GH: git push
    GH->>CI: trigger CI workflow
    CI->>CI: npm test + gitleaks
    GH->>LN: webhook: issue → In Review

    Note over Dev,LN: Phase 3: Close Issue
    Dev->>CC: /close-issue DEMO-1
    CC->>CC: Gate 1: npm test → PASS
    CC->>GH: Gate 2: gh run list → PASS
    CC->>LN: Gate 3: criteria checked? → PASS
    CC->>LN: Post evidence comment
    CC->>LN: Move DEMO-1 → Done
    CC-->>Dev: "DEMO-1 closed with evidence."
```

## Secret Blocked Flow (the "Wow Moment")

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant CC as Claude Code
    participant Git as Git
    participant GH as GitHub
    participant CI as CI
    participant LN as Linear

    Note over Dev,LN: Moment 1: The mistake
    Dev->>CC: "put the API key in the code"
    CC->>CC: writes LINEAR_API_KEY = "lin_api_..."
    CC->>Git: git commit
    Git->>Git: gitleaks pre-commit hook
    Git--xCC: BLOCKED — secret detected
    Note right of Git: Never reaches GitHub

    Note over Dev,LN: Moment 2: The fix
    Dev->>CC: "fix it, use .env"
    CC->>CC: creates .env, updates code
    CC->>Git: git commit
    Git->>Git: gitleaks → clean
    Git-->>CC: commit accepted
    CC->>GH: git push

    Note over Dev,LN: Moment 3: Second layer
    Note right of GH: If someone uses --no-verify
    GH->>CI: CI runs gitleaks
    CI--xGH: FAIL — secret detected
    CI->>LN: ci_failure_bridge.py → bug created
```
