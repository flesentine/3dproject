# Build 0 — Foundation

**Status:** Implementation started  
**Branch:** `build/0-foundation`  
**Purpose:** Establish the technical seams and first runnable spatial schedule world before implementing scheduling features.

## Build 0 goals

Build 0 proves that the master specification can be represented with clean technical boundaries:

1. The project model is independent of React and Three.js.
2. The schedule engine is pure TypeScript.
3. Spatial layout is a derived view of project data, not stored project truth.
4. Interaction state is shared across the 2D shell and 3D scene.
5. The browser can render a structured schedule world with stable workstream geography and time orientation.

## Included

### Toolchain

- React + TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei
- Zustand

### Domain layer

`src/domain/`

Defines workstreams, tasks, milestones, dependencies, project dates, validation issues, and analysis results.

Date helpers use UTC calendar math so schedule dates do not move because of local timezone conversion.

### Schedule engine boundary

`src/engine/schedule.ts`

Build 0 implements:

- model validation
- project date-range calculation
- immediate dependency indexes
- complete upstream traversal
- complete downstream traversal

Build 0 intentionally does **not** implement CPM, float, calendars, constraints, or automatic propagation yet.

### Spatial layout adapter

`src/visualization/layout.ts`

Converts domain data into renderer coordinates.

Current grammar:

- future runs along the positive Z axis
- workstreams occupy stable lanes on X
- task depth represents duration
- task fill represents progress
- milestones use distinct geometry
- the project status date becomes a Today plane

The adapter is disposable renderer logic. It must never become the canonical schedule model.

### AURORA demonstration schedule

`src/data/aurora.ts`

The first schedule contains six workstreams:

- Hardware
- Embedded Software
- Cloud Platform
- Mobile Application
- Validation
- Launch

It contains enough connected activities to test spatial readability and dependency selection without pretending Build 0 is the full 150-activity acceptance dataset.

### Scene and shell

The first scene supports:

- orbit
- zoom
- fixed workstream lanes
- Today plane
- duration blocks
- progress fill
- milestone beacons
- activity selection
- selected activity labels
- immediate dependency connections for the selected activity
- a 2D inspector showing dates, owner, progress, and full upstream/downstream reach

## Architectural rule

The dependency direction is:

```text
Domain model
    ↓
Schedule engine
    ↓
Derived visualization layout
    ↓
React / Three.js scene
```

The scene must not calculate authoritative schedule state.

## Explicitly deferred

The following belong to later builds and should not leak into Build 0:

- critical path
- total/free float
- schedule propagation
- scenario apply/reset
- baseline ghost rendering
- semantic hierarchy drill-down
- search/focus camera navigation
- time scrub/replay
- resource/risk/cost modes
- persistence
- accounts/authentication
- collaboration
- AI
- import/export

## Build 0 exit criteria

Build 0 is complete when:

- the application installs and builds cleanly
- the AURORA scene renders without runtime errors
- workstream lanes and time direction are visually understandable
- clicking tasks updates the inspector
- selecting a task reveals only relevant nearby dependency connections
- project/schedule logic has no Three.js imports
- rendering/layout code has no authority to modify schedule truth

## Next build

**Build 1: Schedule intelligence**

Implement CPM/float on the domain engine, expose the controlling chain visually, and add automated tests around graph/schedule calculations before adding richer interaction.
