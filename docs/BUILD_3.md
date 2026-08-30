# Build 3 — Direct 3D Finish Manipulation

**Status:** Implemented on `build/3-direct-manipulation`  
**Purpose:** Replace form-first schedule simulation with direct manipulation of the spatial schedule.

## Product goal

Build 3 answers the question:

> **Can I grab the schedule itself and change it?**

The interaction must remain schedule-safe: task geography stays fixed, only the finish edge moves through the time axis, and every preview goes through the same reversible scenario engine introduced in Build 2.

## Direct manipulation workflow

1. Select a normal task.
2. A gold finish handle appears at the task's finish edge.
3. Press the handle.
4. Orbit navigation temporarily disables.
5. Drag forward or backward along the 3D time axis.
6. The pointer position maps to a calendar date and snaps to the Monday-Friday working calendar.
7. The selected task and affected successors update through Build 2 propagation while the pointer moves.
8. Existing committed geometry remains visible as ghosts and movement trails.
9. Release the pointer.
10. The result remains as a normal reversible scenario preview.
11. **Apply** commits the preview in memory; **Reset** discards it.

## Gesture constraints

Build 3 deliberately does not allow freeform movement.

- only a selected `task` receives a 3D finish handle;
- the task cannot move between workstream lanes;
- the handle edits only the finish date;
- finish can never move before task start;
- weekends snap in the direction of travel;
- milestones remain editable through the exact-date scenario control but do not receive a 3D drag handle yet;
- summary tasks remain non-editable.

These constraints preserve the spatial grammar: geometry continues to mean schedule data rather than arbitrary object placement.

## Spatial/date mapping

The project world remains anchored to the status date (`Today = Z 0`).

A task finish edge is mapped as:

`(calendar day offset from status date + 1) × WORLD_SCALE.day`

The inverse mapping is isolated in `src/visualization/finishDrag.ts` rather than embedded in React Three Fiber pointer handlers.

That module handles:

- world-Z → calendar-date conversion;
- task-start clamping;
- weekday snapping;
- drag direction when a pointer lands on Saturday or Sunday.

## Interaction state

The Zustand store adds `finishDrag` with:

- source task id;
- committed finish date;
- current snapped drag finish.

Actions:

- `beginFinishDrag`
- `updateFinishDrag`
- `endFinishDrag`

`updateFinishDrag` calls the same `simulateFinishChange` function used by the typed date editor. There is no second propagation implementation for 3D dragging.

## Camera behavior

While a finish drag is active:

- `OrbitControls.enabled = false`;
- the application cursor changes to a resize cursor;
- a transparent horizontal interaction surface converts pointer movement into world-Z coordinates;
- a window-level pointer-up guard ends the gesture even if release occurs away from the visible handle.

When the drag ends, camera controls immediately return.

## Visual behavior

### Gold finish handle

Appears only for the selected normal task and sits at the task's finish edge.

### Live date label

While dragging, the handle shows the currently snapped finish date.

### Existing Build 2 language remains

- amber = scenario-moved geometry;
- wireframe = committed position;
- dashed line = movement from committed to preview;
- scenario CPM / Critical Path / Drivers continue to use the visible preview model.

## Exact-date fallback

The Build 2 date input and +5 / +10 workday shortcuts remain available.

This is intentional. Direct manipulation should be the fast exploratory interaction, while exact-date input remains useful for precise planning and accessibility.

## Automated coverage

Build 3 adds unit coverage for the pure coordinate/date mapper:

- known finish date maps to the expected world-Z coordinate;
- world-Z maps back to the same finish date;
- later weekend drag snaps forward to Monday;
- earlier weekend drag snaps backward to Friday;
- finish cannot cross before task start.

All existing schedule, CPM, scenario propagation, and spatial-origin tests continue to run in CI.

## Explicit non-goals

Not in Build 3:

- start-edge dragging;
- dragging a whole task while preserving duration;
- milestone drag handles;
- dependency creation by dragging connectors;
- multi-select schedule edits;
- touch-specific gesture optimization;
- keyboard nudging;
- named scenario branches;
- undo/redo history after Apply;
- persistence;
- import/export;
- custom project/resource calendars.

## Build 3 acceptance story

1. Select **Sensor Firmware Integration**.
2. Grab the gold finish handle.
3. Drag it from September 4 toward September 18.
4. Watch the task extend while downstream schedule consequences propagate live.
5. See the current snapped date above the handle.
6. See committed positions remain as ghosts.
7. Release the pointer.
8. Inspect Commercial Launch or switch to Critical Path / Drivers.
9. Press Reset and return to the committed plan.
10. Repeat and Apply the preview.

If this feels like manipulating the schedule itself rather than filling out a form, Build 3 has achieved its purpose.
