/**
 * ModelForge - 主画布组件
 * 使用 React Flow 实现节点编辑器
 */

'use client'

import { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  Panel
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { InputNode } from './nodes/InputNode'
import { FormulaNode } from './nodes/FormulaNode'
import { AssumptionNode } from './nodes/AssumptionNode'
import { TableNode } from './nodes/TableNode'
import { ModuleNode } from './nodes/ModuleNode'
import { OutputNode } from './nodes/OutputNode'
import { DCFNode } from './nodes/DCFNode'

// 注册自定义节点类型
const nodeTypes = {
  input: InputNode,
  formula: FormulaNode,
  assumption: AssumptionNode,
  table: TableNode,
  module: ModuleNode,
  output: OutputNode,
  dcf: DCFNode
} as NodeTypes

// 默认节点数据模板
const defaultNodeData: Record<string, Record<string, unknown>> = {
  input: { label: '数据输入', source: 'manual', dataType: 'number' },
  assumption: { name: '假设', value: 0, unit: '', description: '' },
  formula: { label: '公式计算', expression: '', output: null },
  table: { label: '表格', headers: ['列1', '列2', '列3'], cells: {} },
  module: { label: '模块', childNodes: [], inputs: [], outputs: [] },
  output: { name: '输出', format: 'number', value: null, chartType: 'bar' },
  dcf: { label: 'DCF估值', inputs: {}, outputs: undefined, sensitivityEnabled: false }
}

interface ModelCanvasProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
  onNodeDoubleClick?: (node: Node) => void
  readOnly?: boolean
}

function ModelCanvasInternal({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  onNodeDoubleClick,
  readOnly = false
}: ModelCanvasProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  // 处理连接
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
      onEdgesChange?.(edges)
    },
    [edges, onEdgesChange, setEdges]
  )

  // 节点变化处理
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChangeInternal>[0]) => {
      onNodesChangeInternal(changes)
      onNodesChange?.(nodes)
    },
    [nodes, onNodesChange, onNodesChangeInternal]
  )

  // 边变化处理
  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChangeInternal>[0]) => {
      onEdgesChangeInternal(changes)
      onEdgesChange?.(edges)
    },
    [edges, onEdgesChange, onEdgesChangeInternal]
  )

  // 拖拽放置处理
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      // 获取节点类型
      const nodeType = event.dataTransfer.getData('application/reactflow')
      if (!nodeType || !defaultNodeData[nodeType]) return

      // 计算放置位置
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      })

      // 创建新节点
      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { ...defaultNodeData[nodeType] }
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes]
  )

  // 双击节点处理
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeDoubleClick?.(node)
    },
    [onNodeDoubleClick]
  )

  // MiniMap 节点颜色
  const nodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'input':
        return '#3b82f6' // blue
      case 'assumption':
        return '#8b5cf6' // purple
      case 'formula':
        return '#10b981' // green
      case 'table':
        return '#f59e0b' // amber
      case 'module':
        return '#6366f1' // indigo
      case 'output':
        return '#ef4444' // red
      case 'dcf':
        return '#06b6d4' // cyan
      default:
        return '#6b7280' // gray
    }
  }, [])

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : handleNodesChange}
        onEdgesChange={readOnly ? undefined : handleEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Background color="#aaa" gap={16} />
        <Controls showInteractive={!readOnly} />
        <MiniMap nodeColor={nodeColor} nodeStrokeWidth={3} zoomable pannable />
        <Panel position="top-right" className="bg-white/80 p-2 rounded shadow-sm">
          <div className="text-xs text-gray-500">
            节点: {nodes.length} | 连接: {edges.length}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

// 导出带 Provider 的组件
export function ModelCanvas(props: ModelCanvasProps) {
  return (
    <ReactFlowProvider>
      <ModelCanvasInternal {...props} />
    </ReactFlowProvider>
  )
}