# 3D Project

Experimental spatial project-management and schedule-simulation platform.

The core thesis: complex projects should be easier to understand when time, hierarchy, dependencies, critical path, float, baselines, and change impact can be explored as a spatial model rather than only as rows in a Gantt chart.

## Status

**Build 0 — Foundation is in progress.**

The app now has a React/TypeScript/Three.js foundation, an independent project/schedule domain model, a pure TypeScript schedule-engine boundary, an AURORA demonstration schedule, and the first interactive spatial schedule world.

- Master specification: [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md)
- Build 0 notes and exit criteria: [`docs/BUILD_0.md`](docs/BUILD_0.md)

## Product rule

> No feature belongs in the prototype unless it makes a complex project easier to understand.

## Run locally

Requires a current Node.js release compatible with Vite 8.

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run build
```

## Current Build 0 capabilities

- Structured 3D schedule world
- Six stable workstream lanes
- Today/status-date plane
- Task duration represented spatially
- Progress fill
- Milestone beacons
- Orbit and zoom navigation
- Click selection and 2D inspector
- Selective immediate dependency rendering
- Full upstream/downstream graph traversal in the schedule engine
- Project-model validation

## Initial V0.1 direction

- Hierarchical drill-down with stable spatial geography
- Dependency tracing
- Critical path and float
- Scenario-based date changes
- Animated schedule propagation
- Baseline ghost comparison
- Search, focus, breadcrumbs, and return-to-Today navigation
- Simple 2D task table using the same project engine

See the master specification for the complete product thesis, interaction model, data model, technical architecture, prototype acceptance test, roadmap, and competitive/IP notes.
