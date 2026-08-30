import { addCalendarDays, differenceInDays } from '../domain/dates'
import type { ProjectModel, ProjectTask, ScheduleAnalysis } from '../domain/project'
import { taskBelongsToFocus } from '../hierarchy/hierarchy'
import type { AnalysisMode } from '../state/useProjectStore'

export interface TwinRow {
  task: ProjectTask
  isCritical: boolean
  isDriver: boolean
  isScenarioChanged: boolean
  totalFloatDays?: number
  durationWorkdays?: number
}

export interface TwinRowsOptions {
  analysisMode: AnalysisMode
  focusedWorkstreamId: string | null
  focusedWorkPackageId: string | null
  driverTaskIds: string[]
  scenarioChangedTaskIds?: string[]
}

export interface GanttScale {
  start: string
  finish: string
  totalDays: number
  ticks: { date: string; leftPercent: number }[]
}

export interface GanttBarGeometry {
  leftPercent: number
  widthPercent: number
  milestone: boolean
}

function isVisibleForAnalysis(
  task: ProjectTask,
  analysis: ScheduleAnalysis,
  options: TwinRowsOptions,
): boolean {
  if (options.analysisMode === 'critical') return analysis.criticalTaskIds.includes(task.id)
  if (options.analysisMode === 'drivers') return options.driverTaskIds.includes(task.id)
  return taskBelongsToFocus(task, options.focusedWorkstreamId, options.focusedWorkPackageId)
}

export function buildTwinRows(
  project: ProjectModel,
  analysis: ScheduleAnalysis,
  options: TwinRowsOptions,
): TwinRow[] {
  const changedIds = new Set(options.scenarioChangedTaskIds ?? [])
  const driverIds = new Set(options.driverTaskIds)
  const orderByWorkstream = new Map(project.workstreams.map((workstream) => [workstream.id, workstream.order]))
  const packageOrder = new Map((project.workPackages ?? []).map((workPackage) => [workPackage.id, workPackage.order]))

  return project.tasks
    .filter((task) => isVisibleForAnalysis(task, analysis, options))
    .map((task) => {
      const metrics = analysis.activityByTask.get(task.id)
      return {
        task,
        isCritical: metrics?.isCritical ?? false,
        isDriver: driverIds.has(task.id),
        isScenarioChanged: changedIds.has(task.id),
        totalFloatDays: metrics?.totalFloatDays,
        durationWorkdays: metrics?.durationWorkdays,
      }
    })
    .sort((left, right) => {
      const workstreamDelta = (orderByWorkstream.get(left.task.workstreamId) ?? 999) - (orderByWorkstream.get(right.task.workstreamId) ?? 999)
      if (workstreamDelta !== 0) return workstreamDelta
      const packageDelta = (packageOrder.get(left.task.workPackageId ?? '') ?? 999) - (packageOrder.get(right.task.workPackageId ?? '') ?? 999)
      if (packageDelta !== 0) return packageDelta
      const startDelta = left.task.start.localeCompare(right.task.start)
      if (startDelta !== 0) return startDelta
      return left.task.name.localeCompare(right.task.name)
    })
}

export function buildGanttScale(start: string, finish: string): GanttScale {
  const totalDays = Math.max(1, differenceInDays(start, finish) + 1)
  const ticks: GanttScale['ticks'] = []

  for (let offset = 0; offset < totalDays; offset += 7) {
    ticks.push({
      date: addCalendarDays(start, offset),
      leftPercent: (offset / totalDays) * 100,
    })
  }

  return { start, finish, totalDays, ticks }
}

export function ganttBarGeometry(scale: GanttScale, task: Pick<ProjectTask, 'start' | 'finish' | 'kind'>): GanttBarGeometry {
  const startOffset = Math.max(0, differenceInDays(scale.start, task.start))
  const finishOffset = Math.min(scale.totalDays - 1, differenceInDays(scale.start, task.finish))
  const leftPercent = (startOffset / scale.totalDays) * 100
  const milestone = task.kind === 'milestone'
  const spanDays = milestone ? 1 : Math.max(1, finishOffset - startOffset + 1)
  const widthPercent = (spanDays / scale.totalDays) * 100

  return {
    leftPercent,
    widthPercent: Math.max(widthPercent, milestone ? 0.9 : 1.2),
    milestone,
  }
}

export function ganttMarkerPercent(scale: GanttScale, date: string): number | null {
  const offset = differenceInDays(scale.start, date)
  if (offset < 0 || offset >= scale.totalDays) return null
  return (offset / scale.totalDays) * 100
}
