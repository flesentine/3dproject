import { Line, Text } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { DoubleSide, Vector3 } from 'three'
import { useProjectStore } from '../state/useProjectStore'
import { shiftTaskDatesFromWorldZ, startDateFromWorldZ } from '../visualization/directDrag'
import { buildWorldLayout } from '../visualization/layout'

interface OrbitControlsLike {
  enabled: boolean
  target: Vector3
  minDistance: number
  maxDistance: number
  minPolarAngle: number
  maxPolarAngle: number
  zoomSpeed: number
  enableDamping: boolean
  dampingFactor: number
  update: () => void
}

const startColor = '#7fd8ff'
const moveColor = '#b7a4ff'
const MIN_CAMERA_DISTANCE = 5
const MAX_CAMERA_DISTANCE = 46

export function DirectManipulationLayer() {
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null
  const camera = useThree((state) => state.camera)
  const project = useProjectStore((state) => state.project)
  const scenario = useProjectStore((state) => state.scenario)
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const directDrag = useProjectStore((state) => state.directDrag)
  const finishDrag = useProjectStore((state) => state.finishDrag)
  const beginDirectDrag = useProjectStore((state) => state.beginDirectDrag)
  const updateDirectDrag = useProjectStore((state) => state.updateDirectDrag)
  const endDirectDrag = useProjectStore((state) => state.endDirectDrag)

  const displayProject = scenario?.project ?? project
  const layout = useMemo(() => buildWorldLayout(displayProject), [displayProject])
  const visual = layout.tasks.find((candidate) => candidate.task.id === selectedTaskId)
  const committedTask = project.tasks.find((candidate) => candidate.id === selectedTaskId)
  const dragging = Boolean(directDrag)

  useEffect(() => {
    if (!controls) return

    // Trackpads can emit a large stream of wheel deltas. OrbitControls' default
    // zoom speed is much too aggressive for this project scale, so keep zoom
    // deliberate and bounded even on inertial two-finger gestures.
    controls.zoomSpeed = 0.22
    controls.minDistance = MIN_CAMERA_DISTANCE
    controls.maxDistance = MAX_CAMERA_DISTANCE
    controls.minPolarAngle = 0.28
    controls.maxPolarAngle = Math.PI / 2.08
    controls.enableDamping = true
    controls.dampingFactor = 0.085
    controls.update()
  }, [controls])

  useEffect(() => {
    if (!dragging || !controls) return
    const previous = controls.enabled
    controls.enabled = false
    return () => {
      controls.enabled = previous
    }
  }, [controls, dragging])

  useFrame(() => {
    if (dragging && controls) controls.enabled = false
    if (!controls) return

    // Hard safety net: even if a browser/trackpad sends an unusually large
    // wheel burst, never allow the camera to disappear outside the useful
    // project-navigation envelope.
    const offset = camera.position.clone().sub(controls.target)
    const distance = offset.length()
    if (distance > MAX_CAMERA_DISTANCE) {
      offset.setLength(MAX_CAMERA_DISTANCE)
      camera.position.copy(controls.target).add(offset)
      controls.update()
    } else if (distance < MIN_CAMERA_DISTANCE) {
      offset.setLength(MIN_CAMERA_DISTANCE)
      camera.position.copy(controls.target).add(offset)
      controls.update()
    }
  })

  useEffect(() => {
    if (!dragging) return
    const previousCursor = document.body.style.cursor
    document.body.style.cursor = directDrag?.kind === 'shift' ? 'grabbing' : 'ns-resize'
    const finish = () => endDirectDrag()
    window.addEventListener('pointerup', finish)
    window.addEventListener('blur', finish)
    return () => {
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('blur', finish)
      document.body.style.cursor = previousCursor
    }
  }, [directDrag?.kind, dragging, endDirectDrag])

  if (!visual || !committedTask || committedTask.kind !== 'task' || finishDrag) return null

  const startZ = visual.position[2] - visual.size[2] / 2
  const worldCenterZ = (layout.startZ + layout.finishZ) / 2
  const worldDepth = Math.max(180, layout.finishZ - layout.startZ + 140)

  const updateFromPoint = (event: ThreeEvent<PointerEvent>) => {
    const drag = useProjectStore.getState().directDrag
    if (!drag || drag.taskId !== committedTask.id) return
    event.stopPropagation()

    if (drag.kind === 'start') {
      const start = startDateFromWorldZ(
        project.statusDate,
        drag.start,
        committedTask.finish,
        event.point.z,
      )
      updateDirectDrag(committedTask.id, start, committedTask.finish)
      return
    }

    const shifted = shiftTaskDatesFromWorldZ(
      project.statusDate,
      drag.originalStart,
      drag.originalFinish,
      drag.start,
      drag.anchorWorldZ,
      event.point.z,
    )
    updateDirectDrag(committedTask.id, shifted.start, shifted.finish)
  }

  return (
    <>
      {!directDrag && (
        <>
          <group position={[visual.position[0], 1.02, startZ - 0.12]}>
            <Line
              points={[[-visual.size[0] * 0.46, 0, 0], [visual.size[0] * 0.46, 0, 0]]}
              color={startColor}
              lineWidth={1.8}
              transparent
              opacity={0.78}
            />
            <mesh
              onPointerEnter={(event) => {
                event.stopPropagation()
                document.body.style.cursor = 'ns-resize'
              }}
              onPointerLeave={() => {
                document.body.style.cursor = ''
              }}
              onPointerDown={(event) => {
                event.stopPropagation()
                beginDirectDrag(committedTask.id, 'start', event.point.z)
              }}
            >
              <sphereGeometry args={[0.22, 16, 12]} />
              <meshStandardMaterial
                color={startColor}
                emissive={startColor}
                emissiveIntensity={0.32}
                roughness={0.42}
              />
            </mesh>
            <Text
              position={[0, 0.62, 0]}
              fontSize={0.2}
              color="#bcecff"
              anchorX="center"
              anchorY="middle"
            >
              START
            </Text>
          </group>

          <group position={[visual.position[0], 1.18, visual.position[2]]}>
            <mesh
              onPointerEnter={(event) => {
                event.stopPropagation()
                document.body.style.cursor = 'grab'
              }}
              onPointerLeave={() => {
                document.body.style.cursor = ''
              }}
              onPointerDown={(event) => {
                event.stopPropagation()
                beginDirectDrag(committedTask.id, 'shift', event.point.z)
              }}
            >
              <boxGeometry args={[1.3, 0.28, Math.min(1.6, Math.max(0.7, visual.size[2] * 0.35))]} />
              <meshStandardMaterial
                color={moveColor}
                emissive={moveColor}
                emissiveIntensity={0.18}
                transparent
                opacity={0.88}
                roughness={0.48}
              />
            </mesh>
            <Text
              position={[0, 0.43, 0]}
              fontSize={0.2}
              color="#ded6ff"
              anchorX="center"
              anchorY="middle"
            >
              MOVE
            </Text>
          </group>
        </>
      )}

      {directDrag && (
        <>
          <mesh
            position={[0, 0.09, worldCenterZ]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerMove={updateFromPoint}
            onPointerUp={(event) => {
              updateFromPoint(event)
              endDirectDrag()
            }}
          >
            <planeGeometry args={[90, worldDepth]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} side={DoubleSide} />
          </mesh>

          <Text
            position={[visual.position[0], 2.05, visual.position[2]]}
            fontSize={0.28}
            color={directDrag.kind === 'start' ? '#bcecff' : '#ded6ff'}
            anchorX="center"
            anchorY="middle"
            maxWidth={4.2}
          >
            {directDrag.kind === 'start'
              ? `START ${directDrag.start} · FINISH ${directDrag.finish}`
              : `MOVE ${directDrag.start} → ${directDrag.finish}`}
          </Text>
        </>
      )}
    </>
  )
}
