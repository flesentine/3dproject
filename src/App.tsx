import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { addWorkingDays } from './domain/dates'
import { scheduleEngine } from './engine/schedule'
import {
  getWorkPackage,
  getWorkPackageForTask,
  getWorkPackagesForWorkstream,
} from './hierarchy/hierarchy'
import { searchProject, type ProjectSearchResult } from './navigation/navigation'
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
  const focusedWorkstreamId = useProjectStore((state) => state.focusedWorkstreamId)
  const focusedWorkPackageId = useProjectStore((state) => state.focusedWorkPackageId)
  const analysisMode = useProjectStore((state) => state.analysisMode)
  const selectTask = useProjectStore((state) => state.selectTask)
  const setAnalysisMode = useProjectStore((state) => state.setAnalysisMode)
  const focusTask = useProjectStore((state) => state.focusTask)
  const focusWorkstream = useProjectStore((state) => state.focusWorkstream)
  const focusWorkPackage = useProjectStore((state) => state.focusWorkPackage)
  const goToday = useProjectStore((state) => state.goToday)
  const goOverview = useProjectStore((state) => state.goOverview)
  const previewFinishScenario = useProjectStore((state) => state.previewFinishScenario)
  const applyScenario = useProjectStore((state) => state.applyScenario)
  const resetScenario = useProjectStore((state) => state.resetScenario)
  const [scenarioFinish, setScenarioFinish] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const displayProject = scenario?.project ?? project
  const baselineAnalysis = useMemo(() => scheduleEngine.analyze(project), [project])
  const analysis = scenario?.analysis ?? baselineAnalysis
  const selectedTask = displayProject.tasks.find((task) => task.id === selectedTaskId) ?? null
  const baseSelectedTask = project.tasks.find((task) => task.id === selectedTaskId) ?? null
  const selectedWorkstream = project.workstreams.find((workstream) => workstream.id === focusedWorkstreamId) ?? null
  const selectedWorkPackage = getWorkPackage(project, focusedWorkPackageId)
  const selectedTaskWorkPackage = getWorkPackageForTask(project, baseSelectedTask)
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
  const searchResults = useMemo(
    () => searchProject(displayProject, searchQuery),
    [displayProject, searchQuery],
  )

  const taskCountByWorkstream = useMemo(() => {
    const counts = new Map<string, number>()
    for (const task of displayProject.tasks) {
      counts.set(task.workstreamId, (counts.get(task.workstreamId) ?? 0) + 1)
    }
    return counts
  }, [displayProject.tasks])

  const taskCountByWorkPackage = useMemo(() => {
    const counts = new Map<string, number>()
    for (const task of displayProject.tasks) {
      if (!task.workPackageId) continue
      counts.set(task.workPackageId, (counts.get(task.workPackageId) ?? 0) + 1)
    }
    return counts
  }, [displayProject.tasks])

  const visibleWorkPackages = useMemo(
    () => selectedWorkstream ? getWorkPackagesForWorkstream(project, selectedWorkstream.id) : [],
    [project, selectedWorkstream],
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

  const chooseSearchResult = (result: ProjectSearchResult) => {
    if (result.kind === 'task') focusTask(result.id)
    else if (result.kind === 'workPackage') focusWorkPackage(result.id)
    else focusWorkstream(result.id)
    setSearchQuery('')
  }

  return (
    <main className={finishDrag ? 'app-shell dragging-finish' : 'app-shell'}>
      <header className="topbar navigation-topbar">
        <div className="project-title-block">
          <p className="eyebrow">BUILD 5 · HIERARCHICAL SEMANTIC ZOOM</p>
          <h1>{project.name}</h1>
        </div>

        <div className="navigation-center">
          <nav className="breadcrumbs" aria-label="Project location">
            <button type="button" onClick={goOverview} disabled={Boolean(finishDrag)}>{project.name}</button>
            {selectedWorkstream && (
              <>
                <span>/</span>
                <button type="button" onClick={() => focusWorkstream(selectedWorkstream.id)} disabled={Boolean(finishDrag)}>
                  {selectedWorkstream.name}
                </button>
              </>
            )}
            {selectedWorkPackage && (
              <>
                <span>/</span>
                <button type="button" onClick={() => focusWorkPackage(selectedWorkPackage.id)} disabled={Boolean(finishDrag)}>
                  {selectedWorkPackage.name}
                </button>
              </>
            )}
            {selectedTask && (
              <>
                <span>/</span>
                <button type="button" onClick={() => focusTask(selectedTask.id)} disabled={Boolean(finishDrag)}>
                  {selectedTask.name}
                </button>
              </>
            )}
          </nav>

          <div className="project-search" role="search">
            <input
              type="search"
              placeholder="Search packages, tasks, milestones, owners…"
              value={searchQuery}
              disabled={Boolean(finishDrag)}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setSearchQuery('')
                if (event.key === 'Enter' && searchResults[0]) chooseSearchResult(searchResults[0])
              }}
              aria-label="Search project"
            />
            {searchQuery.trim() && (
              <div className="search-results" role="listbox" aria-label="Project search results">
                {searchResults.length > 0 ? searchResults.map((result) => (
                  <button
                    type="button"
                    key={`${result.kind}-${result.id}`}
                    onClick={() => chooseSearchResult(result)}
                    role="option"
                  >
                    <span className="search-result-kind">{result.kind === 'workPackage' ? 'package' : result.kind}</span>
                    <span className="search-result-copy">
                      <strong>{result.label}</strong>
                      <small>{result.detail}</small>
                    </span>
                  </button>
                )) : (
                  <p className="search-empty">No project matches</p>
                )}
              </div>
            )}
          </div>

          <div className="navigation-actions">
            <button type="button" onClick={goOverview} disabled={Boolean(finishDrag)}>Overview</button>
            <button type="button" className="today-button" onClick={goToday} disabled={Boolean(finishDrag)}>Today</button>
          </div>
        </div>

        <div className="project-stats" aria-label="Project model summary">
          <span>{project.workstreams.length} workstreams</span>
          <span>{project.workPackages?.length ?? 0} packages</span>
          <span>{project.tasks.length} activities</span>
          <span>{analysis.criticalTaskIds.length} critical</span>
          {selectedWorkPackage
            ? <span className="focus-stat">package · {selectedWorkPackage.name}</span>
            : selectedWorkstream && <span className="focus-stat">workstream · {selectedWorkstream.name}</span>}
          {finishDrag && <span className="drag-stat">dragging → {finishDrag.finish}</span>}
          {scenario && <span className="scenario-stat">scenario · {scenario.changes.length} changed</span>}
        </div>
      </header>

      <section className="workspace">
        <aside className="context-panel" aria-label="Project orientation and analysis controls">
          <p className="panel-label">Hierarchy</p>
          <h2>{selectedWorkPackage?.name ?? selectedWorkstream?.name ?? 'Project map'}</h2>
          <p className="panel-copy">
            Dive Project → Workstream → Work Package → Task. Each level reveals more detail while every schedule object keeps the same physical location.
          </p>

          <div className="workstream-nav" aria-label="Workstream navigation">
            <div className="workstream-nav-heading">
              <span className="control-title">Workstreams</span>
              {selectedWorkstream && <button type="button" onClick={goOverview}>All</button>}
            </div>
            {project.workstreams.map((workstream) => (
              <button
                type="button"
                key={workstream.id}
                className={focusedWorkstreamId === workstream.id ? 'workstream-button active' : 'workstream-button'}
                onClick={() => focusWorkstream(workstream.id)}
                disabled={Boolean(finishDrag)}
              >
                <span>{workstream.name}</span>
                <small>{taskCountByWorkstream.get(workstream.id) ?? 0}</small>
              </button>
            ))}
          </div>

          {selectedWorkstream && (
            <div className="package-nav" aria-label={`${selectedWorkstream.name} work packages`}>
              <div className="workstream-nav-heading">
                <span className="control-title">Work packages</span>
                {selectedWorkPackage && (
                  <button type="button" onClick={() => focusWorkstream(selectedWorkstream.id)} disabled={Boolean(finishDrag)}>Up</button>
                )}
              </div>
              {visibleWorkPackages.map((workPackage) => (
                <button
                  type="button"
                  key={workPackage.id}
                  className={focusedWorkPackageId === workPackage.id ? 'package-button active' : 'package-button'}
                  onClick={() => focusWorkPackage(workPackage.id)}
                  disabled={Boolean(finishDrag)}
                >
                  <span>{workPackage.name}</span>
                  <small>{taskCountByWorkPackage.get(workPackage.id) ?? 0} activities</small>
                </button>
              ))}
            </div>
          )}

          <div className="navigation-hint-card">
            <span className="control-title">In the world</span>
            <strong>Double-click = dive in</strong>
            <span>Lane / label → workstream</span>
            <span>Package volume / label → work package</span>
            <span>Task → activity</span>
            <span>Breadcrumb → one level back out</span>
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
                  disabled={Boolean(finishDrag) || (mode.id === 'drivers' && !selectedTask)}
                  onClick={() => setAnalysisMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="mode-description">
              {analysisMode === 'critical' && 'Critical analysis temporarily cuts across hierarchy to reveal the controlling network.'}
              {analysisMode === 'drivers' && selectedTask && `Showing the chain that controls ${selectedTask.name}.`}
              {analysisMode === 'normal' && selectedWorkPackage && `Detail level: ${selectedWorkPackage.name}. Sibling packages are still present but quiet.`}
              {analysisMode === 'normal' && !selectedWorkPackage && selectedWorkstream && `Package boundaries are now visible inside ${selectedWorkstream.name}.`}
              {analysisMode === 'normal' && !selectedWorkstream && 'Overview shows stable workstream geography. Dive in to reveal package structure.'}
            </p>
          </div>

          {scenario && (
            <section className="scenario-summary" aria-label="Active scenario summary">
              <div className="scenario-summary-heading">
                <span className="scenario-dot" />
                <strong>{finishDrag ? 'Live drag preview' : 'Scenario active'}</strong>
              </div>
              <p>{scenarioSource?.name ?? 'Selected activity'} → {scenario.requestedFinish}</p>
              <dl className="scenario-impact-list">
                <div><dt>Affected</dt><dd>{scenario.changes.length} activities</dd></div>
                <div><dt>Plan finish</dt><dd>{baselineAnalysis.dateRange.finish}</dd></div>
                <div><dt>Preview finish</dt><dd>{analysis.dateRange.finish}</dd></div>
              </dl>
              <div className="scenario-actions">
                <button type="button" className="apply-button" onClick={applyScenario} disabled={Boolean(finishDrag)}>Apply</button>
                <button type="button" className="reset-button" onClick={resetScenario} disabled={Boolean(finishDrag)}>Reset</button>
              </div>
            </section>
          )}

          <dl className="compact-list">
            <div><dt>Status date</dt><dd>{project.statusDate}</dd></div>
            <div><dt>Plan start</dt><dd>{baselineAnalysis.dateRange.start}</dd></div>
            <div><dt>Plan finish</dt><dd>{baselineAnalysis.dateRange.finish}</dd></div>
            <div><dt>Visible finish</dt><dd>{analysis.dateRange.finish}</dd></div>
          </dl>
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
            {selectedWorkPackage
              ? <span className="package-mode-chip">Package · {selectedWorkPackage.name}</span>
              : selectedWorkstream && <span className="focus-mode-chip">Workstream · {selectedWorkstream.name}</span>}
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
                {selectedTaskWorkPackage && <span className="hierarchy-badge">{selectedTaskWorkPackage.name}</span>}
                {selectedMetrics?.isCritical && <span className="critical-badge">Critical</span>}
                {selectedScenarioChange && <span className="scenario-badge">Scenario moved</span>}
                {finishDrag?.taskId === selectedTask.id && <span className="drag-badge">Dragging</span>}
              </div>

              <button
                type="button"
                className="focus-camera-action"
                onClick={() => focusTask(selectedTask.id)}
                disabled={Boolean(finishDrag)}
              >
                Dive to this activity
              </button>

              <dl className="detail-list">
                <div><dt>Committed</dt><dd>{baseSelectedTask.start} → {baseSelectedTask.finish}</dd></div>
                {selectedScenarioChange && (
                  <div className="scenario-row">
                    <dt>{finishDrag ? 'Live preview' : 'Scenario'}</dt>
                    <dd>{selectedTask.start} → {selectedTask.finish}</dd>
                  </div>
                )}
                <div><dt>Duration</dt><dd>{selectedMetrics ? `${selectedMetrics.durationWorkdays} workdays` : '—'}</dd></div>
                <div><dt>Progress</dt><dd>{formatProgress(selectedTask.progress)}</dd></div>
                <div><dt>Owner</dt><dd>{selectedTask.owner ?? 'Unassigned'}</dd></div>
                <div className={selectedMetrics?.isCritical ? 'critical-row' : undefined}>
                  <dt>Total float</dt><dd>{formatFloat(selectedMetrics?.totalFloatDays)}</dd>
                </div>
                <div><dt>CPM early</dt><dd>{selectedMetrics ? `${selectedMetrics.earlyStart} → ${selectedMetrics.earlyFinish}` : '—'}</dd></div>
                <div><dt>CPM late</dt><dd>{selectedMetrics ? `${selectedMetrics.lateStart} → ${selectedMetrics.lateFinish}` : '—'}</dd></div>
                <div><dt>All upstream</dt><dd>{upstream.length}</dd></div>
                <div><dt>All downstream</dt><dd>{downstream.length}</dd></div>
                <div><dt>Driving chain</dt><dd>{Math.max(0, drivers.taskIds.length - 1)} predecessors</dd></div>
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
                <strong>Build 5 hierarchy rule</strong>
                <p>
                  Work packages are organizational metadata, not fake schedule activities. CPM and dependency math still operate only on real tasks and milestones.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-inspector">
              <p className="panel-label">Inspector</p>
              <h2>{selectedWorkPackage ? `${selectedWorkPackage.name} opened` : selectedWorkstream ? `${selectedWorkstream.name} opened` : 'Enter the project'}</h2>
              <p>
                {selectedWorkPackage
                  ? 'This package is the current detail boundary. Its tasks are emphasized and labeled; sibling packages remain visible as quiet context.'
                  : selectedWorkstream
                    ? 'Work-package volumes are now visible. Double-click one to dive another level, or select a task directly.'
                    : 'Choose a workstream, search for a package or task, or double-click the world to move down the hierarchy.'}
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
