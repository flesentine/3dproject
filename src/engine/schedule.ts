import { compareISODate, maxISODate, minISODate } from '../domain/dates'
import type {
  ProjectDateRange,
  ProjectModel,
  ScheduleAnalysis,
  ValidationIssue,
} from '../domain/project'

export interface ScheduleEngine {
  analyze(project: ProjectModel): ScheduleAnalysis
  getUpstream(project: ProjectModel, taskId: string): string[]
  getDownstream(project: ProjectModel, taskId: string): string[]
}

function buildAdjacency(project: ProjectModel) {
  const upstream = new Map<string, string[]>()
  const downstream = new Map<string, string[]>()

  for (const task of project.tasks) {
    upstream.set(task.id, [])
    downstream.set(task.id, [])
  }

  for (const dependency of project.dependencies) {
    upstream.get(dependency.toTaskId)?.push(dependency.fromTaskId)
    downstream.get(dependency.fromTaskId)?.push(dependency.toTaskId)
  }

  return { upstream, downstream }
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
    }

    if (dependency.fromTaskId === dependency.toTaskId) {
      issues.push({
        code: 'SELF_DEPENDENCY',
        severity: 'error',
        dependencyId: dependency.id,
        message: `Dependency ${dependency.id} cannot point a task to itself.`,
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

export function createScheduleEngine(): ScheduleEngine {
  return {
    analyze(project) {
      const { upstream, downstream } = buildAdjacency(project)

      return {
        dateRange: getDateRange(project),
        upstreamByTask: upstream,
        downstreamByTask: downstream,
        validationIssues: validate(project),
      }
    },

    getUpstream(project, taskId) {
      return traverse(buildAdjacency(project).upstream, taskId)
    },

    getDownstream(project, taskId) {
      return traverse(buildAdjacency(project).downstream, taskId)
    },
  }
}

export const scheduleEngine = createScheduleEngine()
