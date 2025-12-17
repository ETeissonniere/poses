import { useEffect, useRef, useCallback } from 'react'
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
  Float32BufferAttribute,
  Box3,
  Sphere
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
  const gridRef = useRef<GridHelper | null>(null)
  const gridSpacingRef = useRef<number>(1) // Current grid cell spacing in meters
  const gridExtentRef = useRef<number>(100) // Current grid extent (half-size) in meters
  const requiredExtentRef = useRef<number>(10) // Required extent based on pose positions

  // Camera animation targets
  const targetCameraPosRef = useRef<Vector3 | null>(null)
  const targetControlsTargetRef = useRef<Vector3 | null>(null)

  // Calculate where camera should be to fit both frames
  const calculateCameraFit = useCallback((inputPos: Vector3, resultPos: Vector3) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    // Minimal padding just to account for axis arrows
    const padding = 0.5

    // Calculate bounding box containing both frames
    const box = new Box3()

    // Add input position with padding
    box.expandByPoint(new Vector3(
      inputPos.x - padding, inputPos.y - padding, inputPos.z - padding
    ))
    box.expandByPoint(new Vector3(
      inputPos.x + padding, inputPos.y + padding, inputPos.z + padding
    ))

    // Add result position with padding
    box.expandByPoint(new Vector3(
      resultPos.x - padding, resultPos.y - padding, resultPos.z - padding
    ))
    box.expandByPoint(new Vector3(
      resultPos.x + padding, resultPos.y + padding, resultPos.z + padding
    ))

    // Get bounding sphere
    const sphere = new Sphere()
    box.getBoundingSphere(sphere)

    // Calculate required distance to fit sphere in view
    const fov = camera.fov * (Math.PI / 180)
    const distance = sphere.radius / Math.sin(fov / 2)

    // Calculate camera position - maintain similar angle but adjust distance
    const center = sphere.center.clone()
    const currentDir = camera.position.clone().sub(controls.target).normalize()

    // Tight framing - just enough to see the poses clearly
    const finalDistance = Math.max(distance * 1.1, 0.8)

    const newCameraPos = center.clone().add(currentDir.multiplyScalar(finalDistance))

    // Store targets for animation loop to pick up
    targetCameraPosRef.current = newCameraPos
    targetControlsTargetRef.current = center
  }, [])

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
    controls.minDistance = 0.2 // Allow closer zoom for 10cm grid
    controls.maxDistance = 200 // Allow zooming out further for large coordinates
    controlsRef.current = controls

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    scene.add(directionalLight)

    // Grid - rotated to XY plane (Z-up), dynamic spacing based on zoom
    const grid = new GridHelper(100, 100, 0x94a3b8, 0xe2e8f0) // 1m spacing initially
    grid.rotation.x = Math.PI / 2 // Rotate to lie on XY plane
    scene.add(grid)
    gridRef.current = grid
    gridSpacingRef.current = 1

    // Function to update grid based on camera distance and required extent
    const updateGrid = () => {
      if (!gridRef.current || !sceneRef.current) return

      const distance = camera.position.distanceTo(controls.target)

      // Choose grid spacing based on distance
      // Closer = finer grid, farther = coarser grid
      let targetSpacing: number
      if (distance < 2) {
        targetSpacing = 0.1 // 10cm
      } else if (distance < 10) {
        targetSpacing = 0.5 // 50cm
      } else if (distance < 50) {
        targetSpacing = 1 // 1m
      } else if (distance < 200) {
        targetSpacing = 5 // 5m
      } else {
        targetSpacing = 10 // 10m
      }

      // Calculate required grid size based on poses and camera position
      const cameraExtent = Math.max(
        Math.abs(controls.target.x),
        Math.abs(controls.target.y),
        distance
      )
      const minExtent = requiredExtentRef.current
      const targetExtent = Math.max(minExtent, cameraExtent) * 1.5
      // Round up to nice number based on spacing
      const roundedExtent = Math.ceil(targetExtent / (targetSpacing * 10)) * targetSpacing * 10

      // Only recreate grid if spacing or extent changed significantly
      const spacingChanged = targetSpacing !== gridSpacingRef.current
      const extentChanged = roundedExtent > gridExtentRef.current * 1.2 // Only grow, with 20% buffer

      if (spacingChanged || extentChanged) {
        gridSpacingRef.current = targetSpacing
        gridExtentRef.current = Math.max(gridExtentRef.current, roundedExtent)

        sceneRef.current.remove(gridRef.current)
        gridRef.current.geometry.dispose()

        // Grid size is diameter (2x extent), divisions based on spacing
        const gridSize = gridExtentRef.current * 2
        const divisions = Math.round(gridSize / targetSpacing)
        const newGrid = new GridHelper(gridSize, divisions, 0x94a3b8, 0xe2e8f0)
        newGrid.rotation.x = Math.PI / 2
        sceneRef.current.add(newGrid)
        gridRef.current = newGrid
      }
    }

    // World origin axes (subtle)
    const worldAxes = new AxesHelper(0.5)
    worldAxes.setColors(
      new Color(0x94a3b8),
      new Color(0x94a3b8),
      new Color(0x94a3b8)
    )
    scene.add(worldAxes)

    // Current pose frame (standard RGB)
    const inputFrame = createCoordinateFrame(1, {
      x: 0xdc2626, // red-600
      y: 0x16a34a, // green-600
      z: 0x2563eb  // blue-600
    })
    scene.add(inputFrame)
    inputFrameRef.current = inputFrame

    // Transformed pose frame (lighter RGB tones)
    const resultFrame = createCoordinateFrame(1, {
      x: 0xf87171, // red-400
      y: 0x4ade80, // green-400
      z: 0x60a5fa  // blue-400
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

      // Smoothly animate camera towards target position
      if (targetCameraPosRef.current && targetControlsTargetRef.current) {
        const lerpFactor = 0.08

        // Lerp controls target (orbit center)
        controls.target.lerp(targetControlsTargetRef.current, lerpFactor)

        // Lerp camera position
        camera.position.lerp(targetCameraPosRef.current, lerpFactor)

        // Check if we're close enough to stop animating
        const targetDist = camera.position.distanceTo(targetCameraPosRef.current)
        const controlsDist = controls.target.distanceTo(targetControlsTargetRef.current)
        if (targetDist < 0.01 && controlsDist < 0.01) {
          camera.position.copy(targetCameraPosRef.current)
          controls.target.copy(targetControlsTargetRef.current)
          targetCameraPosRef.current = null
          targetControlsTargetRef.current = null
        }
      }

      // Update grid based on current zoom level
      updateGrid()

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

    // Update required grid extent to encompass poses
    requiredExtentRef.current = Math.max(
      Math.abs(inputPos.x), Math.abs(inputPos.y),
      Math.abs(resultPos.x), Math.abs(resultPos.y),
      10 // minimum extent
    )

    // Auto-fit camera to keep both frames visible
    calculateCameraFit(inputPos, resultPos)
  }, [inputPose, resultPose, transform, calculateCameraFit])

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
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs">
        <div className="flex gap-6">
          {/* Current pose frame */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Current:</span>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-600"></div>
              <span className="text-slate-500">X</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-600"></div>
              <span className="text-slate-500">Y</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-600"></div>
              <span className="text-slate-500">Z</span>
            </div>
          </div>
          {/* Transformed frame */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Transformed:</span>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-400"></div>
              <span className="text-slate-500">X</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-400"></div>
              <span className="text-slate-500">Y</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-400"></div>
              <span className="text-slate-500">Z</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
