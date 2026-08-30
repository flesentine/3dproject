import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import { scheduleEngine } from '../engine/schedule'
import { buildMiniMapModel } from './model'

const analysis = scheduleEngine.analyze(auroraProject)

describe('project minimap model', () => {
  it('preserves left-to-right workstream geography', () => {
    const model = buildMiniMapModel(auroraProject)

    expect(model.lanes).toHaveLength(auroraProject.workstreams.length)
    expect(model.lanes.map((lane) => lane.id)).toEqual([
      'hardware',
      'embedded',
      'cloud',
      'mobile',
      'validation',
      'launch',
    ])
    for (let index = 1; index < model.lanes.length; index += 1) {
      expect(model.lanes[index].xPercent).toBeGreaterThan(model.lanes[index - 1].xPercent)
    }
  })

  it('maps Today before future launch milestones', () => {
    const model = buildMiniMapModel(auroraProject, { criticalTaskIds: analysis.criticalTaskIds })
    const launch = model.milestones.find((milestone) => milestone.taskId === 'commercial-launch')

    expect(model.todayPercent).toBeGreaterThan(0)
    expect(model.todayPercent).toBeLessThan(100)
    expect(launch).toBeTruthy()
    expect(launch?.yPercent).toBeGreaterThan(model.todayPercent)
    expect(launch?.critical).toBe(true)
  })

  it('creates a bounded package focus region in its workstream lane', () => {
    const model = buildMiniMapModel(auroraProject, { focusedWorkPackageId: 'embedded-release' })
    const embeddedLane = model.lanes.find((lane) => lane.id === 'embedded')

    expect(model.focusRegion?.workPackageId).toBe('embedded-release')
    expect(model.focusRegion?.xPercent).toBeCloseTo(embeddedLane?.xPercent ?? 0)
    expect(model.focusRegion?.yEndPercent).toBeGreaterThan(model.focusRegion?.yStartPercent ?? 100)
  })

  it('maps selection and camera telemetry into the same stable coordinate system', () => {
    const model = buildMiniMapModel(auroraProject, {
      selectedTaskId: 'sensor-firmware',
      camera: {
        position: [18, 14, -11],
        target: [0, 0.8, 0],
        distance: 25,
      },
    })

    expect(model.selectedTask).toBeTruthy()
    expect(model.selectedTask?.xPercent).toBeGreaterThan(0)
    expect(model.camera).toBeTruthy()
    expect(model.camera?.yPercent).toBeCloseTo(model.todayPercent)
    expect(model.camera?.radiusPercent).toBeGreaterThanOrEqual(5)
    expect(model.camera?.radiusPercent).toBeLessThanOrEqual(27)
  })

  it('clamps a camera outside the project instead of letting the indicator escape the map', () => {
    const model = buildMiniMapModel(auroraProject, {
      camera: {
        position: [500, 100, 500],
        target: [-500, 0, -500],
        distance: 200,
      },
    })

    expect(model.camera?.xPercent).toBe(2)
    expect(model.camera?.yPercent).toBe(2)
    expect(model.camera?.position.xPercent).toBe(99)
    expect(model.camera?.position.yPercent).toBe(99)
    expect(model.camera?.radiusPercent).toBe(27)
  })
})
