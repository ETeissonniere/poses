import { useEffect, useRef } from 'react'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  GridHelper,
  AxesHelper,
  Group,
  Vector3,
  Quaternion,
  ArrowHelper,
  Color,
  AmbientLight,
  DirectionalLight,
  BufferGeometry,
  LineBasicMaterial,
  Line,
  Float32BufferAttribute
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Pose } from '../utils/posemath'

interface PoseVisualizer3DProps {
  inputPose: Pose
  transform: Pose
  resultPose: Pose
}

function createCoordinateFrame(size: number, colors: { x: number; y: number; z: number }): Group {
  const group = new Group()

  // X axis (red-ish)
  const xArrow = new ArrowHelper(
    new Vector3(1, 0, 0),
    new Vector3(0, 0, 0),
    size,
    colors.x,
    size * 0.2,
    size * 0.1
  )
  group.add(xArrow)

  // Y axis (green-ish)
  const yArrow = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 0),
    size,
    colors.y,
    size * 0.2,
    size * 0.1
  )
  group.add(yArrow)

  // Z axis (blue-ish)
  const zArrow = new ArrowHelper(
    new Vector3(0, 0, 1),
    new Vector3(0, 0, 0),
    size,
    colors.z,
    size * 0.2,
    size * 0.1
  )
  group.add(zArrow)

  return group
}

function createDashedLine(start: Vector3, end: Vector3, color: number): Line {
  const geometry = new BufferGeometry()
  const positions = [start.x, start.y, start.z, end.x, end.y, end.z]
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))

  const material = new LineBasicMaterial({
    color,
    opacity: 0.5,
    transparent: true
  })

  return new Line(geometry, material)
}

export function PoseVisualizer3D({ inputPose, transform, resultPose }: PoseVisualizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const cameraRef = useRef<PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Refs for dynamic objects that need updating
  const inputFrameRef = useRef<Group | null>(null)
  const resultFrameRef = useRef<Group | null>(null)
  const connectionLineRef = useRef<Line | null>(null)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new Scene()
    scene.background = new Color(0xf8fafc) // slate-50
    sceneRef.current = scene

    // Camera - positioned for Z-up view
    const camera = new PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(4, -4, 3)
    camera.up.set(0, 0, 1) // Z is up
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 20
    controlsRef.current = controls

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    // Grid - rotated to XY plane (Z-up)
    const grid = new GridHelper(10, 10, 0x94a3b8, 0xe2e8f0) // slate colors
    grid.rotation.x = Math.PI / 2 // Rotate to lie on XY plane
    scene.add(grid)

    // World origin axes (subtle)
    const worldAxes = new AxesHelper(0.5)
    worldAxes.setColors(
      new Color(0x94a3b8),
      new Color(0x94a3b8),
      new Color(0x94a3b8)
    )
    scene.add(worldAxes)

    // Input pose frame (blue tones)
    const inputFrame = createCoordinateFrame(1, {
      x: 0x3b82f6, // blue-500
      y: 0x22c55e, // green-500
      z: 0x6366f1  // indigo-500
    })
    scene.add(inputFrame)
    inputFrameRef.current = inputFrame

    // Result pose frame (emerald/teal tones)
    const resultFrame = createCoordinateFrame(1, {
      x: 0xef4444, // red-500
      y: 0x84cc16, // lime-500
      z: 0x06b6d4  // cyan-500
    })
    scene.add(resultFrame)
    resultFrameRef.current = resultFrame

    // Connection line
    const connectionLine = createDashedLine(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      0xf59e0b // amber-500
    )
    scene.add(connectionLine)
    connectionLineRef.current = connectionLine

    // Animation loop
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // Cleanup
    return () => {
      resizeObserver.disconnect()
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Update poses when props change
  useEffect(() => {
    if (!inputFrameRef.current || !resultFrameRef.current || !connectionLineRef.current) return

    // Update input frame
    const inputPos = new Vector3(inputPose.position.x, inputPose.position.y, inputPose.position.z)
    const inputQuat = new Quaternion(
      inputPose.quaternion.x,
      inputPose.quaternion.y,
      inputPose.quaternion.z,
      inputPose.quaternion.w
    )
    inputFrameRef.current.position.copy(inputPos)
    inputFrameRef.current.quaternion.copy(inputQuat)

    // Update result frame
    const resultPos = new Vector3(resultPose.position.x, resultPose.position.y, resultPose.position.z)
    const resultQuat = new Quaternion(
      resultPose.quaternion.x,
      resultPose.quaternion.y,
      resultPose.quaternion.z,
      resultPose.quaternion.w
    )
    resultFrameRef.current.position.copy(resultPos)
    resultFrameRef.current.quaternion.copy(resultQuat)

    // Update connection line
    const positions = connectionLineRef.current.geometry.getAttribute('position')
    positions.setXYZ(0, inputPos.x, inputPos.y, inputPos.z)
    positions.setXYZ(1, resultPos.x, resultPos.y, resultPos.z)
    positions.needsUpdate = true
  }, [inputPose, resultPose, transform])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <span className="text-lg">🎯</span>
          3D Visualization
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Drag to rotate • Scroll to zoom
        </p>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="flex-1 min-h-[400px]" />

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-slate-600">Input</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-slate-600">Transform</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-slate-600">Result</span>
        </div>
      </div>
    </div>
  )
}
