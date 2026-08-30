import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { addWorkingDays } from './domain/dates'
import { scheduleEngine } from './engine/schedule'
import { ProjectWorld } from './scene/ProjectWorld'
import { useProjectStore, type AnalysisMode } from './state/useProjectStore'

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
  const project = useProjectStore((state) => state.project)
  const scenario = useProjectStore((state) => state.scenario)
  const scenarioError = useProjectStore((state) => state.scenarioError)
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const analysisMode = useProjectStore((state) => state.analysisMode)
  const selectTask = useProjectStore((state) => state.selectTask)
  const setAnalysisMode = useProjectStore((state) => state.setAnalysisMode)
  const previewFinishScenario = useProjectStore((state) => state.previewFinishScenario)
  const applyScenario = useProjectStore((state) => state.applyScenario)
  const resetScenario = useProjectStore((state) => state.resetScenario)
  const [scenarioFinish, setScenarioFinish] = useState('')

  const displayProject = scenario?.project ?? project
  const baselineAnalysis = useMemo(() => scheduleEngine.analyze(project), [project])
  const analysis = scenario?.analysis ?? baselineAnalysis
  const selectedTask = displayProject.tasks.find((task) => task.id === selectedTaskId) ?? null
  const baseSelectedTask = project.tasks.find((task) => task.id === selectedTaskId) ?? null
  const selectedMetrics = selectedTask ? analysis.activityByTask.get(selectedTask.id) : undefined
  const upstream = selectedTask ? scheduleEngine.getUpstream(displayProject, selectedTask.id) : []
  const downstream = selectedTask ? scheduleEngine.getDownstream(displayProject, selectedTask.id) : []
  const selectedScenarioChange = scenario?.changes.find((change) => change.taskId === selectedTaskId)
  const scenarioSource = scenario
    ? project.tasks.find((task) => task.id === scenario.sourceTaskId) ?? null
    : null
  const drivers = useMemo(
    () => selectedTask
      ? scheduleEngine.getDrivers(displayProject, selectedTask.id)
      : { targetTaskId: '', taskIds: [], dependencyIds: [] },
    [displayProject, selectedTask],
  )

  useEffect(() => {
    if (!baseSelectedTask) {
      setScenarioFinish('')
      return
    }

    setScenarioFinish(
      scenario?.sourceTaskId === baseSelectedTask.id
        ? scenario.requestedFinish
        : baseSelectedTask.finish,
    )
  }, [baseSelectedTask, scenario?.requestedFinish, scenario?.sourceTaskId])

  const previewScenario = (finish: string) => {
    if (!baseSelectedTask || !finish) return
    setScenarioFinish(finish)
    previewFinishScenario(baseSelectedTask.id, finish)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BUILD 2 · SCENARIO PROPAGATION</p>
          <h1>{project.name}</h1>
        </div>
        <div className="project-stats" aria-label="Project model summary">
          <span>{project.workstreams.length} workstreams</span>
          <span>{project.tasks.length} activities</span>
          <span>{analysis.criticalTaskIds.length} critical</span>
          <span>{analysis.networkSpanWorkdays} workday network</span>
          {scenario && <span className="scenario-stat">scenario · {scenario.changes.length} changed</span>}
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
            Preview a finish-date change and watch only the additional dependency impact propagate through the existing plan.
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
              {analysisMode === 'critical' && 'Critical path is recalculated against the current scenario.'}
              {analysisMode === 'drivers' && selectedTask && `Showing the chain that controls ${selectedTask.name}.`}
              {analysisMode === 'normal' && 'Scenario movement is highlighted without rearranging workstream geography.'}
            </p>
          </div>

          {scenario && (
            <section className="scenario-summary" aria-label="Active scenario summary">
              <div className="scenario-summary-heading">
                <span className="scenario-dot" />
                <strong>Scenario active</strong>
              </div>
              <p>
                {scenarioSource?.name ?? 'Selected activity'} → {scenario.requestedFinish}
              </p>
              <dl className="scenario-impact-list">
                <div>
                  <dt>Affected</dt>
                  <dd>{scenario.changes.length} activities</dd>
                </div>
                <div>
                  <dt>Plan finish</dt>
                  <dd>{baselineAnalysis.dateRange.finish}</dd>
                </div>
                <div>
                  <dt>Scenario finish</dt>
                  <dd>{analysis.dateRange.finish}</dd>
                </div>
              </dl>
              <div className="scenario-actions">
                <button type="button" className="apply-button" onClick={applyScenario}>Apply</button>
                <button type="button" className="reset-button" onClick={resetScenario}>Reset</button>
              </div>
            </section>
          )}

          <dl className="compact-list">
            <div>
              <dt>Status date</dt>
              <dd>{project.statusDate}</dd>
            </div>
            <div>
              <dt>Plan start</dt>
              <dd>{baselineAnalysis.dateRange.start}</dd>
            </div>
            <div>
              <dt>Plan finish</dt>
              <dd>{baselineAnalysis.dateRange.finish}</dd>
            </div>
            <div>
              <dt>Visible finish</dt>
              <dd>{analysis.dateRange.finish}</dd>
            </div>
          </dl>

          <div className="control-hint">
            <strong>Scenario language</strong>
            <span>Amber = moved in preview</span>
            <span>Wireframe = committed position</span>
            <span>Dashed trail = schedule movement</span>
          </div>
        </aside>

        <div className="viewport" aria-label="3D project schedule viewport">
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: false }}
            onPointerMissed={() => selectTask(null)}
          >
            <color attach="background" args={['#080d13']} />
            <fog attach="fog" args={['#080d13', 34, 88]} />
            <ProjectWorld
              project={displayProject}
              analysis={analysis}
              drivers={drivers}
              baselineProject={scenario ? project : undefined}
              scenarioChanges={scenario?.changes}
            />
          </Canvas>
          <div className="viewport-mode" aria-live="polite">
            {scenario && <span className="scenario-mode-chip">Scenario · {scenario.changes.length} moved</span>}
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
          {selectedTask && baseSelectedTask ? (
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
                {selectedScenarioChange && <span className="scenario-badge">Scenario moved</span>}
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Committed</dt>
                  <dd>{baseSelectedTask.start} → {baseSelectedTask.finish}</dd>
                </div>
                {selectedScenarioChange && (
                  <div className="scenario-row">
                    <dt>Scenario</dt>
                    <dd>{selectedTask.start} → {selectedTask.finish}</dd>
                  </div>
                )}
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

              {baseSelectedTask.kind !== 'summary' && (
                <form
                  className="scenario-editor"
                  onSubmit={(event) => {
                    event.preventDefault()
                    previewScenario(scenarioFinish)
                  }}
                >
                  <div>
                    <p className="panel-label">What-if scenario</p>
                    <strong>Change finish date</strong>
                  </div>
                  <label htmlFor="scenario-finish">Preview finish</label>
                  <input
                    id="scenario-finish"
                    type="date"
                    value={scenarioFinish}
                    min={baseSelectedTask.kind === 'milestone' ? undefined : baseSelectedTask.start}
                    onChange={(event) => setScenarioFinish(event.target.value)}
                  />
                  <div className="quick-shifts" aria-label="Quick scenario shifts">
                    <button type="button" onClick={() => previewScenario(addWorkingDays(baseSelectedTask.finish, 5))}>+5 workdays</button>
                    <button type="button" onClick={() => previewScenario(addWorkingDays(baseSelectedTask.finish, 10))}>+10 workdays</button>
                  </div>
                  <button type="submit" className="primary-action">Preview impact</button>
                  {scenarioError && <p className="scenario-error" role="alert">{scenarioError}</p>}
                </form>
              )}

              <button
                type="button"
                className={analysisMode === 'drivers' ? 'secondary-action active' : 'secondary-action'}
                onClick={() => setAnalysisMode(analysisMode === 'drivers' ? 'normal' : 'drivers')}
              >
                {analysisMode === 'drivers' ? 'Exit driver view' : 'Show what controls this'}
              </button>

              <div className="foundation-note">
                <strong>Build 2 propagation rule</strong>
                <p>
                  Preview changes push successors only when the scenario exceeds existing schedule gap or adds delay beyond an already-existing relationship offset. Earlier finishes never pull the plan earlier.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-inspector">
              <p className="panel-label">Inspector</p>
              <h2>Select something</h2>
              <p>Choose a task or milestone, then preview a finish-date change to watch the schedule impact propagate through the 3D world.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
