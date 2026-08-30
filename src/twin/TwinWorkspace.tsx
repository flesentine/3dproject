import { useMemo } from 'react'
import { maxISODate, minISODate, parseISODate } from '../domain/dates'
import type { ProjectModel, ScenarioTaskChange, ScheduleAnalysis } from '../domain/project'
import { getWorkPackage } from '../hierarchy/hierarchy'
import type { AnalysisMode } from '../state/useProjectStore'
import { buildGanttScale, buildTwinRows, ganttBarGeometry, ganttMarkerPercent } from './model'

export type TwinView = 'table' | 'gantt'

interface TwinWorkspaceProps {
  view: TwinView
  project: ProjectModel
  committedProject: ProjectModel
  analysis: ScheduleAnalysis
  analysisMode: AnalysisMode
  focusedWorkstreamId: string | null
  focusedWorkPackageId: string | null
  selectedTaskId: string | null
  driverTaskIds: string[]
  scenarioChanges?: ScenarioTaskChange[]
  onSelectTask: (taskId: string) => void
  onFocusTask: (taskId: string) => void
}

function shortDate(value: string) {
  return parseISODate(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatProgress(progress: number) {
  return `${Math.round(progress * 100)}%`
}

function rowClass(
  taskId: string,
  selectedTaskId: string | null,
  isCritical: boolean,
  isDriver: boolean,
  isScenarioChanged: boolean,
) {
  return [
    'twin-row',
    selectedTaskId === taskId ? 'selected' : '',
    isCritical ? 'critical' : '',
    isDriver ? 'driver' : '',
    isScenarioChanged ? 'scenario-changed' : '',
  ].filter(Boolean).join(' ')
}

function scopeLabel(project: ProjectModel, workstreamId: string | null, workPackageId: string | null) {
  if (workPackageId) return getWorkPackage(project, workPackageId)?.name ?? 'Work package'
  if (workstreamId) return project.workstreams.find((workstream) => workstream.id === workstreamId)?.name ?? 'Workstream'
  return 'Whole project'
}

export function TwinWorkspace({
  view,
  project,
  committedProject,
  analysis,
  analysisMode,
  focusedWorkstreamId,
  focusedWorkPackageId,
  selectedTaskId,
  driverTaskIds,
  scenarioChanges = [],
  onSelectTask,
  onFocusTask,
}: TwinWorkspaceProps) {
  const scenarioChangedIds = useMemo(
    () => scenarioChanges.map((change) => change.taskId),
    [scenarioChanges],
  )
  const rows = useMemo(
    () => buildTwinRows(project, analysis, {
      analysisMode,
      focusedWorkstreamId,
      focusedWorkPackageId,
      driverTaskIds,
      scenarioChangedTaskIds: scenarioChangedIds,
    }),
    [analysis, analysisMode, driverTaskIds, focusedWorkPackageId, focusedWorkstreamId, project, scenarioChangedIds],
  )
  const workstreamById = useMemo(
    () => new Map(project.workstreams.map((workstream) => [workstream.id, workstream])),
    [project.workstreams],
  )
  const committedById = useMemo(
    () => new Map(committedProject.tasks.map((task) => [task.id, task])),
    [committedProject.tasks],
  )

  const scope = scopeLabel(project, focusedWorkstreamId, focusedWorkPackageId)

  if (view === 'table') {
    return (
      <section className="twin-workspace table-view" aria-label="2D project task table">
        <header className="twin-header">
          <div>
            <p className="panel-label">2D twin · table</p>
            <h2>{scope}</h2>
          </div>
          <div className="twin-summary">
            <span>{rows.length} visible</span>
            <span>{analysisMode === 'normal' ? 'hierarchy focus' : analysisMode}</span>
          </div>
        </header>

        <div className="table-scroll">
          <table className="project-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Workstream / package</th>
                <th>Start</th>
                <th>Finish</th>
                <th>Duration</th>
                <th>Progress</th>
                <th>Float</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const task = row.task
                const workstream = workstreamById.get(task.workstreamId)
                const workPackage = getWorkPackage(project, task.workPackageId)
                const committed = committedById.get(task.id)
                const changed = committed && (committed.start !== task.start || committed.finish !== task.finish)

                return (
                  <tr
                    key={task.id}
                    className={rowClass(task.id, selectedTaskId, row.isCritical, row.isDriver, row.isScenarioChanged)}
                    onClick={() => onSelectTask(task.id)}
                    onDoubleClick={() => onFocusTask(task.id)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') onSelectTask(task.id)
                    }}
                  >
                    <td className="activity-cell">
                      <span className={task.kind === 'milestone' ? 'row-kind milestone' : 'row-kind'}>{task.kind === 'milestone' ? '◆' : '▰'}</span>
                      <div>
                        <strong>{task.name}</strong>
                        <small>
                          {row.isCritical && 'Critical'}
                          {row.isDriver && `${row.isCritical ? ' · ' : ''}Driver`}
                          {changed && `${row.isCritical || row.isDriver ? ' · ' : ''}Scenario moved`}
                        </small>
                      </div>
                    </td>
                    <td>
                      <strong className="hierarchy-cell">{workstream?.name ?? 'Unknown'}</strong>
                      <small>{workPackage?.name ?? 'No package'}</small>
                    </td>
                    <td>{task.start}</td>
                    <td className={changed ? 'scenario-date' : undefined}>
                      {task.finish}
                      {changed && committed && <small>was {committed.finish}</small>}
                    </td>
                    <td>{row.durationWorkdays ?? '—'}d</td>
                    <td>
                      <div className="table-progress">
                        <span style={{ width: `${Math.round(task.progress * 100)}%` }} />
                      </div>
                      <small>{formatProgress(task.progress)}</small>
                    </td>
                    <td className={row.isCritical ? 'critical-value' : undefined}>{row.totalFloatDays ?? '—'}d</td>
                    <td>{task.owner ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  const dateValues = [
    ...project.tasks.flatMap((task) => [task.start, task.finish]),
    ...committedProject.tasks.flatMap((task) => [task.start, task.finish]),
    project.statusDate,
  ]
  const scale = buildGanttScale(minISODate(dateValues), maxISODate(dateValues))
  const todayPercent = ganttMarkerPercent(scale, project.statusDate)

  return (
    <section className="twin-workspace gantt-view" aria-label="2D project Gantt chart">
      <header className="twin-header">
        <div>
          <p className="panel-label">2D twin · Gantt</p>
          <h2>{scope}</h2>
        </div>
        <div className="twin-summary">
          <span>{rows.length} visible</span>
          <span>{shortDate(scale.start)} → {shortDate(scale.finish)}</span>
        </div>
      </header>

      <div className="gantt-shell">
        <div className="gantt-name-header">Activity</div>
        <div className="gantt-time-header">
          {scale.ticks.map((tick) => (
            <span key={tick.date} style={{ left: `${tick.leftPercent}%` }}>{shortDate(tick.date)}</span>
          ))}
        </div>

        <div className="gantt-names">
          {rows.map((row) => {
            const task = row.task
            const workstream = workstreamById.get(task.workstreamId)
            const workPackage = getWorkPackage(project, task.workPackageId)
            return (
              <button
                key={task.id}
                type="button"
                className={rowClass(task.id, selectedTaskId, row.isCritical, row.isDriver, row.isScenarioChanged)}
                onClick={() => onSelectTask(task.id)}
                onDoubleClick={() => onFocusTask(task.id)}
              >
                <strong>{task.name}</strong>
                <small>{workstream?.name} · {workPackage?.name}</small>
              </button>
            )
          })}
        </div>

        <div className="gantt-timeline">
          <div className="gantt-grid" aria-hidden="true">
            {scale.ticks.map((tick) => (
              <span key={tick.date} style={{ left: `${tick.leftPercent}%` }} />
            ))}
          </div>
          {todayPercent !== null && (
            <div className="gantt-today" style={{ left: `${todayPercent}%` }} aria-label={`Today ${project.statusDate}`}>
              <span>Today</span>
            </div>
          )}

          {rows.map((row) => {
            const task = row.task
            const geometry = ganttBarGeometry(scale, task)
            const committed = committedById.get(task.id)
            const committedGeometry = committed ? ganttBarGeometry(scale, committed) : null
            const moved = committed && (committed.start !== task.start || committed.finish !== task.finish)
            const persistentBaseline = task.baselineStart && task.baselineFinish
              ? ganttBarGeometry(scale, { start: task.baselineStart, finish: task.baselineFinish, kind: task.kind })
              : null

            return (
              <button
                key={task.id}
                type="button"
                className={rowClass(task.id, selectedTaskId, row.isCritical, row.isDriver, row.isScenarioChanged)}
                onClick={() => onSelectTask(task.id)}
                onDoubleClick={() => onFocusTask(task.id)}
                aria-label={`${task.name}: ${task.start} to ${task.finish}`}
              >
                {persistentBaseline && (
                  <span
                    className="gantt-persistent-baseline"
                    style={{ left: `${persistentBaseline.leftPercent}%`, width: `${persistentBaseline.widthPercent}%` }}
                  />
                )}
                {moved && committedGeometry && (
                  <span
                    className="gantt-committed-ghost"
                    style={{ left: `${committedGeometry.leftPercent}%`, width: `${committedGeometry.widthPercent}%` }}
                  />
                )}
                <span
                  className={[
                    'gantt-bar',
                    geometry.milestone ? 'milestone' : '',
                    row.isCritical ? 'critical' : '',
                    row.isDriver ? 'driver' : '',
                    row.isScenarioChanged ? 'scenario' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ left: `${geometry.leftPercent}%`, width: `${geometry.widthPercent}%` }}
                >
                  {!geometry.milestone && <span className="gantt-progress" style={{ width: `${Math.round(task.progress * 100)}%` }} />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <footer className="gantt-legend">
        <span><i className="legend-bar" /> Current</span>
        <span><i className="legend-ghost" /> Committed / baseline</span>
        <span><i className="legend-critical" /> Critical</span>
        <span><i className="legend-scenario" /> Scenario moved</span>
      </footer>
    </section>
  )
}
