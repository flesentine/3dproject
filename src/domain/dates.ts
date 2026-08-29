import type { ISODate } from './project'

const DAY_MS = 86_400_000

export function parseISODate(value: ISODate): Date {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    throw new Error(`Invalid ISO date: ${value}`)
  }

  return new Date(Date.UTC(year, month - 1, day))
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
