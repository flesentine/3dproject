import {
  addCalendarDays,
  addWorkingDays,
  compareISODate,
  differenceInDays,
  isWorkingDay,
  parseISODate,
} from '../domain/dates'
import type { ISODate } from '../domain/project'
import { WORLD_SCALE } from './layout'

function snapToWorkingDay(candidate: ISODate, direction: 1 | -1): ISODate {
  let snapped = candidate
  while (!isWorkingDay(parseISODate(snapped))) {
    snapped = addCalendarDays(snapped, direction)
  }
  return snapped
}

function dateFromStartEdgeZ(statusDate: ISODate, currentStart: ISODate, worldZ: number): ISODate {
  const dayOffset = Math.round(worldZ / WORLD_SCALE.day)
  let candidate = addCalendarDays(statusDate, dayOffset)

  if (!isWorkingDay(parseISODate(candidate))) {
    const direction: 1 | -1 = compareISODate(candidate, currentStart) >= 0 ? 1 : -1
    candidate = snapToWorkingDay(candidate, direction)
  }

  return candidate
}

function workingDayDistance(from: ISODate, to: ISODate): number {
  const comparison = compareISODate(from, to)
  if (comparison === 0) return 0

  const direction = comparison < 0 ? 1 : -1
  let cursor = from
  let distance = 0

  while (cursor !== to) {
    cursor = addWorkingDays(cursor, direction)
    distance += direction
    if (Math.abs(distance) > 100_000) throw new Error(`Working-day distance exceeded safety limit: ${from} → ${to}`)
  }

  return distance
}

export function startEdgeZ(statusDate: ISODate, start: ISODate): number {
  return differenceInDays(statusDate, start) * WORLD_SCALE.day
}

export function startDateFromWorldZ(
  statusDate: ISODate,
  currentStart: ISODate,
  taskFinish: ISODate,
  worldZ: number,
): ISODate {
  let candidate = dateFromStartEdgeZ(statusDate, currentStart, worldZ)
  if (compareISODate(candidate, taskFinish) > 0) candidate = taskFinish
  return candidate
}

export interface ShiftedTaskDates {
  start: ISODate
  finish: ISODate
  shiftWorkdays: number
}

export function shiftTaskDatesFromWorldZ(
  statusDate: ISODate,
  originalStart: ISODate,
  originalFinish: ISODate,
  currentStart: ISODate,
  anchorWorldZ: number,
  worldZ: number,
): ShiftedTaskDates {
  const shiftedStartEdge = startEdgeZ(statusDate, originalStart) + (worldZ - anchorWorldZ)
  const start = dateFromStartEdgeZ(statusDate, currentStart, shiftedStartEdge)
  const shiftWorkdays = workingDayDistance(originalStart, start)

  return {
    start,
    finish: addWorkingDays(originalFinish, shiftWorkdays),
    shiftWorkdays,
  }
}
