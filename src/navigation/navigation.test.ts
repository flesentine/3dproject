import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import { buildWorldLayout } from '../visualization/layout'
import { getNavigationFrame, searchProject } from './navigation'

describe('project navigation', () => {
  it('finds tasks by name and prioritizes strong matches', () => {
    const results = searchProject(auroraProject, 'sensor firmware')
    expect(results[0]?.kind).toBe('task')
    expect(results[0]?.label).toContain('Sensor Firmware')
  })

  it('finds workstreams directly', () => {
    const results = searchProject(auroraProject, 'validation')
    expect(results.some((result) => result.kind === 'workstream' && result.label === 'Validation')).toBe(true)
  })

  it('frames Today at the stable time origin', () => {
    const layout = buildWorldLayout(auroraProject)
    const frame = getNavigationFrame(auroraProject, layout, { kind: 'today' })
    expect(frame.target[2]).toBeCloseTo(0)
  })

  it('centers a workstream frame on that lane', () => {
    const layout = buildWorldLayout(auroraProject)
    const workstream = auroraProject.workstreams[0]
    const lane = layout.lanes.find((candidate) => candidate.workstream.id === workstream.id)
    const frame = getNavigationFrame(auroraProject, layout, { kind: 'workstream', targetId: workstream.id })
    expect(frame.target[0]).toBeCloseTo(lane?.x ?? 0)
  })

  it('frames a task around its actual visual position', () => {
    const layout = buildWorldLayout(auroraProject)
    const task = auroraProject.tasks.find((candidate) => candidate.kind === 'task')
    expect(task).toBeTruthy()
    const visual = layout.tasks.find((candidate) => candidate.task.id === task?.id)
    const frame = getNavigationFrame(auroraProject, layout, { kind: 'task', targetId: task?.id })
    expect(frame.target[0]).toBeCloseTo(visual?.position[0] ?? 0)
    expect(frame.target[2]).toBeCloseTo(visual?.position[2] ?? 0)
  })
})
