import { addWorkingDays, compareISODate, isWorkingDay, parseISODate, workingDaysInclusive } from '../domain/dates'
import type {
  Dependency,
  ISODate,
  ProjectModel,
  ProjectTask,
  ScenarioEditKind,
  ScenarioResult,
  ScenarioTaskChange,
} from '../domain/project'
import { scheduleEngine } from './schedule'

export type TaskScenarioEdit =
  | { kind: 'finish'; finish: ISODate }
  | { kind: 'start'; start: ISODate }
  | { kind: 'shift'; start: ISODate; finish: ISODate }

function durationWorkdays(task: ProjectTask): number {
  if (task.kind === 'milestone') return 0
  return Math.max(1, workingDaysInclusive(task.start, task.finish))
}

function taskSpan(task: ProjectTask): number {
  const duration = durationWorkdays(task)
  return duration === 0 ? 0 : duration - 1
}

function isValidScenarioDependency(dependency: Dependency, taskById: Map<string, ProjectTask>): boolean {
  const from = taskById.get(dependency.fromTaskId)
  const to = taskById.get(dependency.toTaskId)

  return Boolean(
    from &&
      to &&
      from.kind !== 'summary' &&
      to.kind !== 'summary' &&
      dependency.fromTaskId !== dependency.toTaskId &&
      Number.isInteger(dependency.lagDays),
  )
}

function requiredSuccessorStart(
  dependency: Dependency,
  predecessor: ProjectTask,
  successorSpan: number,
): ISODate {
  switch (dependency.type) {
    case 'FS':
      return addWorkingDays(predecessor.finish, dependency.lagDays + 1)
    case 'SS':
      return addWorkingDays(predecessor.start, dependency.lagDays)
    case 'FF': {
      const requiredFinish = addWorkingDays(predecessor.finish, dependency.lagDays)
      return addWorkingDays(requiredFinish, -successorSpan)
    }
    case 'SF': {
      const requiredFinish = addWorkingDays(predecessor.start, dependency.lagDays)
      return addWorkingDays(requiredFinish, -successorSpan)
    }
  }
}

function workingDayDistance(from: ISODate, to: ISODate): number {
  const comparison = compareISODate(from, to)
  if (comparison === 0) return 0

  const direction = comparison < 0 ? 1 : -1
  let cursor = from
  let distance = 0

  while (cursor !== to) {
    cursor = addWorkingDays(cursor, direction)
    distance += direction

    if (Math.abs(distance) > 100_000) {
      throw new Error(`Working-day distance exceeded safety limit: ${from} → ${to}`)
    }
  }

  return distance
}

function candidateStartFromRelationship(
  dependency: Dependency,
  basePredecessor: ProjectTask,
  scenarioPredecessor: ProjectTask,
  originalSuccessor: ProjectTask,
  successorSpan: number,
): ISODate {
  const baseConstraint = requiredSuccessorStart(dependency, basePredecessor, successorSpan)
  const scenarioConstraint = requiredSuccessorStart(dependency, scenarioPredecessor, successorSpan)

  if (compareISODate(baseConstraint, originalSuccessor.start) <= 0) {
    return compareISODate(scenarioConstraint, originalSuccessor.start) > 0
      ? scenarioConstraint
      : originalSuccessor.start
  }

  const incrementalShift = Math.max(0, workingDayDistance(baseConstraint, scenarioConstraint))
  return addWorkingDays(originalSuccessor.start, incrementalShift)
}

function buildChanges(base: ProjectModel, scenario: ProjectModel, sourceTaskId: string): ScenarioTaskChange[] {
  const scenarioById = new Map(scenario.tasks.map((task) => [task.id, task]))

  return base.tasks.flatMap((original) => {
    const next = scenarioById.get(original.id)
    if (!next || (next.start === original.start && next.finish === original.finish)) return []

    return [{
      taskId: original.id,
      originalStart: original.start,
      originalFinish: original.finish,
      scenarioStart: next.start,
      scenarioFinish: next.finish,
      startShiftWorkdays: workingDayDistance(original.start, next.start),
      finishShiftWorkdays: workingDayDistance(original.finish, next.finish),
      isSourceEdit: original.id === sourceTaskId,
    }]
  })
}

function validWeekday(value: ISODate): boolean {
  try {
    return isWorkingDay(parseISODate(value))
  } catch {
    return false
  }
}

