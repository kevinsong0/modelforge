/**
 * ModelForge - 假设节点
 */

'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Variable } from 'lucide-react'

interface AssumptionNodeData {
  name: string
  value: number | string
  unit?: string
  description?: string
}

export const AssumptionNode = memo(function AssumptionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AssumptionNodeData

  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-md min-w-[140px]
        ${selected ? 'border-purple-500' : 'border-purple-300'}
      `}
    >
      {/* Header */}
      <div className="bg-purple-50 px-3 py-2 rounded-t-md border-b border-purple-200 flex items-center gap-2">
        <Variable className="w-4 h-4 text-purple-600" />
        <span className="font-medium text-sm text-purple-800">{nodeData.name || '假设'}</span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="text-2xl font-bold text-purple-700">
          {nodeData.value}
          {nodeData.unit && <span className="text-sm text-gray-500 ml-1">{nodeData.unit}</span>}
        </div>
        {nodeData.description && (
          <div className="text-xs text-gray-500 mt-1">{nodeData.description}</div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  )
})