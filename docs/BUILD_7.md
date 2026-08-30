# Build 7 — Project Mini-Map and Orientation

Build 7 adds a permanent orientation aid to the 3D workspace without changing the schedule model or spatial geography.

## Goal

A user should be able to answer, at a glance:

- Where am I in the project?
- Where is Today?
- Which workstream am I looking at?
- Where are the important milestones?
- How far into the project am I focused?
- How do I get home quickly?

The mini-map is intentionally **not** a second dashboard. It is a compact top-down navigation aid for the spatial schedule.

## Spatial grammar

The map uses the same grammar as the 3D world:

- workstreams run left to right
- past is at the top
- future is at the bottom
- Today is a strong horizontal reference line
- milestones remain spatial beacons
- work-package focus is shown as a bounded region inside its workstream
- selected activities are marked without moving anything

No alternate layout is introduced. The mini-map is another projection of the existing world layout.

## New capabilities

### Permanent 3D-only mini-map

The map appears only while the 3D workspace is active. Table and Gantt already provide direct schedule orientation and do not need the extra chrome.

### Workstream navigation

Each workstream has a stable vertical lane on the map. Clicking a lane calls the same `focusWorkstream` action used elsewhere in the product.

### Milestone navigation

Milestones appear as small diamond beacons. Critical milestones use the critical treatment. Clicking a milestone uses the shared task focus/navigation path and flies the 3D camera to it.

### Today recovery

Today is represented by a strong horizontal line. Clicking it uses the existing `goToday` navigation action.

### Overview recovery

A compact Overview action in the mini-map uses the existing `goOverview` command to reframe the whole project.

### Hierarchy focus

When a work package is focused, its time span is highlighted inside the owning workstream lane. This makes package-level semantic zoom visible even when the camera is looking elsewhere.

### Selected activity marker

The currently selected activity is shown as a ring on the map, preserving selection context while navigating around the 3D scene.

### Camera focus and zoom footprint

The mini-map shows the active navigation focus and an approximate zoom footprint.

- every search/fly-to/Today/Overview/workstream/package/task navigation request updates the footprint
- mouse-wheel zoom adjusts the footprint size
- normal orbiting leaves the focus point stable, matching OrbitControls behavior
- free panning clears the footprint rather than displaying stale or misleading orientation information
- the next explicit navigation action restores it

This is intentionally conservative: an orientation aid should prefer showing no camera footprint over showing a wrong one.

## Architecture

Build 7 is isolated from the scheduling engine.

New files:

- `src/orientation/model.ts` — renderer-neutral minimap projection math
- `src/orientation/model.test.ts` — projection/orientation regression tests
- `src/orientation/useOrientationStore.ts` — lightweight view telemetry state
- `src/orientation/ProjectMiniMap.tsx` — interactive mini-map UI
- `src/orientation/ProjectMiniMapPortal.tsx` — connects the mini-map to the active 3D viewport and shared navigation state
- `src/orientation.css` — overlay styling

The schedule engine, CPM calculations, scenario propagation, hierarchy model, and 3D world coordinates are unchanged.

## Projection model

`buildMiniMapModel()` consumes the same `ProjectModel` and `buildWorldLayout()` output as the 3D renderer.

It derives:

- stable lane X positions
- project time bounds
- Today percentage
- milestone positions
- selected activity position
- focused work-package bounds
- camera focus and zoom footprint

All values are normalized into percentage coordinates so the map is responsive and does not need its own rendering engine.

## Interaction rules

The mini-map follows the same interaction contracts as the rest of the app:

- workstream click → focus workstream
- milestone click → focus task / fly to task
- Today click → return to Today
- Overview click → project overview
- schedule drag in progress → mini-map remains visible but navigation controls are disabled

The mini-map never directly edits dates or dependencies.

## Scenario behavior

The mini-map receives the active display project (`scenario.project` when a scenario is active), so milestone positions reflect the current preview rather than an unrelated committed snapshot.

Apply and Reset continue to use the single shared scenario state introduced in Build 2.

## Tests

Build 7 adds regression coverage for:

- stable left-to-right workstream ordering
- Today occurring before future launch milestones
- critical milestone projection
- work-package focus bounds
- selected-task projection
- camera focus normalization
- camera/zoom clamping when a view lies outside project bounds

## Deliberate non-goals

Build 7 does **not** add:

- a geographic map
- a second Three.js scene
- a portfolio dashboard
- resource/risk/cost overlays
- arbitrary map dragging to edit schedule dates
- a persistent independent camera state for Table/Gantt
- free-flight controls

## Acceptance test

A user in the 3D world should be able to:

1. identify Today on the map
2. identify the six workstream lanes
3. see where the current selected activity sits
4. see the current work-package focus region
5. recognize critical milestone beacons
6. click another workstream and fly there
7. click Commercial Launch and fly to the milestone
8. click Today and return home
9. click Overview and recover the whole project
10. zoom the 3D camera and see the map footprint change size

If the mini-map makes the project feel smaller and easier to recover from without demanding attention, Build 7 succeeds.
