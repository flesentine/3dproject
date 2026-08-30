import { create } from 'zustand'
import type { CameraTelemetry } from './model'

interface OrientationState {
  camera: CameraTelemetry | null
  reportCamera: (camera: CameraTelemetry) => void
  clearCamera: () => void
}

function materiallyDifferent(left: CameraTelemetry | null, right: CameraTelemetry): boolean {
  if (!left) return true

  const targetDelta =
    Math.abs(left.target[0] - right.target[0]) +
    Math.abs(left.target[1] - right.target[1]) +
    Math.abs(left.target[2] - right.target[2])
  const positionDelta =
    Math.abs(left.position[0] - right.position[0]) +
    Math.abs(left.position[1] - right.position[1]) +
    Math.abs(left.position[2] - right.position[2])

  return targetDelta > 0.08 || positionDelta > 0.12 || Math.abs(left.distance - right.distance) > 0.15
}

export const useOrientationStore = create<OrientationState>((set) => ({
  camera: null,
  reportCamera: (camera) =>
    set((state) => (materiallyDifferent(state.camera, camera) ? { camera } : state)),
  clearCamera: () => set({ camera: null }),
}))
