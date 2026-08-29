import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import type { Dependency, ProjectModel, ProjectTask } from '../domain/project'
import { createScheduleEngine } from './schedule'

const engine = createScheduleEngine()

function task(id: string): ProjectTask {
  return {
    id,
    name: id,
    workstreamId: 'ws',
    kind: 'task',
    start: '2026-08-03',
    finish: '2026-08-07',
    progress: 0,
  }
}

function dependency(id: string, fromTaskId: string, toTaskId: string, type: Dependency['type'], lagDays = 0): Dependency {
  return { id, fromTaskId, toTaskId, type, lagDays }
}

function project(tasks: ProjectTask[], dependencies: Dependency[]): ProjectModel {
  return {
    id: 'test',
    name: 'Test Project',
    statusDate: '2026-08-03',
    workstreams: [{ id: 'ws', name: 'Workstream', order: 0 }],
    tasks,
    dependencies,
  }
}

describe('schedule engine CPM', () => {
  it('finds the AURORA critical path and total float', () => {
    const analysis = engine.analyze(auroraProject)

    expect(analysis.validationIssues).toEqual([])
    expect(analysis.networkSpanWorkdays).toBe(73)
    expect(analysis.criticalTaskIds).toEqual([
      'hw-architecture',
      'sensor-prototype',
      'sensor-integration',
      'fw-integration',
      'fw-release',
      'system-integration',
      'system-validation',
      'validation-complete',
      'launch-readiness',
      'commercial-launch',
    ])
    expect(analysis.activityByTask.get('sensor-firmware')?.totalFloatDays).toBe(5)
    expect(analysis.activityByTask.get('launch-training')?.totalFloatDays).toBe(47)
    expect(analysis.activityByTask.get('sensor-integration')?.isCritical).toBe(true)
  })

  it('traces the controlling chain into a selected milestone', () => {
    const drivers = engine.getDrivers(auroraProject, 'commercial-launch')

    expect(drivers.taskIds).toEqual([
      'hw-architecture',
      'sensor-prototype',
      'sensor-integration',
      'fw-integration',
      'fw-release',
      'system-integration',
      'system-validation',
      'validation-complete',
      'launch-readiness',
      'commercial-launch',
    ])
    expect(drivers.dependencyIds).toEqual([
      'd01',
      'd02',
      'd07',
      'd08',
      'd19',
      'd21',
      'd23',
      'd24',
      'd26',
    ])
  })

  it('supports FS, SS, FF, and SF relationships with working-day lag', () => {
    const model = project(
      [task('a'), task('fs'), task('ss'), task('ff'), task('sf')],
      [
        dependency('fs-edge', 'a', 'fs', 'FS', 1),
        dependency('ss-edge', 'a', 'ss', 'SS', 2),
        dependency('ff-edge', 'a', 'ff', 'FF', 2),
        dependency('sf-edge', 'a', 'sf', 'SF', 5),
      ],
    )

    const analysis = engine.analyze(model)

    expect(analysis.activityByTask.get('fs')?.earlyStartOffset).toBe(6)
    expect(analysis.activityByTask.get('ss')?.earlyStartOffset).toBe(2)
    expect(analysis.activityByTask.get('ff')?.earlyStartOffset).toBe(2)
    expect(analysis.activityByTask.get('sf')?.earlyStartOffset).toBe(1)
  })

  it('detects dependency cycles and disables CPM output', () => {
    const model = project(
      [task('a'), task('b')],
      [
        dependency('ab', 'a', 'b', 'FS'),
        dependency('ba', 'b', 'a', 'FS'),
      ],
    )

    const analysis = engine.analyze(model)

    expect(analysis.validationIssues.some((issue) => issue.code === 'DEPENDENCY_CYCLE')).toBe(true)
    expect(analysis.activityByTask.size).toBe(0)
    expect(analysis.criticalTaskIds).toEqual([])
  })
})
