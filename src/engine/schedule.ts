import { addWorkingDays, compareISODate, maxISODate, minISODate, workingDaysInclusive } from '../domain/dates'
import type {
  ActivityScheduleMetrics,
  Dependency,
  DriverAnalysis,
  ProjectDateRange,
  ProjectModel,
  ProjectTask,
  ScheduleAnalysis,
  ValidationIssue,
} from '../domain/project'

export interface ScheduleEngine {
  analyze(project: ProjectModel): ScheduleAnalysis
  getUpstream(project: ProjectModel, taskId: string): string[]
  getDownstream(project: ProjectModel, taskId: string): string[]
  getDrivers(project: ProjectModel, taskId: string): DriverAnalysis
}

interface GraphIndex {
  upstream: Map<string, string[]>
  downstream: Map<string, string[]>
  incomingDependencies: Map<string, Dependency[]>
  outgoingDependencies: Map<string, Dependency[]>
}

interface ForwardTiming {
  earlyStart: number
  earlyFinish: number
  span: number
}

interface LateTiming {
  lateStart: number
  lateFinish: number
}

function schedulableTasks(project: ProjectModel): ProjectTask[] {
  return project.tasks.filter((task) => task.kind !== 'summary')
}

function validDependencies(project: ProjectModel): Dependency[] {
  const schedulableIds = new Set(schedulableTasks(project).map((task) => task.id))

  return project.dependencies.filter(
    (dependency) =>
      dependency.fromTaskId !== dependency.toTaskId &&
      schedulableIds.has(dependency.fromTaskId) &&
      schedulableIds.has(dependency.toTaskId),
  )
}

function buildAdjacency(project: ProjectModel, dependencies = validDependencies(project)): GraphIndex {
  const upstream = new Map<string, string[]>()
  const downstream = new Map<string, string[]>()
  const incomingDependencies = new Map<string, Dependency[]>()
  const outgoingDependencies = new Map<string, Dependency[]>()

  for (const task of project.tasks) {
    upstream.set(task.id, [])
    downstream.set(task.id, [])
    incomingDependencies.set(task.id, [])
    outgoingDependencies.set(task.id, [])
  }

  for (const dependency of dependencies) {
    upstream.get(dependency.toTaskId)?.push(dependency.fromTaskId)
    downstream.get(dependency.fromTaskId)?.push(dependency.toTaskId)
    incomingDependencies.get(dependency.toTaskId)?.push(dependency)
    outgoingDependencies.get(dependency.fromTaskId)?.push(dependency)
  }

  return { upstream, downstream, incomingDependencies, outgoingDependencies }
}

function traverse(adjacency: Map<string, string[]>, taskId: string): string[] {
  const visited = new Set<string>()
  const queue = [...(adjacency.get(taskId) ?? [])]

  while (queue.length > 0) {
    const next = queue.shift()
    if (!next || visited.has(next)) continue

    visited.add(next)
    queue.push(...(adjacency.get(next) ?? []))
  }

  return [...visited]
}

