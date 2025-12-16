import { useState, useCallback } from 'react'
import { MatrixDisplay } from './MatrixDisplay'
import { formatNumber } from '../utils/posemath'
import type { Pose } from '../utils/posemath'

interface ResultCardProps {
  result: Pose
  resultMatrix: number[][]
  onUseAsInput: () => void
}

export function ResultCard({ result, resultMatrix, onUseAsInput }: ResultCardProps) {
  const [copiedPos, setCopiedPos] = useState(false)
  const [copiedQuat, setCopiedQuat] = useState(false)

  const copyPosition = useCallback(async () => {
    const text = `${formatNumber(result.position.x)}, ${formatNumber(result.position.y)}, ${formatNumber(result.position.z)}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPos(true)
      setTimeout(() => setCopiedPos(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [result.position])

  const copyQuaternion = useCallback(async () => {
    const text = `${formatNumber(result.quaternion.x)}, ${formatNumber(result.quaternion.y)}, ${formatNumber(result.quaternion.z)}, ${formatNumber(result.quaternion.w)}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedQuat(true)
      setTimeout(() => setCopiedQuat(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [result.quaternion])

  const valueClass = "font-mono text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-lg">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Result</h3>
              <p className="text-xs text-slate-500">Transformed pose</p>
            </div>
          </div>
          <button
            onClick={onUseAsInput}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 px-4 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center gap-2"
          >
            <span>↑</span>
            Use as New Input
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Position */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">Position</span>
            </span>
            <button
              onClick={copyPosition}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              {copiedPos ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1">X</label>
              <div className={valueClass}>{formatNumber(result.position.x)}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1">Y</label>
              <div className={valueClass}>{formatNumber(result.position.y)}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1">Z</label>
              <div className={valueClass}>{formatNumber(result.position.z)}</div>
            </div>
          </div>
        </div>

        {/* Quaternion */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">Quaternion</span>
            </span>
            <button
              onClick={copyQuaternion}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              {copiedQuat ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1">X</label>
              <div className={valueClass}>{formatNumber(result.quaternion.x)}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1">Y</label>
              <div className={valueClass}>{formatNumber(result.quaternion.y)}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1">Z</label>
              <div className={valueClass}>{formatNumber(result.quaternion.z)}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1">W</label>
              <div className={valueClass}>{formatNumber(result.quaternion.w)}</div>
            </div>
          </div>
        </div>

        {/* Matrix */}
        <MatrixDisplay
          matrix={resultMatrix}
          label="Result Transformation Matrix"
          defaultCollapsed={false}
        />
      </div>
    </div>
  )
}
