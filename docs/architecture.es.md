# Arquitectura

[English](architecture.md)

## Vista General del Sistema

Harness-Driven Development conecta 4 componentes en un sistema de enforcement.

```mermaid
graph TD
    YOU["Tú (el humano)"] -->|"/start-issue, /close-issue, /status"| SKILLS

    subgraph Agent["Agente Claude Code"]
        CLAUDE_MD["CLAUDE.md<br/><i>Reglas + contexto</i>"] -.->|"guía el comportamiento"| SKILLS
        SKILLS["Skills<br/><i>Comandos inteligentes</i>"]
    end

    SKILLS -->|"invocan"| HARNESS["Scripts del Harness<br/><i>Validación + enforcement</i>"]
    HARNESS -->|"interactúan con"| LINEAR["Linear API"]
    HARNESS -->|"interactúan con"| GITHUB["GitHub API"]

    HOOKS["Hooks<br/><i>Triggers automáticos</i>"] -->|"activan"| HARNESS

    GIT["git commit / push"] -->|"dispara"| HOOKS
    CI["CI Failure"] -->|"dispara"| HOOKS

    style YOU fill:#58a6ff,color:#0d1117
    style SKILLS fill:#238636,color:#fff
    style HARNESS fill:#d29922,color:#0d1117
    style HOOKS fill:#f85149,color:#fff
    style CLAUDE_MD fill:#8b949e,color:#0d1117
    style LINEAR fill:#5e6ad2,color:#fff
    style GITHUB fill:#24292f,color:#fff
```

## Los 4 Componentes

| Componente | Quién lo usa | Cuándo se activa | Qué hace |
| ---------- | ------------ | ---------------- | -------- |
| **Skills** (recetas) | TÚ los invocas | `/start-issue`, `/close-issue`, `/status` | Ejecuta una receta que llama al harness |
| **Harness** (scripts) | Los skills los invocan, o los hooks los disparan | Cuando un skill lo necesita, o un hook se activa | Verifica reglas y ejecuta validaciones |
| **Hooks** (triggers) | Se activan AUTOMÁTICAMENTE | `git commit`, CI failure | Ejecutan scripts del harness automáticamente |
| **CLAUDE.md** (reglas) | El agente lo lee al iniciar sesión | Siempre — contexto permanente | Define las reglas que todo respeta |

## La Analogía

```
Piensen en un restaurante:

  CLAUDE.md  = El manual de operaciones
               "Así se hacen las cosas aquí"

  SKILLS     = Las recetas del menú
               El chef (agente) sabe ejecutarlas
               "/start-issue" = "preparar la orden"
               "/close-issue" = "servir el plato"

  HARNESS    = El control de calidad
               Verifica que el plato tiene todo
               "¿Sal? ¿Temperatura correcta? ¿Presentación?"

  HOOKS      = Los sensores automáticos
               La alarma del horno, el timer, el termómetro
               Se activan solos
```

## 3 Canales de Comunicación

```mermaid
graph LR
    subgraph Channel1["Canal 1: Webhook"]
        direction LR
        GH1["GitHub PR"] <-->|"integración nativa"| LN1["Linear Issue"]
    end

    subgraph Channel2["Canal 2: CI Bridge"]
        direction LR
        CI2["CI Failure"] -->|"ci_failure_bridge.py"| LN2["Linear Bug"]
    end

    subgraph Channel3["Canal 3: Harness"]
        direction LR
        AG3["Agente"] -->|"linear_client.py"| LN3["Linear Issue"]
    end

    style Channel1 fill:#161b22,color:#c9d1d9
    style Channel2 fill:#161b22,color:#c9d1d9
    style Channel3 fill:#161b22,color:#c9d1d9
```

| Canal | Dirección | Mecanismo | Acciones |
| ----- | --------- | --------- | -------- |
| **Webhook** | Linear ↔ GitHub | Integración nativa | PR abierto → In Progress, merged → Done |
| **CI Bridge** | GitHub → Linear | `ci_failure_bridge.py` | CI falla → auto-crea bug (idempotente) |
| **Harness** | Agente → Linear | `linear_client.py` | Lee issues, crea branches, cierra con evidencia |

## Sistema de Gates (close_issue.sh)

