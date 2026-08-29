import { Line, OrbitControls, PerspectiveCamera, Text } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { DoubleSide } from 'three'
import type { ProjectModel, ProjectTask } from '../domain/project'
import { useProjectStore } from '../state/useProjectStore'
import { buildWorldLayout, type TaskVisual } from '../visualization/layout'

const workstreamColors = [
  '#4e79a7',
  '#59a14f',
  '#9c755f',
  '#b07aa1',
  '#f28e2b',
  '#76b7b2',
]

interface ProjectWorldProps {
  project: ProjectModel
}

function TaskBlock({ visual, color }: { visual: TaskVisual; color: string }) {
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const selectTask = useProjectStore((state) => state.selectTask)
  const [hovered, setHovered] = useState(false)
  const selected = selectedTaskId === visual.task.id
  const { task, position, size } = visual

  if (task.kind === 'milestone') {
    return (
      <group position={position}>
        <mesh
          scale={selected ? 1.25 : hovered ? 1.12 : 1}
          rotation={[0, Math.PI / 4, 0]}
          onPointerEnter={(event) => {
            event.stopPropagation()
            setHovered(true)
          }}
          onPointerLeave={() => setHovered(false)}
          onClick={(event) => {
            event.stopPropagation()
            selectTask(task.id)
          }}
        >
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color={selected ? '#ffffff' : color} emissive={selected ? color : '#000000'} emissiveIntensity={selected ? 0.55 : 0} />
        </mesh>
        <Text position={[0, 1.05, 0]} fontSize={0.34} color="#e8edf4" anchorX="center" anchorY="middle" maxWidth={3.2}>
          {task.name}
        </Text>
      </group>
    )
  }

  const progressDepth = Math.max(0, Math.min(size[2], size[2] * task.progress))
  const progressZ = -size[2] / 2 + progressDepth / 2

  return (
    <group position={position}>
      <mesh
        scale={selected ? [1.04, 1.18, 1.02] : hovered ? [1.02, 1.08, 1.01] : [1, 1, 1]}
        onPointerEnter={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerLeave={() => setHovered(false)}
        onClick={(event) => {
          event.stopPropagation()
          selectTask(task.id)
        }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial color={selected ? '#dfe8f5' : '#293442'} roughness={0.72} metalness={0.08} />
      </mesh>

      {progressDepth > 0 && (
        <mesh position={[0, 0.02, progressZ]}>
          <boxGeometry args={[size[0] * 0.96, size[1] * 1.04, progressDepth]} />
          <meshStandardMaterial color={color} roughness={0.62} metalness={0.1} />
        </mesh>
      )}

      {selected && (
        <Text position={[0, 1.05, 0]} fontSize={0.32} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={3.4}>
          {task.name}
        </Text>
      )}
    </group>
  )
}

function SelectedDependencies({ project, visuals }: { project: ProjectModel; visuals: TaskVisual[] }) {
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const positions = useMemo(() => new Map(visuals.map((visual) => [visual.task.id, visual.position])), [visuals])

  if (!selectedTaskId) return null

  return (
    <group>
      {project.dependencies
        .filter((dependency) => dependency.fromTaskId === selectedTaskId || dependency.toTaskId === selectedTaskId)
        .map((dependency) => {
          const from = positions.get(dependency.fromTaskId)
          const to = positions.get(dependency.toTaskId)
          if (!from || !to) return null

          return (
            <Line
              key={dependency.id}
              points={[from, to]}
              color="#dbe7f5"
              lineWidth={1.6}
              transparent
              opacity={0.82}
            />
          )
        })}
    </group>
  )
}

function WorkstreamLabels({ project, visuals }: { project: ProjectModel; visuals: TaskVisual[] }) {
  const laneByWorkstream = useMemo(() => {
    const layout = buildWorldLayout(project)
    return new Map(layout.lanes.map((lane) => [lane.workstream.id, lane.x]))
  }, [project])

  const firstZ = Math.min(...visuals.map((visual) => visual.position[2] - visual.size[2] / 2)) - 1.6

  return (
    <group>
      {project.workstreams.map((workstream) => (
        <Text
          key={workstream.id}
          position={[laneByWorkstream.get(workstream.id) ?? 0, 0.2, firstZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.38}
          color="#9caabd"
          anchorX="center"
          anchorY="middle"
          maxWidth={3.5}
        >
          {workstream.name}
        </Text>
      ))}
    </group>
  )
}

export function ProjectWorld({ project }: ProjectWorldProps) {
  const layout = useMemo(() => buildWorldLayout(project), [project])
  const selectTask = useProjectStore((state) => state.selectTask)
  const colorByWorkstream = useMemo(
    () => new Map(project.workstreams.map((workstream, index) => [workstream.id, workstreamColors[index % workstreamColors.length]])),
    [project.workstreams],
  )

  const worldCenterZ = (layout.startZ + layout.finishZ) / 2
  const worldDepth = Math.max(40, layout.finishZ - layout.startZ + 12)

  return (
    <>
      <PerspectiveCamera makeDefault position={[18, 14, -11]} fov={48} />
      <OrbitControls makeDefault target={[0, 0.8, worldCenterZ * 0.55]} minDistance={6} maxDistance={75} maxPolarAngle={Math.PI / 2.04} />

      <ambientLight intensity={1.15} />
      <directionalLight position={[8, 18, -6]} intensity={2.4} />
      <directionalLight position={[-14, 10, 26]} intensity={1.1} />

      <gridHelper args={[70, 70, '#263345', '#16202c']} position={[0, 0, worldCenterZ]} />

      {layout.lanes.map((lane, index) => (
        <mesh key={lane.workstream.id} position={[lane.x, 0.015, worldCenterZ]}>
          <boxGeometry args={[3.55, 0.03, worldDepth]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#111923' : '#0d151e'} transparent opacity={0.72} />
        </mesh>
      ))}

      <mesh position={[0, 3.2, layout.todayZ]} onClick={() => selectTask(null)}>
        <planeGeometry args={[30, 6.4]} />
        <meshBasicMaterial color="#7fa6d9" transparent opacity={0.11} side={DoubleSide} depthWrite={false} />
      </mesh>
      <Text position={[-13.2, 5.65, layout.todayZ + 0.04]} fontSize={0.46} color="#a9c8ef" anchorX="left" anchorY="middle">
        TODAY · {project.statusDate}
      </Text>

      <WorkstreamLabels project={project} visuals={layout.tasks} />
      <SelectedDependencies project={project} visuals={layout.tasks} />

      {layout.tasks.map((visual) => (
        <TaskBlock key={visual.task.id} visual={visual} color={colorByWorkstream.get(visual.task.workstreamId) ?? '#6f8298'} />
      ))}
    </>
  )
}
