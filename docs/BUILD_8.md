# Build 8 — Full Direct Manipulation

Build 8 completes the first direct schedule-manipulation model in the 3D workspace.

## Goal

A selected normal task can now be edited through three distinct gestures on the time axis:

1. **START** — resize only the start edge while the finish stays fixed.
2. **MOVE** — shift the entire task through time while preserving its working-day duration.
3. **FINISH** — resize only the finish edge using the Build 3 gold finish handle.

All three gestures create a temporary `ScheduleScenario`. No drag destructively edits the committed plan until **Apply** is chosen.

## Interaction model

Select any normal task in 3D. Three controls become available:

- blue **START** handle at the task's leading edge
- purple **MOVE** grab control over the task
- gold **FINISH** handle at the trailing edge

During any drag:

- OrbitControls are locked
- navigation/search/view switching is locked
- the date snaps to the Monday–Friday working calendar
- the current source start/finish dates are shown in-world
- the same downstream propagation engine recalculates affected activities
- scenario ghosts and movement trails remain visible
- Table and Gantt receive the same scenario immediately
- CPM, float, Critical Path, and Drivers use the preview project

Releasing the pointer leaves the scenario active. The user can then **Apply** or **Reset**.

## Schedule semantics

### Start-edge edit

Changes the source task start while preserving its committed finish.

This changes source duration. SS/SF relationships can therefore create downstream impact when the new source start pushes a controlling relationship later. FS/FF relationships remain driven by the unchanged finish.

The start edge cannot cross beyond the task finish.

### Finish-edge edit

Retains the Build 3 behavior. The source start remains fixed and the finish changes.

FS/FF relationships can propagate downstream when the new finish consumes existing schedule gap and becomes controlling.

The finish edge cannot cross before the task start.

### Whole-task move

Changes both source start and finish by the same working-day offset.

The source task's working-day duration is preserved. Downstream relationships then respond to the shifted predecessor dates through the same relationship-offset propagation algorithm.

### Conservative propagation remains

Build 8 does not turn the simulator into an automatic rescheduler.

- only the source activity is directly edited
- downstream activities move only when additional source impact exceeds their existing relationship gap
- earlier source changes do not automatically pull successors earlier
- predecessor activities are never silently rewritten by a source drag
- existing baseline relationship offsets remain preserved rather than being silently repaired

## Engine changes

`ScheduleScenario` now records:

- `editKind`: `start`, `finish`, or `shift`
- `requestedStart`
- `requestedFinish`

`simulateTaskEdit()` is the generalized scenario entry point. The previous `simulateFinishChange()` function remains as a compatibility wrapper for exact-date editing and the existing finish handle.

This keeps all renderers and interaction styles on one scenario model.

## Spatial mapping

`src/visualization/directDrag.ts` contains renderer-independent helpers for:

- start-edge world-Z → weekday date conversion
- weekend snapping based on drag direction
- start-edge clamping at the task finish
- whole-task world displacement → working-day shift
- duration-preserving shifted start/finish calculation

The mapping is unit tested independently from Three.js.

## 3D implementation

`DirectManipulationLayer` is intentionally additive to `ProjectWorld`.

The proven Build 3 finish interaction remains untouched. Build 8 layers START and MOVE controls into the same Canvas and uses the shared Zustand project store. This reduces regression risk while still converging all three edit gestures on the same scenario engine.

## Validation coverage

Automated tests cover:

- start-edge spatial mapping
- weekend snapping in both directions
- start-edge finish clamping
- whole-task forward shifting
- whole-task backward shifting across weekends
- working-day duration preservation
- start-only scenarios
- shift scenarios
- downstream propagation after a whole-task move
- no automatic successor pull when shifting earlier
- existing finish propagation behavior
- invalid weekend and crossed-edge edits

## Still intentionally out of scope

- changing workstream/package by dragging sideways
- arbitrary XYZ task movement
- upstream auto-propagation
- resource leveling
- constraints/calendars beyond the current weekday model
- dragging milestones directly
- Gantt drag editing
- persistence or multi-user collaboration

The key rule remains: **task manipulation is schedule manipulation, never free-form 3D object placement.**
