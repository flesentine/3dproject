import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Line, OrbitControls, PerspectiveCamera, Text } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DoubleSide, Group, Vector3 } from 'three'
import type {
  DriverAnalysis,
  ProjectModel,
  ScenarioTaskChange,
  ScheduleAnalysis,
} from '../domain/project'
import { useProjectStore } from '../state/useProjectStore'
import { finishDateFromWorldZ } from '../visualization/finishDrag'
import { buildWorldLayout, type TaskVisual } from '../visualization/layout'

const workstreamColors = [
  '#4e79a7',
  '#59a14f',
  '#9c755f',
  '#b07aa1',
  '#f28e2b',
  '#76b7b2',
]

const criticalColor = '#ff816f'
const driverColor = '#9bc6f5'
const scenarioColor = '#f1c76a'
const ghostColor = '#8a98aa'
const dragHandleColor = '#f5d98c'

interface ProjectWorldProps {
  project: ProjectModel
  analysis: ScheduleAnalysis
  drivers: DriverAnalysis
  baselineProject?: ProjectModel
  scenarioChanges?: ScenarioTaskChange[]
}

interface TaskBlockProps {
  visual: TaskVisual
  color: string
  analysis: ScheduleAnalysis
  driverTaskIds: Set<string>
  scenarioChangedTaskIds: Set<string>
  onBeginFinishDrag: (taskId: string) => void
}

