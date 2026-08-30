import { beforeEach, describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import { useProjectStore } from './useProjectStore'

function resetStore() {
  useProjectStore.setState({
    project: auroraProject,
    scenario: null,
    scenarioError: null,
    activeScenarioName: null,
    savedScenarios: [],
    savedScenarioSequence: 0,
    historyPast: [],
    historyFuture: [],
    historySequence: 0,
    finishDrag: null,
    directDrag: null,
    selectedTaskId: null,
    focusedWorkstreamId: null,
    focusedWorkPackageId: null,
    navigationRequest: { id: 0, kind: 'overview' },
    analysisMode: 'normal',
  })
}

function firmwareFinish() {
  return useProjectStore.getState().project.tasks.find((task) => task.id === 'sensor-firmware')?.finish
}

describe('project store history', () => {
  beforeEach(resetStore)

  it('creates an undo revision only when a preview is applied', () => {
    useProjectStore.getState().previewFinishScenario('sensor-firmware', '2026-09-18')
    expect(useProjectStore.getState().historyPast).toHaveLength(0)

    useProjectStore.getState().applyScenario()
    expect(firmwareFinish()).toBe('2026-09-18')
    expect(useProjectStore.getState().historyPast).toHaveLength(1)
    expect(useProjectStore.getState().historyFuture).toHaveLength(0)
  })

  it('undoes and redoes an applied schedule scenario', () => {
    useProjectStore.getState().previewFinishScenario('sensor-firmware', '2026-09-18')
    useProjectStore.getState().applyScenario()

    useProjectStore.getState().undo()
    expect(firmwareFinish()).toBe('2026-09-04')
    expect(useProjectStore.getState().historyPast).toHaveLength(0)
    expect(useProjectStore.getState().historyFuture).toHaveLength(1)

    useProjectStore.getState().redo()
    expect(firmwareFinish()).toBe('2026-09-18')
    expect(useProjectStore.getState().historyPast).toHaveLength(1)
    expect(useProjectStore.getState().historyFuture).toHaveLength(0)
  })

  it('clears redo when a different change is applied after undo', () => {
    useProjectStore.getState().previewFinishScenario('sensor-firmware', '2026-09-18')
    useProjectStore.getState().applyScenario()
    useProjectStore.getState().undo()
    expect(useProjectStore.getState().historyFuture).toHaveLength(1)

    useProjectStore.getState().previewFinishScenario('validation-plan', '2026-09-04')
    useProjectStore.getState().applyScenario()
    expect(useProjectStore.getState().historyFuture).toHaveLength(0)
  })

  it('keeps saved branches when committed history moves backward and forward', () => {
    useProjectStore.getState().previewFinishScenario('sensor-firmware', '2026-09-18')
    useProjectStore.getState().saveScenario('Late firmware')
    expect(useProjectStore.getState().savedScenarios).toHaveLength(1)

    useProjectStore.getState().applyScenario()
    useProjectStore.getState().undo()
    useProjectStore.getState().redo()

    expect(useProjectStore.getState().savedScenarios.map((scenario) => scenario.name)).toEqual(['Late firmware'])
  })

  it('loads a saved branch as a preview without creating committed history', () => {
    useProjectStore.getState().previewFinishScenario('sensor-firmware', '2026-09-18')
    useProjectStore.getState().saveScenario('Late firmware')
    const savedId = useProjectStore.getState().savedScenarios[0]?.id
    if (!savedId) throw new Error('expected saved scenario')

    useProjectStore.getState().resetScenario()
    useProjectStore.getState().loadSavedScenario(savedId)

    expect(useProjectStore.getState().activeScenarioName).toBe('Late firmware')
    expect(useProjectStore.getState().scenario?.project.tasks.find((task) => task.id === 'sensor-firmware')?.finish).toBe('2026-09-18')
    expect(useProjectStore.getState().historyPast).toHaveLength(0)
  })

  it('blocks undo while a scenario preview is active', () => {
    useProjectStore.getState().previewFinishScenario('sensor-firmware', '2026-09-18')
    useProjectStore.getState().applyScenario()
    useProjectStore.getState().previewFinishScenario('validation-plan', '2026-09-04')

    useProjectStore.getState().undo()
    expect(firmwareFinish()).toBe('2026-09-18')
    expect(useProjectStore.getState().scenario).not.toBeNull()
  })
})
