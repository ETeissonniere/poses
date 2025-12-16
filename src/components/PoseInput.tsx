import { useCallback, useState, useEffect } from 'react'
import { isQuaternionNormalized, normalizeQuaternion, quaternionMagnitude, eulerToQuaternion, quaternionToEuler } from '../utils/posemath'

type RotationMode = 'quaternion' | 'euler'
type EulerOrder = 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX'

interface PoseInputProps {
  position: { x: number; y: number; z: number }
  quaternion: { x: number; y: number; z: number; w: number }
  onPositionChange: (position: { x: number; y: number; z: number }) => void
  onQuaternionChange: (quaternion: { x: number; y: number; z: number; w: number }) => void
  disabled?: boolean
  label?: string
}

export function PoseInput({
  position,
  quaternion,
  onPositionChange,
  onQuaternionChange,
  disabled = false,
  label
}: PoseInputProps) {
  const [rotationMode, setRotationMode] = useState<RotationMode>('quaternion')
  const [eulerOrder, setEulerOrder] = useState<EulerOrder>('XYZ')
  const [eulerAngles, setEulerAngles] = useState({ x: 0, y: 0, z: 0 })
  const [useDegrees, setUseDegrees] = useState(true)

  const isNormalized = isQuaternionNormalized(quaternion)
  const magnitude = quaternionMagnitude(quaternion)

  // Sync euler angles when quaternion changes externally (and in quaternion mode)
  useEffect(() => {
    if (rotationMode === 'quaternion') {
      const euler = quaternionToEuler(quaternion, eulerOrder)
      setEulerAngles(euler)
    }
  }, [quaternion, eulerOrder, rotationMode])

  const handlePositionChange = useCallback((axis: 'x' | 'y' | 'z', value: string) => {
    const num = value === '' || value === '-' ? 0 : parseFloat(value)
    if (!isNaN(num)) {
      onPositionChange({ ...position, [axis]: num })
    }
  }, [position, onPositionChange])

  const handleQuaternionChange = useCallback((axis: 'x' | 'y' | 'z' | 'w', value: string) => {
    const num = value === '' || value === '-' ? 0 : parseFloat(value)
    if (!isNaN(num)) {
      onQuaternionChange({ ...quaternion, [axis]: num })
    }
  }, [quaternion, onQuaternionChange])

  const handleNormalize = useCallback(() => {
    if (magnitude > 0) {
      onQuaternionChange(normalizeQuaternion(quaternion))
    }
  }, [quaternion, onQuaternionChange, magnitude])

  const handleEulerChange = useCallback((axis: 'x' | 'y' | 'z', value: string) => {
    const num = value === '' || value === '-' ? 0 : parseFloat(value)
    if (!isNaN(num)) {
      const radians = useDegrees ? num * (Math.PI / 180) : num
      const newEuler = { ...eulerAngles, [axis]: radians }
      setEulerAngles(newEuler)
      const newQuat = eulerToQuaternion(newEuler.x, newEuler.y, newEuler.z, eulerOrder)
      onQuaternionChange(newQuat)
    }
  }, [eulerAngles, eulerOrder, useDegrees, onQuaternionChange])

  const getDisplayEuler = (axis: 'x' | 'y' | 'z'): number => {
    const radians = eulerAngles[axis]
    return useDegrees ? radians * (180 / Math.PI) : radians
  }

  const inputClass = `
    w-full px-3 py-2
    bg-slate-50 border border-slate-200 rounded-lg
    font-mono text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-slate-100 disabled:text-slate-500
    transition-all duration-150
  `

  const labelClass = "text-xs font-medium text-slate-500 mb-1"

  return (
    <div className="space-y-4">
      {label && <h4 className="text-sm font-semibold text-slate-700">{label}</h4>}

      {/* Position inputs */}
      <div>
        <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">Position</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>X</label>
            <input
              type="number"
              value={position.x}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              disabled={disabled}
              className={inputClass}
              step="0.01"
            />
          </div>
          <div>
            <label className={labelClass}>Y</label>
            <input
              type="number"
              value={position.y}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              disabled={disabled}
              className={inputClass}
              step="0.01"
            />
          </div>
          <div>
            <label className={labelClass}>Z</label>
            <input
              type="number"
              value={position.z}
              onChange={(e) => handlePositionChange('z', e.target.value)}
              disabled={disabled}
              className={inputClass}
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Rotation mode toggle */}
      <div>
        <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">Rotation</span>
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setRotationMode('quaternion')}
              disabled={disabled}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                rotationMode === 'quaternion'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              Quaternion
            </button>
            <button
              onClick={() => setRotationMode('euler')}
              disabled={disabled}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                rotationMode === 'euler'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              Euler
            </button>
          </div>
        </div>

        {rotationMode === 'quaternion' ? (
          <>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>W</label>
                <input
                  type="number"
                  value={quaternion.w}
                  onChange={(e) => handleQuaternionChange('w', e.target.value)}
                  disabled={disabled}
                  className={`${inputClass} ${!isNormalized && magnitude > 0 ? 'border-amber-300' : ''}`}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClass}>X</label>
                <input
                  type="number"
                  value={quaternion.x}
                  onChange={(e) => handleQuaternionChange('x', e.target.value)}
                  disabled={disabled}
                  className={`${inputClass} ${!isNormalized && magnitude > 0 ? 'border-amber-300' : ''}`}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClass}>Y</label>
                <input
                  type="number"
                  value={quaternion.y}
                  onChange={(e) => handleQuaternionChange('y', e.target.value)}
                  disabled={disabled}
                  className={`${inputClass} ${!isNormalized && magnitude > 0 ? 'border-amber-300' : ''}`}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClass}>Z</label>
                <input
                  type="number"
                  value={quaternion.z}
                  onChange={(e) => handleQuaternionChange('z', e.target.value)}
                  disabled={disabled}
                  className={`${inputClass} ${!isNormalized && magnitude > 0 ? 'border-amber-300' : ''}`}
                  step="0.01"
                />
              </div>
            </div>
            {!isNormalized && magnitude > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-amber-600 text-xs">|q| = {magnitude.toFixed(4)}</span>
                {!disabled && (
                  <button
                    onClick={handleNormalize}
                    className="text-xs text-amber-700 hover:text-amber-800 underline transition-colors"
                  >
                    Normalize
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={eulerOrder}
                onChange={(e) => setEulerOrder(e.target.value as EulerOrder)}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded"
              >
                <option value="XYZ">XYZ</option>
                <option value="XZY">XZY</option>
                <option value="YXZ">YXZ</option>
                <option value="YZX">YZX</option>
                <option value="ZXY">ZXY</option>
                <option value="ZYX">ZYX</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={useDegrees}
                  onChange={(e) => setUseDegrees(e.target.checked)}
                  disabled={disabled}
                  className="rounded"
                />
                Degrees
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>X (Roll)</label>
                <input
                  type="number"
                  value={parseFloat(getDisplayEuler('x').toFixed(4))}
                  onChange={(e) => handleEulerChange('x', e.target.value)}
                  disabled={disabled}
                  className={inputClass}
                  step={useDegrees ? "1" : "0.01"}
                />
              </div>
              <div>
                <label className={labelClass}>Y (Pitch)</label>
                <input
                  type="number"
                  value={parseFloat(getDisplayEuler('y').toFixed(4))}
                  onChange={(e) => handleEulerChange('y', e.target.value)}
                  disabled={disabled}
                  className={inputClass}
                  step={useDegrees ? "1" : "0.01"}
                />
              </div>
              <div>
                <label className={labelClass}>Z (Yaw)</label>
                <input
                  type="number"
                  value={parseFloat(getDisplayEuler('z').toFixed(4))}
                  onChange={(e) => handleEulerChange('z', e.target.value)}
                  disabled={disabled}
                  className={inputClass}
                  step={useDegrees ? "1" : "0.01"}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
