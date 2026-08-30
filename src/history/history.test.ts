import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import { simulateFinishChange, simulateTaskEdit } from '../engine/scenario'
import {
  previewSavedScenario,
  recordProjectRevision,
  redoProjectRevision,
  saveScenarioSnapshot,
  savedScenarioProjectedFinish,
  undoProjectRevision,
} from './history'

function scenarioFromFinish(taskId: string, finish: string) {
  const result = simulateFinishChange(auroraProject, taskId, finish)
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.message)
  return result.scenario
}

describe('project revision history', () => {
  it('records the previous committed project and restores it with undo', () => {
    const scenario = scenarioFromFinish('sensor-firmware', '2026-09-18')
    const past = recordProjectRevision([], auroraProject, 'Apply launch slip', 1)

    const undone = undoProjectRevision(scenario.project, past, [])
    expect(undone).not.toBeNull()
    expect(undone?.project.tasks.find((task) => task.id === 'sensor-firmware')?.finish).toBe('2026-09-04')
    expect(undone?.future).toHaveLength(1)
    expect(undone?.actionLabel).toBe('Apply launch slip')
  })

  it('redos the exact project that was undone', () => {
    const scenario = scenarioFromFinish('sensor-firmware', '2026-09-18')
    const past = recordProjectRevision([], auroraProject, 'Apply launch slip', 1)
    const undone = undoProjectRevision(scenario.project, past, [])
    if (!undone) throw new Error('expected undo transition')

    const redone = redoProjectRevision(undone.project, undone.past, undone.future)
    expect(redone).not.toBeNull()
    expect(redone?.project.tasks.find((task) => task.id === 'sensor-firmware')?.finish).toBe('2026-09-18')
    expect(redone?.past).toHaveLength(1)
    expect(redone?.future).toHaveLength(0)
  })

  it('caps committed history without affecting the current project', () => {
    let past = [] as ReturnType<typeof recordProjectRevision>
    for (let index = 1; index <= 55; index += 1) {
      past = recordProjectRevision(past, auroraProject, `Revision ${index}`, index, 50)
    }

    expect(past).toHaveLength(50)
    expect(past[0]?.label).toBe('Revision 6')
    expect(past.at(-1)?.label).toBe('Revision 55')
  })
})

describe('saved scenario branches', () => {
  it('saves a named scenario and replaces the snapshot when the same name is reused', () => {
    const first = scenarioFromFinish('sensor-firmware', '2026-09-18')
    const secondResult = simulateTaskEdit(auroraProject, 'sensor-firmware', {
      kind: 'shift',
      start: '2026-09-07',
      finish: '2026-09-11',
    })
    expect(secondResult.ok).toBe(true)
    if (!secondResult.ok) throw new Error(secondResult.message)

    const savedOnce = saveScenarioSnapshot([], first, 'Launch recovery', 'scenario-1')
    const savedTwice = saveScenarioSnapshot(savedOnce, secondResult.scenario, ' launch recovery ', 'scenario-2')

    expect(savedTwice).toHaveLength(1)
    expect(savedTwice[0]?.id).toBe('scenario-1')
    expect(savedTwice[0]?.editKind).toBe('shift')
    expect(savedTwice[0]?.requestedStart).toBe('2026-09-07')
  })

  it('rebuilds comparison changes against the current committed project when a saved branch is revisited', () => {
    const savedScenario = scenarioFromFinish('sensor-firmware', '2026-09-18')
    const [saved] = saveScenarioSnapshot([], savedScenario, 'Late firmware', 'scenario-1')
    if (!saved) throw new Error('expected saved scenario')

    const otherResult = simulateFinishChange(auroraProject, 'validation-plan', '2026-09-04')
    expect(otherResult.ok).toBe(true)
    if (!otherResult.ok) throw new Error(otherResult.message)

    const preview = previewSavedScenario(otherResult.scenario.project, saved)
    const sourceChange = preview.changes.find((change) => change.taskId === 'sensor-firmware')
    const validationPlanChange = preview.changes.find((change) => change.taskId === 'validation-plan')

    expect(sourceChange?.scenarioFinish).toBe('2026-09-18')
    expect(validationPlanChange?.scenarioFinish).toBe('2026-08-28')
    expect(preview.analysis.dateRange.finish).toBe(savedScenario.analysis.dateRange.finish)
  })

  it('reports the projected finish of a saved branch', () => {
    const scenario = scenarioFromFinish('sensor-firmware', '2026-09-18')
    const [saved] = saveScenarioSnapshot([], scenario, 'Late firmware', 'scenario-1')
    if (!saved) throw new Error('expected saved scenario')

    expect(savedScenarioProjectedFinish(saved)).toBe(scenario.analysis.dateRange.finish)
  })
})