```mermaid
flowchart TD
    START["/close-issue DEMO-1"] --> G1{"Gate 1<br/>¿Tests pasan?"}
    G1 -->|"npm test"| G1R{Resultado}
    G1R -->|PASS| G2{"Gate 2<br/>¿CI green?"}
    G1R -->|FAIL| BLOCKED["BLOQUEADO<br/>Arregla los tests"]

    G2 -->|"gh run list"| G2R{Resultado}
    G2R -->|PASS| G3{"Gate 3<br/>¿Acceptance criteria?"}
    G2R -->|FAIL| BLOCKED2["BLOQUEADO<br/>Arregla el CI"]

    G3 -->|"Linear API"| G3R{Resultado}
    G3R -->|PASS| CLOSE["TODOS LOS GATES PASAN"]
    G3R -->|FAIL| BLOCKED3["BLOQUEADO<br/>Completa criterios en Linear"]

    CLOSE --> EVIDENCE["Posta comentario de evidencia"]
    EVIDENCE --> DONE["Mueve issue a Done"]

    style START fill:#58a6ff,color:#0d1117
    style BLOCKED fill:#f85149,color:#fff
    style BLOCKED2 fill:#f85149,color:#fff
    style BLOCKED3 fill:#f85149,color:#fff
    style CLOSE fill:#238636,color:#fff
    style DONE fill:#238636,color:#fff
```

## 4 Capas de Enforcement

```mermaid
graph TB
    subgraph L1["Capa 1: Pre-commit (local)"]
        L1A["gitleaks"] --> L1B["check_issue_ref.sh"]
    end

    subgraph L2["Capa 2: CI (GitHub Actions)"]
        L2A["npm test"] --> L2B["gitleaks scan"]
        L2B --> L2C{"¿Pasa?"}
        L2C -->|No| L2D["ci_failure_bridge.py → Bug en Linear"]
    end

    subgraph L3["Capa 3: Harness (Agente)"]
        L3A["close_issue.sh"] --> L3B["3 gates"]
        L3B --> L3C["Evidencia + audit trail"]
    end

    subgraph L4["Capa 4: Webhook (GitHub → Linear)"]
        L4A["PR abierto → In Progress"]
        L4B["PR merged → Done"]
    end

    L1 -->|"si se bypasea (--no-verify)"| L2
    L2 -->|"antes de cerrar"| L3
    L3 -->|"en eventos de PR"| L4

    style L1 fill:#238636,color:#fff
    style L2 fill:#d29922,color:#0d1117
    style L3 fill:#58a6ff,color:#0d1117
    style L4 fill:#8b949e,color:#0d1117
```

## Flujo de Datos: End to End

```mermaid
sequenceDiagram
    actor Dev as Desarrollador
    participant CC as Claude Code
    participant Git as Git (local)
    participant GH as GitHub
    participant CI as GitHub Actions
    participant LN as Linear

    Note over Dev,LN: Fase 1: Iniciar Issue
    Dev->>CC: /start-issue DEMO-1
    CC->>LN: linear_client.py get DEMO-1
    LN-->>CC: título, descripción, criterios
    CC->>Git: git checkout -b feat/DEMO-1-dark-mode
    CC->>LN: linear_client.py move DEMO-1 "In Progress"
    CC-->>Dev: "DEMO-1 iniciado. Branch listo."

    Note over Dev,LN: Fase 2: Implementar
    Dev->>CC: "implementa dark mode"
    CC->>CC: escribe código
    CC->>Git: git commit -m "feat: toggle\n\nRefs DEMO-1"
    Git->>Git: pre-commit: gitleaks scan
    Git->>Git: commit-msg: check_issue_ref.sh
    Git-->>CC: commit aceptado
    CC->>GH: git push
    GH->>CI: dispara CI workflow
    CI->>CI: npm test + gitleaks
    GH->>LN: webhook: issue → In Review

    Note over Dev,LN: Fase 3: Cerrar Issue
    Dev->>CC: /close-issue DEMO-1
    CC->>CC: Gate 1: npm test → PASS
    CC->>GH: Gate 2: gh run list → PASS
    CC->>LN: Gate 3: criterios checkeados? → PASS
    CC->>LN: Posta comentario de evidencia
    CC->>LN: Mueve DEMO-1 → Done
    CC-->>Dev: "DEMO-1 cerrado con evidencia."
```

## Flujo del Secret Bloqueado (el "Momento Wow")

```mermaid
sequenceDiagram
    actor Dev as Desarrollador
    participant CC as Claude Code
    participant Git as Git
    participant GH as GitHub
    participant CI as CI
    participant LN as Linear

    Note over Dev,LN: Momento 1: El error
    Dev->>CC: "pon el API key en el código"
    CC->>CC: escribe LINEAR_API_KEY = "lin_api_..."
    CC->>Git: git commit
    Git->>Git: gitleaks pre-commit hook
    Git--xCC: BLOQUEADO — secret detectado
    Note right of Git: Nunca llega a GitHub

    Note over Dev,LN: Momento 2: La corrección
    Dev->>CC: "arréglalo, usa .env"
    CC->>CC: crea .env, actualiza código
    CC->>Git: git commit
    Git->>Git: gitleaks → limpio
    Git-->>CC: commit aceptado
    CC->>GH: git push

    Note over Dev,LN: Momento 3: Segunda capa
    Note right of GH: Si alguien usa --no-verify
    GH->>CI: CI corre gitleaks
    CI--xGH: FAIL — secret detectado
    CI->>LN: ci_failure_bridge.py → bug creado
```
