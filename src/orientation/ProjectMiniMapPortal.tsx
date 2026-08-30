import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { scheduleEngine } from '../engine/schedule'
import { getNavigationFrame } from '../navigation/navigation'
import { useProjectStore } from '../state/useProjectStore'
import { buildWorldLayout } from '../visualization/layout'
import { ProjectMiniMap } from './ProjectMiniMap'
import { useOrientationStore } from './useOrientationStore'

function distanceBetween(
  left: [number, number, number],
  right: [number, number, number],
): number {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2])
}

export function ProjectMiniMapPortal() {
  const project = useProjectStore((state) => state.project)
  const scenario = useProjectStore((state) => state.scenario)
  const finishDrag = useProjectStore((state) => state.finishDrag)
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const focusedWorkstreamId = useProjectStore((state) => state.focusedWorkstreamId)
  const focusedWorkPackageId = useProjectStore((state) => state.focusedWorkPackageId)
  const navigationRequest = useProjectStore((state) => state.navigationRequest)
  const focusTask = useProjectStore((state) => state.focusTask)
  const focusWorkstream = useProjectStore((state) => state.focusWorkstream)
  const goToday = useProjectStore((state) => state.goToday)
  const goOverview = useProjectStore((state) => state.goOverview)
  const camera = useOrientationStore((state) => state.camera)
  const reportCamera = useOrientationStore((state) => state.reportCamera)
  const clearCamera = useOrientationStore((state) => state.clearCamera)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const displayProject = scenario?.project ?? project
  const analysis = useMemo(() => scheduleEngine.analyze(displayProject), [displayProject])

  useEffect(() => {
    const resolve = () => {
      const viewport = document.querySelector<HTMLElement>('.viewport')
      const nextCanvas = viewport?.querySelector<HTMLCanvasElement>('canvas') ?? null
      setPortalTarget(nextCanvas ? viewport : null)
      setCanvas(nextCanvas)
    }

    resolve()
    const observer = new MutationObserver(resolve)
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!portalTarget) return
    const layout = buildWorldLayout(displayProject)
    const frame = getNavigationFrame(displayProject, layout, navigationRequest)
    reportCamera({
      position: frame.position,
      target: frame.target,
      distance: distanceBetween(frame.position, frame.target),
    })
  }, [displayProject, navigationRequest, portalTarget, reportCamera])

  useEffect(() => {
    if (!canvas) return

    const onWheel = (event: WheelEvent) => {
      const current = useOrientationStore.getState().camera
      if (!current) return
      const factor = Math.exp(event.deltaY * 0.0011)
      reportCamera({
        ...current,
        distance: Math.min(95, Math.max(4, current.distance * factor)),
      })
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button === 2 || (event.button === 0 && event.shiftKey)) {
        clearCamera()
      }
    }

    canvas.addEventListener('wheel', onWheel, { passive: true })
    canvas.addEventListener('pointerdown', onPointerDown)
    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
    }
  }, [canvas, clearCamera, reportCamera])

  useEffect(() => () => clearCamera(), [clearCamera])

  if (!portalTarget) return null

  return createPortal(
    <ProjectMiniMap
      project={displayProject}
      criticalTaskIds={analysis.criticalTaskIds}
      focusedWorkstreamId={focusedWorkstreamId}
      focusedWorkPackageId={focusedWorkPackageId}
      selectedTaskId={selectedTaskId}
      disabled={Boolean(finishDrag)}
      onFocusWorkstream={focusWorkstream}
      onFocusTask={focusTask}
      onToday={goToday}
      onOverview={goOverview}
    />,
    portalTarget,
  )
}
