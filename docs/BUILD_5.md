# Build 5 — Hierarchical Semantic Zoom

Build 5 turns the Build 4 navigation layer into an actual project hierarchy.

The core interaction is now:

> Project → Workstream → Work Package → Task

The hierarchy is deliberately separated from schedule mathematics. Work packages organize and reveal schedule activities, but they are **not** synthetic CPM activities and cannot alter critical path, float, dependency logic, or scenario propagation.

## Product goal

Build 4 proved that the camera can navigate a stable schedule world. Build 5 proves that the same world can reveal different levels of organizational detail without rearranging task geography.

The user should be able to:

1. Start at the full AURORA project.
2. Enter a workstream.
3. See that workstream resolve into work-package volumes.
4. Enter one work package.
5. See only that package's activities emphasized and labeled.
6. Enter an individual task.
7. Use breadcrumbs to back out one semantic level at a time.

## Hierarchy model

### Project

The root spatial model.

### Workstream

Existing stable project lanes:

- Hardware
- Embedded Software
- Cloud Platform
- Mobile Application
- Validation
- Launch

### Work package

Build 5 adds explicit hierarchy metadata through `WorkPackage`:

```ts
interface WorkPackage {
  id: string
  name: string
  workstreamId: string
  order: number
}
```

Activities optionally reference a package:

```ts
interface ProjectTask {
  // existing schedule fields...
  workPackageId?: string
}
```

`ProjectModel.workPackages` is optional so small engine fixtures and future imported schedules can still exist before hierarchy metadata is assigned.

### Task / milestone

Tasks and milestones remain the only real schedule activities.

## Why work packages are not summary tasks

A common scheduling implementation would add parent summary rows to the same activity collection.

Build 5 intentionally does not do that.

A synthetic summary activity can accidentally:

- enter CPM calculations
- change project date range
- appear critical
- distort total float
- become a dependency target
- create false schedule causality

Instead, work packages are pure hierarchy metadata mapped onto the existing schedule graph.

This preserves the architecture:

> hierarchy graph + dependency graph = two different graphs over the same project

## AURORA package structure

Build 5 groups the existing demo schedule into 12 work packages.

### Hardware

- Architecture & Prototype
- Integration & Freeze

### Embedded Software

- Platform & Drivers
- Sensor & Release

### Cloud Platform

- Core Services
- Observability & Freeze

### Mobile Application

- Application Core
- Integration & Field Beta

### Validation

- Validation Preparation
- System Qualification

### Launch

- Operations Enablement
- Commercial Readiness

No existing task dates or dependency relationships are changed by this grouping.

## Semantic rendering rules

### Project level

The user sees the stable six-lane project world.

Work-package volumes are hidden.

This keeps the overview clean.

### Workstream level

The selected workstream remains in its existing lane.

Other workstreams fade.

The focused lane now reveals translucent wireframe work-package volumes around its activities.

Package labels become visible.

### Work-package level

The selected package becomes brighter.

Sibling package volumes remain visible but quiet.

Activities outside the selected package fade in Normal mode.

Member task labels become more prominent.

No activity changes coordinates.

### Task level

The existing Build 4 task camera framing remains.

Task selection, dependency context, CPM metrics, scenario editing, and direct finish dragging remain available.

## In-world interaction

- Double-click a workstream lane or label → enter workstream.
- Double-click a work-package volume or label → enter package.
- Double-click a task or milestone → enter activity.
- Double-click Today → return to Today.
- Breadcrumbs broaden the hierarchy one level at a time.

## Breadcrumb contract

Example:

`Project AURORA / Embedded Software / Sensor & Release / Sensor firmware integration`

Clicking:

- `Project AURORA` returns to overview.
- `Embedded Software` returns to workstream-level package view.
- `Sensor & Release` returns to package-level task view.
- the task refocuses the activity.

Going up clears deeper selection state rather than leaving hidden lower-level state active.

## Search

Search now includes:

- workstreams
- work packages
- tasks
- milestones
- owners

A work-package search result is a first-class camera target.

Searching `System Qualification`, for example, enters the Validation workstream and frames only the qualification package.

Task search details now include their work-package path.

## Camera framing

Build 5 adds a `workPackage` navigation target.

Package framing uses only the package's member task visuals to calculate its Z span.

This produces a closer semantic zoom than workstream framing while preserving the lane's X coordinate.

## Analysis-mode behavior

Hierarchy filtering is strongest only in **Normal** mode.

### Critical Path

Critical Path can reveal critical activities outside the current work package or workstream.

### Drivers

Drivers can reveal the controlling chain across hierarchy boundaries.

This is intentional. Hierarchy must never hide schedule causality when the user explicitly asks an analysis question.

## Scenario compatibility

Build 5 keeps all Build 2 and Build 3 scenario behavior:

- reversible finish-date previews
- conservative downstream propagation
- live CPM recalculation
- committed ghost geometry
- movement trails
- Apply / Reset
- direct finish-edge dragging

Because scenario projects are based on the same `ProjectModel`, hierarchy metadata travels with scenario copies without entering schedule calculations.

## Tests

Build 5 adds tests for:

- ordered packages inside a workstream
- resolving task → package → workstream → project
- package membership
- semantic focus membership
- package search
- package camera framing

Existing CPM and scenario tests remain the regression gate proving hierarchy did not change schedule behavior.

## Explicit non-goals

Build 5 does **not** add:

- arbitrary user-created recursive hierarchy
- more than one package level below workstream
- automatic package generation
- hierarchy import/export mapping
- package-level dependency logic
- package-level CPM
- persistence
- collaboration
- minimap
- resource hierarchy

Those should only be added after this level-of-detail model proves useful.

## Demo path

Recommended Build 5 demo:

1. Start at Project AURORA overview.
2. Double-click **Embedded Software**.
3. Two package volumes appear: **Platform & Drivers** and **Sensor & Release**.
4. Double-click **Sensor & Release**.
5. Boot/platform work fades while Sensor Firmware Integration, Firmware Integration, and Firmware Release Candidate become the detail set.
6. Double-click **Sensor Firmware Integration**.
7. Use **Drivers** to cut across hierarchy and reveal any controlling predecessor outside the package.
8. Use the breadcrumb to back out to Sensor & Release, Embedded Software, and Project AURORA.

The acceptance criterion is simple:

> The user should feel like they moved deeper into the same project, not like the application loaded a different chart.

## Architecture rule carried forward

The world has three distinct concerns:

1. **Schedule engine** — dates, dependencies, CPM, float, scenarios.
2. **Hierarchy engine** — belonging and semantic levels.
3. **Spatial renderer** — stable physical representation of both.

None of those layers should absorb the responsibilities of another.
