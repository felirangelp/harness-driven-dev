# Guía de Configuración de Linear

[English](guide-linear.md)

Guía completa para configurar Linear para Harness-Driven Development.

## 1. Crear una Cuenta de Linear

Si no tienes una, regístrate en [linear.app](https://linear.app/). El plan gratuito funciona para demos.

## 2. Crear un Team

El team es el contenedor de todos tus issues. La clave del team se convierte en el prefijo de los IDs (ej., `DEMO-1`).

1. Ve a **Linear → Settings → Teams** (barra lateral izquierda)
2. Click en **Create team**
3. Configura:
   - **Team name**: `Demo` (o el nombre de tu proyecto)
   - **Team key**: `DEMO` (este será el prefijo de los issues)
   - **Description**: opcional
4. Click en **Create team**

> **Importante**: La clave del team determina el prefijo de tus issues. En esta guía se usa `DEMO` como ejemplo — tu clave puede ser cualquiera (ej., `HAR`, `EXP`, `PROJ`). Los scripts del harness detectan referencias a issues dinámicamente usando el patrón `[A-Z]+-[0-9]+`, así que cualquier clave funciona automáticamente.

## 3. Configurar los Estados del Workflow

Linear viene con estados por defecto. Verifica que coincidan con lo que el harness espera:

| Estado | Tipo | Requerido por |
|--------|------|---------------|
| **Todo** | Unstarted | `/start-issue` mueve DESDE aquí |
| **In Progress** | Started | `/start-issue` mueve HACIA aquí |
| **In Review** | Started | El webhook de GitHub mueve aquí al hacer PR review |
| **Done** | Completed | `/close-issue` mueve HACIA aquí |

Para verificar o editar estados:
1. Ve a **Settings → Teams → [Tu Team] → Workflow**
2. Verifica que existan los 4 estados de arriba
3. Si falta alguno, click en **+ Add state**

## 4. Crear un Proyecto (opcional)

Los proyectos agrupan issues relacionados. Para el demo:

1. Ve a **Linear → Projects** (barra lateral izquierda)
2. Click en **+ Create project**
3. Configura:
   - **Name**: `HDD Demo`
   - **Team**: `Demo`
   - **Status**: Active
4. Click en **Create**

## 5. Crear una API Key

La API key permite que los scripts del harness interactúen con Linear. **Necesitas esto antes de crear issues vía CLI o Claude Code.**

1. Click en tu **avatar** (esquina inferior izquierda) → **Settings**
2. En la barra lateral, click en **Security & access**
3. Baja hasta **Personal API keys**
4. Click en **New API key**
5. Dale un label: `harness-driven-dev`
6. **Copia la key inmediatamente** — empieza con `lin_api_` y no se mostrará de nuevo

## 6. Guardar la API Key

### Localmente (para desarrollo y demo)

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y pega tu key
# LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### En GitHub (para CI — el workflow del Linear Bridge)

El workflow Linear Bridge corre en GitHub Actions y necesita la key para crear bugs en Linear cuando CI falla. Debes guardarla como secret del repositorio.

**Opción A: Vía terminal (requiere [GitHub CLI](https://cli.github.com/))**

```bash
# Asegúrate de estar en el directorio del repo
cd ~/projects/harness-driven-dev

# Configura el secret — te pedirá que pegues el valor
gh secret set LINEAR_API_KEY

# Pega tu key lin_api_xxxxxxxxxx y presiona Enter
# Resultado esperado: ✓ Set secret LINEAR_API_KEY for tu-usuario/harness-driven-dev
```

**Opción B: Vía GitHub web**

1. Ve a https://github.com/felirangelp/harness-driven-dev/settings/secrets/actions
   - O navega: repo → pestaña **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Llena:
   - **Name**: `LINEAR_API_KEY`
   - **Secret**: pega la misma key `lin_api_...` que pusiste en `.env`
4. Click en **Add secret**
5. Deberías ver `LINEAR_API_KEY` listado bajo Repository secrets

## 7. Crear los Issues del Demo

El demo usa 3 features simples para el Task Board. Cada una es lo suficientemente pequeña para implementarla en minutos, pero lo suficientemente completa para mostrar el flujo del harness.

| Issue | Qué hace | Por qué está en el demo |
|-------|----------|------------------------|
| **Add dark mode toggle** | Agrega un botón para cambiar entre tema claro y oscuro | Perfecto para el "momento wow" del secret bloqueado — el agente escribe el toggle y probamos el flujo completo commit → hook → CI |
| **Add task counter per column** | Muestra "To Do (3)" en vez de solo "To Do" en los headers | Feature rápida que demuestra `/start-issue` → código → `/close-issue` sin drama |
| **Add drag and drop** | Permite arrastrar tareas entre columnas en vez de usar las flechas | Feature más compleja, buena para mostrar que el harness escala |

Ahora que tienes la API key configurada, puedes crear estos issues desde Claude Code, vía CLI, o manualmente.

### Opción A: Desde Claude Code (recomendado)

Inicia Claude Code en el directorio del proyecto y dile al agente:

```
Crea los 3 issues del demo
```

O créalos uno por uno:

```
/create-issue Add dark mode toggle
/create-issue Add task counter per column
/create-issue Add drag and drop between columns
```

El agente creará cada issue en Linear con criterios de aceptación automáticamente.

### Opción B: Vía script CLI

```bash
source .venv/bin/activate

python3 scripts/linear_client.py create "Add dark mode toggle" \
  "## Acceptance Criteria
- [ ] Toggle button visible in the header
- [ ] Dark and light styles applied to the board
- [ ] User preference saved in localStorage"

python3 scripts/linear_client.py create "Add task counter per column" \
  "## Acceptance Criteria
- [ ] Counter number shows in each column header
- [ ] Counter updates when tasks are added, moved, or deleted"

python3 scripts/linear_client.py create "Add drag and drop between columns" \
  "## Acceptance Criteria
- [ ] Tasks can be dragged from one column to another
- [ ] Task state updates on drop"
```

### Opción C: Manualmente en Linear

1. Ve a la vista de tu team en Linear
2. Click en **+ Create issue** (o presiona `C`)
3. Crea cada issue con el título y la descripción de la tabla de arriba

> **Importante**: Siempre incluye `## Acceptance Criteria` con checkboxes `- [ ]`. El gate 3 del harness revisa estos checkboxes para verificar el Definition of Done.

## 8. Conectar Linear con GitHub

Esto habilita la sincronización automática de estados (PR → In Progress, merge → Done) vía webhook.

> **Importante — Múltiples Workspaces de Linear**: La GitHub App de Linear solo se puede instalar **una vez por cuenta de GitHub**. Si ya tienes otro workspace de Linear conectado a la misma cuenta de GitHub (ej., un proyecto de trabajo), debes **desinstalar** la app primero y reinstalarla para este workspace. Ver [Solución: Múltiples Workspaces](#múltiples-workspaces-de-linear-en-la-misma-cuenta-de-github) al final de esta sección.

### Paso 8.1: Instalar la integración de GitHub en Linear

1. Ve a **Linear → Settings → Integrations** (barra lateral izquierda)
2. Busca **GitHub** → click en **Enable**
3. Te redirigirá a GitHub para instalar la app de Linear
4. Selecciona tu cuenta de GitHub (ej., `felirangelp`)
5. Bajo **Repository access**, selecciona **Only select repositories**
6. Elige tu repo (ej., `harness-driven-dev`)
7. Click en **Save** / **Install**
8. Serás redirigido de vuelta a Linear

### Paso 8.2: Conectar tu cuenta personal de GitHub

1. En Linear → **Settings → Integrations → GitHub** (misma página)
2. Busca **Personal GitHub account not connected** → click en **Connected accounts →**
3. Click en **Connect** junto a GitHub
4. Autoriza la conexión
5. Esto sincroniza la atribución de tus commits y PRs

> Si "Connected accounts" aparece en gris, completa el Paso 8.1 primero. La conexión de cuenta personal solo funciona después de que la integración del workspace esté habilitada.

### Paso 8.3: Configurar las Automatizaciones de PR

1. Ve a **Linear → Settings → Teams → [Tu Team] → Workflows & automations**
2. Bajo **Pull request and commit automations**, configura:

| Evento | Acción |
|--------|--------|
| On draft PR open, move to... | **No action** |
| On PR open, move to... | **In Progress** |
| On PR review request or activity, move to... | **In Review** |
| On PR ready for merge, move to... | **In Review** |
| On PR merge, move to... | **Done** |

> **¿Por qué estas configuraciones?** El harness usa `Refs DEMO-XXX` (no `Closes`) en commits y descripciones de PR. El webhook detecta el identificador del issue en el nombre del branch (ej., `feat/HAR-5-dark-mode`) y actualiza el estado automáticamente.

### Paso 8.4: Habilitar features adicionales (opcional)

En la configuración de la integración de GitHub, habilita:
- **View pull requests in Linear** (Alpha) — toggle ON
- **Pull request notifications** — All activity by people

### Solución: Múltiples Workspaces de Linear en la Misma Cuenta de GitHub

**El problema**: La GitHub App de Linear solo se puede instalar una vez por cuenta/organización de GitHub. Si tienes dos workspaces de Linear (ej., `ExpertIA` para trabajo y `Harness Driven Dev` para este demo) usando la misma cuenta de GitHub, te saldrá este error:

> *"Error while connecting with GitHub. Unable to connect with GitHub. Make sure you haven't connected another Linear account with this GitHub installation."*

**La solución**: Desinstalar la app del otro workspace primero, luego instalarla para este.

**Paso a paso**:

1. **Desinstalar la app existente de Linear en GitHub**:
   - Ve a `https://github.com/settings/installations`
   - Busca **Linear** → click en **Configure**
   - Baja hasta **Danger zone** → click en **Uninstall**
   - Confirma

2. **Instalar para el nuevo workspace**:
   - Ve a tu nuevo workspace de Linear → **Settings → Integrations → GitHub → Enable**
   - Te pedirá instalar la app en GitHub → selecciona tu cuenta
   - Elige **Only select repositories** → selecciona el repo de este proyecto
   - Click en **Save**
   - De vuelta en Linear, debería conectar sin error

3. **Completar la configuración** (Pasos 8.2, 8.3, 8.4 de arriba)

4. **Reconectar el otro workspace después** (cuando termines):
   - Ve al otro workspace de Linear → **Settings → Integrations → GitHub → Enable**
   - Instala la app de nuevo → selecciona los repos de ese proyecto
   - El workspace anterior se desconectará, pero puedes cambiar en cualquier momento

**El impacto de cambiar**: Mientras un workspace está desconectado, los PRs no moverán issues automáticamente en Linear. Pero si ese proyecto usa scripts de harness (como este), los scripts mueven issues vía la API directamente — así que el impacto es mínimo.

**Alternativa — Usar una Organización de GitHub**: Si no quieres estar cambiando de un lado a otro, crea una Organización de GitHub gratuita para este proyecto. La app de Linear se instala por organización, así que dos orgs pueden conectarse a dos workspaces de Linear diferentes sin conflicto.

## 9. Verificar que Todo Funciona

```bash
# Activar ambiente virtual
source .venv/bin/activate

# Test: listar todos los issues
python3 scripts/linear_client.py list

# Resultado esperado (el prefijo de tu team variará):
#   HAR-5  [To Do]  Add dark mode toggle
#   HAR-6  [To Do]  Add task counter per column
#   HAR-7  [To Do]  Add drag and drop between columns

# Test: obtener un issue específico (usa tu ID real)
python3 scripts/linear_client.py get HAR-5

# Test: mover un issue (y luego devolverlo)
python3 scripts/linear_client.py move HAR-5 "In Progress"
python3 scripts/linear_client.py move HAR-5 "To Do"
```

Si te salen errores:

| Error | Causa | Solución |
|-------|-------|----------|
| `LINEAR_API_KEY not set` | `.env` falta o está vacío | Verifica que tu `.env` tenga la key |
| `Issue not found` | Team key incorrecta | Verifica `LINEAR_TEAM_KEY` en `.env` |
| `HTTP 401` | API key inválida o del workspace equivocado | Crea una key nueva desde el workspace correcto |
| `State 'Todo' not found` | Nombre de estado incorrecto | Usa `"To Do"` (con espacio), no `"Todo"` |
| `Team 'DEMO' not found` | Team key default no coincide | Configura `LINEAR_TEAM_KEY` en `.env` con tu team key |
| Muestra issues del workspace equivocado | Variable del shell sobreescribe `.env` | El script prioriza `.env`, pero verifica con `echo $LINEAR_API_KEY` |

## 10. Política de Keywords

La integración Linear-GitHub responde a keywords en commits y PRs:

| Keyword | ¿Usar? | Por qué |
|---------|--------|---------|
| `Refs HAR-XXX` | **Siempre** | Linkea commit al issue sin cerrarlo |
| `Closes HAR-XXX` | **Nunca** | Auto-cierra el issue, bypasea los gates del harness |
| `Fixes HAR-XXX` | **Nunca** | Igual que Closes |
| `Resolves HAR-XXX` | **Nunca** | Igual que Closes |

> **Nota**: Reemplaza `HAR` con el prefijo real de tu team. El hook `check_issue_ref.sh` acepta cualquier team key que coincida con el patrón `[A-Z]+-[0-9]+`.

El hook `check_issue_ref.sh` hace cumplir esto automáticamente en cada commit.
