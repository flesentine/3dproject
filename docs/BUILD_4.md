# Build 4 — Navigation and Semantic Zoom

**Status:** Implemented on `build/4-navigation-semantic-zoom`  
**Purpose:** Make the 3D schedule behave like a navigable project space rather than a static 3D viewer.

## Product goal

Build 4 answers:

> **How do I get to the part of the project I care about without getting lost?**

The navigation system must preserve spatial memory. Camera movement and semantic focus are allowed to change viewpoint and information density, but they must never rearrange project geography.

## Navigation model

All navigation entry points issue the same small set of camera requests:

- **Overview** — frame the complete project.
- **Today** — return to the stable Today plane at the time origin.
- **Workstream** — frame one stable lane and enter semantic workstream focus.
- **Task** — select an activity and fly directly to its spatial position.

Search, breadcrumbs, sidebar workstream buttons, inspector Focus, and in-world double-clicks all converge on this model.

## Project search

The top search field searches:

- task names;
- milestone names;
- workstream names;
- task owners.

Results are ranked by exact, prefix, and partial matches. Pressing Enter chooses the strongest result.

Selecting a task result:

1. selects the activity;
2. enters its workstream context;
3. flies the camera to the task.

Selecting a workstream result enters and frames that workstream.

## Breadcrumbs

The top breadcrumb represents semantic location:

`Project AURORA / Workstream / Selected Activity`

- Click the project name to return to Overview.
- Click the workstream to reframe the lane.
- Click the selected activity to refocus the camera on it.

Breadcrumbs are location controls, not a separate hierarchy engine.

## Today and Overview

**Today** clears workstream/task semantic focus and flies back to the Today plane.

**Overview** clears semantic focus and frames the whole project.

These two actions are the primary escape hatches when a user feels lost.

## Workstream semantic zoom

Build 4 introduces the first real semantic-zoom level:

`Project → Workstream → Task`

Entering a workstream:

- keeps every lane at its existing X coordinate;
- keeps every task at its existing time coordinate;
- emphasizes the selected lane;
- fades unrelated lanes and tasks in Normal mode;
- expands task labels inside the focused workstream;
- keeps the rest of the project faintly visible for orientation.

This is intentionally not a separate scene and not a layout transformation.

## Cross-workstream analysis

Semantic focus must never hide causal truth.

Therefore:

- **Normal mode** applies workstream fading.
- **Critical Path** may emphasize critical activities outside the focused workstream.
- **Drivers** may emphasize controlling predecessors outside the focused workstream.

Analysis takes precedence over semantic fading when the user explicitly asks a causal question.

## In-world gestures

- Single-click task: select it.
- Double-click task: select + semantic focus + camera fly-to.
- Double-click lane or workstream label: enter that workstream.
- Double-click Today plane: return Today.
- Orbit and zoom remain available when not dragging a finish handle.

## Camera behavior

Camera transitions interpolate rather than teleport.

The camera rig updates both:

- camera position;
- OrbitControls target.

This matters because a fly-to that moves only the camera but leaves the orbit target behind produces broken navigation on the next mouse drag.

## Direct manipulation compatibility

Build 3 finish dragging remains unchanged.

While a finish drag is active:

- camera navigation controls in the 2D UI are disabled;
- Orbit controls remain locked;
- the drag surface owns pointer movement;
- releasing the pointer returns the app to normal navigation.

This prevents navigation and schedule editing from competing for the same gesture.

## Automated coverage

Build 4 adds pure tests for:

- task search ranking;
- workstream search;
- Today framing at stable Z=0;
- workstream camera centering on the correct lane;
- task camera framing at the actual rendered task location.

Search and camera framing math remain outside React and Three.js components.

## Explicit non-goals

Not in Build 4:

- semantic hierarchy below the existing workstream/task level;
- recursive parent/child dive into epics and subtasks;
- minimap;
- keyboard navigation shortcuts;
- WASD/free-flight mode;
- saved camera bookmarks;
- browser URL/deep-link navigation state;
- search filters;
- fuzzy/AI search;
- mobile gesture redesign;
- portfolio-level navigation.

## Build 4 acceptance story

1. Open the project from Overview.
2. Search for **Sensor Firmware Integration**.
3. Select it and watch the camera fly into the correct workstream and task.
4. Use the breadcrumb to return to its workstream.
5. Observe unrelated work fade while task labels expand in the focused lane.
6. Switch to Drivers and verify controlling work outside the lane can still reappear.
7. Click **Today** and return to the stable project home position.
8. Click **Overview** and recover the full project map.
9. Double-click a different workstream lane and enter it without any geometry rearrangement.

If a new user can move from the whole project to one activity and back without losing orientation, Build 4 has achieved its purpose.
