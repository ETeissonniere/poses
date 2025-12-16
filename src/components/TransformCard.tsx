import { PoseInput } from './PoseInput'
import { MatrixDisplay } from './MatrixDisplay'
import type { Pose } from '../utils/posemath'

interface TransformCardProps {
  transform: Pose
  transformMatrix: number[][]
  onTransformChange: (transform: Pose) => void
  onReset: () => void
}

export function TransformCard({
  transform,
  transformMatrix,
  onTransformChange,
  onReset
}: TransformCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="text-amber-600 text-lg">↻</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Apply Transform</h3>
              <p className="text-xs text-slate-500">Local frame transformation</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-white/50 transition-colors"
          >
            Reset to Identity
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <PoseInput
          position={transform.position}
          quaternion={transform.quaternion}
          onPositionChange={(position) => onTransformChange({ ...transform, position })}
          onQuaternionChange={(quaternion) => onTransformChange({ ...transform, quaternion })}
        />

        <MatrixDisplay
          matrix={transformMatrix}
          label="Transform Matrix"
          defaultCollapsed={true}
        />
      </div>
    </div>
  )
}
