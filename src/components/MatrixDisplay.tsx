import { useState, useCallback } from 'react'
import { formatNumber } from '../utils/posemath'

interface MatrixDisplayProps {
  matrix: number[][]
  label?: string
  defaultCollapsed?: boolean
}

export function MatrixDisplay({ matrix, label, defaultCollapsed = false }: MatrixDisplayProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const text = matrix
      .map(row => row.map(n => formatNumber(n, 6)).join('\t'))
      .join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [matrix])

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-100 cursor-pointer hover:bg-slate-150 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">
            {collapsed ? '▶' : '▼'}
          </span>
          <span className="text-xs font-medium text-slate-600">
            {label || '4×4 Transformation Matrix'}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleCopy()
          }}
          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Matrix grid */}
      {!collapsed && (
        <div className="p-3">
          <div className="grid grid-cols-4 gap-1 font-mono text-xs">
            {matrix.map((row, i) =>
              row.map((value, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`
                    px-2 py-1.5 text-right rounded
                    ${i === j ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-700'}
                    ${j === 3 && i < 3 ? 'bg-green-50 text-green-700' : ''}
                    ${i === 3 ? 'bg-slate-100 text-slate-500' : ''}
                    border border-slate-100
                  `}
                >
                  {formatNumber(value, 4)}
                </div>
              ))
            )}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-slate-400">
            <span><span className="inline-block w-3 h-3 bg-blue-50 border border-blue-200 rounded mr-1"></span>Diagonal</span>
            <span><span className="inline-block w-3 h-3 bg-green-50 border border-green-200 rounded mr-1"></span>Translation</span>
          </div>
        </div>
      )}
    </div>
  )
}
