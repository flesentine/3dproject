import type { ProjectModel } from '../domain/project'
import type { WorldLayout } from '../visualization/layout'

export type NavigationKind = 'overview' | 'today' | 'workstream' | 'task'

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
      kind: 'task'
      id: string
      label: string
      detail: string
      workstreamId: string
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

  for (const task of project.tasks) {
    const nameScore = textScore(task.name, query)
    const ownerScore = textScore(task.owner, query)
    const workstream = workstreamById.get(task.workstreamId)
    const workstreamScore = textScore(workstream?.name, query)
    const score = Math.max(nameScore, ownerScore - 5, workstreamScore - 15)
    if (score <= 0) continue

    results.push({
      kind: 'task',
      id: task.id,
      label: task.name,
      detail: `${task.kind} · ${workstream?.name ?? 'Unknown workstream'}${task.owner ? ` · ${task.owner}` : ''}`,
      workstreamId: task.workstreamId,
      score: score + (task.kind === 'milestone' ? 4 : 0),
    })
  }

  return results
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, limit)
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
      position: [15, 11, layout.todayZ - 15],
    }
  }

  if (request.kind === 'task' && request.targetId) {
    const visual = layout.tasks.find((candidate) => candidate.task.id === request.targetId)
    if (visual) {
      const depth = Math.max(visual.size[2], 1)
      return {
        target: [visual.position[0], Math.max(0.7, visual.position[1]), visual.position[2]],
        position: [visual.position[0] + 6.5, 5.2, visual.position[2] - Math.max(7, depth * 0.7 + 5)],
      }
    }
  }

  if (request.kind === 'workstream' && request.targetId) {
    const lane = layout.lanes.find((candidate) => candidate.workstream.id === request.targetId)
    const visuals = layout.tasks.filter((visual) => visual.task.workstreamId === request.targetId)
    if (lane && visuals.length > 0) {
      const minZ = Math.min(...visuals.map((visual) => visual.position[2] - visual.size[2] / 2))
      const maxZ = Math.max(...visuals.map((visual) => visual.position[2] + visual.size[2] / 2))
      const centerZ = (minZ + maxZ) / 2
      const span = Math.max(12, maxZ - minZ)
      return {
        target: [lane.x, 0.7, centerZ],
        position: [lane.x + 10, 8.5, centerZ - Math.min(22, span * 0.35 + 9)],
      }
    }
  }

  const width = Math.max(18, project.workstreams.length * 4.2)
  return {
    target: [0, 0.8, worldCenterZ],
    position: [Math.max(18, width * 0.65), 16, worldCenterZ - 24],
  }
}