function TaskBlock({
  visual,
  color,
  analysis,
  driverTaskIds,
  scenarioChangedTaskIds,
  onBeginFinishDrag,
}: TaskBlockProps) {
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const analysisMode = useProjectStore((state) => state.analysisMode)
  const finishDrag = useProjectStore((state) => state.finishDrag)
  const selectTask = useProjectStore((state) => state.selectTask)
  const [hovered, setHovered] = useState(false)
  const [handleHovered, setHandleHovered] = useState(false)
  const groupRef = useRef<Group>(null)
  const initialized = useRef(false)
  const selected = selectedTaskId === visual.task.id
  const metrics = analysis.activityByTask.get(visual.task.id)
  const isCritical = metrics?.isCritical ?? false
  const isDriver = driverTaskIds.has(visual.task.id)
  const scenarioChanged = scenarioChangedTaskIds.has(visual.task.id)
  const emphasized =
    selected ||
    analysisMode === 'normal' ||
    (analysisMode === 'critical' && isCritical) ||
    (analysisMode === 'drivers' && isDriver)
  const muted = !emphasized
  const analysisColor =
    analysisMode === 'critical' && isCritical
      ? criticalColor
      : analysisMode === 'drivers' && isDriver
        ? driverColor
        : scenarioChanged
          ? scenarioColor
          : color
  const { task, position, size } = visual
  const targetPosition = useMemo(
    () => new Vector3(position[0], position[1], position[2]),
    [position[0], position[1], position[2]],
  )

  useLayoutEffect(() => {
    if (!groupRef.current || initialized.current) return
    groupRef.current.position.copy(targetPosition)
    initialized.current = true
  }, [targetPosition])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    if (!initialized.current) {
      group.position.copy(targetPosition)
      initialized.current = true
      return
    }

    const blend = 1 - Math.exp(-8 * delta)
    group.position.lerp(targetPosition, blend)
  })

  const pointerHandlers = {
    onPointerEnter: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      setHovered(true)
    },
    onPointerLeave: () => setHovered(false),
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation()
      selectTask(task.id)
    },
  }

  if (task.kind === 'milestone') {
    return (
      <group ref={groupRef} {...pointerHandlers}>
        <mesh
          scale={selected ? 1.25 : hovered ? 1.12 : emphasized ? 1 : 0.82}
          rotation={[0, Math.PI / 4, 0]}
        >
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color={selected ? '#ffffff' : analysisColor}
            emissive={selected || scenarioChanged || (analysisMode !== 'normal' && emphasized) ? analysisColor : '#000000'}
            emissiveIntensity={selected ? 0.55 : scenarioChanged ? 0.26 : analysisMode !== 'normal' && emphasized ? 0.32 : 0}
            transparent={muted}
            opacity={muted ? 0.12 : 1}
            depthWrite={!muted}
          />
        </mesh>
        <Text
          position={[0, 1.05, 0]}
          fontSize={0.34}
          color={muted ? '#3f4b5a' : '#e8edf4'}
          anchorX="center"
          anchorY="middle"
          maxWidth={3.2}
        >
          {task.name}
        </Text>
      </group>
    )
  }

  const progressDepth = Math.max(0, Math.min(size[2], size[2] * task.progress))
  const progressZ = -size[2] / 2 + progressDepth / 2
  const activelyDragging = finishDrag?.taskId === task.id

  return (
    <group ref={groupRef} {...pointerHandlers}>
      <mesh scale={selected ? [1.04, 1.18, 1.02] : hovered ? [1.02, 1.08, 1.01] : [1, 1, 1]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={selected ? '#dfe8f5' : analysisMode !== 'normal' && emphasized ? analysisColor : scenarioChanged ? '#4a402a' : '#293442'}
          emissive={scenarioChanged && !selected ? scenarioColor : '#000000'}
          emissiveIntensity={scenarioChanged && !selected ? 0.11 : 0}
          roughness={0.72}
          metalness={0.08}
          transparent={muted}
          opacity={muted ? 0.1 : 1}
          depthWrite={!muted}
        />
      </mesh>

      {progressDepth > 0 && (
        <mesh position={[0, 0.02, progressZ]}>
          <boxGeometry args={[size[0] * 0.96, size[1] * 1.04, progressDepth]} />
          <meshStandardMaterial
            color={analysisColor}
            roughness={0.62}
            metalness={0.1}
            transparent={muted}
            opacity={muted ? 0.08 : 1}
            depthWrite={!muted}
          />
        </mesh>
      )}

      {selected && (
        <>
          <Text position={[0, 1.05, 0]} fontSize={0.32} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={3.4}>
            {task.name}
          </Text>
          <group position={[0, 0.05, size[2] / 2 + 0.12]}>
            <Line
              points={[[-size[0] * 0.46, 0, 0], [size[0] * 0.46, 0, 0]]}
              color={dragHandleColor}
              lineWidth={activelyDragging ? 3 : 1.8}
              transparent
              opacity={activelyDragging || handleHovered ? 1 : 0.72}
            />
            <mesh
              scale={activelyDragging ? 1.28 : handleHovered ? 1.14 : 1}
              onPointerEnter={(event) => {
                event.stopPropagation()
                setHandleHovered(true)
                document.body.style.cursor = 'col-resize'
              }}
              onPointerLeave={() => {
                setHandleHovered(false)
                if (!activelyDragging) document.body.style.cursor = ''
              }}
              onPointerDown={(event) => {
                event.stopPropagation()
                onBeginFinishDrag(task.id)
              }}
            >
              <sphereGeometry args={[0.22, 16, 12]} />
              <meshStandardMaterial
                color={activelyDragging ? '#fff2c8' : dragHandleColor}
                emissive={dragHandleColor}
                emissiveIntensity={activelyDragging ? 0.65 : 0.28}
                roughness={0.42}
              />
            </mesh>
            {(handleHovered || activelyDragging) && (
              <Text
                position={[0, 0.72, 0]}
                fontSize={0.25}
                color="#ffe7a8"
                anchorX="center"
                anchorY="middle"
                maxWidth={2.7}
              >
                {activelyDragging ? (finishDrag?.finish ?? task.finish) : 'DRAG FINISH'}
              </Text>
            )}
          </group>
        </>
      )}
    </group>
  )
}

