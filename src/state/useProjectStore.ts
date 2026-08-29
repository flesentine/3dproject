import { create } from 'zustand'
import { auroraProject } from '../data/aurora'

export type AnalysisMode = 'normal' | 'critical' | 'drivers'

interface ProjectState {
  selectedTaskId: string | null
  analysisMode: AnalysisMode
  selectTask: (taskId: string | null) => void
  setAnalysisMode: (mode: AnalysisMode) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
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
}))

export const projectModel = auroraProject
