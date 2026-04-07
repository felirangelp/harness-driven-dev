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
