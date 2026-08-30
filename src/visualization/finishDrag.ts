import {
  addCalendarDays,
  compareISODate,
  differenceInDays,
  isWorkingDay,
  parseISODate,
} from '../domain/dates'
import type { ISODate } from '../domain/project'
import { WORLD_SCALE } from './layout'

export function finishEdgeZ(statusDate: ISODate, finish: ISODate): number {
  return (differenceInDays(statusDate, finish) + 1) * WORLD_SCALE.day
}

function snapToWorkingDay(candidate: ISODate, direction: 1 | -1): ISODate {
  let snapped = candidate

  while (!isWorkingDay(parseISODate(snapped))) {
    snapped = addCalendarDays(snapped, direction)
  }

  return snapped
}

export function finishDateFromWorldZ(
  statusDate: ISODate,
  taskStart: ISODate,
  currentFinish: ISODate,
  worldZ: number,
): ISODate {
  const finishDayOffset = Math.round(worldZ / WORLD_SCALE.day) - 1
  let candidate = addCalendarDays(statusDate, finishDayOffset)

  if (compareISODate(candidate, taskStart) < 0) {
    candidate = taskStart
  }

  if (!isWorkingDay(parseISODate(candidate))) {
    const direction: 1 | -1 = compareISODate(candidate, currentFinish) >= 0 ? 1 : -1
    candidate = snapToWorkingDay(candidate, direction)
  }

  if (compareISODate(candidate, taskStart) < 0) {
    candidate = snapToWorkingDay(taskStart, 1)
  }

  return candidate
}
