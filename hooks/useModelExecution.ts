/**
 * ModelForge - 模型执行钩子
 * 将 React Flow 节点转换为计算图并执行
 */

import { useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { ComputationGraph, ExecutionEngine } from '@/lib/engine/graph'
import type { ModelNode, ModelEdge, ExecutionResult } from '@/types'

// 转换 React Flow 节点到计算图节点
function convertToModelNodes(nodes: Node[]): ModelNode[] {
  return nodes.map((node) => {
    const baseNode = {
      id: node.id,
      type: node.type as ModelNode['type'],
      label: (node.data.label as string) || (node.data.name as string) || node.type || '节点',
      position: node.position,
      data: node.data
    }

    // 根据类型确保数据结构正确
    switch (node.type) {
      case 'input':
        return {
          ...baseNode,
          type: 'input',
          data: {
            source: (node.data.source as string) || 'manual',
            dataType: (node.data.dataType as string) || 'number',
            value: node.data.value
          }
        } as ModelNode
      case 'assumption':
        return {
          ...baseNode,
          type: 'assumption',
          data: {
            name: (node.data.name as string) || '假设',
            value: node.data.value ?? 0,
            unit: (node.data.unit as string) || '',
            description: (node.data.description as string) || ''
          }
        } as ModelNode
      case 'formula':
        return {
          ...baseNode,
          type: 'formula',
          data: {
            expression: (node.data.expression as string) || '',
            inputs: [],
            output: node.data.output
          }
        } as ModelNode
      case 'table':
        return {
          ...baseNode,
          type: 'table',
          data: {
            rows: 3,
            columns: ((node.data.headers as string[]) || []).length || 3,
            cells: (node.data.cells as Record<string, { value: unknown }>) || {},
            headers: (node.data.headers as string[]) || ['列1', '列2', '列3']
          }
        } as ModelNode
      case 'module':
        return {
          ...baseNode,
          type: 'module',
          data: {
            childNodes: (node.data.childNodes as string[]) || [],
            childEdges: [],
            inputs: (node.data.inputs as { id: string; label: string }[]) || [],
            outputs: (node.data.outputs as { id: string; label: string }[]) || []
          }
        } as ModelNode
      default:
        return baseNode as ModelNode
    }
  })
}

// 转换 React Flow 边到计算图边
function convertToModelEdges(edges: Edge[]): ModelEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    label: edge.label as string | undefined,
    animated: edge.animated
  }))
}

export function useModelExecution() {
  const executeModel = useCallback(
    async (nodes: Node[], edges: Edge[]): Promise<ExecutionResult> => {
      const engine = new ExecutionEngine()

      // 转换节点和边
      const modelNodes = convertToModelNodes(nodes)
      const modelEdges = convertToModelEdges(edges)

      // 创建计算图
      const graph = new ComputationGraph(modelNodes, modelEdges)

      // 执行
      return engine.execute(graph)
    },
    []
  )

  return { executeModel }
}

// 更新节点结果
export function updateNodesWithResults(
  nodes: Node[],
  results: Record<string, unknown>
): Node[] {
  return nodes.map((node) => {
    const result = results[node.id]
    if (result !== undefined) {
      // 根据节点类型更新不同的字段
      if (node.type === 'formula') {
        return {
          ...node,
          data: { ...node.data, output: result }
        }
      }
      if (node.type === 'output') {
        return {
          ...node,
          data: { ...node.data, value: result }
        }
      }
      if (node.type === 'input' || node.type === 'assumption') {
        return {
          ...node,
          data: { ...node.data, value: result }
        }
      }
    }
    return node
  })
}