# 3D Project — Master Product Specification

**Status:** Final pre-build specification  
**Working title:** 3D Project  
**Repository:** `flesentine/3dproject`  
**Product stage:** V0.1 prototype definition  

---

## 1. Executive summary

3D Project is an experimental project-management and schedule-analysis product that turns a complex project schedule into a navigable spatial model.

The goal is **not** to make a Gantt chart look impressive in 3D. The goal is to make difficult project questions easier to answer:

1. Where are we now?
2. What controls this milestone?
3. What depends on this activity?
4. Why did this date move?
5. What happens if this task slips?
6. Where is the schedule fragile?
7. How much float remains before downstream impact occurs?

The core product thesis is:

> **Traditional project tools show schedules as rows. 3D Project turns the schedule into a spatial model where hierarchy, time, dependencies, critical path, float, baselines, and the consequences of change can be seen and manipulated directly.**

The wild visual experience is what gets attention. The long-term value is **causal schedule understanding and simulation**.

### Product rule

> **No feature belongs in the prototype unless it makes a complex project easier to understand.**

---

## 2. Final review conclusions

After repeated concept reviews, the product direction is frozen around the following decisions.

### 2.1 3D is the interface, not the product

The product is not “project management you can fly around.”

The product is a **spatial schedule explorer with interactive causal simulation**.

Free-flight navigation may exist as a power-user feature and demo delight, but normal use must not require game controls.

### 2.2 Selection is more important than navigation

The primary interaction loop is:

> **See → Select → Isolate → Change → Watch impact**

A user should be able to select a task or milestone, isolate its relevant context, inspect dependency drivers, propose a schedule change, and immediately watch the consequences propagate.

### 2.3 The project must have stable spatial geography

Users build spatial memory. Therefore the scene should not completely rearrange when switching analysis modes.

- Past stays behind.
- Future stays ahead.
- Workstreams maintain consistent lateral regions.
- Key milestones act as landmarks.
- Modes change emphasis, visibility, overlays, and styling—not the fundamental geography.

### 2.4 The app should almost never show everything at once

A 10,000-task schedule rendered as 10,000 labeled boxes and 20,000 dependency lines is failure, not sophistication.

The renderer must aggressively use:

- level of detail,
- hierarchy-based culling,
- selective labels,
- contextual dependency rendering,
- progressive disclosure,
- semantic zoom.

At any normal level, the target is roughly **10–30 cognitively meaningful visible objects**, even if thousands of activities exist underneath.

### 2.5 Schedule mathematics must remain real

The visual layer cannot invent its own simplified definition of project scheduling.

The underlying engine should be capable of evolving toward conventional scheduling concepts including:

- Finish-to-Start (FS)
- Start-to-Start (SS)
- Finish-to-Finish (FF)
- Start-to-Finish (SF)
- lag and lead
- working calendars
- milestones
- constraints
- total/free float
- critical path
- baseline dates
- actual and forecast dates
- parent/child hierarchy

V0.1 may support only a deliberate subset, but the data model must not block later expansion.

---

## 3. Product positioning

### 3.1 What it is

A new visual and analytical layer for complex schedules.

Potential long-term users:

- project managers,
- program managers,
- PMO/project-controls teams,
- engineering leads,
- executives,
- stakeholders who need to understand schedule consequences without reading a 2,000-row plan.

### 3.2 What it is not

V0.1 is not attempting to become:

- a full Microsoft Project replacement,
- Primavera P6,
- Jira,
- Asana,
- a collaboration suite,
- a generic diagramming app,
- a BIM/digital-twin platform,
- a metaverse,
- a VR product.

### 3.3 Long-term entry strategy

A realistic enterprise path is to become a **visual/simulation layer over existing schedule systems first**, rather than forcing customers to replace existing planning tools immediately.

Possible future imports/integrations could include:

- Microsoft Project,
- Primavera P6,
- Excel/CSV,
- Jira,
- Azure DevOps,
- other enterprise project systems.

This is intentionally outside V0.1.

---

## 4. Differentiation

The differentiator is not simply “3D project management.” That space already exists.

3D Project should concentrate on a specific combination:

### 4.1 Schedule-first spatial model

Time is a first-class physical concept in the scene.

### 4.2 CPM / float awareness

The app explains not only what is late, but which activities actually control delivery and how much tolerance remains.

### 4.3 Causal propagation

A user can alter a date and watch schedule consequences propagate through dependencies.

### 4.4 Baseline ghosts

