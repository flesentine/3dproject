import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import { simulateFinishChange } from '../engine/scenario'
import { buildWorldLayout } from './layout'

describe('scenario spatial layout', () => {
  it('keeps Today at the spatial origin', () => {
    const layout = buildWorldLayout(auroraProject)

    expect(layout.todayZ).toBe(0)
    expect(layout.startZ).toBeLessThan(0)
    expect(layout.finishZ).toBeGreaterThan(0)
  })

  it('does not move unaffected work when a scenario extends the project earlier than the committed start', () => {
    const result = simulateFinishChange(auroraProject, 'hw-freeze', '2026-07-31')
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)

    const baseLayout = buildWorldLayout(auroraProject)
    const scenarioLayout = buildWorldLayout(result.scenario.project)
    const baseHardwareArchitecture = baseLayout.tasks.find((visual) => visual.task.id === 'hw-architecture')
    const scenarioHardwareArchitecture = scenarioLayout.tasks.find((visual) => visual.task.id === 'hw-architecture')

    expect(baseHardwareArchitecture?.position).toEqual(scenarioHardwareArchitecture?.position)
    expect(scenarioLayout.startZ).toBeLessThan(baseLayout.startZ)
    expect(scenarioLayout.todayZ).toBe(0)
  })
})
