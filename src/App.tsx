import { useState, useMemo, useCallback } from 'react'
import { PoseCard } from './components/PoseCard'
import { TransformCard } from './components/TransformCard'
import { ResultCard } from './components/ResultCard'
import {
  identityPose,
  identityTransform,
  createTransformMatrix,
  applyTransform,
  matrixToPose,
  matrixToArray,
  type Pose
} from './utils/posemath'

function App() {
  // State for input pose
  const [inputPose, setInputPose] = useState<Pose>(identityPose())

  // State for transform
  const [transform, setTransform] = useState<Pose>(identityTransform())

  // Compute matrices and result
  const inputMatrix = useMemo(() => createTransformMatrix(inputPose), [inputPose])
  const transformMatrix = useMemo(() => createTransformMatrix(transform), [transform])

  const resultMatrix = useMemo(
    () => applyTransform(inputMatrix, transformMatrix),
    [inputMatrix, transformMatrix]
  )

  const resultPose = useMemo(() => matrixToPose(resultMatrix), [resultMatrix])

  // Convert matrices to arrays for display
  const inputMatrixArray = useMemo(() => matrixToArray(inputMatrix), [inputMatrix])
  const transformMatrixArray = useMemo(() => matrixToArray(transformMatrix), [transformMatrix])
  const resultMatrixArray = useMemo(() => matrixToArray(resultMatrix), [resultMatrix])

  // Handlers
  const handleResetPose = useCallback(() => setInputPose(identityPose()), [])
  const handleResetTransform = useCallback(() => setTransform(identityTransform()), [])

  const handleUseAsInput = useCallback(() => {
    setInputPose(resultPose)
    setTransform(identityTransform())
  }, [resultPose])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white text-xl">⬡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Pose Transform Tool</h1>
              <p className="text-sm text-slate-500">Transform 3D poses with quaternion math</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Input Pose */}
        <PoseCard
          pose={inputPose}
          poseMatrix={inputMatrixArray}
          onPoseChange={setInputPose}
          onReset={handleResetPose}
        />

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-slate-500">↓</span>
          </div>
        </div>

        {/* Transform */}
        <TransformCard
          transform={transform}
          transformMatrix={transformMatrixArray}
          onTransformChange={setTransform}
          onReset={handleResetTransform}
        />

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-slate-500">↓</span>
          </div>
        </div>

        {/* Result */}
        <ResultCard
          result={resultPose}
          resultMatrix={resultMatrixArray}
          onUseAsInput={handleUseAsInput}
        />

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4">
          <p>Local frame convention: result = pose × transform</p>
          <p className="mt-1">
            By <a href="https://eliottteissonniere.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700 underline">Eliott Teissonniere</a>
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
