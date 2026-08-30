import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import { scheduleEngine } from '../engine/schedule'
import { buildGanttScale, buildTwinRows, ganttBarGeometry, ganttMarkerPercent } from './model'

const analysis = scheduleEngine.analyze(auroraProject)

describe('2D twin view model', () => {
  it('shows all tasks at project overview in normal mode', () => {
    const rows = buildTwinRows(auroraProject, analysis, {
      analysisMode: 'normal',
      focusedWorkstreamId: null,
      focusedWorkPackageId: null,
      driverTaskIds: [],
    })

    expect(rows).toHaveLength(auroraProject.tasks.length)
  })

  it('respects work-package semantic focus in normal mode', () => {
    const packageId = 'embedded-sensor-release'
    const rows = buildTwinRows(auroraProject, analysis, {
      analysisMode: 'normal',
      focusedWorkstreamId: 'embedded',
      focusedWorkPackageId: packageId,
      driverTaskIds: [],
    })

    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.task.workPackageId === packageId)).toBe(true)
  })

  it('critical mode cuts across hierarchy focus', () => {
    const rows = buildTwinRows(auroraProject, analysis, {
      analysisMode: 'critical',
      focusedWorkstreamId: 'cloud',
      focusedWorkPackageId: 'cloud-runtime',
      driverTaskIds: [],
    })

    expect(rows.map((row) => row.task.id)).toEqual(analysis.criticalTaskIds)
  })

  it('driver mode displays only the supplied controlling chain', () => {
    const drivers = scheduleEngine.getDrivers(auroraProject, 'commercial-launch')
    const rows = buildTwinRows(auroraProject, analysis, {
      analysisMode: 'drivers',
      focusedWorkstreamId: 'launch',
      focusedWorkPackageId: 'launch-commercial',
      driverTaskIds: drivers.taskIds,
    })

    expect(rows.map((row) => row.task.id)).toEqual(drivers.taskIds)
  })

  it('maps tasks and Today onto one deterministic Gantt scale', () => {
    const scale = buildGanttScale('2026-08-03', '2026-10-30')
    const bar = ganttBarGeometry(scale, {
      start: '2026-08-31',
      finish: '2026-09-04',
      kind: 'task',
    })
    const today = ganttMarkerPercent(scale, '2026-08-29')

    expect(scale.totalDays).toBe(89)
    expect(scale.ticks.length).toBeGreaterThan(10)
    expect(bar.leftPercent).toBeGreaterThan(30)
    expect(bar.widthPercent).toBeGreaterThan(4)
    expect(today).not.toBeNull()
  })
})
