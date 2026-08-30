# 3D Project

Experimental spatial project-management and schedule-simulation platform.

The core thesis: complex projects should be easier to understand when time, hierarchy, dependencies, critical path, float, baselines, and change impact can be explored as a spatial model rather than only as rows in a Gantt chart.

## Status

**Build 9 — History and Scenario Branches is complete.**

The prototype now supports safe schedule exploration on top of the Build 8 direct-manipulation model. What-if previews can be named and saved as reusable scenario branches, while only **Apply** creates committed project history. Applied changes can then be moved backward and forward with **Undo / Redo** without deleting saved alternatives.

- Master specification: [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md)
- Build 0 foundation: [`docs/BUILD_0.md`](docs/BUILD_0.md)
- Build 1 critical path and drivers: [`docs/BUILD_1.md`](docs/BUILD_1.md)
- Build 2 scenario propagation: [`docs/BUILD_2.md`](docs/BUILD_2.md)
- Build 3 direct manipulation: [`docs/BUILD_3.md`](docs/BUILD_3.md)
- Build 4 navigation and semantic zoom: [`docs/BUILD_4.md`](docs/BUILD_4.md)
- Build 5 hierarchical semantic zoom: [`docs/BUILD_5.md`](docs/BUILD_5.md)
- Build 6 2D twin view: [`docs/BUILD_6.md`](docs/BUILD_6.md)
- Build 7 project mini-map and orientation: [`docs/BUILD_7.md`](docs/BUILD_7.md)
- Build 8 full direct manipulation: [`docs/BUILD_8.md`](docs/BUILD_8.md)
- Build 9 history and scenario branches: [`docs/BUILD_9.md`](docs/BUILD_9.md)

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

### Safe exploration history

- Committed project **Undo / Redo**
- Only **Apply** creates a committed history revision
- Preview, Save, Load, Delete, and Reset do not pollute committed history
- Human-readable undo/redo action labels
- 50-revision in-memory committed history cap
- Redo clears when a different change is applied after Undo
- **Cmd/Ctrl + Z** Undo
- **Cmd/Ctrl + Shift + Z** Redo
- **Ctrl + Y** Redo
- Undo/Redo deliberately blocked while a preview or drag is active

### Named scenario branches

- Name any active what-if preview
- Save the preview without applying it
- Reuse a name to update the existing saved branch
- Preview a saved branch later
- Delete saved branches independently from project history
- Saved branch stores source activity, edit kind, requested dates, and alternate project state
- Reopened branches recalculate CPM and schedule differences against the current committed project
- Saved branches survive Apply, Undo, and Redo
- Saved-branch projected project finish shown in the branch panel
- Entire feature is in-memory only in V0.1

### Synchronized project surfaces

- **3D** spatial schedule and causal simulation view
- **Table** for dense schedule inspection
- **Gantt** for conventional calendar/time reading
- One shared `ProjectModel` across all renderers
- One shared CPM/driver analysis across all renderers
- Shared selected activity and hierarchy focus
- Shared scenario preview, Apply, and Reset state
- Shared history and saved scenarios
- Normal mode respects the same hierarchy boundary in every view
- Critical Path and Drivers cut across hierarchy consistently in every view

### Full direct manipulation

- Blue **START** handle resizes only the task start edge
- Purple **MOVE** control shifts the whole task through time
- Gold **FINISH** handle resizes only the task finish edge
- Start/finish edges cannot cross each other
- Whole-task movement preserves working-day duration
- Weekend snapping follows drag direction
- Orbit controls lock during all three gestures
- Navigation, search, view switching, mini-map actions, and Apply/Reset lock during active drag
- In-world date feedback while dragging
- Every gesture produces the same reversible `ScheduleScenario`
- `ScheduleScenario` records edit kind plus requested start/finish
- Start-only edits can affect SS/SF relationships
- Finish-only edits can affect FS/FF relationships
- Whole-task movement can affect all relationship types
- Source edits never silently rewrite predecessor activities
- Earlier source edits do not automatically pull successors earlier

### Project orientation

- Permanent 3D-only interactive mini-map
- Same workstream geography as the 3D world
- Past → future time orientation
- Strong Today reference line
- Milestone beacons with critical treatment
- Current selected-activity marker
- Focused work-package time region
- Camera navigation focus and approximate zoom footprint
- Mouse-wheel zoom updates the footprint size
- Free panning clears stale camera focus rather than showing misleading orientation
- Click workstream lane → focus/fly to workstream
- Click milestone → focus/fly to milestone
- Click Today → return home
- Click Overview → frame the project
- Scenario preview milestones use the active scenario project positions

### Spatial schedule

- Structured 3D schedule world
- Six stable workstream lanes
- Today/status-date plane anchored at Z=0
- Task duration represented spatially
- Progress fill
- Milestone beacons
- Orbit and zoom navigation
- Click selection and shared inspector
- Stable geography across analysis modes, hierarchy focus, scenario changes, and history revisions
- Animated task movement when scenario dates change
- Wireframe ghosts for committed positions
- Dashed movement trails from committed to scenario positions
- Translucent work-package volumes revealed at workstream level

### 2D Table

- Activity, hierarchy, start, finish, duration, progress, float, and owner columns
- Selected-row synchronization with the shared inspector
- Critical and driver treatments
- Scenario-moved treatment
- Committed finish shown when a scenario moves an activity
- Progress visualization
- Click to select
- Double-click to synchronize hierarchy focus to the activity

### 2D Gantt

- Calendar timeline with weekly ticks
- Today marker
- Task bars and milestone diamonds
- Progress fill
- Critical and driver treatments
- Scenario-moved treatment
- Committed-position ghost during scenario preview
- Persistent task baselines when baseline dates exist
- Click to select
- Double-click to synchronize hierarchy focus to the activity

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
- Double-click task to focus and fly to it in 3D
- Double-click lane/workstream label to enter that workstream
- Double-click work-package volume/label to enter that package
- Semantic focus without geometry rearrangement

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

- Start-date, finish-date, and whole-task what-if preview for normal tasks
- Exact finish-date scenario editing for tasks and milestones
- +5 / +10 workday quick scenarios
- Conservative downstream propagation
- Existing schedule gap can absorb a delay
- Existing baseline relationship offsets are preserved instead of silently repaired
- Earlier source changes do not pull successors earlier
- Scenario-aware CPM, float, critical path, and driver analysis
- Committed versus scenario dates in the inspector and 2D views
- **Apply** to commit the in-memory preview
- **Reset** to discard it completely

### Analysis views

- **Normal** — semantic hierarchy focus plus immediate selected-task dependency context
- **Critical Path** — isolates critical work across hierarchy in 3D, Table, and Gantt
- **Drivers** — exposes the controlling chain across hierarchy in 3D, Table, and Gantt

## Initial V0.1 direction

- Keyboard navigation shortcuts and optional free-flight mode
- Gantt drag editing through the existing scenario engine
- Scenario persistence / import-export only after the local interaction model is proven
- Richer recursive hierarchy below work package only if the current semantic model proves useful
- Later project/resource calendars and holidays
- Import/export and persistence

See the master specification for the complete product thesis, interaction model, data model, technical architecture, prototype acceptance test, roadmap, and competitive/IP notes.
