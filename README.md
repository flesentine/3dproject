# 3D Project

Experimental spatial project-management and schedule-simulation platform.

The core thesis: complex projects should be easier to understand when time, hierarchy, dependencies, critical path, float, baselines, and change impact can be explored as a spatial model rather than only as rows in a Gantt chart.

## Status

**Build 1 — Critical Path and Drivers is complete.**

The app now has a React/TypeScript/Three.js spatial schedule world backed by a pure TypeScript scheduling engine with working-day CPM, total float, critical-path analysis, and selected-activity driver tracing.

- Master specification: [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md)
- Build 0 foundation: [`docs/BUILD_0.md`](docs/BUILD_0.md)
- Build 1 critical path and drivers: [`docs/BUILD_1.md`](docs/BUILD_1.md)

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
- Today/status-date plane
- Task duration represented spatially
- Progress fill
- Milestone beacons
- Orbit and zoom navigation
- Click selection and 2D inspector
- Stable geography across analysis modes

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

### Analysis views

- **Normal** — immediate dependency context around the selected activity
- **Critical Path** — fades non-critical work and exposes the zero-float network
- **Drivers** — fades unrelated work and exposes only the chain controlling the selected target

## Initial V0.1 direction

- Scenario-based date changes
- Animated schedule propagation
- Baseline ghost comparison
- Hierarchical drill-down with semantic zoom
- Search, focus, breadcrumbs, and return-to-Today navigation
- Simple 2D task table using the same project engine
- Later project/resource calendars and holidays

See the master specification for the complete product thesis, interaction model, data model, technical architecture, prototype acceptance test, roadmap, and competitive/IP notes.