Previous schedule geometry remains visible so movement is immediately understandable.

### 4.5 Scenario simulation

Proposed changes are temporary until explicitly applied.

### 4.6 Impact traversal

The system can isolate upstream drivers and downstream consequences around any selected activity or milestone.

---

## 5. Competitive and IP guardrail

### 5.1 Important discovery

A current competitor, **Galactify**, already markets a spatial/3D work-management product with hierarchical zoom, tasks, relationships, diagrams, and project-management use cases.

Relevant sources:

- https://www.galactify.com/
- https://www.galactify.com/about-us
- https://www.galactify.com/post/european-patent-granted-for-spatial-computing

Galactify states that it holds a granted European patent covering aspects of nested 3D blocks/workspaces and seamless semantic zoom. Public patent databases also show U.S. Patent **12,141,926** and European Patent **EP4185968B1** associated with the same general invention family.

Patent references:

- https://patents.google.com/patent/EP4185968A1/en
- https://patents.justia.com/patent/12141926

### 5.2 Product response

This does **not** mean the broad idea of 3D schedule visualization cannot be built. It does mean we should avoid deliberately cloning Galactify's specific nested-workspace interaction model.

Our design should remain schedule-centric:

- continuous structured schedule space,
- explicit time/horizon model,
- workstream lanes,
- dependency/CPM analysis,
- schedule propagation,
- float visualization,
- baseline comparison,
- scenario simulation.

The architecture should not depend on a separate URL-addressed 3D workspace per parent block or seamless automatic camera switching between nested independent workspaces as described in Galactify's patent materials.

### 5.3 Legal note

This document is a product/engineering specification, not a freedom-to-operate opinion. Before a commercial release, a qualified patent attorney should review the final implementation and relevant claims.

---

## 6. Spatial grammar

The user must be able to form a mental map.

### 6.1 Direction

Default orientation:

- **behind the user / behind Today:** past
- **ahead / toward the horizon:** future
- **left/right:** stable workstream regions or lanes
- **vertical dimension:** reserved for hierarchy, emphasis, contextual separation, and dependency routing—not arbitrary decoration

### 6.2 Today

Today is the anchor of the entire project.

It should be represented by a subtle but unmistakable plane or boundary crossing the project world.

A permanent **Today** action returns the camera to the canonical project orientation.

Keyboard shortcut candidate: `T`.

### 6.3 The Project Horizon

Major future milestones should read as landmarks on the horizon.

When a milestone moves because of a schedule change, the user should physically see it shift farther away or closer.

This is a signature visual metaphor.

### 6.4 Elastic time

Time should be spatial but not naively linear at every scale.

Different zoom levels may reveal different temporal granularity:

- portfolio: quarters/years,
- project: months,
- workstream: weeks,
- execution: days.

Long activities should not make short activities effectively invisible. The layout/time transform should preserve meaning across scales.

---

## 7. Hierarchy and semantic detail

The underlying project contains at least two different graphs.

### 7.1 Hierarchy graph

Answers:

> Where does this belong?

Example:

```text
Portfolio
└── Program
    └── Project
        └── Workstream
            └── Work Package
                └── Task
                    └── Subtask
```

### 7.2 Dependency graph

Answers:

> What affects what?

Example:

```text
A → B → C
    └→ D → E
```

The same activity participates in both graphs.

### 7.3 Semantic level of detail

Zoom should change the **meaningful abstraction level**, not simply make boxes larger.

Example progression:

```text
AURORA
  ↓
Engineering / Cloud / Validation / Launch
  ↓
Embedded Software
  ↓
Firmware Integration / Regression / Release
  ↓
Individual execution tasks
```

The renderer may aggregate or summarize children until closer inspection is useful.

---

## 8. Visual language

The aesthetic should feel like:

- architectural visualization,
- CAD,
- holographic systems visualization,
- restrained science-fiction UI.

Avoid literal cities, realistic buildings, avatars, or game-world props in the core product.

### 8.1 Task geometry

A task should initially encode only a small number of concepts visually.

Recommended:

- **position:** schedule + hierarchy/workstream
- **length along time:** duration
- **fill:** progress
- **state treatment:** normal, complete, blocked, selected, critical

Do not overload geometry with simultaneous encodings for cost, priority, effort, resource allocation, risk, owner, etc.

Those can appear in explicit modes or the inspector.

### 8.2 Milestones

Milestones should be highly legible landmarks, potentially vertical beacons or distinct geometric markers.

### 8.3 Dependencies

