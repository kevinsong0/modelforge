/**
 * ModelForge - 输出节点
 */

'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileOutput } from 'lucide-react'
import { OutputChart, formatValue, generateChartData, type ChartData } from '@/components/output/OutputChart'

interface OutputNodeData {
  name: string
  format: 'number' | 'text' | 'table' | 'chart'
  chartType?: 'line' | 'bar' | 'pie'
  value?: unknown
}

export const OutputNode = memo(function OutputNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as OutputNodeData

  // 渲染输出值
  const renderValue = () => {
    const { format, value, chartType = 'bar' } = nodeData

    if (value === undefined || value === null) {
      return <div className="text-xs text-gray-400 italic">等待输入</div>
    }

    switch (format) {
      case 'chart': {
        const chartData = generateChartData(value as Record<string, unknown>)
        if (!chartData) {
          return <div className="text-sm text-red-500">无效图表数据</div>
        }
        return (
          <div className="mt-2 min-w-[200px]">
            <OutputChart type={chartType} data={chartData} height={150} />
          </div>
        )
      }
      case 'table': {
        // 简单表格渲染
        if (Array.isArray(value)) {
          return (
            <div className="mt-2 text-xs overflow-auto max-h-32">
              <table className="border-collapse border border-gray-300">
                <tbody>
                  {value.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Array.isArray(row)
                        ? row.map((cell, j) => (
                            <td key={j} className="border border-gray-200 px-2 py-1">
                              {String(cell)}
                            </td>
                          ))
                        : (
                            <td className="border border-gray-200 px-2 py-1">
                              {String(row)}
                            </td>
                          )}
                    </tr>
                  ))}
                  {value.length > 5 && (
                    <tr>
                      <td colSpan={99} className="text-center text-gray-400 px-2 py-1">
                        ... 还有 {value.length - 5} 行
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        }
        return <div className="text-sm text-red-500">无效表格数据</div>
      }
      case 'number':
        return (
          <div className="mt-2 text-xl font-bold text-red-600">
            {typeof value === 'number' ? formatValue(value, 'number') : String(value)}
          </div>
        )
      case 'text':
      default:
        return (
          <div className="mt-2 text-sm text-gray-700 max-w-[200px] break-words">
            {String(value)}
          </div>
        )
    }
  }

  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-md min-w-[140px]
        ${selected ? 'border-red-500' : 'border-red-300'}
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />

      {/* Header */}
      <div className="bg-red-50 px-3 py-2 rounded-t-md border-b border-red-200 flex items-center gap-2">
        <FileOutput className="w-4 h-4 text-red-600" />
        <span className="font-medium text-sm text-red-800">{nodeData.name || '输出'}</span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-xs text-gray-500">
          格式: {nodeData.format}
          {nodeData.format === 'chart' && nodeData.chartType && ` (${nodeData.chartType})`}
        </div>
        {renderValue()}
      </div>
    </div>
  )
})