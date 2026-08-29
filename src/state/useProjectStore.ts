import { create } from 'zustand'
import { auroraProject } from '../data/aurora'

interface ProjectState {
  selectedTaskId: string | null
  selectTask: (taskId: string | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  selectedTaskId: null,
  selectTask: (selectedTaskId) => set({ selectedTaskId }),
}))

export const projectModel = auroraProject
