import { describe, expect, it } from 'vitest'
import { auroraProject } from '../data/aurora'
import {
  getHierarchyPath,
  getTasksForWorkPackage,
  getWorkPackageForTask,
  getWorkPackagesForWorkstream,
  taskBelongsToFocus,
} from './hierarchy'

describe('project hierarchy', () => {
  it('organizes each workstream into ordered work packages', () => {
    expect(getWorkPackagesForWorkstream(auroraProject, 'embedded').map((item) => item.id)).toEqual([
      'embedded-platform',
      'embedded-release',
    ])
  })

  it('resolves a task through project, workstream, and work package', () => {
    const path = getHierarchyPath(auroraProject, 'sensor-firmware')
    expect(path.project.name).toBe('Project AURORA')
    expect(path.workstream?.name).toBe('Embedded Software')
    expect(path.workPackage?.name).toBe('Sensor & Release')
    expect(path.task?.name).toBe('Sensor firmware integration')
  })

  it('keeps work-package membership separate from the schedule dependency graph', () => {
    const tasks = getTasksForWorkPackage(auroraProject, 'validation-qualification')
    expect(tasks.map((task) => task.id)).toEqual([
      'system-integration',
      'system-validation',
      'validation-complete',
    ])
    expect(tasks.every((task) => getWorkPackageForTask(auroraProject, task)?.id === 'validation-qualification')).toBe(true)
  })

  it('applies semantic focus from broadest to narrowest level', () => {
    const firmware = auroraProject.tasks.find((task) => task.id === 'sensor-firmware')!
    const boot = auroraProject.tasks.find((task) => task.id === 'embedded-boot')!
    const cloud = auroraProject.tasks.find((task) => task.id === 'cloud-api')!

    expect(taskBelongsToFocus(firmware, null, null)).toBe(true)
    expect(taskBelongsToFocus(firmware, 'embedded', null)).toBe(true)
    expect(taskBelongsToFocus(cloud, 'embedded', null)).toBe(false)
    expect(taskBelongsToFocus(firmware, 'embedded', 'embedded-release')).toBe(true)
    expect(taskBelongsToFocus(boot, 'embedded', 'embedded-release')).toBe(false)
  })
})
