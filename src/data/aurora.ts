import type { Dependency, ProjectModel, ProjectTask, WorkPackage } from '../domain/project'

const workPackages: WorkPackage[] = [
  { id: 'hw-foundation', name: 'Architecture & Prototype', workstreamId: 'hardware', order: 0 },
  { id: 'hw-integration', name: 'Integration & Freeze', workstreamId: 'hardware', order: 1 },

  { id: 'embedded-platform', name: 'Platform & Drivers', workstreamId: 'embedded', order: 0 },
  { id: 'embedded-release', name: 'Sensor & Release', workstreamId: 'embedded', order: 1 },

  { id: 'cloud-services', name: 'Core Services', workstreamId: 'cloud', order: 0 },
  { id: 'cloud-release', name: 'Observability & Freeze', workstreamId: 'cloud', order: 1 },

  { id: 'mobile-core', name: 'Application Core', workstreamId: 'mobile', order: 0 },
  { id: 'mobile-field', name: 'Integration & Field Beta', workstreamId: 'mobile', order: 1 },

  { id: 'validation-prep', name: 'Validation Preparation', workstreamId: 'validation', order: 0 },
  { id: 'validation-qualification', name: 'System Qualification', workstreamId: 'validation', order: 1 },

  { id: 'launch-ops', name: 'Operations Enablement', workstreamId: 'launch', order: 0 },
  { id: 'launch-commercial', name: 'Commercial Readiness', workstreamId: 'launch', order: 1 },
]

const tasks: ProjectTask[] = [
  { id: 'hw-architecture', name: 'Hardware architecture', workstreamId: 'hardware', workPackageId: 'hw-foundation', kind: 'task', start: '2026-08-03', finish: '2026-08-14', progress: 1, owner: 'Maya Chen' },
  { id: 'sensor-prototype', name: 'Sensor prototype', workstreamId: 'hardware', workPackageId: 'hw-foundation', kind: 'task', start: '2026-08-17', finish: '2026-08-28', progress: 0.9, owner: 'Maya Chen' },
  { id: 'sensor-integration', name: 'Sensor integration', workstreamId: 'hardware', workPackageId: 'hw-integration', kind: 'task', start: '2026-08-31', finish: '2026-09-11', progress: 0.15, owner: 'Noah Park', baselineStart: '2026-08-24', baselineFinish: '2026-09-04' },
  { id: 'hw-freeze', name: 'Hardware freeze', workstreamId: 'hardware', workPackageId: 'hw-integration', kind: 'milestone', start: '2026-09-14', finish: '2026-09-14', progress: 0 },

  { id: 'embedded-boot', name: 'Boot platform', workstreamId: 'embedded', workPackageId: 'embedded-platform', kind: 'task', start: '2026-08-03', finish: '2026-08-14', progress: 1, owner: 'Iris Kim' },
  { id: 'embedded-drivers', name: 'Device drivers', workstreamId: 'embedded', workPackageId: 'embedded-platform', kind: 'task', start: '2026-08-17', finish: '2026-08-28', progress: 0.8, owner: 'Iris Kim' },
  { id: 'sensor-firmware', name: 'Sensor firmware integration', workstreamId: 'embedded', workPackageId: 'embedded-release', kind: 'task', start: '2026-08-31', finish: '2026-09-04', progress: 0.05, owner: 'Leo Grant' },
  { id: 'fw-integration', name: 'Firmware integration', workstreamId: 'embedded', workPackageId: 'embedded-release', kind: 'task', start: '2026-09-07', finish: '2026-09-18', progress: 0, owner: 'Leo Grant' },
  { id: 'fw-release', name: 'Firmware release candidate', workstreamId: 'embedded', workPackageId: 'embedded-release', kind: 'milestone', start: '2026-09-21', finish: '2026-09-21', progress: 0 },

  { id: 'cloud-core', name: 'Cloud platform core', workstreamId: 'cloud', workPackageId: 'cloud-services', kind: 'task', start: '2026-08-10', finish: '2026-08-28', progress: 0.75, owner: 'Priya Rao' },
  { id: 'cloud-api', name: 'Operations API', workstreamId: 'cloud', workPackageId: 'cloud-services', kind: 'task', start: '2026-08-31', finish: '2026-09-11', progress: 0.1, owner: 'Priya Rao' },
  { id: 'cloud-observability', name: 'Telemetry and observability', workstreamId: 'cloud', workPackageId: 'cloud-release', kind: 'task', start: '2026-09-07', finish: '2026-09-18', progress: 0, owner: 'Evan Bell' },
  { id: 'cloud-freeze', name: 'Cloud release freeze', workstreamId: 'cloud', workPackageId: 'cloud-release', kind: 'milestone', start: '2026-09-21', finish: '2026-09-21', progress: 0 },

  { id: 'mobile-shell', name: 'Mobile application shell', workstreamId: 'mobile', workPackageId: 'mobile-core', kind: 'task', start: '2026-08-17', finish: '2026-08-28', progress: 0.65, owner: 'Sofia Martinez' },
  { id: 'mobile-routing', name: 'Mission routing UI', workstreamId: 'mobile', workPackageId: 'mobile-core', kind: 'task', start: '2026-08-31', finish: '2026-09-11', progress: 0.1, owner: 'Sofia Martinez' },
  { id: 'mobile-integration', name: 'Cloud/mobile integration', workstreamId: 'mobile', workPackageId: 'mobile-field', kind: 'task', start: '2026-09-14', finish: '2026-09-25', progress: 0, owner: 'Sofia Martinez' },
  { id: 'mobile-beta', name: 'Field beta ready', workstreamId: 'mobile', workPackageId: 'mobile-field', kind: 'milestone', start: '2026-09-28', finish: '2026-09-28', progress: 0 },

  { id: 'validation-plan', name: 'System validation plan', workstreamId: 'validation', workPackageId: 'validation-prep', kind: 'task', start: '2026-08-17', finish: '2026-08-28', progress: 0.9, owner: 'Amir Patel' },
  { id: 'system-integration', name: 'System integration test', workstreamId: 'validation', workPackageId: 'validation-qualification', kind: 'task', start: '2026-09-21', finish: '2026-10-02', progress: 0, owner: 'Amir Patel', baselineStart: '2026-09-14', baselineFinish: '2026-09-25' },
  { id: 'system-validation', name: 'System validation', workstreamId: 'validation', workPackageId: 'validation-qualification', kind: 'task', start: '2026-10-05', finish: '2026-10-16', progress: 0, owner: 'Amir Patel' },
  { id: 'validation-complete', name: 'Engineering complete', workstreamId: 'validation', workPackageId: 'validation-qualification', kind: 'milestone', start: '2026-10-19', finish: '2026-10-19', progress: 0 },

  { id: 'launch-training', name: 'Operations training', workstreamId: 'launch', workPackageId: 'launch-ops', kind: 'task', start: '2026-09-21', finish: '2026-10-09', progress: 0, owner: 'Grace Liu' },
  { id: 'launch-readiness', name: 'Commercial readiness', workstreamId: 'launch', workPackageId: 'launch-commercial', kind: 'task', start: '2026-10-12', finish: '2026-10-23', progress: 0, owner: 'Grace Liu' },
  { id: 'commercial-launch', name: 'Commercial launch', workstreamId: 'launch', workPackageId: 'launch-commercial', kind: 'milestone', start: '2026-10-30', finish: '2026-10-30', progress: 0, baselineStart: '2026-10-23', baselineFinish: '2026-10-23' },
]