function AnalysisDependencies({
  project,
  analysis,
  drivers,
  visuals,
}: {
  project: ProjectModel
  analysis: ScheduleAnalysis
  drivers: DriverAnalysis
  visuals: TaskVisual[]
}) {
  const selectedTaskId = useProjectStore((state) => state.selectedTaskId)
  const analysisMode = useProjectStore((state) => state.analysisMode)
  const positions = useMemo(() => new Map(visuals.map((visual) => [visual.task.id, visual.position])), [visuals])
  const criticalDependencyIds = useMemo(() => new Set(analysis.criticalDependencyIds), [analysis.criticalDependencyIds])
  const driverDependencyIds = useMemo(() => new Set(drivers.dependencyIds), [drivers.dependencyIds])

  const dependencies = project.dependencies.filter((dependency) => {
    if (analysisMode === 'critical') return criticalDependencyIds.has(dependency.id)
    if (analysisMode === 'drivers') return driverDependencyIds.has(dependency.id)
    return Boolean(selectedTaskId) && (dependency.fromTaskId === selectedTaskId || dependency.toTaskId === selectedTaskId)
  })

  if (dependencies.length === 0) return null

  const color = analysisMode === 'critical' ? criticalColor : analysisMode === 'drivers' ? driverColor : '#dbe7f5'
  const lineWidth = analysisMode === 'normal' ? 1.6 : 2.6

  return (
    <group>
      {dependencies.map((dependency) => {
        const from = positions.get(dependency.fromTaskId)
        const to = positions.get(dependency.toTaskId)
        if (!from || !to) return null

        return (
          <Line
            key={dependency.id}
            points={[from, to]}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={analysisMode === 'normal' ? 0.82 : 0.95}
          />
        )
      })}
    </group>
  )
}

