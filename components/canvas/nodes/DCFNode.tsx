/**
 * ModelForge - DCF 估值节点组件
 * 用于 DCF（现金流折现）估值模型的可视化节点
 */

'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react'

interface DCFNodeData {
  label?: string
  inputs?: {
    historicalRevenue?: number[]
    revenueGrowthRate?: number
    ebitdaMargin?: number
    taxRate?: number
    depreciationPercent?: number
    capexPercent?: number
    nwcPercent?: number
    terminalGrowthRate?: number
    discountRate?: number
    projectionYears?: number
  }
  outputs?: {
    enterpriseValue?: number
    equityValue?: number
    perShareValue?: number
    terminalValue?: number
  }
  sensitivityEnabled?: boolean
  sensitivityRange?: {
    waccRange: { min: number; max: number; step: number }
    growthRange: { min: number; max: number; step: number }
  }
}

export const DCFNode = memo(function DCFNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as DCFNodeData
  const hasOutputs = nodeData.outputs && nodeData.outputs.enterpriseValue !== undefined

  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-md min-w-[200px] max-w-[280px]
        ${selected ? 'border-cyan-500 shadow-lg' : 'border-cyan-300'}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-cyan-500 border-2 border-white"
      />

      {/* Header */}
      <div className="bg-cyan-50 px-3 py-2 rounded-t-md border-b border-cyan-200 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-cyan-600" />
        <span className="font-medium text-sm text-cyan-800">
          {nodeData.label || 'DCF 估值'}
        </span>
        {nodeData.sensitivityEnabled && (
          <span title="敏感性分析已启用" className="ml-auto">
            <TrendingUp className="w-3 h-3 text-cyan-500" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 text-xs">
        {/* Input Parameters */}
        <div className="space-y-1">
          <div className="text-gray-500 font-medium">输入参数</div>
          <div className="grid grid-cols-2 gap-1 text-gray-600">
            <span>增长率:</span>
            <span className="text-right font-mono">
              {nodeData.inputs?.revenueGrowthRate !== undefined
                ? `${(nodeData.inputs.revenueGrowthRate * 100).toFixed(1)}%`
                : '-'}
            </span>
            <span>EBITDA率:</span>
            <span className="text-right font-mono">
              {nodeData.inputs?.ebitdaMargin !== undefined
                ? `${(nodeData.inputs.ebitdaMargin * 100).toFixed(1)}%`
                : '-'}
            </span>
            <span>WACC:</span>
            <span className="text-right font-mono">
              {nodeData.inputs?.discountRate !== undefined
                ? `${(nodeData.inputs.discountRate * 100).toFixed(1)}%`
                : '-'}
            </span>
            <span>永续增长:</span>
            <span className="text-right font-mono">
              {nodeData.inputs?.terminalGrowthRate !== undefined
                ? `${(nodeData.inputs.terminalGrowthRate * 100).toFixed(1)}%`
                : '-'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Outputs */}
        <div className="space-y-1">
          <div className="text-gray-500 font-medium">估值结果</div>
          {hasOutputs ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">企业价值:</span>
                <span className="font-mono text-cyan-700 font-semibold">
                  {formatValue(nodeData.outputs!.enterpriseValue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">股权价值:</span>
                <span className="font-mono text-cyan-700 font-semibold">
                  {formatValue(nodeData.outputs!.equityValue)}
                </span>
              </div>
              {nodeData.outputs!.perShareValue !== undefined && (
                <div className="flex justify-between items-center bg-cyan-50 px-2 py-1 rounded">
                  <span className="text-cyan-700">每股价值:</span>
                  <span className="font-mono text-cyan-800 font-bold">
                    {formatValue(nodeData.outputs!.perShareValue)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="w-3 h-3" />
              <span>等待计算</span>
            </div>
          )}
        </div>

        {/* Sensitivity Analysis Indicator */}
        {nodeData.sensitivityEnabled && hasOutputs && (
          <>
            <div className="border-t border-gray-200" />
            <div className="text-cyan-600 text-center">
              📊 敏感性分析已计算
            </div>
          </>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-cyan-500 border-2 border-white"
      />
    </div>
  )
})

/**
 * 格式化数值显示
 */
function formatValue(value: number | undefined): string {
  if (value === undefined) return '-'

  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`
  } else if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`
  } else if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`
  } else {
    return value.toFixed(2)
  }
}