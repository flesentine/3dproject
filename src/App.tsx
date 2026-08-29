import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { scheduleEngine } from './engine/schedule'
import { ProjectWorld } from './scene/ProjectWorld'
import { projectModel, useProjectStore } from './state/useProjectStore'

function formatProgress(progress: number) {
  return `${Math.round(progress * 100)}%`
}

export default function App() {
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const selectTask = useProjectStore((state) => state.selectTask)
  const analysis = useMemo(() => scheduleEngine.analyze(projectModel), [])
  const selectedTask = projectModel.tasks.find((task) => task.id === selectedTaskId) ?? null
  const upstream = selectedTask ? scheduleEngine.getUpstream(projectModel, selectedTask.id) : []
  const downstream = selectedTask ? scheduleEngine.getDownstream(projectModel, selectedTask.id) : []

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BUILD 0 · FOUNDATION</p>
          <h1>{projectModel.name}</h1>
        </div>
        <div className="project-stats" aria-label="Project model summary">
          <span>{projectModel.workstreams.length} workstreams</span>
          <span>{projectModel.tasks.length} activities</span>
          <span>{projectModel.dependencies.length} dependencies</span>
          <span className={analysis.validationIssues.length === 0 ? 'healthy' : 'warning'}>
            {analysis.validationIssues.length === 0 ? 'model valid' : `${analysis.validationIssues.length} model issues`}
          </span>
        </div>
      </header>

      <section className="workspace">
        <aside className="context-panel" aria-label="Project orientation">
          <p className="panel-label">Spatial schedule</p>
          <h2>Project horizon</h2>
          <p className="panel-copy">
            Time runs away from the project start. Workstreams stay in fixed lanes. Click an activity to expose its immediate dependency connections.
          </p>

          <dl className="compact-list">
            <div>
              <dt>Status date</dt>
              <dd>{projectModel.statusDate}</dd>
            </div>
            <div>
              <dt>Schedule start</dt>
              <dd>{analysis.dateRange.start}</dd>
            </div>
            <div>
              <dt>Schedule finish</dt>
              <dd>{analysis.dateRange.finish}</dd>
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
            <ProjectWorld project={projectModel} />
          </Canvas>
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
              <p className="task-kind">{selectedTask.kind}</p>

              <dl className="detail-list">
                <div>
                  <dt>Start</dt>
                  <dd>{selectedTask.start}</dd>
                </div>
                <div>
                  <dt>Finish</dt>
                  <dd>{selectedTask.finish}</dd>
                </div>
                <div>
                  <dt>Progress</dt>
                  <dd>{formatProgress(selectedTask.progress)}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{selectedTask.owner ?? 'Unassigned'}</dd>
                </div>
                <div>
                  <dt>All upstream</dt>
                  <dd>{upstream.length}</dd>
                </div>
                <div>
                  <dt>All downstream</dt>
                  <dd>{downstream.length}</dd>
                </div>
              </dl>

              <div className="foundation-note">
                <strong>Build 0 boundary</strong>
                <p>Selection and graph traversal are live. CPM, float, scenario propagation, baseline ghosts, and semantic drill-down come next.</p>
              </div>
            </>
          ) : (
            <div className="empty-inspector">
              <p className="panel-label">Inspector</p>
              <h2>Select something</h2>
              <p>Choose a task or milestone in the schedule world to inspect its dates, progress, owner, and dependency reach.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
