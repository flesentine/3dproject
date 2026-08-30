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
  const finishDrag = useProjectStore((state) => state.finishDrag)
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
    <main className={finishDrag ? 'app-shell dragging-finish' : 'app-shell'}>
      <header className="topbar">
        <div>
          <p className="eyebrow">BUILD 3 · DIRECT MANIPULATION</p>
          <h1>{project.name}</h1>
        </div>
        <div className="project-stats" aria-label="Project model summary">
          <span>{project.workstreams.length} workstreams</span>
          <span>{project.tasks.length} activities</span>
          <span>{analysis.criticalTaskIds.length} critical</span>
          <span>{analysis.networkSpanWorkdays} workday network</span>
          {finishDrag && <span className="drag-stat">dragging → {finishDrag.finish}</span>}
          {scenario && <span className="scenario-stat">scenario · {scenario.changes.length} changed</span>}
          <span className={analysis.validationIssues.length === 0 ? 'healthy' : 'warning'}>
            {analysis.validationIssues.length === 0 ? 'model valid' : `${analysis.validationIssues.length} model issues`}
          </span>
        </div>
      </header>

      <section className="workspace">
        <aside className="context-panel" aria-label="Project orientation and analysis controls">
          <p className="panel-label">Spatial schedule</p>
          <h2>Grab the schedule</h2>
          <p className="panel-copy">
            Select a task, grab its finish handle, and drag through time. The same scenario engine continuously propagates only the additional downstream impact.
          </p>

          <div className="direct-manipulation-card">
            <span className="control-title">Direct edit</span>
            <strong>1. Select a task</strong>
            <span>2. Grab the gold finish handle</span>
            <span>3. Drag forward or backward</span>
            <span>4. Release → Apply or Reset</span>
          </div>

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
              {analysisMode === 'critical' && 'Critical path is recalculated against the current preview.'}
              {analysisMode === 'drivers' && selectedTask && `Showing the chain that controls ${selectedTask.name}.`}
              {analysisMode === 'normal' && 'Direct manipulation keeps geography fixed while dates and impacts change.'}
            </p>
          </div>

          {scenario && (
            <section className="scenario-summary" aria-label="Active scenario summary">
              <div className="scenario-summary-heading">
                <span className="scenario-dot" />
                <strong>{finishDrag ? 'Live drag preview' : 'Scenario active'}</strong>
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
                  <dt>Preview finish</dt>
                  <dd>{analysis.dateRange.finish}</dd>
                </div>
              </dl>
              <div className="scenario-actions">
                <button type="button" className="apply-button" onClick={applyScenario} disabled={Boolean(finishDrag)}>Apply</button>
                <button type="button" className="reset-button" onClick={resetScenario} disabled={Boolean(finishDrag)}>Reset</button>
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
            <span>Gold handle = editable finish</span>
            <span>Amber = moved in preview</span>
            <span>Wireframe = committed position</span>
            <span>Dashed trail = schedule movement</span>
          </div>
        </aside>

        <div className="viewport" aria-label="3D project schedule viewport">
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: false }}
            onPointerMissed={() => {
              if (!finishDrag) selectTask(null)
            }}
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
            {finishDrag && <span className="drag-mode-chip">Dragging finish → {finishDrag.finish}</span>}
            {!finishDrag && scenario && <span className="scenario-mode-chip">Scenario · {scenario.changes.length} moved</span>}
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
                <button type="button" className="quiet-button" onClick={() => selectTask(null)} aria-label="Clear selected activity" disabled={Boolean(finishDrag)}>
                  Clear
                </button>
              </div>
              <h2>{selectedTask.name}</h2>
              <div className="task-badges">
                <span className="task-kind">{selectedTask.kind}</span>
                {selectedMetrics?.isCritical && <span className="critical-badge">Critical</span>}
                {selectedScenarioChange && <span className="scenario-badge">Scenario moved</span>}
                {finishDrag?.taskId === selectedTask.id && <span className="drag-badge">Dragging</span>}
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Committed</dt>
                  <dd>{baseSelectedTask.start} → {baseSelectedTask.finish}</dd>
                </div>
                {selectedScenarioChange && (
                  <div className="scenario-row">
                    <dt>{finishDrag ? 'Live preview' : 'Scenario'}</dt>
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

              {baseSelectedTask.kind === 'task' && (
                <div className="drag-instruction">
                  <span className="drag-handle-swatch" />
                  <div>
                    <strong>Drag it in 3D</strong>
                    <p>Use the gold handle at the task’s finish edge. Dates snap to weekdays and downstream impact updates while you move.</p>
                  </div>
                </div>
              )}

              {baseSelectedTask.kind !== 'summary' && (
                <form
                  className="scenario-editor"
                  onSubmit={(event) => {
                    event.preventDefault()
                    previewScenario(scenarioFinish)
                  }}
                >
                  <div>
                    <p className="panel-label">Exact-date fallback</p>
                    <strong>Type a finish date</strong>
                  </div>
                  <label htmlFor="scenario-finish">Preview finish</label>
                  <input
                    id="scenario-finish"
                    type="date"
                    value={scenarioFinish}
                    min={baseSelectedTask.kind === 'milestone' ? undefined : baseSelectedTask.start}
                    disabled={Boolean(finishDrag)}
                    onChange={(event) => setScenarioFinish(event.target.value)}
                  />
                  <div className="quick-shifts" aria-label="Quick scenario shifts">
                    <button type="button" disabled={Boolean(finishDrag)} onClick={() => previewScenario(addWorkingDays(baseSelectedTask.finish, 5))}>+5 workdays</button>
                    <button type="button" disabled={Boolean(finishDrag)} onClick={() => previewScenario(addWorkingDays(baseSelectedTask.finish, 10))}>+10 workdays</button>
                  </div>
                  <button type="submit" className="primary-action" disabled={Boolean(finishDrag)}>Preview impact</button>
                  {scenarioError && <p className="scenario-error" role="alert">{scenarioError}</p>}
                </form>
              )}

              <button
                type="button"
                className={analysisMode === 'drivers' ? 'secondary-action active' : 'secondary-action'}
                disabled={Boolean(finishDrag)}
                onClick={() => setAnalysisMode(analysisMode === 'drivers' ? 'normal' : 'drivers')}
              >
                {analysisMode === 'drivers' ? 'Exit driver view' : 'Show what controls this'}
              </button>

              <div className="foundation-note">
                <strong>Build 3 direct manipulation</strong>
                <p>
                  Dragging edits only the selected task’s finish along the time axis. Release keeps a reversible scenario preview; Apply commits it in memory and Reset discards it.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-inspector">
              <p className="panel-label">Inspector</p>
              <h2>Select a task</h2>
              <p>Choose a normal task to reveal its finish handle, then drag the handle through time to preview schedule impact directly in the 3D world.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
