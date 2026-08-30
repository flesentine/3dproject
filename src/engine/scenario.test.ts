import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import { simulateFinishChange, simulateTaskEdit } from './scenario'

function expectScenario(result: ReturnType<typeof simulateTaskEdit>) {
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.message)
  return result.scenario
}

describe('scenario propagation', () => {
  it('propagates an embedded firmware slip through the launch chain', () => {
    const scenario = expectScenario(
      simulateFinishChange(auroraProject, 'sensor-firmware', '2026-09-18'),
    )
    const task = (id: string) => scenario.project.tasks.find((item) => item.id === id)

    expect(scenario.editKind).toBe('finish')
    expect(task('sensor-firmware')).toMatchObject({
      start: '2026-08-31',
      finish: '2026-09-18',
    })
    expect(task('fw-integration')).toMatchObject({
      start: '2026-09-21',
      finish: '2026-10-02',
    })
    expect(task('fw-release')).toMatchObject({
      start: '2026-10-05',
      finish: '2026-10-05',
    })
    expect(task('system-integration')).toMatchObject({
      start: '2026-10-05',
      finish: '2026-10-16',
    })
    expect(task('system-validation')).toMatchObject({
      start: '2026-10-19',
      finish: '2026-10-30',
    })
    expect(task('validation-complete')).toMatchObject({
      start: '2026-11-02',
      finish: '2026-11-02',
    })
    expect(task('launch-readiness')).toMatchObject({
      start: '2026-10-26',
      finish: '2026-11-06',
    })
    expect(task('commercial-launch')).toMatchObject({
      start: '2026-11-09',
      finish: '2026-11-09',
    })

    expect(scenario.changes.map((change) => change.taskId)).toEqual([
      'sensor-firmware',
      'fw-integration',
      'fw-release',
      'system-integration',
      'system-validation',
      'validation-complete',
      'launch-readiness',
      'commercial-launch',
    ])
  })

  it('lets existing schedule gap absorb a delay before it reaches a successor', () => {
    const scenario = expectScenario(
      simulateFinishChange(auroraProject, 'validation-plan', '2026-09-04'),
    )
    const systemIntegration = scenario.project.tasks.find((task) => task.id === 'system-integration')

    expect(systemIntegration).toMatchObject({
      start: '2026-09-21',
      finish: '2026-10-02',
    })
    expect(scenario.changes.map((change) => change.taskId)).toEqual(['validation-plan'])
  })

  it('does not pull successors earlier when a predecessor finishes early', () => {
    const scenario = expectScenario(
      simulateFinishChange(auroraProject, 'sensor-firmware', '2026-09-03'),
    )
    const firmwareIntegration = scenario.project.tasks.find((task) => task.id === 'fw-integration')

    expect(firmwareIntegration).toMatchObject({
      start: '2026-09-07',
      finish: '2026-09-18',
    })
    expect(scenario.changes.map((change) => change.taskId)).toEqual(['sensor-firmware'])
  })

  it('supports dragging only the start edge while finish stays fixed', () => {
    const scenario = expectScenario(
      simulateTaskEdit(auroraProject, 'fw-integration', { kind: 'start', start: '2026-09-14' }),
    )
    const source = scenario.project.tasks.find((task) => task.id === 'fw-integration')

    expect(scenario.editKind).toBe('start')
    expect(scenario.requestedStart).toBe('2026-09-14')
    expect(scenario.requestedFinish).toBe('2026-09-18')
    expect(source).toMatchObject({ start: '2026-09-14', finish: '2026-09-18' })
  })

  it('shifts an entire task without changing its working-day duration', () => {
    const scenario = expectScenario(
      simulateTaskEdit(auroraProject, 'sensor-firmware', {
        kind: 'shift',
        start: '2026-09-07',
        finish: '2026-09-11',
      }),
    )
    const task = (id: string) => scenario.project.tasks.find((item) => item.id === id)

    expect(scenario.editKind).toBe('shift')
    expect(task('sensor-firmware')).toMatchObject({ start: '2026-09-07', finish: '2026-09-11' })
    expect(task('fw-integration')).toMatchObject({ start: '2026-09-14', finish: '2026-09-25' })
    expect(scenario.changes[0]).toMatchObject({
      taskId: 'sensor-firmware',
      startShiftWorkdays: 5,
      finishShiftWorkdays: 5,
      isSourceEdit: true,
    })
  })

  it('rejects a whole-task move that secretly changes duration', () => {
    const result = simulateTaskEdit(auroraProject, 'sensor-firmware', {
      kind: 'shift',
      start: '2026-09-07',
      finish: '2026-09-18',
    })

    expect(result).toEqual({
      ok: false,
      message: 'Whole-task movement must preserve the activity working-day duration.',
    })
  })

  it('does not pull successors earlier when a whole task shifts earlier', () => {
    const scenario = expectScenario(
      simulateTaskEdit(auroraProject, 'sensor-firmware', {
        kind: 'shift',
        start: '2026-08-24',
        finish: '2026-08-28',
      }),
    )
    const firmwareIntegration = scenario.project.tasks.find((task) => task.id === 'fw-integration')

    expect(firmwareIntegration).toMatchObject({ start: '2026-09-07', finish: '2026-09-18' })
    expect(scenario.changes.map((change) => change.taskId)).toEqual(['sensor-firmware'])
  })

  it('rejects weekend finish dates', () => {
    const result = simulateFinishChange(auroraProject, 'sensor-firmware', '2026-09-19')

    expect(result).toEqual({
      ok: false,
      message: 'Choose a valid weekday finish date.',
    })
  })

  it('rejects a start edge dragged past the finish', () => {
    const result = simulateTaskEdit(auroraProject, 'sensor-firmware', {
      kind: 'start',
      start: '2026-09-07',
    })

    expect(result).toEqual({
      ok: false,
      message: 'Start cannot be later than the activity finish.',
    })
  })
})