function validate(project: ProjectModel): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const taskIds = new Set(project.tasks.map((task) => task.id))
  const summaryTaskIds = new Set(project.tasks.filter((task) => task.kind === 'summary').map((task) => task.id))
  const workstreamIds = new Set(project.workstreams.map((workstream) => workstream.id))

  for (const task of project.tasks) {
    if (!workstreamIds.has(task.workstreamId)) {
      issues.push({
        code: 'UNKNOWN_WORKSTREAM',
        severity: 'error',
        taskId: task.id,
        message: `${task.name} references missing workstream ${task.workstreamId}.`,
      })
    }

    if (task.parentId && !taskIds.has(task.parentId)) {
      issues.push({
        code: 'UNKNOWN_PARENT',
        severity: 'error',
        taskId: task.id,
        message: `${task.name} references missing parent ${task.parentId}.`,
      })
    }

    if (compareISODate(task.finish, task.start) < 0) {
      issues.push({
        code: 'FINISH_BEFORE_START',
        severity: 'error',
        taskId: task.id,
        message: `${task.name} finishes before it starts.`,
      })
    }

    if (task.progress < 0 || task.progress > 1) {
      issues.push({
        code: 'INVALID_PROGRESS',
        severity: 'error',
        taskId: task.id,
        message: `${task.name} progress must be between 0 and 1.`,
      })
    }
  }

  for (const dependency of project.dependencies) {
    if (!taskIds.has(dependency.fromTaskId) || !taskIds.has(dependency.toTaskId)) {
      issues.push({
        code: 'UNKNOWN_DEPENDENCY_TASK',
        severity: 'error',
        dependencyId: dependency.id,
        message: `Dependency ${dependency.id} references a missing task.`,
      })
      continue
    }

    if (dependency.fromTaskId === dependency.toTaskId) {
      issues.push({
        code: 'SELF_DEPENDENCY',
        severity: 'error',
        dependencyId: dependency.id,
        message: `Dependency ${dependency.id} cannot point a task to itself.`,
      })
    }

    if (!Number.isInteger(dependency.lagDays)) {
      issues.push({
        code: 'INVALID_LAG',
        severity: 'error',
        dependencyId: dependency.id,
        message: `Dependency ${dependency.id} lag must be a whole number of working days.`,
      })
    }

    if (summaryTaskIds.has(dependency.fromTaskId) || summaryTaskIds.has(dependency.toTaskId)) {
      issues.push({
        code: 'SUMMARY_DEPENDENCY_IGNORED',
        severity: 'warning',
        dependencyId: dependency.id,
        message: `Dependency ${dependency.id} references a summary task and is excluded from CPM analysis.`,
      })
    }
  }

  return issues
}

function getDateRange(project: ProjectModel): ProjectDateRange {
  if (project.tasks.length === 0) {
    return { start: project.statusDate, finish: project.statusDate }
  }

  return {
    start: minISODate(project.tasks.map((task) => task.start)),
    finish: maxISODate(project.tasks.map((task) => task.finish)),
  }
}

function getDurationWorkdays(task: ProjectTask): number {
  if (task.kind === 'milestone') return 0
  return Math.max(1, workingDaysInclusive(task.start, task.finish))
}

function getSpan(task: ProjectTask): number {
  const duration = getDurationWorkdays(task)
  return duration === 0 ? 0 : duration - 1
}

function topologicalSort(project: ProjectModel, dependencies: Dependency[]): { order: string[]; hasCycle: boolean } {
  const tasks = schedulableTasks(project)
  const ids = new Set(tasks.map((task) => task.id))
  const indegree = new Map(tasks.map((task) => [task.id, 0]))
  const outgoing = new Map(tasks.map((task) => [task.id, [] as string[]]))

  for (const dependency of dependencies) {
    if (!ids.has(dependency.fromTaskId) || !ids.has(dependency.toTaskId)) continue
    indegree.set(dependency.toTaskId, (indegree.get(dependency.toTaskId) ?? 0) + 1)
    outgoing.get(dependency.fromTaskId)?.push(dependency.toTaskId)
  }

  const queue = tasks
    .filter((task) => (indegree.get(task.id) ?? 0) === 0)
    .map((task) => task.id)
  const order: string[] = []

  while (queue.length > 0) {
    const taskId = queue.shift()
    if (!taskId) continue
    order.push(taskId)

    for (const successorId of outgoing.get(taskId) ?? []) {
      const nextIndegree = (indegree.get(successorId) ?? 0) - 1
      indegree.set(successorId, nextIndegree)
      if (nextIndegree === 0) queue.push(successorId)
    }
  }

  return { order, hasCycle: order.length !== tasks.length }
}

