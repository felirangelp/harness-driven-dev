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

> **Importante**: La clave del team (`DEMO`) debe coincidir con lo que esperan los scripts del harness. Si usas una clave diferente, actualiza `scripts/linear_client.py` línea 131 donde dice `team_key="DEMO"`.

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
2. En la barra lateral, ve a **Security & access** (bajo la configuración de tu cuenta)
   - Alternativamente: ve a **Settings → API** y click en el link **"security & access settings"** en la sección Member API keys
3. Baja hasta **Personal API keys**
4. Click en **Create key**
5. Dale un nombre: `harness-driven-dev`
6. Click en **Create**
7. **Copia la key inmediatamente** — empieza con `lin_api_` y no se mostrará de nuevo

## 6. Guardar la API Key

### Localmente (para desarrollo y demo)

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y pega tu key
# LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### En GitHub (para CI — el workflow del Linear Bridge)

```bash
# Te pedirá que pegues la key
gh secret set LINEAR_API_KEY
```

O manualmente:
1. Ve a tu repo en GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Name: `LINEAR_API_KEY`
4. Value: pega tu key `lin_api_...`
5. Click en **Add secret**

## 7. Crear los Issues del Demo

Ahora que tienes la API key configurada, puedes crear issues desde Claude Code, vía CLI, o manualmente.

### Opción A: Desde Claude Code (recomendado)

Inicia Claude Code en el directorio del proyecto y pide:

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
- [ ] Toggle button visible
- [ ] Dark/light styles applied
- [ ] Preference saved in localStorage"

python3 scripts/linear_client.py create "Add task counter per column" \
  "## Acceptance Criteria
- [ ] Counter shows in column header
- [ ] Updates on add/move/delete"

python3 scripts/linear_client.py create "Add drag and drop between columns" \
  "## Acceptance Criteria
- [ ] Tasks draggable between columns
- [ ] State updates on drop"
```

### Opción C: Manualmente en Linear

1. Ve a la vista de tu team en Linear
2. Click en **+ Create issue** (o presiona `C`)
3. Crea cada issue con título y descripción

> **Importante**: Siempre incluye `## Acceptance Criteria` con checkboxes `- [ ]`. El gate 3 del harness revisa estos checkboxes para verificar el Definition of Done.

## 8. Conectar Linear con GitHub

Esto habilita la sincronización automática de estados (PR → In Progress, merge → Done).

### Paso 8.1: Instalar la integración de GitHub en Linear

1. Ve a **Linear → Settings → Integrations** (barra lateral, bajo Organization)
2. Busca **GitHub** bajo Essentials
3. Click en **Connect** / **Enable**
4. Autoriza a Linear para acceder a tu cuenta de GitHub
5. Selecciona el repositorio: `harness-driven-dev`

### Paso 8.2: Conectar tu cuenta personal de GitHub

1. Ve a **Linear → Settings → Account → Connected accounts**
2. Busca **GitHub** y click en **Connect**
3. Autoriza la conexión
4. Esto sincroniza la atribución de tus commits y PRs

### Paso 8.3: Configurar las Automatizaciones de PR

1. Ve a **Linear → Settings → Teams → [Tu Team] → Workflows & automations**
2. Bajo **Pull request and commit automations**, configura:

| Evento | Acción |
|--------|--------|
| On draft PR open, move to... | **No action** |
| On PR or commit open, move to... | **In Progress** |
| On PR review request or activity, move to... | **In Review** |
| On PR ready for merge, move to... | **In Review** |
| On PR or commit merge, move to... | **Done** |

> **¿Por qué estas configuraciones?** El harness usa `Refs DEMO-XXX` (no `Closes`) en commits y descripciones de PR. El webhook detecta el identificador del issue en el nombre del branch (`feat/DEMO-1-dark-mode`) y actualiza el estado automáticamente.

### Paso 8.4: Habilitar features adicionales

En la configuración de la integración de GitHub, habilita:
- **View pull requests in Linear** (Alpha) — toggle ON
- **Pull request notifications** — All activity by people

## 9. Verificar que Todo Funciona

```bash
# Activar ambiente virtual
source .venv/bin/activate

# Test: listar todos los issues
python3 scripts/linear_client.py list

# Resultado esperado:
#   DEMO-1  [Todo]  Add dark mode toggle
#   DEMO-2  [Todo]  Add task counter per column
#   DEMO-3  [Todo]  Add drag and drop

# Test: obtener un issue específico
python3 scripts/linear_client.py get DEMO-1

# Test: mover un issue (y luego devolverlo)
python3 scripts/linear_client.py move DEMO-1 "In Progress"
python3 scripts/linear_client.py move DEMO-1 "Todo"
```

Si te salen errores:
- `LINEAR_API_KEY not set` → Revisa tu archivo `.env`
- `Issue not found` → Verifica que la clave del team coincida (`DEMO`)
- `HTTP 401` → Tu API key es inválida o expiró, crea una nueva

## 10. Política de Keywords

La integración Linear-GitHub responde a keywords en commits y PRs:

| Keyword | ¿Usar? | Por qué |
|---------|--------|---------|
| `Refs DEMO-XXX` | **Siempre** | Linkea sin cerrar |
| `Closes DEMO-XXX` | **Nunca** | Auto-cierra, bypasea los gates del harness |
| `Fixes DEMO-XXX` | **Nunca** | Igual que Closes |
| `Resolves DEMO-XXX` | **Nunca** | Igual que Closes |

El hook `check_issue_ref.sh` hace cumplir esto automáticamente en cada commit.
