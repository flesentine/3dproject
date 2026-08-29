import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { scheduleEngine } from './engine/schedule'
import { ProjectWorld } from './scene/ProjectWorld'
import { projectModel, useProjectStore, type AnalysisMode } from './state/useProjectStore'

function formatProgress(progress: number) {
  return `${Math.round(progress * 100)}%`
}

function formatFloat(days: number | undefined) {
  if (days === undefined) return '—'
  if (days === 0) return '0 days · critical'
  return `${days} working day${days === 1 ? '' : 's'}`
}

const modes: { id: AnalysisMode; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'critical', label: 'Critical path' },
  { id: 'drivers', label: 'Drivers' },
]

export default function App() {
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const analysisMode = useProjectStore((state) => state.analysisMode)
  const selectTask = useProjectStore((state) => state.selectTask)
  const setAnalysisMode = useProjectStore((state) => state.setAnalysisMode)
  const analysis = useMemo(() => scheduleEngine.analyze(projectModel), [])
  const selectedTask = projectModel.tasks.find((task) => task.id === selectedTaskId) ?? null
  const selectedMetrics = selectedTask ? analysis.activityByTask.get(selectedTask.id) : undefined
  const upstream = selectedTask ? scheduleEngine.getUpstream(projectModel, selectedTask.id) : []
  const downstream = selectedTask ? scheduleEngine.getDownstream(projectModel, selectedTask.id) : []
  const drivers = useMemo(
    () => selectedTask
      ? scheduleEngine.getDrivers(projectModel, selectedTask.id)
      : { targetTaskId: '', taskIds: [], dependencyIds: [] },
    [selectedTask],
  )

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BUILD 1 · CRITICAL PATH</p>
          <h1>{projectModel.name}</h1>
        </div>
        <div className="project-stats" aria-label="Project model summary">
          <span>{projectModel.workstreams.length} workstreams</span>
          <span>{projectModel.tasks.length} activities</span>
          <span>{analysis.criticalTaskIds.length} critical</span>
          <span>{analysis.networkSpanWorkdays} workday network</span>
          <span className={analysis.validationIssues.length === 0 ? 'healthy' : 'warning'}>
            {analysis.validationIssues.length === 0 ? 'model valid' : `${analysis.validationIssues.length} model issues`}
          </span>
        </div>
      </header>

      <section className="workspace">
        <aside className="context-panel" aria-label="Project orientation and analysis controls">
          <p className="panel-label">Spatial schedule</p>
          <h2>Project horizon</h2>
          <p className="panel-copy">
            Time runs forward through stable workstream lanes. Analysis changes emphasis, never geography.
          </p>

          <div className="analysis-controls" aria-label="Schedule analysis mode">
            <span className="control-title">Analysis mode</span>
            <div className="mode-switch">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={analysisMode === mode.id ? 'mode-button active' : 'mode-button'}
                  aria-pressed={analysisMode === mode.id}
                  disabled={mode.id === 'drivers' && !selectedTask}
                  onClick={() => setAnalysisMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="mode-description">
              {analysisMode === 'critical' && 'Only the zero-float controlling network is emphasized.'}
              {analysisMode === 'drivers' && selectedTask && `Showing the chain that controls ${selectedTask.name}.`}
              {analysisMode === 'normal' && 'Select an activity to inspect its immediate schedule context.'}
            </p>
          </div>

          <dl className="compact-list">
            <div>
              <dt>Status date</dt>
              <dd>{projectModel.statusDate}</dd>
            </div>
            <div>
              <dt>Planned start</dt>
              <dd>{analysis.dateRange.start}</dd>
            </div>
            <div>
              <dt>Planned finish</dt>
              <dd>{analysis.dateRange.finish}</dd>
            </div>
            <div>
              <dt>CPM network span</dt>
              <dd>{analysis.networkSpanWorkdays} workdays</dd>
            </div>
          </dl>

          <div className="control-hint">
            <strong>Navigate</strong>
            <span>Drag to orbit</span>
            <span>Scroll to zoom</span>
            <span>Click a task to inspect</span>
          </div>
        </aside>

        <div className="viewport" aria-label="3D project schedule viewport">
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: false }}
            onPointerMissed={() => selectTask(null)}
          >
            <color attach="background" args={['#080d13']} />
            <fog attach="fog" args={['#080d13', 34, 78]} />
            <ProjectWorld project={projectModel} analysis={analysis} drivers={drivers} />
          </Canvas>
          <div className="viewport-mode" aria-live="polite">
            {analysisMode === 'critical' && <span className="critical-mode-chip">Critical path · {analysis.criticalTaskIds.length} activities</span>}
            {analysisMode === 'drivers' && selectedTask && <span className="driver-mode-chip">Drivers → {selectedTask.name}</span>}
          </div>
          <div className="viewport-caption">
            <span>Past</span>
            <span className="horizon-line" />
            <strong>Future →</strong>
          </div>
        </div>

        <aside className="inspector" aria-label="Selected activity inspector">
          {selectedTask ? (
            <>
              <div className="inspector-heading">
                <p className="panel-label">Selected activity</p>
                <button type="button" className="quiet-button" onClick={() => selectTask(null)} aria-label="Clear selected activity">
                  Clear
                </button>
              </div>
              <h2>{selectedTask.name}</h2>
              <div className="task-badges">
                <span className="task-kind">{selectedTask.kind}</span>
                {selectedMetrics?.isCritical && <span className="critical-badge">Critical</span>}
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Planned start</dt>
                  <dd>{selectedTask.start}</dd>
                </div>
                <div>
                  <dt>Planned finish</dt>
                  <dd>{selectedTask.finish}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{selectedMetrics ? `${selectedMetrics.durationWorkdays} workdays` : '—'}</dd>
                </div>
                <div>
                  <dt>Progress</dt>
                  <dd>{formatProgress(selectedTask.progress)}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{selectedTask.owner ?? 'Unassigned'}</dd>
                </div>
                <div className={selectedMetrics?.isCritical ? 'critical-row' : undefined}>
                  <dt>Total float</dt>
                  <dd>{formatFloat(selectedMetrics?.totalFloatDays)}</dd>
                </div>
                <div>
                  <dt>CPM early</dt>
                  <dd>{selectedMetrics ? `${selectedMetrics.earlyStart} → ${selectedMetrics.earlyFinish}` : '—'}</dd>
                </div>
                <div>
                  <dt>CPM late</dt>
                  <dd>{selectedMetrics ? `${selectedMetrics.lateStart} → ${selectedMetrics.lateFinish}` : '—'}</dd>
                </div>
                <div>
                  <dt>All upstream</dt>
                  <dd>{upstream.length}</dd>
                </div>
                <div>
                  <dt>All downstream</dt>
                  <dd>{downstream.length}</dd>
                </div>
                <div>
                  <dt>Driving chain</dt>
                  <dd>{Math.max(0, drivers.taskIds.length - 1)} predecessors</dd>
                </div>
              </dl>

              <button
                type="button"
                className={analysisMode === 'drivers' ? 'primary-action active' : 'primary-action'}
                onClick={() => setAnalysisMode(analysisMode === 'drivers' ? 'normal' : 'drivers')}
              >
                {analysisMode === 'drivers' ? 'Exit driver view' : 'Show what controls this'}
              </button>

              <div className="foundation-note">
                <strong>Build 1 schedule analysis</strong>
                <p>
                  CPM uses a Monday-Friday working calendar. Holidays, resource calendars, scenario propagation, and baseline ghosts remain intentionally deferred.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-inspector">
              <p className="panel-label">Inspector</p>
              <h2>Select something</h2>
              <p>Choose a task or milestone to see its dates, duration, total float, CPM windows, and controlling predecessor chain.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
