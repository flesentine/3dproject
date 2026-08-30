# 3D Project

Experimental spatial project-management and schedule-simulation platform.

The core thesis: complex projects should be easier to understand when time, hierarchy, dependencies, critical path, float, baselines, and change impact can be explored as a spatial model rather than only as rows in a Gantt chart.

## Status

**Build 5 — Hierarchical Semantic Zoom is complete.**

The app now combines CPM/driver analysis, reversible scenario propagation, direct 3D finish manipulation, animated navigation, and a real hierarchy: **Project → Workstream → Work Package → Task**. Work-package volumes appear only after entering a workstream, package focus reveals its member activities, and breadcrumbs let the user back out without changing the project's stable spatial geography.

- Master specification: [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md)
- Build 0 foundation: [`docs/BUILD_0.md`](docs/BUILD_0.md)
- Build 1 critical path and drivers: [`docs/BUILD_1.md`](docs/BUILD_1.md)
- Build 2 scenario propagation: [`docs/BUILD_2.md`](docs/BUILD_2.md)
- Build 3 direct manipulation: [`docs/BUILD_3.md`](docs/BUILD_3.md)
- Build 4 navigation and semantic zoom: [`docs/BUILD_4.md`](docs/BUILD_4.md)
- Build 5 hierarchical semantic zoom: [`docs/BUILD_5.md`](docs/BUILD_5.md)

## Product rule

> No feature belongs in the prototype unless it makes a complex project easier to understand.

## Run locally

Requires a current Node.js release compatible with Vite 8.

```bash
npm install
npm run dev
```

Validation:

```bash
npm test
npm run build
```

## Current capabilities

### Spatial schedule

- Structured 3D schedule world
- Six stable workstream lanes
- Today/status-date plane anchored at Z=0
- Task duration represented spatially
- Progress fill
- Milestone beacons
- Orbit and zoom navigation
- Click selection and 2D inspector
- Stable geography across analysis modes, hierarchy focus, and scenario changes
- Animated task movement when scenario dates change
- Wireframe ghosts for committed positions
- Dashed movement trails from committed to scenario positions
- Selected-task finish handle for direct 3D editing
- Live snapped finish-date label while dragging
- Camera orbit lock during direct manipulation
- Translucent work-package volumes revealed at workstream level

### Hierarchy and navigation

- Project → Workstream → Work Package → Task semantic hierarchy
- 12 AURORA work packages across six workstreams
- Work packages are metadata, not synthetic CPM activities
- Project-wide search across workstreams, work packages, tasks, milestones, and owners
- Animated camera fly-to for workstreams, work packages, and tasks
- **Overview** recovery action
- **Today** recovery action
- Breadcrumb location through all four hierarchy levels
- Left-panel workstream navigator
- Contextual work-package navigator after entering a workstream
- Double-click task to focus and fly to it
- Double-click lane/workstream label to enter that workstream
- Double-click work-package volume/label to enter that package
- Double-click Today plane to return home
- Semantic focus without geometry rearrangement
- Package-member task labels expand at deeper levels
- Inspector **Dive to this activity** action

### Schedule analysis

- Monday-Friday working calendar
- FS / SS / FF / SF dependencies
- Whole-working-day lag and lead
- Topological schedule analysis
- Dependency-cycle detection
- CPM forward and backward passes
- Early and late dates
- Total float
- Global critical path
- Critical dependency chain
- Full upstream/downstream traversal
- Controlling-driver chain for any selected activity

### Scenario simulation

- Finish-date what-if preview for tasks and milestones
- Direct finish dragging for normal tasks
- +5 / +10 workday quick scenarios
- Exact-date fallback editor
- Conservative downstream propagation
- Existing schedule gap can absorb a delay
- Existing baseline relationship offsets are preserved instead of silently repaired
- Earlier finishes do not pull successors earlier
- Scenario-aware CPM, float, critical path, and driver analysis
- Committed versus scenario dates in the inspector
- **Apply** to commit the in-memory preview
- **Reset** to discard it completely

### Analysis views

- **Normal** — semantic hierarchy focus plus immediate selected-task dependency context
- **Critical Path** — fades non-critical work and can cut across the current hierarchy level
- **Drivers** — exposes the controlling chain even when it crosses workstreams or work packages

## Initial V0.1 direction

- Start-edge and whole-task schedule manipulation
- Mini-map / project orientation aid
- Keyboard navigation shortcuts and optional free-flight mode
- Simple 2D task table using the same project engine
- Named scenario branches and richer undo/redo
- Richer recursive hierarchy below work package only if the current semantic model proves useful
- Later project/resource calendars and holidays
- Import/export and persistence

See the master specification for the complete product thesis, interaction model, data model, technical architecture, prototype acceptance test, roadmap, and competitive/IP notes.
