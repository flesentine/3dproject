import {
  addCalendarDays,
  addWorkingDays,
  compareISODate,
  isWorkingDay,
  parseISODate,
} from '../domain/dates'
import type { ISODate, ProjectTask } from '../domain/project'
import type { TaskScenarioEdit } from '../engine/scenario'
import type { GanttScale } from './model'

export type GanttDragKind = 'start' | 'finish' | 'shift'

export interface GanttDragPreview {
  edit: TaskScenarioEdit
  start: ISODate
  finish: ISODate
  pointerDate: ISODate
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function ganttDateFromClientX(
  scale: GanttScale,
  timelineLeft: number,
  timelineWidth: number,
  clientX: number,
): ISODate {
  if (timelineWidth <= 0) return scale.start
  const ratio = clamp((clientX - timelineLeft) / timelineWidth, 0, 1)
  const offset = Math.round(ratio * Math.max(0, scale.totalDays - 1))
  return addCalendarDays(scale.start, offset)
}

export function snapGanttDateToWeekday(
  value: ISODate,
  previous: ISODate,
): ISODate {
  if (isWorkingDay(parseISODate(value))) return value

  const direction = compareISODate(value, previous) < 0 ? -1 : 1
  let cursor = value
  for (let index = 0; index < 3; index += 1) {
    cursor = addCalendarDays(cursor, direction)
    if (isWorkingDay(parseISODate(cursor))) return cursor
  }
  return value
}

export function workingDayOffsetBetween(from: ISODate, to: ISODate): number {
  const comparison = compareISODate(from, to)
  if (comparison === 0) return 0
  const direction = comparison < 0 ? 1 : -1
  let cursor = from
  let offset = 0

  while (cursor !== to) {
    cursor = addWorkingDays(cursor, direction)
    offset += direction
    if (Math.abs(offset) > 10_000) throw new Error(`Gantt drag offset exceeded safety limit: ${from} → ${to}`)
  }
  return offset
}

export function deriveGanttDragPreview(
  task: Pick<ProjectTask, 'start' | 'finish'>,
  kind: GanttDragKind,
  anchorDate: ISODate,
  rawPointerDate: ISODate,
  previousPointerDate: ISODate,
): GanttDragPreview {
  const pointerDate = snapGanttDateToWeekday(rawPointerDate, previousPointerDate)

  if (kind === 'start') {
    const start = compareISODate(pointerDate, task.finish) > 0 ? task.finish : pointerDate
    return {
      edit: { kind: 'start', start },
      start,
      finish: task.finish,
      pointerDate: start,
    }
  }

  if (kind === 'finish') {
    const finish = compareISODate(pointerDate, task.start) < 0 ? task.start : pointerDate
    return {
      edit: { kind: 'finish', finish },
      start: task.start,
      finish,
      pointerDate: finish,
    }
  }

  const offset = workingDayOffsetBetween(anchorDate, pointerDate)
  const start = addWorkingDays(task.start, offset)
  const finish = addWorkingDays(task.finish, offset)
  return {
    edit: { kind: 'shift', start, finish },
    start,
    finish,
    pointerDate,
  }
}