function requestedRange(source: ProjectTask, edit: TaskScenarioEdit): {
  kind: ScenarioEditKind
  start: ISODate
  finish: ISODate
} | { error: string } {
  if (edit.kind === 'finish') {
    if (!validWeekday(edit.finish)) return { error: 'Choose a valid weekday finish date.' }
    if (source.kind !== 'milestone' && compareISODate(edit.finish, source.start) < 0) {
      return { error: 'Finish cannot be earlier than the activity start.' }
    }
    return {
      kind: 'finish',
      start: source.kind === 'milestone' ? edit.finish : source.start,
      finish: edit.finish,
    }
  }

  if (edit.kind === 'start') {
    if (source.kind !== 'task') return { error: 'Only normal tasks have a draggable start edge.' }
    if (!validWeekday(edit.start)) return { error: 'Choose a valid weekday start date.' }
    if (compareISODate(edit.start, source.finish) > 0) {
      return { error: 'Start cannot be later than the activity finish.' }
    }
    return { kind: 'start', start: edit.start, finish: source.finish }
  }

  if (!validWeekday(edit.start) || !validWeekday(edit.finish)) {
    return { error: 'Shifted tasks must start and finish on weekdays.' }
  }
  if (compareISODate(edit.finish, edit.start) < 0) {
    return { error: 'Shifted task finish cannot be earlier than its start.' }
  }
  if (source.kind === 'milestone' && edit.start !== edit.finish) {
    return { error: 'A milestone shift must keep start and finish together.' }
  }
  if (source.kind === 'task') {
    const shiftedDuration = Math.max(1, workingDaysInclusive(edit.start, edit.finish))
    if (shiftedDuration !== durationWorkdays(source)) {
      return { error: 'Whole-task movement must preserve the activity working-day duration.' }
    }
  }

  return { kind: 'shift', start: edit.start, finish: edit.finish }
}

export function simulateTaskEdit(
  project: ProjectModel,
  taskId: string,
  edit: TaskScenarioEdit,
): ScenarioResult {
  const source = project.tasks.find((task) => task.id === taskId)
  if (!source) return { ok: false, message: 'The selected activity no longer exists.' }
  if (source.kind === 'summary') return { ok: false, message: 'Summary activities cannot be edited in scenarios.' }

  const range = requestedRange(source, edit)
  if ('error' in range) return { ok: false, message: range.error }

  const baseAnalysis = scheduleEngine.analyze(project)
  if (baseAnalysis.validationIssues.some((issue) => issue.code === 'DEPENDENCY_CYCLE')) {
    return { ok: false, message: 'Scenario propagation is disabled until the dependency cycle is removed.' }
  }

  const baseTaskById = new Map(project.tasks.map((task) => [task.id, task]))
  const scenarioTaskById = new Map(project.tasks.map((task) => [task.id, { ...task }]))
  const validDependencies = project.dependencies.filter((dependency) =>
    isValidScenarioDependency(dependency, baseTaskById),
  )
  const incomingByTask = new Map<string, Dependency[]>()

  for (const task of project.tasks) incomingByTask.set(task.id, [])
  for (const dependency of validDependencies) {
    incomingByTask.get(dependency.toTaskId)?.push(dependency)
  }

  const sourceScenario = scenarioTaskById.get(taskId)
  if (!sourceScenario) return { ok: false, message: 'The selected activity could not be loaded.' }
  sourceScenario.start = range.start
  sourceScenario.finish = range.finish

  const downstream = new Set(scheduleEngine.getDownstream(project, taskId))

  for (const successorId of baseAnalysis.topologicalOrder) {
    if (!downstream.has(successorId)) continue

    const successor = scenarioTaskById.get(successorId)
    const originalSuccessor = baseTaskById.get(successorId)
    if (!successor || !originalSuccessor || successor.kind === 'summary') continue

    const span = taskSpan(originalSuccessor)
    let requiredStart = originalSuccessor.start

    for (const dependency of incomingByTask.get(successorId) ?? []) {
      const basePredecessor = baseTaskById.get(dependency.fromTaskId)
      const scenarioPredecessor = scenarioTaskById.get(dependency.fromTaskId)
      if (!basePredecessor || !scenarioPredecessor) continue

      const candidate = candidateStartFromRelationship(
        dependency,
        basePredecessor,
        scenarioPredecessor,
        originalSuccessor,
        span,
      )
      if (compareISODate(candidate, requiredStart) > 0) requiredStart = candidate
    }

    if (compareISODate(requiredStart, originalSuccessor.start) <= 0) continue

    successor.start = requiredStart
    successor.finish = span === 0 ? requiredStart : addWorkingDays(requiredStart, span)
  }

  const scenarioProject: ProjectModel = {
    ...project,
    tasks: project.tasks.map((task) => scenarioTaskById.get(task.id) ?? task),
  }
  const analysis = scheduleEngine.analyze(scenarioProject)
  const changes = buildChanges(project, scenarioProject, taskId)

  return {
    ok: true,
    scenario: {
      sourceTaskId: taskId,
      editKind: range.kind,
      requestedStart: range.start,
      requestedFinish: range.finish,
      project: scenarioProject,
      analysis,
      changes,
    },
  }
}

export function simulateFinishChange(
  project: ProjectModel,
  taskId: string,
  requestedFinish: ISODate,
): ScenarioResult {
  return simulateTaskEdit(project, taskId, { kind: 'finish', finish: requestedFinish })
}
