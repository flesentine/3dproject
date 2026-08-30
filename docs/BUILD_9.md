# Build 9 — History and Scenario Branches

**Status:** Complete pending final CI/merge gate

Build 9 makes schedule experimentation safer. The product already supported reversible what-if previews, but once a preview was applied there was no committed history, and useful alternate scenarios could not be named and revisited.

This build adds two separate mechanisms:

1. **Committed project history** — Undo / Redo for applied schedule changes.
2. **Saved scenario branches** — named alternate project states that can be previewed later without committing them.

The separation is intentional.

> **Save is not Apply. Preview is not history. Only Apply creates a committed revision.**

---

## User workflow

A typical flow is now:

1. Select an activity.
2. Manipulate START / MOVE / FINISH or type a what-if finish date.
3. Inspect the propagated preview in 3D, Table, and Gantt.
4. Give the preview a name such as `Supplier slips 2 weeks`.
5. Save the scenario branch.
6. Reset and explore another alternative.
7. Re-open the saved branch later with **Preview**.
8. Apply whichever branch should become the current plan.
9. Use **Undo** or **Redo** to move through committed schedule revisions.

Saved branches remain available while committed history moves backward or forward.

---

## Committed Undo / Redo

Undo/Redo operates only on committed `ProjectModel` states.

### Revision creation

A history revision is created when an active scenario is **Applied**.

The revision stores:

- the previous committed `ProjectModel`
- a stable sequence id
- a human-readable action label

Action labels include the named scenario when available, otherwise the direct manipulation type and source activity, for example:

- `Apply Supplier slips 2 weeks`
- `Resize finish · Sensor firmware integration`
- `Resize start · Firmware integration`
- `Move task · Sensor firmware integration`

### Undo

Undo restores the previous committed project and moves the current project onto the redo stack.

### Redo

Redo restores the project that was undone and moves the current project back onto the undo stack.

### Fork behavior

If the user:

1. applies change A
2. undoes A
3. applies a different change B

then the old redo path for A is discarded.

This prevents impossible history branches from being represented as a linear redo stack.

### History limit

Committed history is capped at 50 revisions in V0.1.

The cap limits memory growth while still providing far more exploration depth than the current prototype needs.

---

## Named scenario branches

A saved scenario is an in-memory snapshot of an alternate project state.

A saved branch stores:

- id
- user-visible name
- source task id
- edit kind (`start`, `finish`, or `shift`)
- requested start
- requested finish
- full alternate `ProjectModel`

It does **not** store a second authoritative schedule engine.

When a saved branch is previewed later:

1. its project snapshot becomes the preview project
2. schedule analysis is recalculated
3. differences are recalculated against the *current committed project*
4. the existing scenario visualization displays ghosts, changes, CPM, Drivers, Table, Gantt, and mini-map positions

This means a saved branch can still be meaningfully compared after the committed plan has changed.

### Same-name behavior

Saving another scenario using the same name updates that named branch instead of creating a duplicate.

Branch ids remain stable when a name is updated.

### Delete behavior

Deleting a saved scenario deletes only the saved branch record.

It does not alter:

- committed history
- the committed project
- another saved branch

---

## Keyboard shortcuts

When focus is not inside an editable field:

- **Cmd/Ctrl + Z** → Undo
- **Cmd/Ctrl + Shift + Z** → Redo
- **Ctrl + Y** → Redo

Undo/Redo are disabled while:

- a scenario preview is active
- a direct manipulation gesture is active

The user must Apply or Reset the preview first. This avoids ambiguous questions such as whether Undo should undo the preview gesture or the last committed schedule revision.

---

## Shared across all views

History and saved scenarios operate above the renderer layer.

Therefore the same behavior applies to:

- 3D
- Table
- Gantt

A saved branch loaded while viewing Table is the same branch seen when switching to 3D or Gantt.

An Undo in any view restores one shared committed `ProjectModel`.

---

## Architecture

### New module

`src/history/history.ts`

Provides pure helpers for:

- recording a revision
- undo transition
- redo transition
- saving/updating named scenario snapshots
- rebuilding a saved scenario preview against the current committed plan
- calculating saved branch projected finish

### Store changes

`src/state/useProjectStore.ts` now owns:

- `historyPast`
- `historyFuture`
- `historySequence`
- `savedScenarios`
- `savedScenarioSequence`
- `activeScenarioName`

New actions:

- `saveScenario(name)`
- `loadSavedScenario(id)`
- `deleteSavedScenario(id)`
- `undo()`
- `redo()`

### Scenario comparison

`compareProjectSchedules()` is now exported from `src/engine/scenario.ts`.

The same change-detection logic used by ordinary what-if simulation is reused when a previously saved branch is reopened against a newer committed plan.

### UI

`src/history/HistoryScenarioPanelPortal.tsx`

Adds a renderer-independent control surface to the existing left context panel:

- Undo
- Redo
- history action labels
- scenario naming
- Save / Update branch
- saved branch list
- Preview branch
- Delete branch
- projected project finish

The portal also updates the runtime build label to Build 9 without coupling history behavior into the main `App` component.

---

## Validation coverage

### Pure history tests

`src/history/history.test.ts`

Covers:

- recording committed revisions
- Undo
- Redo
- history cap
- saved branch creation
- same-name branch replacement
- previewing a saved branch against a different committed plan
- projected saved-branch finish

### Store integration tests

`src/state/useProjectStore.test.ts`

Covers:

- previews do not create committed history
- Apply creates history
- Undo / Redo round trip
- redo stack clears after a new Apply following Undo
- saved scenarios survive Undo / Redo
- loading a saved branch does not create committed history
- Undo is blocked while an active scenario preview exists

---

## Build 9 acceptance test

1. Delay **Sensor firmware integration**.
2. Save the preview as `Late firmware`.
3. Reset it.
4. Create and save a different scenario.
5. Preview `Late firmware` again.
6. Confirm 3D, Table, Gantt, CPM, and Drivers all show that branch.
7. Apply `Late firmware`.
8. Undo.
9. Confirm the original committed schedule returns.
10. Redo.
11. Confirm `Late firmware` returns.
12. Confirm both saved scenario branches still exist throughout the process.

Success means the user can explore aggressively without fear of losing either the committed plan or a useful alternative.

---

## Explicitly not in Build 9

- browser/localStorage persistence
- backend scenario storage
- collaboration
- multi-user revision history
- Git-like merge/rebase between saved scenarios
- named committed baselines
- branching history graph visualization
- scenario diff table beyond the existing scenario change visualization

Those are later product decisions. Build 9 intentionally proves the local interaction model first.
