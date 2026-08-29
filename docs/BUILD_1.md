# Build 1 — Critical Path and Drivers

**Status:** Complete  
**Branch:** `build/1-critical-path`  
**Purpose:** Turn the Build 0 spatial schedule shell into a real schedule-analysis experience.

## Product goal

Build 1 answers two useful questions directly in the 3D world:

1. **What is the project's critical path?**
2. **What is actually controlling this selected activity or milestone?**

These are intentionally separate. The global critical path is the longest zero-float network. Driver analysis traces only the predecessor relationships that determine the selected activity's earliest possible start.

## Schedule engine additions

- Monday-Friday working calendar
- Working-day activity duration derived from planned dates
- Finish-to-start (FS)
- Start-to-start (SS)
- Finish-to-finish (FF)
- Start-to-finish (SF)
- Positive or negative whole-working-day lag
- Topological sorting
- Dependency-cycle detection
- Forward CPM pass
- Backward CPM pass
- Early start / early finish
- Late start / late finish
- Total float
- Critical activity detection
- Critical dependency detection
- Driver-chain tracing for any selected schedulable activity
- Invalid lag relationships rejected from CPM instead of contaminating analysis

## Build 1 calendar boundary

Build 1 uses a simple Monday-Friday calendar with no holidays or resource calendars. Calendar services remain isolated in `src/domain/dates.ts` so later builds can replace this with project/resource calendars without changing the CPM or 3D renderer contracts.

## Visual behavior

Build 1 adds three stable-geography analysis states:

### Normal

The Build 0 schedule world remains readable and uncluttered. Selecting a task shows only immediate dependency connections.

### Critical Path

Non-critical activity geometry fades. Critical activities and the dependency chain that actually links them remain emphasized without moving anything spatially.

### Drivers

With an activity selected, unrelated geometry fades and only the controlling predecessor chain into the target remains emphasized. This is the first implementation of the product's core "show me what controls this" interaction.

## Inspector additions

The selected-activity inspector shows:

- Duration in working days
- Total float
- Critical / non-critical state
- CPM early dates
- CPM late dates
- Upstream/downstream reach
- Driver count
- A direct **Show what controls this** action

## Testing

Build 1 introduces Vitest and makes tests part of CI. Coverage includes:

- Known AURORA critical-path result
- Known AURORA float values
- Commercial Launch driver chain
- FS / SS / FF / SF relationship math
- Working-day lag
- Dependency-cycle rejection

A full Build 1 UI/engine checkpoint passed the automated test suite and Vite production build before final hardening.

## Explicit non-goals

Not in Build 1:

- Date editing
- Schedule propagation into stored project dates
- Scenario branches
- Baseline ghost rendering
- Holidays / custom calendars
- Resource leveling
- Risk overlays
- Import/export
- Backend persistence
- AI

Those remain later milestones. Build 1 is successful when a user can select Commercial Launch and visually understand which activities are actually controlling it.
