/**
 * ModelForge - 模块节点
 */

'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Package } from 'lucide-react'

interface ModuleNodeData {
  label: string
  childNodes: string[]
  inputs: { id: string; label: string }[]
  outputs: { id: string; label: string }[]
}

export const ModuleNode = memo(function ModuleNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ModuleNodeData

  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-md min-w-[160px]
        ${selected ? 'border-indigo-500' : 'border-indigo-300'}
      `}
    >
      {/* Header */}
      <div className="bg-indigo-50 px-3 py-2 rounded-t-md border-b border-indigo-200 flex items-center gap-2">
        <Package className="w-4 h-4 text-indigo-600" />
        <span className="font-medium text-sm text-indigo-800">{nodeData.label || '模块'}</span>
      </div>

      {/* Content */}
      <div className="p-3 text-xs text-gray-600">
        <div>包含 {nodeData.childNodes?.length || 0} 个子节点</div>
        <div className="mt-1 text-indigo-600">
          输入: {nodeData.inputs?.length || 0} | 输出: {nodeData.outputs?.length || 0}
        </div>
      </div>

      {/* Input Handles */}
      {(nodeData.inputs || []).map((input, i) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className="w-3 h-3 bg-indigo-500 border-2 border-white"
          style={{ top: 60 + i * 20 }}
        />
      ))}

      {/* Output Handles */}
      {(nodeData.outputs || []).map((output, i) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className="w-3 h-3 bg-indigo-500 border-2 border-white"
          style={{ top: 60 + i * 20 }}
        />
      ))}
    </div>
  )
})