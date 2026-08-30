import { create } from 'zustand'
import { auroraProject } from '../data/aurora'
import type { ISODate, ProjectModel, ScheduleScenario } from '../domain/project'
import { simulateFinishChange } from '../engine/scenario'
import { getWorkPackage } from '../hierarchy/hierarchy'
import type { NavigationKind, NavigationRequest } from '../navigation/navigation'

export type AnalysisMode = 'normal' | 'critical' | 'drivers'

export interface FinishDragState {
  taskId: string
  originalFinish: ISODate
  finish: ISODate
}

interface ProjectState {
  project: ProjectModel
  scenario: ScheduleScenario | null
  scenarioError: string | null
  finishDrag: FinishDragState | null
  selectedTaskId: string | null
  focusedWorkstreamId: string | null
  focusedWorkPackageId: string | null
  navigationRequest: NavigationRequest
  analysisMode: AnalysisMode
  selectTask: (taskId: string | null) => void
  setAnalysisMode: (mode: AnalysisMode) => void
  focusTask: (taskId: string) => void
  focusWorkstream: (workstreamId: string) => void
  focusWorkPackage: (workPackageId: string) => void
  goToday: () => void
  goOverview: () => void
  previewFinishScenario: (taskId: string, finish: ISODate) => void
  beginFinishDrag: (taskId: string) => void
  updateFinishDrag: (taskId: string, finish: ISODate) => void
  endFinishDrag: () => void
  applyScenario: () => void
  resetScenario: () => void
}

function nextNavigation(
  state: Pick<ProjectState, 'navigationRequest'>,
  kind: NavigationKind,
  targetId?: string,
): NavigationRequest {
  return {
    id: state.navigationRequest.id + 1,
    kind,
    targetId,
  }
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: auroraProject,
  scenario: null,
  scenarioError: null,
  finishDrag: null,
  selectedTaskId: null,
  focusedWorkstreamId: null,
  focusedWorkPackageId: null,
  navigationRequest: { id: 0, kind: 'overview' },
  analysisMode: 'normal',
  selectTask: (selectedTaskId) =>
    set((state) => ({
      selectedTaskId,
      analysisMode: selectedTaskId === null && state.analysisMode === 'drivers' ? 'normal' : state.analysisMode,
    })),
  setAnalysisMode: (analysisMode) =>
    set((state) => ({
      analysisMode: analysisMode === 'drivers' && !state.selectedTaskId ? 'normal' : analysisMode,
    })),
  focusTask: (taskId) =>
    set((state) => {
      const task = (state.scenario?.project ?? state.project).tasks.find((candidate) => candidate.id === taskId)
      if (!task) return state
      return {
        selectedTaskId: taskId,
        focusedWorkstreamId: task.workstreamId,
        focusedWorkPackageId: task.workPackageId ?? null,
        navigationRequest: nextNavigation(state, 'task', taskId),
      }
    }),
  focusWorkstream: (workstreamId) =>
    set((state) => {
      if (!state.project.workstreams.some((workstream) => workstream.id === workstreamId)) return state
      return {
        focusedWorkstreamId: workstreamId,
        focusedWorkPackageId: null,
        selectedTaskId: null,
        analysisMode: state.analysisMode === 'drivers' ? 'normal' : state.analysisMode,
        navigationRequest: nextNavigation(state, 'workstream', workstreamId),
      }
    }),
  focusWorkPackage: (workPackageId) =>
    set((state) => {
      const workPackage = getWorkPackage(state.project, workPackageId)
      if (!workPackage) return state
      return {
        focusedWorkstreamId: workPackage.workstreamId,
        focusedWorkPackageId: workPackage.id,
        selectedTaskId: null,
        analysisMode: state.analysisMode === 'drivers' ? 'normal' : state.analysisMode,
        navigationRequest: nextNavigation(state, 'workPackage', workPackage.id),
      }
    }),
  goToday: () =>
    set((state) => ({
      focusedWorkstreamId: null,
      focusedWorkPackageId: null,
      selectedTaskId: null,
      analysisMode: state.analysisMode === 'drivers' ? 'normal' : state.analysisMode,
      navigationRequest: nextNavigation(state, 'today'),
    })),
  goOverview: () =>
    set((state) => ({
      focusedWorkstreamId: null,
      focusedWorkPackageId: null,
      selectedTaskId: null,
      analysisMode: state.analysisMode === 'drivers' ? 'normal' : state.analysisMode,
      navigationRequest: nextNavigation(state, 'overview'),
    })),
  previewFinishScenario: (taskId, finish) =>
    set((state) => {
      const result = simulateFinishChange(state.project, taskId, finish)
      return result.ok
        ? { scenario: result.scenario, scenarioError: null, finishDrag: null }
        : { scenarioError: result.message, finishDrag: null }
    }),
  beginFinishDrag: (taskId) =>
    set((state) => {
      const task = state.project.tasks.find((candidate) => candidate.id === taskId)
      if (!task || task.kind !== 'task') return state

      return {
        selectedTaskId: taskId,
        focusedWorkstreamId: task.workstreamId,
        focusedWorkPackageId: task.workPackageId ?? null,
        analysisMode: 'normal',
        scenarioError: null,
        finishDrag: {
          taskId,
          originalFinish: task.finish,
          finish: state.scenario?.sourceTaskId === taskId ? state.scenario.requestedFinish : task.finish,
        },
      }
    }),
  updateFinishDrag: (taskId, finish) =>
    set((state) => {
      if (!state.finishDrag || state.finishDrag.taskId !== taskId || state.finishDrag.finish === finish) {
        return state
      }

      const result = simulateFinishChange(state.project, taskId, finish)
      if (!result.ok) {
        return {
          scenarioError: result.message,
          finishDrag: { ...state.finishDrag, finish },
        }
      }

      return {
        scenario: result.scenario,
        scenarioError: null,
        finishDrag: { ...state.finishDrag, finish },
      }
    }),
  endFinishDrag: () => set({ finishDrag: null }),
  applyScenario: () =>
    set((state) => state.scenario
      ? {
          project: state.scenario.project,
          scenario: null,
          scenarioError: null,
          finishDrag: null,
        }
      : { finishDrag: null }),
  resetScenario: () => set({ scenario: null, scenarioError: null, finishDrag: null }),
}))