function ScenarioGhosts({
  baselineProject,
  scenarioProject,
  changes,
}: {
  baselineProject: ProjectModel
  scenarioProject: ProjectModel
  changes: ScenarioTaskChange[]
}) {
  const baselineLayout = useMemo(() => buildWorldLayout(baselineProject), [baselineProject])
  const scenarioLayout = useMemo(() => buildWorldLayout(scenarioProject), [scenarioProject])
  const baselineById = useMemo(() => new Map(baselineLayout.tasks.map((visual) => [visual.task.id, visual])), [baselineLayout.tasks])
  const scenarioById = useMemo(() => new Map(scenarioLayout.tasks.map((visual) => [visual.task.id, visual])), [scenarioLayout.tasks])

  return (
    <group>
      {changes.map((change) => {
        const baseline = baselineById.get(change.taskId)
        const scenario = scenarioById.get(change.taskId)
        if (!baseline || !scenario) return null

        return (
          <group key={change.taskId}>
            {baseline.task.kind === 'milestone' ? (
              <mesh position={baseline.position} rotation={[0, Math.PI / 4, 0]}>
                <octahedronGeometry args={[0.55, 0]} />
                <meshBasicMaterial color={ghostColor} wireframe transparent opacity={0.34} depthWrite={false} />
              </mesh>
            ) : (
              <mesh position={baseline.position}>
                <boxGeometry args={baseline.size} />
                <meshBasicMaterial color={ghostColor} wireframe transparent opacity={0.28} depthWrite={false} />
              </mesh>
            )}
            <Line
              points={[baseline.position, scenario.position]}
              color={scenarioColor}
              lineWidth={1.25}
              transparent
              opacity={0.44}
              dashed
              dashSize={0.28}
              gapSize={0.18}
            />
          </group>
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

function FinishDragSurface({ layout }: { layout: ReturnType<typeof buildWorldLayout> }) {
  const finishDrag = useProjectStore((state) => state.finishDrag)
  const committedProject = useProjectStore((state) => state.project)
  const updateFinishDrag = useProjectStore((state) => state.updateFinishDrag)
  const endFinishDrag = useProjectStore((state) => state.endFinishDrag)

  if (!finishDrag) return null

  const task = committedProject.tasks.find((candidate) => candidate.id === finishDrag.taskId)
  if (!task) return null

  const centerZ = (layout.startZ + layout.finishZ) / 2
  const depth = Math.max(180, layout.finishZ - layout.startZ + 140)

  const updateFromPoint = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const finish = finishDateFromWorldZ(
      committedProject.statusDate,
      task.start,
      finishDrag.finish,
      event.point.z,
    )
    updateFinishDrag(task.id, finish)
  }

  return (
    <mesh
      position={[0, 0.08, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={updateFromPoint}
      onPointerUp={(event) => {
        updateFromPoint(event)
        endFinishDrag()
      }}
    >
      <planeGeometry args={[90, depth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={DoubleSide} />
    </mesh>
  )
}

export function ProjectWorld({
  project,
  analysis,
  drivers,
  baselineProject,
  scenarioChanges = [],
}: ProjectWorldProps) {
  const layout = useMemo(() => buildWorldLayout(project), [project])
  const finishDrag = useProjectStore((state) => state.finishDrag)
  const beginFinishDrag = useProjectStore((state) => state.beginFinishDrag)
  const endFinishDrag = useProjectStore((state) => state.endFinishDrag)
  const selectTask = useProjectStore((state) => state.selectTask)
  const driverTaskIds = useMemo(() => new Set(drivers.taskIds), [drivers.taskIds])
  const scenarioChangedTaskIds = useMemo(
    () => new Set(scenarioChanges.map((change) => change.taskId)),
    [scenarioChanges],
  )
  const colorByWorkstream = useMemo(
    () => new Map(project.workstreams.map((workstream, index) => [workstream.id, workstreamColors[index % workstreamColors.length]])),
    [project.workstreams],
  )

  const worldCenterZ = (layout.startZ + layout.finishZ) / 2
  const worldDepth = Math.max(40, layout.finishZ - layout.startZ + 12)
  const draggingFinish = Boolean(finishDrag)

  useEffect(() => {
    if (!draggingFinish) return

    const previousCursor = document.body.style.cursor
    document.body.style.cursor = 'col-resize'
    const finish = () => endFinishDrag()
    window.addEventListener('pointerup', finish)
    window.addEventListener('blur', finish)

    return () => {
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('blur', finish)
      document.body.style.cursor = previousCursor
    }
  }, [draggingFinish, endFinishDrag])

  return (
    <>
      <PerspectiveCamera makeDefault position={[18, 14, -11]} fov={48} />
      <OrbitControls
        makeDefault
        enabled={!draggingFinish}
        target={[0, 0.8, worldCenterZ * 0.55]}
        minDistance={6}
        maxDistance={85}
        maxPolarAngle={Math.PI / 2.04}
      />

      <ambientLight intensity={1.15} />
      <directionalLight position={[8, 18, -6]} intensity={2.4} />
      <directionalLight position={[-14, 10, 26]} intensity={1.1} />

      <gridHelper args={[80, 80, '#263345', '#16202c']} position={[0, 0, worldCenterZ]} />

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
      {baselineProject && scenarioChanges.length > 0 && (
        <ScenarioGhosts
          baselineProject={baselineProject}
          scenarioProject={project}
          changes={scenarioChanges}
        />
      )}
      <AnalysisDependencies project={project} analysis={analysis} drivers={drivers} visuals={layout.tasks} />

      {layout.tasks.map((visual) => (
        <TaskBlock
          key={visual.task.id}
          visual={visual}
          color={colorByWorkstream.get(visual.task.workstreamId) ?? '#6f8298'}
          analysis={analysis}
          driverTaskIds={driverTaskIds}
          scenarioChangedTaskIds={scenarioChangedTaskIds}
          onBeginFinishDrag={beginFinishDrag}
        />
      ))}

      {finishDrag && <FinishDragSurface layout={layout} />}
    </>
  )
}
