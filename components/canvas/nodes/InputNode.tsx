/**
 * ModelForge - 数据输入节点
 */

'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'

interface InputNodeData {
  label: string
  source: 'manual' | 'akshare' | 'excel' | 'api'
  dataType: 'stock' | 'financials' | 'market' | 'custom'
  value?: unknown
}

export const InputNode = memo(function InputNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as InputNodeData

  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-md min-w-[150px]
        ${selected ? 'border-blue-500' : 'border-blue-300'}
      `}
    >
      {/* Header */}
      <div className="bg-blue-50 px-3 py-2 rounded-t-md border-b border-blue-200 flex items-center gap-2">
        <Database className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-sm text-blue-800">{nodeData.label || '数据输入'}</span>
      </div>

      {/* Content */}
      <div className="p-3 text-xs text-gray-600">
        <div>来源: {nodeData.source === 'akshare' ? 'AKShare' : nodeData.source}</div>
        <div>类型: {nodeData.dataType}</div>
        {nodeData.value !== undefined && (
          <div className="mt-1 font-mono text-blue-600">{String(nodeData.value)}</div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  )
})