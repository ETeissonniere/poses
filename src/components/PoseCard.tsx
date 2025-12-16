import { PoseInput } from './PoseInput'
import { MatrixDisplay } from './MatrixDisplay'
import type { Pose } from '../utils/posemath'

interface PoseCardProps {
  pose: Pose
  poseMatrix: number[][]
  onPoseChange: (pose: Pose) => void
  onReset: () => void
}

export function PoseCard({
  pose,
  poseMatrix,
  onPoseChange,
  onReset
}: PoseCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-lg">◎</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Current Pose</h3>
              <p className="text-xs text-slate-500">Input position and orientation</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-white/50 transition-colors"
          >
            Reset to Origin
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <PoseInput
          position={pose.position}
          quaternion={pose.quaternion}
          onPositionChange={(position) => onPoseChange({ ...pose, position })}
          onQuaternionChange={(quaternion) => onPoseChange({ ...pose, quaternion })}
        />

        <MatrixDisplay
          matrix={poseMatrix}
          label="Pose Matrix"
          defaultCollapsed={false}
        />
      </div>
    </div>
  )
}
