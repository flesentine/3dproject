import type { ProjectModel } from '../domain/project'
import { getTasksForWorkPackage, getWorkPackage } from '../hierarchy/hierarchy'
import type { WorldLayout } from '../visualization/layout'

export type NavigationKind = 'overview' | 'today' | 'workstream' | 'workPackage' | 'task'

export interface NavigationRequest {
  id: number
  kind: NavigationKind
  targetId?: string
}

export interface NavigationFrame {
  position: [number, number, number]
  target: [number, number, number]
}

export type ProjectSearchResult =
  | {
      kind: 'workstream'
      id: string
      label: string
      detail: string
      score: number
    }
  | {
      kind: 'workPackage'
      id: string
      label: string
      detail: string
      workstreamId: string
      score: number
    }
  | {
      kind: 'task'
      id: string
      label: string
      detail: string
      workstreamId: string
      workPackageId?: string
      score: number
    }

function textScore(value: string | undefined, query: string): number {
  if (!value) return 0
  const normalized = value.toLowerCase()
  if (normalized === query) return 100
  if (normalized.startsWith(query)) return 70
  if (normalized.includes(query)) return 40
  return 0
}

export function searchProject(project: ProjectModel, rawQuery: string, limit = 8): ProjectSearchResult[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return []

  const workstreamById = new Map(project.workstreams.map((workstream) => [workstream.id, workstream]))
  const workPackageById = new Map((project.workPackages ?? []).map((workPackage) => [workPackage.id, workPackage]))
  const results: ProjectSearchResult[] = []

  for (const workstream of project.workstreams) {
    const score = textScore(workstream.name, query)
    if (score > 0) {
      results.push({
        kind: 'workstream',
        id: workstream.id,
        label: workstream.name,
        detail: 'Workstream',
        score: score + 5,
      })
    }
  }

  for (const workPackage of project.workPackages ?? []) {
    const score = textScore(workPackage.name, query)
    if (score <= 0) continue
    results.push({
      kind: 'workPackage',
      id: workPackage.id,
      label: workPackage.name,
      detail: `Work package · ${workstreamById.get(workPackage.workstreamId)?.name ?? 'Unknown workstream'}`,
      workstreamId: workPackage.workstreamId,
      score: score + 8,
    })
  }

  for (const task of project.tasks) {
    const nameScore = textScore(task.name, query)
    const ownerScore = textScore(task.owner, query)
    const workstream = workstreamById.get(task.workstreamId)
    const workPackage = task.workPackageId ? workPackageById.get(task.workPackageId) : undefined
    const workstreamScore = textScore(workstream?.name, query)
    const workPackageScore = textScore(workPackage?.name, query)
    const score = Math.max(nameScore, ownerScore - 5, workPackageScore - 10, workstreamScore - 15)
    if (score <= 0) continue

    results.push({
      kind: 'task',
      id: task.id,
      label: task.name,
      detail: `${task.kind} · ${workstream?.name ?? 'Unknown workstream'}${workPackage ? ` / ${workPackage.name}` : ''}${task.owner ? ` · ${task.owner}` : ''}`,
      workstreamId: task.workstreamId,
      workPackageId: task.workPackageId,
      score: score + (task.kind === 'milestone' ? 4 : 0),
    })
  }

  return results
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, limit)
}

/**
 * Camera convention: approach schedule geometry from the +Z (future/front)
 * side and from above. Drei Text faces +Z, so this keeps labels readable and
 * prevents a semantic "dive in" from landing behind the task/package.
 */
function frameVisuals(layout: WorldLayout, visuals: WorldLayout['tasks'], x: number, distanceScale: number): NavigationFrame | null {
  if (visuals.length === 0) return null
  const minZ = Math.min(...visuals.map((visual) => visual.position[2] - visual.size[2] / 2))
  const maxZ = Math.max(...visuals.map((visual) => visual.position[2] + visual.size[2] / 2))
  const centerZ = (minZ + maxZ) / 2
  const span = Math.max(4, maxZ - minZ)
  return {
    target: [x, 0.75, centerZ],
    position: [x + 7.5 * distanceScale, 6.2 * distanceScale, centerZ + Math.min(20, span * 0.32 + 7) * distanceScale],
  }
}

export function getNavigationFrame(
  project: ProjectModel,
  layout: WorldLayout,
  request: Pick<NavigationRequest, 'kind' | 'targetId'>,
): NavigationFrame {
  const worldCenterZ = (layout.startZ + layout.finishZ) / 2

  if (request.kind === 'today') {
    return {
      target: [0, 0.85, layout.todayZ],
      position: [15, 11, layout.todayZ + 15],
    }
  }

  if (request.kind === 'task' && request.targetId) {
    const visual = layout.tasks.find((candidate) => candidate.task.id === request.targetId)
    if (visual) {
      const depth = Math.max(visual.size[2], 1)
      return {
        target: [visual.position[0], Math.max(0.7, visual.position[1]), visual.position[2]],
        position: [visual.position[0] + 6.5, 5.2, visual.position[2] + Math.max(7, depth * 0.7 + 5)],
      }
    }
  }

  if (request.kind === 'workPackage' && request.targetId) {
    const workPackage = getWorkPackage(project, request.targetId)
    if (workPackage) {
      const lane = layout.lanes.find((candidate) => candidate.workstream.id === workPackage.workstreamId)
      const taskIds = new Set(getTasksForWorkPackage(project, workPackage.id).map((task) => task.id))
      const visuals = layout.tasks.filter((visual) => taskIds.has(visual.task.id))
      const frame = lane ? frameVisuals(layout, visuals, lane.x, 0.72) : null
      if (frame) return frame
    }
  }

  if (request.kind === 'workstream' && request.targetId) {
    const lane = layout.lanes.find((candidate) => candidate.workstream.id === request.targetId)
    const visuals = layout.tasks.filter((visual) => visual.task.workstreamId === request.targetId)
    const frame = lane ? frameVisuals(layout, visuals, lane.x, 1) : null
    if (frame) return frame
  }

  const width = Math.max(18, project.workstreams.length * 4.2)
  return {
    target: [0, 0.8, worldCenterZ],
    position: [Math.max(18, width * 0.65), 16, worldCenterZ + 24],
  }
}