function successorStartConstraint(
  dependency: Dependency,
  predecessor: ForwardTiming | ActivityScheduleMetrics,
  successorSpan: number,
): number {
  switch (dependency.type) {
    case 'FS':
      return predecessor.earlyFinish + dependency.lagDays + 1
    case 'SS':
      return predecessor.earlyStart + dependency.lagDays
    case 'FF':
      return predecessor.earlyFinish + dependency.lagDays - successorSpan
    case 'SF':
      return predecessor.earlyStart + dependency.lagDays - successorSpan
  }
}

function predecessorLatestStartConstraint(
  dependency: Dependency,
  successor: LateTiming,
  predecessorSpan: number,
): number {
  switch (dependency.type) {
    case 'FS':
      return successor.lateStart - dependency.lagDays - 1 - predecessorSpan
    case 'SS':
      return successor.lateStart - dependency.lagDays
    case 'FF':
      return successor.lateFinish - dependency.lagDays - predecessorSpan
    case 'SF':
      return successor.lateFinish - dependency.lagDays
  }
}

function calculateCpm(
  project: ProjectModel,
  dependencies: Dependency[],
  graph: GraphIndex,
  order: string[],
): Pick<ScheduleAnalysis, 'activityByTask' | 'criticalTaskIds' | 'criticalDependencyIds' | 'networkSpanWorkdays'> {
  const taskById = new Map(schedulableTasks(project).map((task) => [task.id, task]))
  const forward = new Map<string, ForwardTiming>()

  for (const taskId of order) {
    const task = taskById.get(taskId)
    if (!task) continue

    const span = getSpan(task)
    let earlyStart = 0

    for (const dependency of graph.incomingDependencies.get(taskId) ?? []) {
      const predecessor = forward.get(dependency.fromTaskId)
      if (!predecessor) continue
      earlyStart = Math.max(earlyStart, successorStartConstraint(dependency, predecessor, span))
    }

    forward.set(taskId, {
      earlyStart,
      earlyFinish: earlyStart + span,
      span,
    })
  }

  const projectFinishOffset = Math.max(0, ...[...forward.values()].map((timing) => timing.earlyFinish))
  const late = new Map<string, LateTiming>()

  for (const taskId of [...order].reverse()) {
    const timing = forward.get(taskId)
    if (!timing) continue

    let lateStart = projectFinishOffset - timing.span

    for (const dependency of graph.outgoingDependencies.get(taskId) ?? []) {
      const successor = late.get(dependency.toTaskId)
      if (!successor) continue
      lateStart = Math.min(
        lateStart,
        predecessorLatestStartConstraint(dependency, successor, timing.span),
      )
    }

    late.set(taskId, {
      lateStart,
      lateFinish: lateStart + timing.span,
    })
  }

  const projectStart = getDateRange(project).start
  const activityByTask = new Map<string, ActivityScheduleMetrics>()

  for (const taskId of order) {
    const task = taskById.get(taskId)
    const early = forward.get(taskId)
    const latest = late.get(taskId)
    if (!task || !early || !latest) continue

    const totalFloatDays = latest.lateStart - early.earlyStart
    activityByTask.set(taskId, {
      taskId,
      durationWorkdays: getDurationWorkdays(task),
      earlyStartOffset: early.earlyStart,
      earlyFinishOffset: early.earlyFinish,
      lateStartOffset: latest.lateStart,
      lateFinishOffset: latest.lateFinish,
      totalFloatDays,
      earlyStart: addWorkingDays(projectStart, early.earlyStart),
      earlyFinish: addWorkingDays(projectStart, early.earlyFinish),
      lateStart: addWorkingDays(projectStart, latest.lateStart),
      lateFinish: addWorkingDays(projectStart, latest.lateFinish),
      isCritical: totalFloatDays === 0,
    })
  }

  const criticalTaskIds = order.filter((taskId) => activityByTask.get(taskId)?.isCritical)
  const criticalTaskSet = new Set(criticalTaskIds)
  const criticalDependencyIds = dependencies
    .filter((dependency) => {
      if (!criticalTaskSet.has(dependency.fromTaskId) || !criticalTaskSet.has(dependency.toTaskId)) return false
      const predecessor = activityByTask.get(dependency.fromTaskId)
      const successor = activityByTask.get(dependency.toTaskId)
      if (!predecessor || !successor) return false
      return successor.earlyStartOffset === successorStartConstraint(dependency, predecessor, successor.earlyFinishOffset - successor.earlyStartOffset)
    })
    .map((dependency) => dependency.id)

  return {
    activityByTask,
    criticalTaskIds,
    criticalDependencyIds,
    networkSpanWorkdays: activityByTask.size === 0 ? 0 : projectFinishOffset + 1,
  }
}

