import { describe, expect, it } from 'vitest'
import { WORLD_SCALE } from './layout'
import { shiftTaskDatesFromWorldZ, startDateFromWorldZ, startEdgeZ } from './directDrag'

describe('Build 8 direct-drag spatial mapping', () => {
  it('maps a task start edge to its world z coordinate', () => {
    expect(startEdgeZ('2026-08-29', '2026-08-31')).toBeCloseTo(2 * WORLD_SCALE.day)
  })

  it('maps world z back to the same start date', () => {
    const z = startEdgeZ('2026-08-29', '2026-08-31')
    expect(startDateFromWorldZ('2026-08-29', '2026-08-31', '2026-09-04', z)).toBe('2026-08-31')
  })

  it('snaps a later weekend start drag forward to Monday', () => {
    const saturdayZ = startEdgeZ('2026-08-29', '2026-09-12')
    expect(startDateFromWorldZ('2026-08-29', '2026-09-04', '2026-09-18', saturdayZ)).toBe('2026-09-14')
  })

  it('snaps an earlier weekend start drag backward to Friday', () => {
    const sundayZ = startEdgeZ('2026-08-29', '2026-09-06')
    expect(startDateFromWorldZ('2026-08-29', '2026-09-11', '2026-09-18', sundayZ)).toBe('2026-09-04')
  })

  it('never allows the start edge beyond the finish', () => {
    const tooLateZ = startEdgeZ('2026-08-29', '2026-10-01')
    expect(startDateFromWorldZ('2026-08-29', '2026-08-31', '2026-09-18', tooLateZ)).toBe('2026-09-18')
  })

  it('shifts the whole task by the same working-day amount', () => {
    const anchor = startEdgeZ('2026-08-29', '2026-08-31')
    const fiveCalendarDaysLater = anchor + 7 * WORLD_SCALE.day
    const result = shiftTaskDatesFromWorldZ(
      '2026-08-29',
      '2026-08-31',
      '2026-09-04',
      '2026-08-31',
      anchor,
      fiveCalendarDaysLater,
    )

    expect(result).toEqual({
      start: '2026-09-07',
      finish: '2026-09-11',
      shiftWorkdays: 5,
    })
  })

  it('preserves duration when shifting backward across a weekend', () => {
    const anchor = startEdgeZ('2026-08-29', '2026-09-07')
    const result = shiftTaskDatesFromWorldZ(
      '2026-08-29',
      '2026-09-07',
      '2026-09-11',
      '2026-09-07',
      anchor,
      anchor - 3 * WORLD_SCALE.day,
    )

    expect(result).toEqual({
      start: '2026-09-04',
      finish: '2026-09-10',
      shiftWorkdays: -1,
    })
  })
})
