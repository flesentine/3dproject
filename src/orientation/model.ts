import type { ProjectModel } from '../domain/project'
import { buildWorldLayout, WORLD_SCALE } from '../visualization/layout'

export interface CameraTelemetry {
  position: [number, number, number]
  target: [number, number, number]
  distance: number
}

export interface MiniMapLane {
  id: string
  name: string
  shortLabel: string
  xPercent: number
}

export interface MiniMapMilestone {
  taskId: string
  name: string
  workstreamId: string
  xPercent: number
  yPercent: number
  critical: boolean
}

export interface MiniMapFocusRegion {
  workPackageId: string
  xPercent: number
  yStartPercent: number
  yEndPercent: number
}

export interface MiniMapPoint {
  xPercent: number
  yPercent: number
}

export interface MiniMapCamera extends MiniMapPoint {
  radiusPercent: number
  position: MiniMapPoint
}

export interface MiniMapModel {
  lanes: MiniMapLane[]
  milestones: MiniMapMilestone[]
  todayPercent: number
  selectedTask?: MiniMapPoint
  focusRegion?: MiniMapFocusRegion
  camera?: MiniMapCamera
  bounds: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
  }
}

export interface MiniMapOptions {
  focusedWorkPackageId?: string | null
  selectedTaskId?: string | null
  criticalTaskIds?: Iterable<string>
  camera?: CameraTelemetry | null
}

const MAP_PADDING_PERCENT = 7

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 50
  const inner = 100 - MAP_PADDING_PERCENT * 2
  return MAP_PADDING_PERCENT + ((value - min) / (max - min)) * inner
}

function shortLaneLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length > 1) return words.map((word) => word[0]?.toUpperCase() ?? '').join('').slice(0, 3)
  return name.slice(0, 3).toUpperCase()
}

export function buildMiniMapModel(project: ProjectModel, options: MiniMapOptions = {}): MiniMapModel {
  const layout = buildWorldLayout(project)
  const halfLane = WORLD_SCALE.laneGap * 0.48
  const minLaneX = Math.min(...layout.lanes.map((lane) => lane.x), 0) - halfLane
  const maxLaneX = Math.max(...layout.lanes.map((lane) => lane.x), 0) + halfLane
  const minTaskZ = Math.min(
    ...layout.tasks.map((visual) => visual.position[2] - visual.size[2] / 2),
    layout.startZ,
    layout.todayZ,
  )
  const maxTaskZ = Math.max(
    ...layout.tasks.map((visual) => visual.position[2] + visual.size[2] / 2),
    layout.finishZ,
    layout.todayZ,
  )
  const minZ = minTaskZ - WORLD_SCALE.day * 2
  const maxZ = maxTaskZ + WORLD_SCALE.day * 2
  const criticalTaskIds = new Set(options.criticalTaskIds ?? [])

  const lanes = layout.lanes.map<MiniMapLane>((lane) => ({
    id: lane.workstream.id,
    name: lane.workstream.name,
    shortLabel: shortLaneLabel(lane.workstream.name),
    xPercent: normalize(lane.x, minLaneX, maxLaneX),
  }))

  const milestoneVisuals = layout.tasks.filter((visual) => visual.task.kind === 'milestone')
  const milestones = milestoneVisuals.map<MiniMapMilestone>((visual) => ({
    taskId: visual.task.id,
    name: visual.task.name,
    workstreamId: visual.task.workstreamId,
    xPercent: normalize(visual.position[0], minLaneX, maxLaneX),
    yPercent: normalize(visual.position[2], minZ, maxZ),
    critical: criticalTaskIds.has(visual.task.id),
  }))

  const selectedVisual = options.selectedTaskId
    ? layout.tasks.find((visual) => visual.task.id === options.selectedTaskId)
    : undefined

  const focusedPackage = options.focusedWorkPackageId
    ? (project.workPackages ?? []).find((workPackage) => workPackage.id === options.focusedWorkPackageId)
    : undefined
  const focusedMembers = focusedPackage
    ? layout.tasks.filter((visual) => visual.task.workPackageId === focusedPackage.id)
    : []
  const focusedLane = focusedPackage
    ? layout.lanes.find((lane) => lane.workstream.id === focusedPackage.workstreamId)
    : undefined

  const focusRegion = focusedPackage && focusedLane && focusedMembers.length > 0
    ? {
        workPackageId: focusedPackage.id,
        xPercent: normalize(focusedLane.x, minLaneX, maxLaneX),
        yStartPercent: normalize(
          Math.min(...focusedMembers.map((visual) => visual.position[2] - visual.size[2] / 2)),
          minZ,
          maxZ,
        ),
        yEndPercent: normalize(
          Math.max(...focusedMembers.map((visual) => visual.position[2] + visual.size[2] / 2)),
          minZ,
          maxZ,
        ),
      }
    : undefined

  const camera = options.camera
    ? {
        xPercent: clamp(normalize(options.camera.target[0], minLaneX, maxLaneX), 2, 98),
        yPercent: clamp(normalize(options.camera.target[2], minZ, maxZ), 2, 98),
        radiusPercent: clamp(5 + (options.camera.distance / 95) * 22, 5, 27),
        position: {
          xPercent: clamp(normalize(options.camera.position[0], minLaneX, maxLaneX), 1, 99),
          yPercent: clamp(normalize(options.camera.position[2], minZ, maxZ), 1, 99),
        },
      }
    : undefined

  return {
    lanes,
    milestones,
    todayPercent: normalize(layout.todayZ, minZ, maxZ),
    selectedTask: selectedVisual
      ? {
          xPercent: normalize(selectedVisual.position[0], minLaneX, maxLaneX),
          yPercent: normalize(selectedVisual.position[2], minZ, maxZ),
        }
      : undefined,
    focusRegion,
    camera,
    bounds: { minX: minLaneX, maxX: maxLaneX, minZ, maxZ },
  }
}