Dependencies are **not globally visible by default**.

Default state: clean scene.

On selection:

- immediate predecessors/successors may appear.

Trace mode:

- requested upstream/downstream chain appears.

Critical mode:

- critical or near-critical path is emphasized.

### 8.4 Baseline ghosts

When a schedule change is simulated, the original geometry remains visible as translucent ghost geometry.

This gives an immediate physical comparison between:

- before,
- proposed/current after.

---

## 9. Primary interaction model

### 9.1 Core loop

> **See → Select → Isolate → Change → Watch impact**

### 9.2 Selection

Selecting an object should immediately reduce visual noise.

Most irrelevant geometry fades while enough context remains to preserve orientation.

### 9.3 Focus

Click/focus moves the camera smoothly toward the selected object.

### 9.4 Drill-down

The user can move from summarized objects into more detailed activity levels.

This must not blindly imitate patented nested-workspace mechanics. The implementation can instead maintain one schedule scene/coordinate model with LOD transitions, filtering, grouping, or staged reveals.

### 9.5 Search

Search should be a primary navigation mechanism.

Selecting a search result focuses the relevant object while maintaining spatial orientation.

### 9.6 Breadcrumbs

A persistent hierarchy breadcrumb gives deterministic navigation back outward.

Example:

```text
AURORA / Engineering / Embedded Software / Firmware Release
```

### 9.7 Optional free movement

Power-user navigation can include:

- orbit,
- pan,
- zoom,
- optional WASD/free-flight mode.

Free flight must never be required for normal use.

---

## 10. Analysis modes

All modes preserve the same fundamental spatial geography.

### 10.1 Normal

Clean schedule overview.

### 10.2 Trace

Shows relevant predecessor/successor relationships for a selected node.

Possible controls:

- immediate drivers,
- all upstream,
- immediate downstream,
- all downstream.

### 10.3 Critical

Fades noncritical work and emphasizes the controlling chain and near-critical activities.

### 10.4 Baseline

Shows baseline/current schedule overlap.

### 10.5 Scenario

Shows proposed schedule changes before commitment.

Future analysis modes, explicitly not V0.1:

- risk,
- resources,
- cost,
- AI explanation,
- portfolio health.

---

## 11. Impact Mode — the core product moment

Impact Mode is the feature most likely to turn the prototype from “interesting visualization” into a serious planning tool.

Example:

1. User selects **Sensor Firmware Integration**.
2. Relevant context becomes prominent.
3. User chooses **Impact** or **Trace**.
4. Upstream drivers and downstream consequences appear.
5. User changes finish from September 4 to September 18.
6. The schedule engine recalculates.
7. Successor activities move only when logic requires it.
8. Activities protected by float remain stationary until float is exhausted.
9. Milestones move if impacted.
10. Baseline ghosts remain at the old positions.
11. Critical path/float values update.

The inspector may summarize:

```text
Proposed task slip: +14 days
System Validation impact: +9 days
Launch impact: +7 days
Remaining downstream float: 0 days
Critical path changed: Yes
```

The animation should make causality visible as a propagation wave rather than teleporting the entire schedule instantly.

---

## 12. Scenario safety model

Schedule experimentation must feel reversible.

Date dragging should default to a scenario, not an immediate destructive commit.

After a change:

```text
Scenario: Sensor Firmware Integration +14 days

[Apply] [Reset]
```

Undo should exist from the beginning.

This naturally evolves later into multiple what-if branches.

---

## 13. Float visualization

Float is a strong spatial concept and should become an early post-MVP feature.

Potential visualization:

- a translucent extension/envelope showing how far an activity can move before affecting downstream dates.

Conceptually:

```text
Task duration        Safe movement envelope
██████████████       ░░░░░░░░
```

Zero-float activities have no safe extension.

This turns an abstract scheduling concept into something directly visible.

Target: V0.2 unless implementation is trivial enough to include late in V0.1.

---

## 14. Editing behavior

Tasks should not be arbitrarily draggable in 3D space.

Editing geometry must preserve meaning.

Recommended interactions:

- drag start edge → modify start date,
- drag finish edge → modify finish date,
- drag entire activity along time axis → shift task,
- workstream/hierarchy coordinates remain fixed unless changed through structured controls.

This prevents accidental corruption of the visual grammar.

---

## 15. User interface shell

The project viewport should dominate the screen.

### Top

- Search
- Today
- analysis mode selector

### Left

- hierarchy/breadcrumb/navigation
- optional workstream filter

