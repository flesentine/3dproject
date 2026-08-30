import { describe, expect, it } from 'vitest'
import { WORLD_SCALE } from './layout'
import { finishDateFromWorldZ, finishEdgeZ } from './finishDrag'

describe('finish-drag spatial mapping', () => {
  it('maps a task finish edge to its world z coordinate', () => {
    expect(finishEdgeZ('2026-08-29', '2026-09-04')).toBeCloseTo(7 * WORLD_SCALE.day)
  })

  it('maps world z back to the same finish date', () => {
    const z = finishEdgeZ('2026-08-29', '2026-09-04')
    expect(finishDateFromWorldZ('2026-08-29', '2026-08-31', '2026-09-04', z)).toBe('2026-09-04')
  })

  it('snaps a later weekend drag forward to Monday', () => {
    const saturdayZ = finishEdgeZ('2026-08-29', '2026-09-12')
    expect(finishDateFromWorldZ('2026-08-29', '2026-08-31', '2026-09-04', saturdayZ)).toBe('2026-09-14')
  })

  it('snaps an earlier weekend drag backward to Friday', () => {
    const sundayZ = finishEdgeZ('2026-08-29', '2026-09-06')
    expect(finishDateFromWorldZ('2026-08-29', '2026-08-31', '2026-09-11', sundayZ)).toBe('2026-09-04')
  })

  it('never allows a task finish before its start', () => {
    const tooEarlyZ = finishEdgeZ('2026-08-29', '2026-08-20')
    expect(finishDateFromWorldZ('2026-08-29', '2026-09-01', '2026-09-04', tooEarlyZ)).toBe('2026-09-01')
  })
})
