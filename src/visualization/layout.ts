import { differenceInDays } from '../domain/dates'
import type { ISODate, ProjectModel, ProjectTask, Workstream } from '../domain/project'

export const WORLD_SCALE = {
  day: 0.38,
  laneGap: 4.2,
  taskWidth: 2.8,
  taskHeight: 0.7,
  milestoneSize: 0.8,
} as const

export interface TaskVisual {
  task: ProjectTask
  position: [number, number, number]
  size: [number, number, number]
}

export interface LaneVisual {
  workstream: Workstream
  x: number
}

export interface WorldLayout {
  lanes: LaneVisual[]
  tasks: TaskVisual[]
  todayZ: number
  startZ: number
  finishZ: number
}

export function getProjectStart(project: ProjectModel): ISODate {
  return project.tasks.reduce(
    (earliest, task) => (task.start < earliest ? task.start : earliest),
    project.tasks[0]?.start ?? project.statusDate,
  )
}

export function buildWorldLayout(project: ProjectModel, anchorStart?: ISODate): WorldLayout {
  const orderedWorkstreams = [...project.workstreams].sort((a, b) => a.order - b.order)
  const midpoint = (orderedWorkstreams.length - 1) / 2
  const laneX = new Map<string, number>()

  const lanes = orderedWorkstreams.map((workstream, index) => {
    const x = (index - midpoint) * WORLD_SCALE.laneGap
    laneX.set(workstream.id, x)
    return { workstream, x }
  })

  const actualProjectStart = getProjectStart(project)
  const timeOrigin = anchorStart ?? project.statusDate

  const projectFinish = project.tasks.reduce(
    (latest, task) => (task.finish > latest ? task.finish : latest),
    project.tasks[0]?.finish ?? project.statusDate,
  )

  const tasks = project.tasks.map<TaskVisual>((task) => {
    const startDay = differenceInDays(timeOrigin, task.start)
    const durationDays = Math.max(1, differenceInDays(task.start, task.finish) + 1)
    const depth = task.kind === 'milestone' ? WORLD_SCALE.milestoneSize : durationDays * WORLD_SCALE.day
    const width = task.kind === 'milestone' ? WORLD_SCALE.milestoneSize : WORLD_SCALE.taskWidth
    const height = task.kind === 'milestone' ? WORLD_SCALE.milestoneSize : WORLD_SCALE.taskHeight

    return {
      task,
      position: [
        laneX.get(task.workstreamId) ?? 0,
        height / 2,
        startDay * WORLD_SCALE.day + depth / 2,
      ],
      size: [width, height, depth],
    }
  })

  return {
    lanes,
    tasks,
    todayZ: differenceInDays(timeOrigin, project.statusDate) * WORLD_SCALE.day,
    startZ: differenceInDays(timeOrigin, actualProjectStart) * WORLD_SCALE.day,
    finishZ: differenceInDays(timeOrigin, projectFinish) * WORLD_SCALE.day,
  }
}
