import type { ISODate } from './project'

const DAY_MS = 86_400_000

export function parseISODate(value: ISODate): Date {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    throw new Error(`Invalid ISO date: ${value}`)
  }

  return new Date(Date.UTC(year, month - 1, day))
}

export function formatISODate(value: Date): ISODate {
  return value.toISOString().slice(0, 10)
}

export function differenceInDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / DAY_MS)
}

export function compareISODate(left: ISODate, right: ISODate): number {
  return parseISODate(left).getTime() - parseISODate(right).getTime()
}

export function minISODate(values: ISODate[]): ISODate {
  if (values.length === 0) {
    throw new Error('Cannot calculate a minimum date from an empty list')
  }

  return [...values].sort(compareISODate)[0]
}

export function maxISODate(values: ISODate[]): ISODate {
  if (values.length === 0) {
    throw new Error('Cannot calculate a maximum date from an empty list')
  }

  return [...values].sort(compareISODate).at(-1) as ISODate
}

export function addCalendarDays(value: ISODate, days: number): ISODate {
  if (!Number.isInteger(days)) {
    throw new Error(`Calendar-day offset must be an integer: ${days}`)
  }

  const cursor = parseISODate(value)
  cursor.setUTCDate(cursor.getUTCDate() + days)
  return formatISODate(cursor)
}

export function isWorkingDay(value: Date): boolean {
  const day = value.getUTCDay()
  return day !== 0 && day !== 6
}

export function addWorkingDays(value: ISODate, workingDays: number): ISODate {
  if (!Number.isInteger(workingDays)) {
    throw new Error(`Working-day offset must be an integer: ${workingDays}`)
  }

  const cursor = parseISODate(value)
  if (workingDays === 0) return formatISODate(cursor)

  const direction = workingDays > 0 ? 1 : -1
  let remaining = Math.abs(workingDays)

  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + direction)
    if (isWorkingDay(cursor)) remaining -= 1
  }

  return formatISODate(cursor)
}

export function workingDaysInclusive(from: ISODate, to: ISODate): number {
  if (compareISODate(to, from) < 0) return 0

  const cursor = parseISODate(from)
  const finish = parseISODate(to)
  let total = 0

  while (cursor.getTime() <= finish.getTime()) {
    if (isWorkingDay(cursor)) total += 1
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return total
}