const edge = (id: string, fromTaskId: string, toTaskId: string): Dependency => ({
  id,
  fromTaskId,
  toTaskId,
  type: 'FS',
  lagDays: 0,
})

const dependencies: Dependency[] = [
  edge('d01', 'hw-architecture', 'sensor-prototype'),
  edge('d02', 'sensor-prototype', 'sensor-integration'),
  edge('d03', 'sensor-integration', 'hw-freeze'),
  edge('d04', 'embedded-boot', 'embedded-drivers'),
  edge('d05', 'embedded-drivers', 'sensor-firmware'),
  edge('d06', 'sensor-firmware', 'fw-integration'),
  edge('d07', 'sensor-integration', 'fw-integration'),
  edge('d08', 'fw-integration', 'fw-release'),
  edge('d09', 'cloud-core', 'cloud-api'),
  edge('d10', 'cloud-core', 'cloud-observability'),
  edge('d11', 'cloud-api', 'cloud-freeze'),
  edge('d12', 'cloud-observability', 'cloud-freeze'),
  edge('d13', 'mobile-shell', 'mobile-routing'),
  edge('d14', 'mobile-routing', 'mobile-integration'),
  edge('d15', 'cloud-api', 'mobile-integration'),
  edge('d16', 'mobile-integration', 'mobile-beta'),
  edge('d17', 'validation-plan', 'system-integration'),
  edge('d18', 'hw-freeze', 'system-integration'),
  edge('d19', 'fw-release', 'system-integration'),
  edge('d20', 'cloud-freeze', 'system-integration'),
  edge('d21', 'system-integration', 'system-validation'),
  edge('d22', 'mobile-beta', 'system-validation'),
  edge('d23', 'system-validation', 'validation-complete'),
  edge('d24', 'validation-complete', 'launch-readiness'),
  edge('d25', 'launch-training', 'launch-readiness'),
  edge('d26', 'launch-readiness', 'commercial-launch'),
]

export const auroraProject: ProjectModel = {
  id: 'aurora',
  name: 'Project AURORA',
  statusDate: '2026-08-29',
  workstreams: [
    { id: 'hardware', name: 'Hardware', order: 0 },
    { id: 'embedded', name: 'Embedded Software', order: 1 },
    { id: 'cloud', name: 'Cloud Platform', order: 2 },
    { id: 'mobile', name: 'Mobile Application', order: 3 },
    { id: 'validation', name: 'Validation', order: 4 },
    { id: 'launch', name: 'Launch', order: 5 },
  ],
  workPackages,
  tasks,
  dependencies,
}
