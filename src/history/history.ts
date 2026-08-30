import type { ProjectModel, ScheduleScenario, ScenarioEditKind } from '../domain/project'
import { scheduleEngine } from '../engine/schedule'
import { compareProjectSchedules } from '../engine/scenario'

export interface ProjectHistoryEntry {
  id: number
  label: string
  project: ProjectModel
}

export interface ProjectHistoryStacks {
  past: ProjectHistoryEntry[]
  future: ProjectHistoryEntry[]
}

export interface SavedScenarioSnapshot {
  id: string
  name: string
  sourceTaskId: string
  editKind: ScenarioEditKind
  requestedStart: string
  requestedFinish: string
  project: ProjectModel
}

export interface HistoryTransition {
  project: ProjectModel
  past: ProjectHistoryEntry[]
  future: ProjectHistoryEntry[]
  actionLabel: string
}

const DEFAULT_HISTORY_LIMIT = 50

export function recordProjectRevision(
  past: ProjectHistoryEntry[],
  currentProject: ProjectModel,
  label: string,
  id: number,
  limit = DEFAULT_HISTORY_LIMIT,
): ProjectHistoryEntry[] {
  const next = [...past, { id, label, project: currentProject }]
  return next.length > limit ? next.slice(next.length - limit) : next
}

export function undoProjectRevision(
  currentProject: ProjectModel,
  past: ProjectHistoryEntry[],
  future: ProjectHistoryEntry[],
): HistoryTransition | null {
  const previous = past.at(-1)
  if (!previous) return null

  return {
    project: previous.project,
    past: past.slice(0, -1),
    future: [
      ...future,
      {
        id: previous.id,
        label: previous.label,
        project: currentProject,
      },
    ],
    actionLabel: previous.label,
  }
}

export function redoProjectRevision(
  currentProject: ProjectModel,
  past: ProjectHistoryEntry[],
  future: ProjectHistoryEntry[],
): HistoryTransition | null {
  const next = future.at(-1)
  if (!next) return null

  return {
    project: next.project,
    past: [
      ...past,
      {
        id: next.id,
        label: next.label,
        project: currentProject,
      },
    ],
    future: future.slice(0, -1),
    actionLabel: next.label,
  }
}

export function saveScenarioSnapshot(
  saved: SavedScenarioSnapshot[],
  scenario: ScheduleScenario,
  rawName: string,
  id: string,
): SavedScenarioSnapshot[] {
  const name = rawName.trim()
  if (!name) return saved

  const snapshot: SavedScenarioSnapshot = {
    id,
    name,
    sourceTaskId: scenario.sourceTaskId,
    editKind: scenario.editKind,
    requestedStart: scenario.requestedStart,
    requestedFinish: scenario.requestedFinish,
    project: scenario.project,
  }

  const existingIndex = saved.findIndex(
    (candidate) => candidate.name.trim().toLowerCase() === name.toLowerCase(),
  )

  if (existingIndex === -1) return [...saved, snapshot]

  return saved.map((candidate, index) =>
    index === existingIndex ? { ...snapshot, id: candidate.id } : candidate,
  )
}

export function previewSavedScenario(
  committedProject: ProjectModel,
  snapshot: SavedScenarioSnapshot,
): ScheduleScenario {
  return {
    sourceTaskId: snapshot.sourceTaskId,
    editKind: snapshot.editKind,
    requestedStart: snapshot.requestedStart,
    requestedFinish: snapshot.requestedFinish,
    project: snapshot.project,
    analysis: scheduleEngine.analyze(snapshot.project),
    changes: compareProjectSchedules(
      committedProject,
      snapshot.project,
      snapshot.sourceTaskId,
    ),
  }
}

export function savedScenarioProjectedFinish(snapshot: SavedScenarioSnapshot): string {
  return scheduleEngine.analyze(snapshot.project).dateRange.finish
}
