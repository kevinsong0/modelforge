/**
 * ModelForge - 表格节点
 */

'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Table } from 'lucide-react'

interface TableNodeData {
  label: string
  headers: string[]
  cells: Record<string, { value: unknown }>
}

export const TableNode = memo(function TableNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TableNodeData
  const headers = nodeData.headers || ['列1', '列2', '列3']

  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-md min-w-[250px]
        ${selected ? 'border-amber-500' : 'border-amber-300'}
      `}
    >
      {/* Header */}
      <div className="bg-amber-50 px-3 py-2 rounded-t-md border-b border-amber-200 flex items-center gap-2">
        <Table className="w-4 h-4 text-amber-600" />
        <span className="font-medium text-sm text-amber-800">{nodeData.label || '表格'}</span>
      </div>

      {/* Table */}
      <div className="p-2 overflow-auto max-h-[200px]">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="bg-amber-100 border border-amber-200 px-2 py-1 text-left font-medium text-amber-800"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((row) => (
              <tr key={row}>
                {headers.map((_, col) => (
                  <td
                    key={col}
                    className="border border-amber-100 px-2 py-1 text-gray-600"
                  >
                    {nodeData.cells?.[`${row}-${col}`]?.value != null
                      ? String(nodeData.cells[`${row}-${col}`].value)
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />
    </div>
  )
})