function analyzeProject(project: ProjectModel): ScheduleAnalysis {
  const dependencies = validDependencies(project)
  const graph = buildAdjacency(project, dependencies)
  const validationIssues = validate(project)
  const { order, hasCycle } = topologicalSort(project, dependencies)

  if (hasCycle) {
    validationIssues.push({
      code: 'DEPENDENCY_CYCLE',
      severity: 'error',
      message: 'The dependency graph contains a cycle. CPM analysis is disabled until the cycle is removed.',
    })
  }

  const cpm = hasCycle
    ? {
        activityByTask: new Map<string, ActivityScheduleMetrics>(),
        criticalTaskIds: [] as string[],
        criticalDependencyIds: [] as string[],
        networkSpanWorkdays: 0,
      }
    : calculateCpm(project, dependencies, graph, order)

  return {
    dateRange: getDateRange(project),
    upstreamByTask: graph.upstream,
    downstreamByTask: graph.downstream,
    validationIssues,
    topologicalOrder: order,
    ...cpm,
  }
}

function getDriverAnalysis(project: ProjectModel, taskId: string): DriverAnalysis {
  const analysis = analyzeProject(project)
  const dependencies = validDependencies(project)
  const graph = buildAdjacency(project, dependencies)
  const driverTaskIds = new Set<string>()
  const driverDependencyIds = new Set<string>()
  const queue = [taskId]

  if (analysis.activityByTask.has(taskId)) driverTaskIds.add(taskId)

  while (queue.length > 0) {
    const currentTaskId = queue.shift()
    if (!currentTaskId) continue

    const successor = analysis.activityByTask.get(currentTaskId)
    if (!successor) continue

    const successorSpan = successor.earlyFinishOffset - successor.earlyStartOffset
    for (const dependency of graph.incomingDependencies.get(currentTaskId) ?? []) {
      const predecessor = analysis.activityByTask.get(dependency.fromTaskId)
      if (!predecessor) continue

      const isDriving =
        successor.earlyStartOffset === successorStartConstraint(dependency, predecessor, successorSpan)
      if (!isDriving) continue

      driverDependencyIds.add(dependency.id)
      if (!driverTaskIds.has(dependency.fromTaskId)) {
        driverTaskIds.add(dependency.fromTaskId)
        queue.push(dependency.fromTaskId)
      }
    }
  }

  const orderIndex = new Map(analysis.topologicalOrder.map((id, index) => [id, index]))

  return {
    targetTaskId: taskId,
    taskIds: [...driverTaskIds].sort((left, right) => (orderIndex.get(left) ?? 0) - (orderIndex.get(right) ?? 0)),
    dependencyIds: project.dependencies
      .filter((dependency) => driverDependencyIds.has(dependency.id))
      .map((dependency) => dependency.id),
  }
}

export function createScheduleEngine(): ScheduleEngine {
  return {
    analyze: analyzeProject,

    getUpstream(project, taskId) {
      return traverse(buildAdjacency(project).upstream, taskId)
    },

    getDownstream(project, taskId) {
      return traverse(buildAdjacency(project).downstream, taskId)
    },

    getDrivers: getDriverAnalysis,
  }
}

export const scheduleEngine = createScheduleEngine()
