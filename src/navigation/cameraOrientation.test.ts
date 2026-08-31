import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import { buildWorldLayout } from '../visualization/layout'
import { getNavigationFrame } from './navigation'

describe('camera orientation safety', () => {
  const layout = buildWorldLayout(auroraProject)

  it('dives to a task from the label-facing future side', () => {
    const task = auroraProject.tasks.find((candidate) => candidate.kind === 'task')
    expect(task).toBeTruthy()
    const frame = getNavigationFrame(auroraProject, layout, { kind: 'task', targetId: task?.id })
    expect(frame.position[2]).toBeGreaterThan(frame.target[2])
    expect(frame.position[1]).toBeGreaterThan(frame.target[1])
  })

  it('dives to a workstream and package from the same readable side', () => {
    const workstream = auroraProject.workstreams[0]
    const workPackage = auroraProject.workPackages?.find((candidate) => candidate.workstreamId === workstream.id)
    expect(workPackage).toBeTruthy()

    const workstreamFrame = getNavigationFrame(auroraProject, layout, { kind: 'workstream', targetId: workstream.id })
    const packageFrame = getNavigationFrame(auroraProject, layout, { kind: 'workPackage', targetId: workPackage?.id })

    expect(workstreamFrame.position[2]).toBeGreaterThan(workstreamFrame.target[2])
    expect(packageFrame.position[2]).toBeGreaterThan(packageFrame.target[2])
  })

  it('uses the same front-side convention for Today and Overview recovery', () => {
    const today = getNavigationFrame(auroraProject, layout, { kind: 'today' })
    const overview = getNavigationFrame(auroraProject, layout, { kind: 'overview' })
    expect(today.position[2]).toBeGreaterThan(today.target[2])
    expect(overview.position[2]).toBeGreaterThan(overview.target[2])
  })
})