### Right

Selected-object inspector containing fields such as:

- name,
- parent/workstream,
- start,
- finish,
- duration,
- progress,
- owner,
- predecessors,
- successors,
- total float,
- critical status,
- baseline dates.

### Bottom

- time scale / scrub affordance
- scenario status if active

### Project mini-map

A small understated overview may show:

- camera region,
- Today plane,
- workstream regions,
- key milestones.

This should be added only if user testing shows meaningful navigation benefit.

---

## 16. Core scheduling engine

The project engine must be independent of the 3D renderer.

### 16.1 Engine responsibilities

- project hierarchy,
- activity dates,
- duration,
- dependency graph,
- schedule propagation,
- milestones,
- critical path,
- total/free float,
- baseline state,
- scenario state,
- undoable changes,
- upstream/downstream traversal.

### 16.2 Renderer responsibilities

The renderer consumes derived state such as:

```text
Render object A at location X
Render object B with progress P
Emphasize task C as critical
Render dependency D only because Trace mode requests it
Show baseline ghost at prior location Y
```

The renderer must not become the authoritative scheduling engine.

### 16.3 Why separation matters

The same project engine can later drive:

- 3D view,
- Gantt view,
- table view,
- network view,
- portfolio summary,
- exports/imports,
- automated analysis.

---

## 17. Initial data model

Illustrative TypeScript shape; not final API contract.

```ts
export type DependencyType = "FS" | "SS" | "FF" | "SF";

export interface ProjectNode {
  id: string;
  name: string;
  kind: "portfolio" | "program" | "project" | "workstream" | "work-package" | "task" | "milestone";
  parentId?: string;
}

export interface Task extends ProjectNode {
  kind: "task" | "milestone";
  start: string;
  finish: string;
  progress: number;
  owner?: string;
  status?: "not-started" | "active" | "blocked" | "complete";
  baselineStart?: string;
  baselineFinish?: string;
}

export interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  lagDays: number;
}

export interface ScheduleAnalysis {
  taskId: string;
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  totalFloatDays?: number;
  freeFloatDays?: number;
  critical: boolean;
}
```

V0.1 can initially implement FS dependencies only while retaining the dependency type field.

---

## 18. V0.1 scope — frozen

### 18.1 Project data

- one synthetic project,
- approximately 150 underlying tasks,
- six workstreams,
- three major milestones,
- parent/child hierarchy,
- dates,
- progress,
- FS dependencies,
- baseline snapshot.

### 18.2 Scheduling

- dependency traversal,
- forward schedule propagation,
- critical path,
- float calculation sufficient for prototype logic,
- scenario state,
- apply/reset,
- undo.

### 18.3 3D/spatial scene

- structured schedule space,
- Today plane,
- stable workstream regions,
- future horizon,
- task geometry,
- milestone landmarks,
- progress visualization,
- selective labels,
- level of detail,
- baseline ghosts,
- selective dependency curves.

### 18.4 Navigation

- orbit,
- pan/zoom,
- click/select,
- focus,
- drill-down/filter-to-detail,
- breadcrumb back,
- search,
- return to Today,
- optional WASD if inexpensive.

### 18.5 Analysis

- Normal mode,
- Trace mode,
- Critical mode,
- Baseline overlay,
- Scenario overlay.

### 18.6 Editing

- change task date/duration along time axis,
- recalculate downstream schedule,
- animate impact,
- apply/reset scenario.

### 18.7 2D support

A simple task table using the same engine state.

A full Gantt view is optional for V0.1 and should not delay the spatial prototype.

---

## 19. Explicitly out of scope for V0.1

Do not build these yet:

- authentication,
- backend database,
- Supabase,
- multi-user collaboration,
- comments,
- Jira/Slack/GitHub integrations,
- Microsoft Project import,
- Primavera import,
- CSV importer,
- AI assistant,
- voice control,
- VR/XR,
- mobile UI,
- avatars,
- literal buildings/cities,
- weather/risk effects,
- resource heat maps,
- cost modeling,
- portfolio dashboards,
- complex permission system,
- realistic digital twins.

These are distractions until the central interaction proves itself.

---

## 20. Demo project: AURORA

Use a believable synthetic project instead of `Task 1`, `Task 2`, etc.

### Project

**AURORA — Autonomous Delivery Platform**

### Workstreams

1. Hardware
2. Embedded Software
3. Cloud Platform
4. Mobile Application
5. System Validation
6. Launch

### Major milestones

