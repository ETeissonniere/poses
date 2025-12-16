import { useCallback, useState, useEffect } from 'react'
import { isQuaternionNormalized, normalizeQuaternion, quaternionMagnitude, eulerToQuaternion, quaternionToEuler } from '../utils/posemath'

type RotationMode = 'quaternion' | 'euler'
type EulerOrder = 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX'

// NumberInput component that allows intermediate states like '-' while typing
interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
  step?: string
}

function NumberInput({ value, onChange, disabled, className, step }: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value))

  // Sync local state when external value changes (but not while user is typing intermediate values)
  useEffect(() => {
    // Only update if the local value represents a different number
    const localNum = parseFloat(localValue)
    if (!isNaN(localNum) && localNum !== value) {
      setLocalValue(String(value))
    } else if (isNaN(localNum) && !isNaN(value)) {
      // Local is intermediate state, external changed - update local
      setLocalValue(String(value))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Only propagate to parent if it's a valid number
    const num = parseFloat(newValue)
    if (!isNaN(num)) {
      onChange(num)
    }
  }

  const handleBlur = () => {
    // On blur, if the value is invalid, reset to the external value
    const num = parseFloat(localValue)
    if (isNaN(num)) {
      setLocalValue(String(value))
    }
  }

  return (
    <input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={className}
      step={step}
    />
  )
}

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

  const handlePositionChange = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    onPositionChange({ ...position, [axis]: value })
  }, [position, onPositionChange])

  const handleQuaternionChange = useCallback((axis: 'x' | 'y' | 'z' | 'w', value: number) => {
    onQuaternionChange({ ...quaternion, [axis]: value })
  }, [quaternion, onQuaternionChange])

  const handleNormalize = useCallback(() => {
    if (magnitude > 0) {
      onQuaternionChange(normalizeQuaternion(quaternion))
    }
  }, [quaternion, onQuaternionChange, magnitude])

  const handleEulerChange = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    const radians = useDegrees ? value * (Math.PI / 180) : value
    const newEuler = { ...eulerAngles, [axis]: radians }
    setEulerAngles(newEuler)
    const newQuat = eulerToQuaternion(newEuler.x, newEuler.y, newEuler.z, eulerOrder)
    onQuaternionChange(newQuat)
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
            <NumberInput
              value={position.x}
              onChange={(v) => handlePositionChange('x', v)}
              disabled={disabled}
              className={inputClass}
              step="0.01"
            />
          </div>
          <div>
            <label className={labelClass}>Y</label>
            <NumberInput
              value={position.y}
              onChange={(v) => handlePositionChange('y', v)}
              disabled={disabled}
              className={inputClass}
              step="0.01"
            />
          </div>
          <div>
            <label className={labelClass}>Z</label>
            <NumberInput
              value={position.z}
              onChange={(v) => handlePositionChange('z', v)}
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
                <NumberInput
                  value={quaternion.w}
                  onChange={(v) => handleQuaternionChange('w', v)}
                  disabled={disabled}
                  className={`${inputClass} ${!isNormalized && magnitude > 0 ? 'border-amber-300' : ''}`}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClass}>X</label>
                <NumberInput
                  value={quaternion.x}
                  onChange={(v) => handleQuaternionChange('x', v)}
                  disabled={disabled}
                  className={`${inputClass} ${!isNormalized && magnitude > 0 ? 'border-amber-300' : ''}`}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClass}>Y</label>
                <NumberInput
                  value={quaternion.y}
                  onChange={(v) => handleQuaternionChange('y', v)}
                  disabled={disabled}
                  className={`${inputClass} ${!isNormalized && magnitude > 0 ? 'border-amber-300' : ''}`}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClass}>Z</label>
                <NumberInput
                  value={quaternion.z}
                  onChange={(v) => handleQuaternionChange('z', v)}
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
                <NumberInput
                  value={parseFloat(getDisplayEuler('x').toFixed(4))}
                  onChange={(v) => handleEulerChange('x', v)}
                  disabled={disabled}
                  className={inputClass}
                  step={useDegrees ? "1" : "0.01"}
                />
              </div>
              <div>
                <label className={labelClass}>Y (Pitch)</label>
                <NumberInput
                  value={parseFloat(getDisplayEuler('y').toFixed(4))}
                  onChange={(v) => handleEulerChange('y', v)}
                  disabled={disabled}
                  className={inputClass}
                  step={useDegrees ? "1" : "0.01"}
                />
              </div>
              <div>
                <label className={labelClass}>Z (Yaw)</label>
                <NumberInput
                  value={parseFloat(getDisplayEuler('z').toFixed(4))}
                  onChange={(v) => handleEulerChange('z', v)}
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
