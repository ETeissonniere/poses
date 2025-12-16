import { useCallback } from 'react'
import { isQuaternionNormalized, normalizeQuaternion, quaternionMagnitude } from '../utils/posemath'

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
  const isNormalized = isQuaternionNormalized(quaternion)
  const magnitude = quaternionMagnitude(quaternion)

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

      {/* Quaternion inputs */}
      <div>
        <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">Quaternion</span>
          {!isNormalized && magnitude > 0 && (
            <span className="text-amber-600 text-xs">
              |q| = {magnitude.toFixed(4)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3">
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
        </div>

        {/* Normalize button */}
        {!isNormalized && magnitude > 0 && !disabled && (
          <button
            onClick={handleNormalize}
            className="mt-2 text-xs text-amber-700 hover:text-amber-800 underline transition-colors"
          >
            Normalize quaternion
          </button>
        )}
      </div>
    </div>
  )
}
