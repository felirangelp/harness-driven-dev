# Contributing

[Español](#contribuir)

Thank you for your interest in contributing to Harness-Driven Development!

## How to Contribute

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feat/your-feature`
3. **Make your changes** following the guidelines below
4. **Run tests**: `npm test`
5. **Commit** with the format: `type: description` + `Refs ISSUE-ID`
6. **Push** and open a Pull Request

## Guidelines

### Commit Messages

```
feat: add new gate for lint check

Refs DEMO-4
```

- Use `Refs`, never `Closes/Fixes/Resolves`
- Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`

### Code Style

- **HTML/CSS/JS**: Vanilla only — no frameworks, no build tools
- **Python**: stdlib only — no pip dependencies for harness scripts
- **Shell**: POSIX-compatible, `set -euo pipefail`

### Adding a New Gate

1. Add your check to `scripts/close_issue.sh`
2. Increment `GATES_TOTAL`
3. Document it in `CLAUDE.md`
4. Add a test or verification

### Adding a New Skill

1. Create `.claude/skills/your-skill/SKILL.md`
2. Follow the frontmatter format (see existing skills)
3. Reference it in `CLAUDE.md`
4. Document it in the README

## What We're Looking For

- New enforcement gates (lint, coverage, dependency checks)
- Adapters for other project management tools (Jira, Asana, Notion)
- Adapters for other CI systems (GitLab CI, CircleCI)
- Translations of documentation
- Improvements to existing scripts

## What We're NOT Looking For

- Framework dependencies (React, Vue, etc.)
- External Python packages for harness scripts
- Changes that break the demo flow

## Questions?

Open an issue or start a discussion.

---

# Contribuir

Gracias por tu interés en contribuir a Harness-Driven Development.

## Cómo Contribuir

1. **Fork** el repositorio
2. **Crea un branch**: `git checkout -b feat/tu-feature`
3. **Haz tus cambios** siguiendo las guías de abajo
4. **Corre tests**: `npm test`
5. **Commitea** con el formato: `type: descripción` + `Refs ISSUE-ID`
6. **Push** y abre un Pull Request

## Guías

### Mensajes de Commit

```
feat: agregar nuevo gate para lint check

Refs DEMO-4
```

- Usa `Refs`, nunca `Closes/Fixes/Resolves`
- Tipos: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`

### Estilo de Código

- **HTML/CSS/JS**: Vanilla solamente — sin frameworks, sin build tools
- **Python**: solo stdlib — sin dependencias pip para scripts del harness
- **Shell**: compatible con POSIX, `set -euo pipefail`

### Agregar un Nuevo Gate

1. Agrega tu verificación a `scripts/close_issue.sh`
2. Incrementa `GATES_TOTAL`
3. Documéntalo en `CLAUDE.md`
4. Agrega un test o verificación

### Agregar un Nuevo Skill

1. Crea `.claude/skills/tu-skill/SKILL.md`
2. Sigue el formato de frontmatter (ve los skills existentes)
3. Referéncialo en `CLAUDE.md`
4. Documéntalo en el README

## Qué Buscamos

- Nuevos gates de enforcement (lint, coverage, dependency checks)
- Adaptadores para otras herramientas de gestión (Jira, Asana, Notion)
- Adaptadores para otros sistemas de CI (GitLab CI, CircleCI)
- Traducciones de documentación
- Mejoras a scripts existentes

## Qué NO Buscamos

- Dependencias de frameworks (React, Vue, etc.)
- Paquetes Python externos para scripts del harness
- Cambios que rompan el flujo del demo

## ¿Preguntas?

Abre un issue o inicia una discusión.