- Engineering Complete
- System Validation Complete
- Commercial Launch

### Designed schedule problem

A task named **Sensor Firmware Integration** is planned to finish September 4.

It has very little float and drives a sequence that eventually controls System Validation and Commercial Launch.

During the demo, the task is moved to September 18.

The schedule should produce a visually interesting but logically credible chain of effects.

---

## 21. The 60-second acceptance test

A new user opens the prototype with no tutorial.

Within approximately one minute, can the user:

1. identify Today,
2. understand roughly where Commercial Launch is,
3. focus a workstream,
4. select a task,
5. identify what depends on it,
6. delay the task,
7. watch the downstream schedule respond,
8. recognize that a milestone moved,
9. compare new positions to baseline ghosts,
10. understand why the movement occurred?

Success reaction:

> “Oh. I get it.”

Failure reaction:

> “Cool graphics. What am I looking at?”

The prototype is successful only if the first reaction dominates.

---

## 22. Technical architecture

### 22.1 Recommended frontend stack

Initial recommendation:

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei where useful
- Zustand or another small predictable state store
- CSS/Tailwind depending on preferred app-shell workflow

The scene renderer and schedule engine should remain separate modules.

### 22.2 Initial persistence

V0.1 should run entirely locally with static/sample data.

Possible later local persistence:

- IndexedDB,
- JSON import/export.

No backend is needed to prove the product thesis.

### 22.3 Future backend

If the prototype succeeds, a future backend could use PostgreSQL/Supabase or an equivalent platform for:

- users,
- projects,
- collaboration,
- schedule history,
- scenario versions,
- imports/integrations.

This is intentionally deferred.

---

## 23. Proposed code architecture

```text
src/
├── app/
│   ├── App.tsx
│   └── shell/
├── project/
│   ├── model/
│   ├── sample-data/
│   ├── schedule/
│   │   ├── graph.ts
│   │   ├── propagate.ts
│   │   ├── criticalPath.ts
│   │   ├── float.ts
│   │   └── scenario.ts
│   └── selectors/
├── scene/
│   ├── ProjectScene.tsx
│   ├── layout/
│   ├── camera/
│   ├── tasks/
│   ├── milestones/
│   ├── dependencies/
│   ├── baseline/
│   └── lod/
├── features/
│   ├── selection/
│   ├── trace/
│   ├── critical/
│   ├── scenario/
│   ├── search/
│   └── inspector/
├── ui/
└── tests/
```

The exact structure can evolve, but `project/schedule` must remain usable without Three.js.

---

## 24. Rendering/performance rules

The renderer should be designed for eventual large schedules even though the prototype contains only ~150 tasks.

### 24.1 Avoid expensive per-task architecture

Do not assume thousands of heavy React components with independent state and effects will scale.

### 24.2 Plan for instancing

Large homogeneous task geometry should be able to use instanced rendering.

### 24.3 Labels are expensive and cognitively noisy

Labels should appear only when:

- nearby,
- selected,
- important at the current semantic level.

### 24.4 Dependency lines are conditional

Render only needed relationships.

### 24.5 Scene culling

Hide/aggregate detail outside the current hierarchy, focus, or LOD threshold.

### 24.6 Deterministic layout

The same project should generate the same geography each time unless the project data itself changes.

Stable spatial memory is a product feature.

---

## 25. Animation rules

Animation exists to explain cause and effect, not to decorate the scene.

Good uses:

- smooth focus transitions,
- successor movement propagating from a changed task,
- milestone shift after dependency impact,
- baseline/current separation,
- subtle selection emphasis.

Avoid:

- constant floating,
- random motion,
- excessive glow,
- game-like particle clutter,
- motion that obscures schedule meaning.

A complex project should feel alive because its **logic is visible**, not because everything wiggles.

---

## 26. Build sequence

### Build 0 — project foundation

- create Vite/React/TypeScript app,
- install 3D/state dependencies,
- establish lint/format/test baseline,
- create module boundaries.

### Build 1 — schedule engine

- typed data model,
- AURORA sample project,
- hierarchy traversal,
- FS graph,
- basic propagation,
- critical path/float prototype,
- unit tests independent of renderer.

### Build 2 — spatial scene

- camera,
- Today plane,
- workstream layout,
- task duration blocks,
- milestones,
- labels/LOD.

### Build 3 — selection/navigation

- click selection,
- focus,
- search,
- breadcrumb navigation,
- return to Today.

### Build 4 — dependency analysis

