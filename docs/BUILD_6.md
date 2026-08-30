# Build 6 — 2D Twin View

Build 6 adds conventional project-management surfaces without creating a second project model.

The core rule is simple:

> **3D, Table, and Gantt are three views of one live schedule.**

The user can move between spatial analysis and conventional schedule inspection without losing selection, hierarchy context, CPM state, scenario state, or committed dates.

## Why this build exists

The 3D world is the product's understanding and simulation layer, but professional project work still benefits from dense 2D surfaces.

Build 6 proves that the schedule engine is truly renderer-independent.

The same `ProjectModel` and `ScheduleAnalysis` now drive:

- the 3D schedule world
- a task table
- a Gantt chart
- the shared inspector
- hierarchy navigation
- Critical Path mode
- Drivers mode
- scenario previews

There is no duplicated schedule state.

## Workspace switch

The top navigation now exposes:

- **3D**
- **Table**
- **Gantt**

Switching views does not clear or rebuild project state.

The following remain active across view changes:

- selected activity
- focused workstream
- focused work package
- Normal / Critical Path / Drivers mode
- active scenario preview
- committed versus scenario dates
- inspector context
- search context

If a task is selected in Table and the user switches to 3D, that same task is still selected.

If a scenario is created in the shared inspector while viewing Gantt, the 3D world immediately reflects that same scenario when the user returns.

## Table view

The Table view provides a dense schedule-reading surface.

Columns:

- activity
- workstream / work package
- start
- finish
- duration
- progress
- total float
- owner

Visual states include:

- selected row
- critical activity
- driver activity
- scenario-moved activity
- milestone indicator
- progress bar
- committed finish shown beneath a scenario finish

Interaction:

- single click selects the activity
- double-click focuses the hierarchy on the activity
- Enter selects a keyboard-focused row

The existing right-side inspector remains the detailed editing and analysis surface.

## Gantt view

The Gantt is generated directly from the active project model.

It includes:

- calendar timeline
- weekly date ticks
- Today marker
- task bars
- milestone diamonds
- progress fill
- critical treatment
- driver treatment
- scenario treatment
- committed-position ghost when a scenario moves an activity
- persistent baseline markers when baseline dates exist on the task

The Gantt uses calendar dates for geometry while CPM continues to use the working-day scheduling engine.

This separation is intentional:

- schedule math answers when work can occur
- the Gantt answers where dates sit on the calendar

## Hierarchy behavior

Normal mode respects the same semantic focus used by 3D.

At project overview:

- all schedule activities are visible

At workstream focus:

- only activities in that workstream are shown in Table and Gantt

At work-package focus:

- only activities in that work package are shown

This mirrors the 3D semantic-zoom behavior without changing the underlying schedule.

## Analysis behavior

Critical Path and Drivers deliberately override hierarchy filtering.

### Critical Path

When Critical Path is enabled:

- Table shows the critical activities across the full project
- Gantt shows the critical activities across the full project
- 3D exposes the same cross-hierarchy critical network

### Drivers

When Drivers is enabled for a selected activity:

- Table shows the controlling driver chain
- Gantt shows the same controlling driver chain
- 3D exposes the same chain spatially

This preserves one meaning for each analysis mode across all renderers.

## Shared scenarios

Build 6 does not add a second editing engine.

Scenario editing remains centralized in the existing inspector and 3D direct manipulation.

A preview scenario updates the active `ProjectModel`, then every renderer reads it.

Therefore:

1. select an activity in Table or Gantt
2. change its finish date in the inspector
3. preview the impact
4. Table updates
5. Gantt updates
6. switch to 3D
7. the same propagated schedule and ghost comparison are already visible
8. Apply or Reset affects all views together

## Architecture

Build 6 adds a renderer-neutral 2D model layer under `src/twin/`.

### `src/twin/model.ts`

Pure helpers for:

- semantic row filtering
- critical/driver filtering
- scenario-change state
- Gantt calendar scale
- Gantt bar geometry
- Today marker position

These helpers do not depend on React.

### `src/twin/TwinWorkspace.tsx`

React renderer for:

- Table
- Gantt

It receives the same project and analysis objects already used elsewhere.

### `src/twin/model.test.ts`

Regression coverage verifies:

- project overview rows
- work-package focus
- Critical Path crossing hierarchy boundaries
- Drivers crossing hierarchy boundaries
- deterministic Gantt date geometry

## Important product decisions

### 1. 2D is not a fallback

Table and Gantt are first-class views of the same project.

The product is not trying to destroy conventional PM interfaces. It uses 3D where spatial understanding adds value and 2D where dense precision is better.

### 2. No duplicate state

We do not maintain separate dates, dependencies, or scenarios for Gantt.

That would eventually cause renderer drift and destroy trust.

### 3. No direct Gantt editing yet

Build 6 intentionally keeps Gantt read/select focused.

Direct drag editing already exists in 3D and exact-date scenario editing exists in the inspector.

Gantt drag editing can be added later only if it uses the exact same scenario engine.

### 4. Hierarchy means the same thing everywhere

A focused work package is a focused work package whether the user is looking at a 3D volume, a table, or a Gantt.

### 5. Analysis means the same thing everywhere

Critical Path and Drivers cannot have renderer-specific definitions.

## Demo sequence

A useful Build 6 demonstration:

1. open Project AURORA in 3D
2. enter **Embedded Software → Sensor & Release**
3. select **Sensor firmware integration**
4. switch to Table
5. confirm the same package and task remain selected
6. switch to Gantt
7. inspect the same task on the calendar
8. preview a later finish date from the inspector
9. watch the Gantt show committed ghost versus scenario position
10. switch to 3D
11. observe the same propagated scenario and baseline ghosts
12. enable Drivers
13. move between Table, Gantt, and 3D and confirm the controlling chain remains identical

## Explicit non-goals for Build 6

Not included:

- direct drag editing in Gantt
- editable table cells
- column customization
- grouping collapse controls
- dependency arrows in Gantt
- print layouts
- PDF export
- CSV / Excel import or export
- resource swimlanes
- portfolio rollups
- persistence
- collaboration

## Build 6 acceptance test

Build 6 is successful if a user can:

1. select an activity in any view
2. switch to another view without losing selection
3. focus a work package and see the same scope reflected in all views
4. enable Critical Path and see the same critical set across all views
5. enable Drivers and see the same controlling chain across all views
6. preview a schedule change and see the same scenario dates in Table, Gantt, and 3D
7. Apply or Reset once and have every view agree

The goal is trust:

> **One project. One schedule engine. Multiple ways to understand it.**
