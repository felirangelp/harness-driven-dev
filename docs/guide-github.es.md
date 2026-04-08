# Guía de Configuración de GitHub

[English](guide-github.md)

Guía completa para configurar GitHub para Harness-Driven Development.

## 1. Crear el Repositorio

Si estás empezando desde cero:

```bash
# Opción A: Fork del repo
# Ve a https://github.com/felirangelp/harness-driven-dev → Fork

# Opción B: Clonar y subir a tu propio repo
git clone https://github.com/felirangelp/harness-driven-dev.git
cd harness-driven-dev
git remote set-url origin https://github.com/TU_USUARIO/harness-driven-dev.git
git push -u origin main
```

## 2. Configurar Secrets del Repositorio

Los secrets son variables de entorno que GitHub Actions puede usar de forma segura.

### 2.1 LINEAR_API_KEY (requerido)

Permite que el workflow Linear Bridge cree bugs en Linear cuando CI falla.

**Vía CLI:**
```bash
gh secret set LINEAR_API_KEY
# Pega tu key lin_api_... cuando te lo pida
```

**Vía web:**
1. Ve a tu repo → pestaña **Settings**
2. Barra lateral: **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Llena:
   - **Name**: `LINEAR_API_KEY`
   - **Secret**: tu key `lin_api_xxxxxxxxxx`
5. Click en **Add secret**

### 2.2 GITHUB_TOKEN (automático)

GitHub lo provee automáticamente — no necesita configuración. Lo usa la acción de gitleaks para escanear secrets.

## 3. Verificar los Workflows de GitHub Actions

El repo incluye 2 workflows que corren automáticamente:

### 3.1 Workflow CI (`.github/workflows/ci.yml`)

**Se dispara**: en push a `main`, en pull requests a `main`

**Jobs:**
| Job | Qué hace | Cómo verificar |
|-----|----------|----------------|
| **Tests** | Corre `npm ci` + `npm test` | Haz push de cualquier commit y revisa la pestaña Actions |
| **Secret Scanning** | Corre gitleaks para detectar secrets | Escanea todos los commits automáticamente |

**Para verificar que funciona:**
1. Ve a tu repo → pestaña **Actions**
2. Deberías ver el workflow "CI"
3. Click en el último run para ver resultados

### 3.2 Workflow Linear Bridge (`.github/workflows/linear-bridge.yml`)

**Se dispara**: corre automáticamente después de que el workflow CI termina con falla

**Qué hace:**
1. Detecta que CI falló
2. Ejecuta `scripts/ci_failure_bridge.py`
3. Crea un bug en Linear con:
   - Nombres de los jobs que fallaron
   - Nombre del branch
   - Link al run de GitHub Actions
4. Si ya existe un bug de bridge, agrega un comentario en vez de duplicar

**Para verificar que funciona:**
- Solo corre cuando CI falla — lo verás en acción durante el demo cuando se haga push de un secret

## 4. Configurar GitHub Pages

Esto publica la landing page y los slides.

**Vía CLI:**
```bash
gh api repos/TU_USUARIO/harness-driven-dev/pages \
  -X POST \
  --input - <<< '{"source":{"branch":"main","path":"/docs"}}'
```

**Vía web:**
1. Ve a tu repo → pestaña **Settings**
2. Barra lateral: **Pages**
3. Bajo **Source**, selecciona:
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click en **Save**
5. Espera 1-2 minutos a que se construya el sitio

**Tu sitio estará en:**
```
https://TU_USUARIO.github.io/harness-driven-dev/
```

## 5. Instalar Pre-commit Hooks Localmente

Estos hooks corren en tu máquina antes de cada commit.

```bash
# Instalar pre-commit (si no está instalado)
pip install pre-commit

# Instalar los hooks definidos en .pre-commit-config.yaml
pre-commit install --hook-type pre-commit --hook-type commit-msg
```

Esto instala:

| Hook | Cuándo corre | Qué hace |
|------|-------------|----------|
| **gitleaks** | Antes de cada commit | Escanea archivos staged buscando secrets (API keys, passwords, tokens) |
| **check-issue-ref** | En el mensaje de commit | Verifica que `Refs DEMO-XXX` esté presente, bloquea `Closes/Fixes/Resolves` |

### Verificar que los hooks funcionan

