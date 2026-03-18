/**
 * ModelForge - 公式计算节点
 */

'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Calculator } from 'lucide-react'

interface FormulaNodeData {
  label: string
  expression: string
  output?: number | string
}

export const FormulaNode = memo(function FormulaNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FormulaNodeData

  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-md min-w-[180px]
        ${selected ? 'border-green-500' : 'border-green-300'}
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />

      {/* Header */}
      <div className="bg-green-50 px-3 py-2 rounded-t-md border-b border-green-200 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-green-600" />
        <span className="font-medium text-sm text-green-800">{nodeData.label || '公式计算'}</span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">公式:</div>
        <div className="font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200 text-green-700">
          {nodeData.expression || '未设置'}
        </div>
        {nodeData.output !== undefined && (
          <div className="mt-2 text-xs">
            <span className="text-gray-500">结果: </span>
            <span className="font-bold text-green-600">{nodeData.output}</span>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  )
})