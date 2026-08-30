import type { ProjectModel, ProjectTask, WorkPackage, Workstream } from '../domain/project'

export interface HierarchyPath {
  project: { id: string; name: string }
  workstream?: Workstream
  workPackage?: WorkPackage
  task?: ProjectTask
}

export function getWorkPackages(project: ProjectModel): WorkPackage[] {
  return [...(project.workPackages ?? [])].sort((left, right) => {
    if (left.workstreamId !== right.workstreamId) {
      const workstreamOrder = new Map(project.workstreams.map((workstream) => [workstream.id, workstream.order]))
      return (workstreamOrder.get(left.workstreamId) ?? 0) - (workstreamOrder.get(right.workstreamId) ?? 0)
    }
    return left.order - right.order || left.name.localeCompare(right.name)
  })
}

export function getWorkPackagesForWorkstream(project: ProjectModel, workstreamId: string): WorkPackage[] {
  return getWorkPackages(project).filter((workPackage) => workPackage.workstreamId === workstreamId)
}

export function getWorkPackage(project: ProjectModel, workPackageId: string | null | undefined): WorkPackage | null {
  if (!workPackageId) return null
  return (project.workPackages ?? []).find((workPackage) => workPackage.id === workPackageId) ?? null
}

export function getWorkPackageForTask(project: ProjectModel, task: ProjectTask | null | undefined): WorkPackage | null {
  return getWorkPackage(project, task?.workPackageId)
}

export function getTasksForWorkPackage(project: ProjectModel, workPackageId: string): ProjectTask[] {
  return project.tasks.filter((task) => task.workPackageId === workPackageId)
}

export function getHierarchyPath(project: ProjectModel, taskId?: string | null, workPackageId?: string | null, workstreamId?: string | null): HierarchyPath {
  const task = taskId ? project.tasks.find((candidate) => candidate.id === taskId) : undefined
  const resolvedWorkPackage = getWorkPackage(project, task?.workPackageId ?? workPackageId)
  const resolvedWorkstreamId = task?.workstreamId ?? resolvedWorkPackage?.workstreamId ?? workstreamId ?? undefined
  const workstream = resolvedWorkstreamId
    ? project.workstreams.find((candidate) => candidate.id === resolvedWorkstreamId)
    : undefined

  return {
    project: { id: project.id, name: project.name },
    workstream,
    workPackage: resolvedWorkPackage ?? undefined,
    task,
  }
}

export function taskBelongsToFocus(
  task: ProjectTask,
  focusedWorkstreamId: string | null,
  focusedWorkPackageId: string | null,
): boolean {
  if (focusedWorkPackageId) return task.workPackageId === focusedWorkPackageId
  if (focusedWorkstreamId) return task.workstreamId === focusedWorkstreamId
  return true
}
