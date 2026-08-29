export type ISODate = string

export type TaskKind = 'task' | 'milestone' | 'summary'
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF'

export interface Workstream {
  id: string
  name: string
  order: number
}

export interface ProjectTask {
  id: string
  name: string
  workstreamId: string
  parentId?: string
  kind: TaskKind
  start: ISODate
  finish: ISODate
  progress: number
  owner?: string
  baselineStart?: ISODate
  baselineFinish?: ISODate
}

export interface Dependency {
  id: string
  fromTaskId: string
  toTaskId: string
  type: DependencyType
  lagDays: number
}

export interface ProjectModel {
  id: string
  name: string
  statusDate: ISODate
  workstreams: Workstream[]
  tasks: ProjectTask[]
  dependencies: Dependency[]
}

export interface ProjectDateRange {
  start: ISODate
  finish: ISODate
}

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  code: string
  severity: ValidationSeverity
  message: string
  taskId?: string
  dependencyId?: string
}

export interface ActivityScheduleMetrics {
  taskId: string
  durationWorkdays: number
  earlyStartOffset: number
  earlyFinishOffset: number
  lateStartOffset: number
  lateFinishOffset: number
  totalFloatDays: number
  earlyStart: ISODate
  earlyFinish: ISODate
  lateStart: ISODate
  lateFinish: ISODate
  isCritical: boolean
}

export interface DriverAnalysis {
  targetTaskId: string
  taskIds: string[]
  dependencyIds: string[]
}

export interface ScheduleAnalysis {
  dateRange: ProjectDateRange
  upstreamByTask: Map<string, string[]>
  downstreamByTask: Map<string, string[]>
  validationIssues: ValidationIssue[]
  activityByTask: Map<string, ActivityScheduleMetrics>
  topologicalOrder: string[]
  criticalTaskIds: string[]
  criticalDependencyIds: string[]
  networkSpanWorkdays: number
}
