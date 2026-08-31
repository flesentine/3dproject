# Build 10 — Interactive Gantt and Camera Polish

## Goal

Build 10 fixes two navigation problems found during hands-on browser testing and turns the existing Gantt twin into a direct schedule-editing surface.

The guiding rule remains:

> 3D, Table, and Gantt are different views of one schedule model. Editing in any surface must create the same deterministic scenario.

## 1. Dive-in camera orientation

Earlier builds framed semantic navigation from the negative-Z/past side of the schedule. Drei text and the visual language are oriented toward positive Z, which meant a task/package dive could feel like arriving behind the project.

Build 10 establishes a canonical camera convention:

- semantic focus approaches from **+Z / future / front**
- camera remains above the schedule
- task focus uses the same convention as work-package and workstream focus
- Today and Overview recovery use the same convention
- camera targets remain date/layout derived; no geometry is rearranged

Pure navigation tests assert that every semantic frame places the camera on the readable side of its target.

## 2. Trackpad zoom safety

The previous OrbitControls settings allowed high-inertia trackpad wheel streams to zoom out extremely quickly. A project could effectively disappear before the user realized how far the camera had moved.

Build 10 adds two levels of protection:

1. **Control tuning**
   - `zoomSpeed = 0.22`
   - damping enabled
   - restrained polar-angle range
   - useful min/max camera distances

2. **Hard safety envelope**
   - every frame checks camera-to-target distance
   - camera is clamped to the allowed navigation envelope even if a browser emits an unusually large trackpad/wheel burst

The hard clamp is deliberately independent of input device behavior.

## 3. Interactive Gantt editing

Normal task bars now expose the same three edits available in the 3D world:

- **MOVE** — drag the bar body
- **START** — drag the blue left grip
- **FINISH** — drag the gold right grip

Milestones remain click/select only in Build 10. Direct milestone dragging stays a later refinement.

### MOVE

- preserves the source task's working-day duration
- converts pointer movement into working-day offset
- weekend crossings do not stretch duration
- produces a `shift` `ScheduleScenario`

### START

- changes only source start
- finish remains committed
- cannot cross finish
- produces a `start` `ScheduleScenario`

### FINISH

- changes only source finish
- start remains committed
- cannot cross start
- produces a `finish` `ScheduleScenario`

## 4. Pointer/date mapping

New pure module:

`src/twin/ganttDrag.ts`

Responsibilities:

- map client X to a date on a frozen Gantt scale
- clamp pointer position to the visible time range
- snap weekends according to current drag direction
- compute working-day offsets for MOVE
- enforce start/finish crossing constraints
- derive the exact `TaskScenarioEdit` represented by the gesture

The active Gantt scale is frozen at pointer-down for date conversion so a scenario that expands the displayed date range cannot create drag feedback/jitter.

## 5. One scenario engine

Gantt does **not** mutate dates directly.

The flow is:

```text
pointer gesture
    ↓
Gantt date mapping
    ↓
existing Zustand drag actions
    ↓
simulateTaskEdit / simulateFinishChange
    ↓
ScheduleScenario
    ↓
CPM + layout + 3D + Table + Gantt + Drivers
```

This preserves the architecture established in Builds 2, 3, 6, and 8.

## 6. Scenario and history behavior

Releasing a Gantt gesture leaves a normal scenario preview active.

Therefore all existing behavior remains intact:

- committed-position ghosts
- scenario movement treatment
- downstream conservative propagation
- updated CPM / float / Critical Path
- updated Drivers
- Save named scenario
- Apply
- Reset
- Apply creates one Undo revision
- preview/drag itself does not create history

## 7. Automated tests

Build 10 adds tests for:

- front-side task camera framing
- front-side workstream camera framing
- front-side work-package camera framing
- Today/Overview camera framing
- pointer X → calendar date mapping
- timeline-end clamping
- weekend snapping in both directions
- START edge crossing clamp
- FINISH edge crossing clamp
- MOVE duration preservation across a weekend

All earlier schedule, scenario, history, hierarchy, layout, orientation, and twin tests remain part of CI.

## Explicit non-goals

Build 10 does not add:

- direct milestone dragging
- resource leveling
- holiday calendars
- persistent backend storage
- external imports
- collaborative editing
- cost/resource views
- AI scheduling

## Signature Build 10 demo

1. Open 3D view.
2. Double-click Sensor Firmware Integration.
3. Camera flies in from above/front with the label readable.
4. Use a trackpad to zoom rapidly; the project stays within a recoverable camera envelope.
5. Switch to Gantt.
6. Select Sensor Firmware Integration.
7. Drag the bar body later through time.
8. Watch the downstream scenario update.
9. Switch to 3D and see the exact same preview and ghosts.
10. Reset.
11. Return to Gantt and drag the gold finish edge later.
12. Save the preview as a named scenario or Apply it.
13. Undo the applied revision if desired.

Build 10 makes 2D and 3D editing genuinely interchangeable while making the 3D navigation substantially harder to lose.
