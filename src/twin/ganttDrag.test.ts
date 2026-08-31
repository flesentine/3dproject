import { describe, expect, it } from 'vitest'
import { workingDaysInclusive } from '../domain/dates'
import { deriveGanttDragPreview, ganttDateFromClientX, snapGanttDateToWeekday } from './ganttDrag'
import { buildGanttScale } from './model'

describe('Gantt direct manipulation', () => {
  it('maps pointer x into the visible calendar scale and clamps at both ends', () => {
    const scale = buildGanttScale('2026-08-31', '2026-09-11')
    expect(ganttDateFromClientX(scale, 100, 1000, 100)).toBe('2026-08-31')
    expect(ganttDateFromClientX(scale, 100, 1000, 1100)).toBe('2026-09-11')
    expect(ganttDateFromClientX(scale, 100, 1000, -500)).toBe('2026-08-31')
  })

  it('snaps a weekend in the current drag direction', () => {
    expect(snapGanttDateToWeekday('2026-09-05', '2026-09-04')).toBe('2026-09-07')
    expect(snapGanttDateToWeekday('2026-09-06', '2026-09-07')).toBe('2026-09-04')
  })

  it('clamps the start handle at the committed finish', () => {
    const preview = deriveGanttDragPreview(
      { start: '2026-08-31', finish: '2026-09-04' },
      'start',
      '2026-08-31',
      '2026-09-10',
      '2026-09-09',
    )
    expect(preview.start).toBe('2026-09-04')
    expect(preview.finish).toBe('2026-09-04')
  })

  it('clamps the finish handle at the committed start', () => {
    const preview = deriveGanttDragPreview(
      { start: '2026-08-31', finish: '2026-09-04' },
      'finish',
      '2026-09-04',
      '2026-08-20',
      '2026-08-21',
    )
    expect(preview.start).toBe('2026-08-31')
    expect(preview.finish).toBe('2026-08-31')
  })

  it('moves a whole task by working days and preserves duration across weekends', () => {
    const original = { start: '2026-08-31', finish: '2026-09-04' }
    const preview = deriveGanttDragPreview(
      original,
      'shift',
      '2026-09-02',
      '2026-09-09',
      '2026-09-08',
    )
    expect(preview.start).toBe('2026-09-07')
    expect(preview.finish).toBe('2026-09-11')
    expect(workingDaysInclusive(preview.start, preview.finish)).toBe(
      workingDaysInclusive(original.start, original.finish),
    )
  })
})