- immediate predecessor/successor display,
- Trace mode,
- Critical mode.

### Build 5 — scenarios

- drag/change task date,
- scenario state,
- propagation animation,
- baseline ghosts,
- Apply/Reset,
- Undo.

### Build 6 — polish against acceptance test

Do not add major features. Iterate until the 60-second test works reliably.

---

## 27. V0.2 candidates

Only after V0.1 proves the concept:

- explicit float envelopes,
- richer dependency types,
- working calendars,
- schedule history/time scrub,
- basic CSV import,
- stronger 2D Gantt/table editing,
- project-change replay,
- better large-schedule aggregation.

---

## 28. V0.3+ candidates

Later possibilities:

- risk overlays,
- resource heat,
- cost overlays,
- AI “Explain this view,”
- AI “Why did this move?”,
- AI impact queries,
- Project Pulse / changes-since-last-visit briefing,
- portfolio mode,
- MS Project/P6 integration,
- collaboration,
- what-if branches,
- executive presentation mode,
- controlled XR experiments.

None should enter the product merely because it looks futuristic.

---

## 29. Long-term AI concept

AI is not foundational to V0.1.

Once deterministic schedule behavior works, AI can become a project copilot on top of trusted project state.

Possible queries:

- “Show me what threatens September.”
- “Why did launch move?”
- “Take me to everything controlling TRR.”
- “What changed since Monday?”
- “What happens if this slips two weeks?”
- “Explain why this task is critical.”

The AI should manipulate/filter a trustworthy model, not hallucinate scheduling logic.

---

## 30. Product modes over time

The long-term product may support two broad experiences using the same underlying model.

### Plan

For PMs/project controls:

- edit dates,
- dependencies,
- scenarios,
- baselines,
- schedule logic.

### Explore

For leaders/stakeholders:

- navigate,
- focus,
- trace,
- understand status,
- inspect causal impact,
- present the project without a slide deck.

The prototype should support the beginning of both without creating separate products.

---

## 31. Non-negotiable UX principles

1. **Clarity beats spectacle.**
2. **Spatial positions must carry stable meaning.**
3. **Never show complexity the user did not ask to see.**
4. **Dependencies are contextual, not permanent spaghetti.**
5. **Selection should aggressively reduce noise.**
6. **Scenario edits must feel safe and reversible.**
7. **The schedule engine is authoritative; the renderer is not.**
8. **A 2D representation must remain possible from the same model.**
9. **Animation explains causality.**
10. **The prototype lives or dies on the schedule-impact interaction.**

---

## 32. Decisions frozen before coding

| Decision | Final direction |
|---|---|
| Main product idea | Spatial schedule explorer + causal simulation |
| Default orientation | Today anchored; future toward horizon |
| Spatial stability | Preserve geography across modes |
| Navigation | Click/focus/zoom primary; free flight optional |
| Detail | Semantic/LOD reveal rather than showing everything |
| Core graphs | Hierarchy graph + dependency graph |
| Dependency visibility | Contextual only |
| Task encoding | Position, duration, progress, state |
| Editing | Constrained to schedule/time semantics |
| Schedule changes | Scenario first, then Apply/Reset |
| Baselines | Ghost geometry |
| Engine | Independent from renderer |
| V0.1 backend | None |
| V0.1 AI | None |
| V0.1 imports | None |
| Demo project | AURORA, ~150 tasks |
| Key proof | Delay task → watch credible downstream impact |

---

## 33. Definition of V0.1 done

V0.1 is done when all of the following are true:

- The AURORA schedule loads reliably.
- The user can orient themselves around Today and future milestones.
- Workstreams and hierarchy are understandable without a tutorial.
- Selecting a task reduces noise and reveals useful context.
- Upstream/downstream tracing works.
- Critical path is calculated by the project engine and represented clearly.
- A date change can be proposed safely as a scenario.
- Relevant successor dates recalculate.
- The user can visually watch the effect propagate.
- Baseline ghosts make schedule drift obvious.
- Apply/Reset/Undo work.
- The scene remains readable rather than becoming dependency spaghetti.
- A simple 2D table shows the same underlying task state.
- The 60-second acceptance test can be demonstrated end-to-end.

Only then should we expand scope.

---

## 34. Final thesis

The most important sentence for the team:

> **We are not building a 3D Gantt chart. We are building a spatial model of schedule causality.**

If a complicated schedule becomes easier to understand, explore, and safely simulate, the product succeeds.

If it merely looks futuristic, it fails.
