import { create } from 'zustand'
import { auroraProject } from '../data/aurora'
import type { ISODate, ProjectModel, ScheduleScenario } from '../domain/project'
import { simulateFinishChange } from '../engine/scenario'

export type AnalysisMode = 'normal' | 'critical' | 'drivers'

interface ProjectState {
  project: ProjectModel
  scenario: ScheduleScenario | null
  scenarioError: string | null
  selectedTaskId: string | null
  analysisMode: AnalysisMode
  selectTask: (taskId: string | null) => void
  setAnalysisMode: (mode: AnalysisMode) => void
  previewFinishScenario: (taskId: string, finish: ISODate) => void
  applyScenario: () => void
  resetScenario: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: auroraProject,
  scenario: null,
  scenarioError: null,
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
        ? { scenario: result.scenario, scenarioError: null }
        : { scenario: null, scenarioError: result.message }
    }),
  applyScenario: () =>
    set((state) => state.scenario
      ? {
          project: state.scenario.project,
          scenario: null,
          scenarioError: null,
        }
      : state),
  resetScenario: () => set({ scenario: null, scenarioError: null }),
}))
