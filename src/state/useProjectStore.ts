import { create } from 'zustand'
import { auroraProject } from '../data/aurora'
import type { ISODate, ProjectModel, ScheduleScenario } from '../domain/project'
import { simulateFinishChange } from '../engine/scenario'

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
  analysisMode: AnalysisMode
  selectTask: (taskId: string | null) => void
  setAnalysisMode: (mode: AnalysisMode) => void
  previewFinishScenario: (taskId: string, finish: ISODate) => void
  beginFinishDrag: (taskId: string) => void
  updateFinishDrag: (taskId: string, finish: ISODate) => void
  endFinishDrag: () => void
  applyScenario: () => void
  resetScenario: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: auroraProject,
  scenario: null,
  scenarioError: null,
  finishDrag: null,
  selectedTaskId: null,
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
