import { useMemo } from 'react'
import type { ProjectModel } from '../domain/project'
import { buildMiniMapModel } from './model'
import { useOrientationStore } from './useOrientationStore'

interface ProjectMiniMapProps {
  project: ProjectModel
  criticalTaskIds: string[]
  focusedWorkstreamId: string | null
  focusedWorkPackageId: string | null
  selectedTaskId: string | null
  disabled?: boolean
  onFocusWorkstream: (workstreamId: string) => void
  onFocusTask: (taskId: string) => void
  onToday: () => void
  onOverview: () => void
}

export function ProjectMiniMap({
  project,
  criticalTaskIds,
  focusedWorkstreamId,
  focusedWorkPackageId,
  selectedTaskId,
  disabled = false,
  onFocusWorkstream,
  onFocusTask,
  onToday,
  onOverview,
}: ProjectMiniMapProps) {
  const camera = useOrientationStore((state) => state.camera)
  const model = useMemo(
    () => buildMiniMapModel(project, {
      focusedWorkPackageId,
      selectedTaskId,
      criticalTaskIds,
      camera,
    }),
    [camera, criticalTaskIds, focusedWorkPackageId, project, selectedTaskId],
  )

  return (
    <aside className={disabled ? 'project-minimap disabled' : 'project-minimap'} aria-label="3D project mini-map">
      <div className="project-minimap-header">
        <div>
          <span>Project map</span>
          <small>past → future</small>
        </div>
        <button type="button" onClick={onOverview} disabled={disabled}>Overview</button>
      </div>

      <div className="project-minimap-map">
        <span className="project-minimap-time-label past">Past</span>
        <span className="project-minimap-time-label future">Future</span>

        {model.focusRegion && (
          <div
            className="project-minimap-package-focus"
            style={{
              left: `${model.focusRegion.xPercent}%`,
              top: `${model.focusRegion.yStartPercent}%`,
              height: `${Math.max(4, model.focusRegion.yEndPercent - model.focusRegion.yStartPercent)}%`,
            }}
            aria-hidden="true"
          />
        )}

        {model.lanes.map((lane) => {
          const focused = focusedWorkstreamId === lane.id
          return (
            <button
              type="button"
              key={lane.id}
              className={focused ? 'project-minimap-lane focused' : 'project-minimap-lane'}
              style={{ left: `${lane.xPercent}%` }}
              onClick={() => onFocusWorkstream(lane.id)}
              disabled={disabled}
              aria-label={`Focus ${lane.name}`}
              title={lane.name}
            >
              <span>{lane.shortLabel}</span>
            </button>
          )
        })}

        <button
          type="button"
          className="project-minimap-today"
          style={{ top: `${model.todayPercent}%` }}
          onClick={onToday}
          disabled={disabled}
          aria-label={`Return to Today, ${project.statusDate}`}
          title={`Today · ${project.statusDate}`}
        >
          <span>Today</span>
        </button>

        {model.milestones.map((milestone) => {
          const selected = selectedTaskId === milestone.taskId
          const className = [
            'project-minimap-milestone',
            milestone.critical ? 'critical' : '',
            selected ? 'selected' : '',
          ].filter(Boolean).join(' ')
          return (
            <button
              type="button"
              key={milestone.taskId}
              className={className}
              style={{ left: `${milestone.xPercent}%`, top: `${milestone.yPercent}%` }}
              onClick={() => onFocusTask(milestone.taskId)}
              disabled={disabled}
              aria-label={`Focus milestone ${milestone.name}`}
              title={milestone.name}
            />
          )
        })}

        {model.selectedTask && (
          <div
            className="project-minimap-selected-task"
            style={{ left: `${model.selectedTask.xPercent}%`, top: `${model.selectedTask.yPercent}%` }}
            aria-hidden="true"
          />
        )}

        {model.camera && (
          <>
            <div
              className="project-minimap-camera-footprint"
              style={{
                left: `${model.camera.xPercent}%`,
                top: `${model.camera.yPercent}%`,
                width: `${model.camera.radiusPercent * 2}%`,
                height: `${model.camera.radiusPercent * 2}%`,
              }}
              aria-hidden="true"
            />
            <div
              className="project-minimap-camera-target"
              style={{ left: `${model.camera.xPercent}%`, top: `${model.camera.yPercent}%` }}
              aria-hidden="true"
            />
            <div
              className="project-minimap-camera-position"
              style={{ left: `${model.camera.position.xPercent}%`, top: `${model.camera.position.yPercent}%` }}
              aria-hidden="true"
            />
          </>
        )}
      </div>

      <div className="project-minimap-legend" aria-hidden="true">
        <span><i className="camera-key" />camera</span>
        <span><i className="milestone-key" />milestone</span>
      </div>
    </aside>
  )
}
