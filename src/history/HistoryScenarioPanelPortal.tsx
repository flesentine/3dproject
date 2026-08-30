import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { savedScenarioProjectedFinish } from './history'
import { useProjectStore } from '../state/useProjectStore'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  )
}

export function HistoryScenarioPanelPortal() {
  const scenario = useProjectStore((state) => state.scenario)
  const activeScenarioName = useProjectStore((state) => state.activeScenarioName)
  const savedScenarios = useProjectStore((state) => state.savedScenarios)
  const historyPast = useProjectStore((state) => state.historyPast)
  const historyFuture = useProjectStore((state) => state.historyFuture)
  const finishDrag = useProjectStore((state) => state.finishDrag)
  const directDrag = useProjectStore((state) => state.directDrag)
  const saveScenario = useProjectStore((state) => state.saveScenario)
  const loadSavedScenario = useProjectStore((state) => state.loadSavedScenario)
  const deleteSavedScenario = useProjectStore((state) => state.deleteSavedScenario)
  const undo = useProjectStore((state) => state.undo)
  const redo = useProjectStore((state) => state.redo)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [scenarioName, setScenarioName] = useState('')

  const dragging = Boolean(finishDrag || directDrag)
  const canUndo = historyPast.length > 0 && !scenario && !dragging
  const canRedo = historyFuture.length > 0 && !scenario && !dragging
  const undoLabel = historyPast.at(-1)?.label ?? 'Nothing to undo'
  const redoLabel = historyFuture.at(-1)?.label ?? 'Nothing to redo'

  const savedRows = useMemo(
    () => savedScenarios.map((saved) => ({
      saved,
      projectedFinish: savedScenarioProjectedFinish(saved),
    })),
    [savedScenarios],
  )

  useEffect(() => {
    const resolve = () => {
      setPortalTarget(document.querySelector<HTMLElement>('.context-panel'))
    }

    resolve()
    const observer = new MutationObserver(resolve)
    observer.observe(document.getElementById('root') ?? document.body, {
      childList: true,
      subtree: true,
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const eyebrow = document.querySelector<HTMLElement>('.project-title-block .eyebrow')
    if (!eyebrow) return
    const previous = eyebrow.textContent
    eyebrow.textContent = 'BUILD 9 · HISTORY & SCENARIO BRANCHES'
    return () => {
      eyebrow.textContent = previous
    }
  }, [portalTarget])

  useEffect(() => {
    if (!scenario) {
      setScenarioName('')
      return
    }
    setScenarioName(activeScenarioName ?? '')
  }, [activeScenarioName, scenario?.editKind, scenario?.requestedFinish, scenario?.requestedStart, scenario])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      if (!(event.metaKey || event.ctrlKey)) return

      const key = event.key.toLowerCase()
      if (key === 'z' && event.shiftKey) {
        if (!canRedo) return
        event.preventDefault()
        redo()
        return
      }

      if (key === 'z') {
        if (!canUndo) return
        event.preventDefault()
        undo()
        return
      }

      if (key === 'y') {
        if (!canRedo) return
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canRedo, canUndo, redo, undo])

  if (!portalTarget) return null

  return createPortal(
    <section className="history-scenario-panel" aria-label="History and saved scenario branches">
      <div className="history-panel-heading">
        <div>
          <span className="control-title">History & branches</span>
          <small>Explore without losing a useful plan.</small>
        </div>
        <span className="history-depth" title="Committed revisions in undo history">
          {historyPast.length} rev
        </span>
      </div>

      <div className="history-actions" aria-label="Committed project history">
        <button
          type="button"
          disabled={!canUndo}
          onClick={undo}
          title={canUndo ? `Undo: ${undoLabel}` : scenario ? 'Reset or Apply the active preview before Undo' : undoLabel}
        >
          <span>↶ Undo</span>
          <small>{canUndo ? undoLabel : '⌘Z'}</small>
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={redo}
          title={canRedo ? `Redo: ${redoLabel}` : scenario ? 'Reset or Apply the active preview before Redo' : redoLabel}
        >
          <span>↷ Redo</span>
          <small>{canRedo ? redoLabel : '⇧⌘Z'}</small>
        </button>
      </div>

      {scenario && !dragging && (
        <form
          className="save-scenario-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (!scenarioName.trim()) return
            saveScenario(scenarioName)
          }}
        >
          <div className="save-scenario-copy">
            <strong>{activeScenarioName ? `Branch · ${activeScenarioName}` : 'Unsaved scenario'}</strong>
            <span>{scenario.changes.length} changed · finish {scenario.analysis.dateRange.finish}</span>
          </div>
          <label htmlFor="scenario-branch-name">Scenario name</label>
          <div className="save-scenario-row">
            <input
              id="scenario-branch-name"
              type="text"
              value={scenarioName}
              maxLength={48}
              placeholder="e.g. Supplier slips 2 weeks"
              onChange={(event) => setScenarioName(event.target.value)}
            />
            <button type="submit" disabled={!scenarioName.trim()}>
              {savedScenarios.some((saved) => saved.name.toLowerCase() === scenarioName.trim().toLowerCase())
                ? 'Update'
                : 'Save'}
            </button>
          </div>
          <small>Saving stores the preview as a branch. It does not Apply it.</small>
        </form>
      )}

      <div className="saved-scenarios">
        <div className="saved-scenarios-heading">
          <span>Saved scenarios</span>
          <small>{savedScenarios.length}</small>
        </div>

        {savedRows.length === 0 ? (
          <p className="saved-scenarios-empty">Create a what-if preview, give it a name, and it will stay here while you explore other paths.</p>
        ) : (
          <div className="saved-scenario-list">
            {savedRows.map(({ saved, projectedFinish }) => {
              const active = activeScenarioName === saved.name && Boolean(scenario)
              return (
                <article key={saved.id} className={active ? 'saved-scenario active' : 'saved-scenario'}>
                  <div className="saved-scenario-summary">
                    <strong>{saved.name}</strong>
                    <span>{saved.editKind} · {saved.requestedStart} → {saved.requestedFinish}</span>
                    <small>Projected project finish · {projectedFinish}</small>
                  </div>
                  <div className="saved-scenario-actions">
                    <button
                      type="button"
                      className="preview-branch"
                      disabled={dragging}
                      onClick={() => loadSavedScenario(saved.id)}
                    >
                      {active ? 'Reload' : 'Preview'}
                    </button>
                    <button
                      type="button"
                      className="delete-branch"
                      disabled={dragging}
                      onClick={() => deleteSavedScenario(saved.id)}
                      aria-label={`Delete saved scenario ${saved.name}`}
                      title={`Delete ${saved.name}`}
                    >
                      ×
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <div className="history-rule">
        <strong>Build 9 rule</strong>
        <span>Preview and Save are reversible. Only Apply enters committed Undo/Redo history.</span>
      </div>
    </section>,
    portalTarget,
  )
}