```bash
# Test gitleaks (debería pasar con código limpio)
pre-commit run gitleaks --all-files

# Test issue-ref check (debería BLOQUEAR — sin referencia a issue)
echo "test commit message" > /tmp/test-msg.txt
bash scripts/check_issue_ref.sh /tmp/test-msg.txt
# Esperado: BLOCKED

# Test con mensaje válido (debería PASAR)
echo "feat: add feature

Refs DEMO-1" > /tmp/test-msg.txt
bash scripts/check_issue_ref.sh /tmp/test-msg.txt
# Esperado: Issue reference OK
```

## 6. Instalar GitHub CLI (`gh`)

El harness usa `gh` para verificar estado de CI y ver runs.

**macOS:**
```bash
brew install gh
gh auth login
```

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install gh
gh auth login
```

**Windows:**
```bash
winget install GitHub.cli
gh auth login
```

**Verificar:**
```bash
gh --version
gh run list --limit 1
```

## 7. Convención de Nombres de Branch

El webhook Linear-GitHub detecta identificadores de issues en nombres de branch para auto-linkear PRs.

**Patrón:** `{type}/DEMO-{N}-{slug}`

| Ejemplo | ¿Detectado? | Resultado |
|---------|-------------|-----------|
| `feat/DEMO-1-dark-mode` | Sí | PR linkeado a DEMO-1 |
| `fix/DEMO-2-counter-bug` | Sí | PR linkeado a DEMO-2 |
| `my-feature-branch` | No | Sin auto-linking |

**Tipos:** `feat`, `fix`, `docs`, `test`, `chore`, `refactor`

## 8. Configuración del Repositorio (recomendado)

### 8.1 Branch Protection (opcional para demo)

1. Ve a **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Habilita:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging**
   - Selecciona checks: `Tests`, `Secret Scanning`

### 8.2 Topics

Agrega topics para hacer el repo descubrible:

```bash
gh repo edit --add-topic harness-driven-development \
  --add-topic linear --add-topic claude-code \
  --add-topic ai-agents --add-topic devops
```

## 9. Checklist de Verificación Completa

Recorre este checklist para verificar que todo está configurado:

```bash
# 1. Remote de git configurado
git remote -v
# Debería mostrar la URL de tu repo

# 2. GitHub CLI autenticado
gh auth status
# Debería mostrar "Logged in to github.com"

# 3. Secrets configurados
gh secret list
# Debería mostrar LINEAR_API_KEY

# 4. CI workflow existe y corre
gh run list --limit 3
# Debería mostrar runs recientes

# 5. GitHub Pages activo
gh api repos/TU_USUARIO/harness-driven-dev/pages --jq '.html_url'
# Debería mostrar tu URL de pages

# 6. Pre-commit hooks instalados
pre-commit run --all-files
# Debería correr gitleaks y pasar

# 7. Hook de issue-ref funciona
echo "bad message" > /tmp/test.txt
bash scripts/check_issue_ref.sh /tmp/test.txt
# Debería mostrar BLOCKED
```

## Troubleshooting

**"gh: command not found"**
- Instala GitHub CLI: https://cli.github.com/

**"pre-commit: command not found"**
- Ejecuta `pip install pre-commit` dentro de tu ambiente virtual

**El workflow CI no aparece en la pestaña Actions**
- Haz push de un commit a `main` — los workflows se activan en el primer push

**GitHub Pages muestra 404**
- Verifica que la fuente esté en branch `main`, carpeta `/docs`
- Espera 2-3 minutos después de habilitarlo
- Revisa la pestaña Actions por un workflow "pages-build-deployment"

**Linear Bridge no crea bugs**
- Verifica que `LINEAR_API_KEY` esté como secret del repositorio
- El bridge solo corre cuando CI realmente falla

**`/close-issue` Gate 2 muestra "FAIL (last run: skipped)" aunque CI pasó**
- Esto pasa cuando el script toma el workflow Linear Bridge (skipped) en vez del workflow CI real
- El script `close_issue.sh` filtra por `--workflow ci.yml` para evitar esto
- Si aún lo ves, espera unos segundos e intenta de nuevo — el CI run puede estar en progreso
- Verifica manualmente: `gh run list --workflow ci.yml --branch main --limit 1`
