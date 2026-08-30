# Build 2 — Scenario Propagation

**Status:** Implemented on `build/2-scenario-propagation`  
**Purpose:** Turn static schedule analysis into reversible what-if simulation.

## Product goal

Build 2 answers the question:

> **What happens to the project if this activity finishes on a different date?**

The answer must be visible in the same stable 3D geography used by Builds 0 and 1.

## Scenario workflow

1. Select a task or milestone.
2. Choose a what-if finish date or use a +5 / +10 workday shortcut.
3. Preview the scenario.
4. The edited activity and affected successors move to their scenario dates.
5. Their committed positions remain visible as wireframe ghosts.
6. Dashed movement trails show schedule displacement.
7. CPM, total float, critical path, and driver analysis recalculate against the preview.
8. **Apply** commits the preview into the in-memory project model.
9. **Reset** discards the preview and restores the committed project unchanged.

## Propagation rule

Build 2 deliberately does **not** fully reschedule the project to CPM-early dates.

It uses conservative, incremental propagation:

- the selected source activity receives the requested finish date;
- downstream activities preserve their existing durations;
- an existing valid schedule gap absorbs delay until the changed relationship constraint reaches the successor;
- if a baseline relationship is already inconsistent with strict dependency math, Build 2 preserves that baseline offset and propagates only the *additional* scenario shift;
- earlier source finishes never pull successors earlier;
- unaffected work remains fixed.

This avoids a dangerous prototype behavior where a simple what-if edit silently "repairs" unrelated baseline dates.

## Supported relationships

Propagation honors the Build 1 dependency model:

- Finish-to-start (FS)
- Start-to-start (SS)
- Finish-to-finish (FF)
- Start-to-finish (SF)
- positive or negative whole-working-day lag

## Calendar boundary

Build 2 continues to use the isolated Monday-Friday working calendar from Build 1.

Scenario finish dates must be weekdays. Holidays, project calendars, and resource calendars remain later work.

## Visual language

### Amber geometry

An activity whose dates differ in the preview is highlighted in amber.

### Wireframe ghost

The committed geometry remains at its original spatial position as a muted wireframe.

### Dashed movement trail

A dashed line links the committed and scenario positions so displacement is readable even when multiple objects move.

### Animation

Task objects interpolate toward new positions rather than teleporting. The project geography itself never rearranges.

## Scenario-aware analysis

While a scenario is active:

- Critical Path uses scenario dates.
- Total float is recalculated.
- Driver analysis uses the scenario schedule.
- The inspector shows committed and scenario dates together for moved activities.
- The project summary shows committed finish versus visible scenario finish.

## State model

The store keeps two separate concepts:

- `project`: the committed in-memory plan;
- `scenario`: a reversible preview containing a derived project model, analysis result, source edit, and per-task changes.

Invalid scenario input reports an error without discarding a valid preview already on screen.

## Automated coverage

Build 2 adds tests for:

- a Sensor Firmware Integration delay propagating through firmware, system integration, validation, readiness, and Commercial Launch;
- schedule gap absorbing a delay before it reaches System Integration;
- earlier finishes not pulling successors earlier;
- weekend finish rejection under the Build 2 calendar.

## Explicit non-goals

Not in Build 2:

- direct dragging of task edges in 3D;
- start-date editing;
- changing task duration independently from finish-date scenarios;
- multiple named scenario branches;
- undo/redo history beyond Reset-before-Apply;
- persistent storage;
- holidays or resource calendars;
- resource leveling;
- baseline mode using imported baseline fields;
- import/export;
- AI.

## Build 2 acceptance story

1. Select **Sensor Firmware Integration**.
2. Preview a finish of **2026-09-18**.
3. Watch the source activity extend and the downstream chain move.
4. See committed positions remain as ghosts.
5. Inspect **Commercial Launch** and see the scenario date.
6. Switch to **Critical Path** or **Drivers** and see analysis update without moving the geography.
7. Press **Reset** and return exactly to the committed plan.
8. Repeat and press **Apply** to make the preview the new in-memory plan.

If that interaction is understandable without reading a Gantt chart, Build 2 has achieved its purpose.
