/**
 * ModelForge - 模型编辑器页面
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModelCanvas } from '@/components/canvas/ModelCanvas'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { NodeEditorDialog } from '@/components/canvas/NodeEditorDialog'
import { useModelExecution, updateNodesWithResults } from '@/hooks/useModelExecution'
import { useModelPersistence } from '@/hooks/useModelPersistence'
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { modelTemplates, getTemplateById, createTemplateInstance } from '@/lib/templates/model-templates'
import { exportModelToExcel, importModelFromExcel } from '@/lib/excel'
import {
  Play,
  Save,
  Download,
  Upload,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  Check,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'
import type { Node, Edge } from '@xyflow/react'

// 示例节点数据
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: '历史收入', source: 'akshare', dataType: 'financials' }
  },
  {
    id: '2',
    type: 'assumption',
    position: { x: 100, y: 250 },
    data: { name: '收入增长率', value: '15%', unit: '%', description: '预期年收入增长率' }
  },
  {
    id: '3',
    type: 'assumption',
    position: { x: 100, y: 380 },
    data: { name: 'EBITDA 利润率', value: '20%', unit: '%', description: 'EBITDA/收入' }
  },
  {
    id: '4',
    type: 'formula',
    position: { x: 400, y: 200 },
    data: {
      label: '收入预测',
      expression: 'revenue * (1 + growth_rate)',
      output: null
    }
  },
  {
    id: '5',
    type: 'output',
    position: { x: 700, y: 200 },
    data: { name: '预测收入', format: 'number', value: null }
  }
]

const initialEdges: Edge[] = [
  { id: 'e1-4', source: '1', target: '4', animated: true },
  { id: 'e2-4', source: '2', target: '4', animated: true },
  { id: 'e4-5', source: '4', target: '5', animated: true }
]

export default function ModelEditorPage() {
  const params = useParams()
  const modelId = params.id as string

  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [showChat, setShowChat] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [modelName, setModelName] = useState('未命名模型')
  const [modelDescription, setModelDescription] = useState('')

  const { executeModel } = useModelExecution()
  const {
    isSaving,
    isLoading,
    lastSaved,
    error: persistenceError,
    hasUnsavedChanges,
    loadModel,
    saveModel,
    exportModel,
    importModel
  } = useModelPersistence(modelId === 'new' ? null : modelId)

  const {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clearHistory
  } = useUndoRedo({ maxHistorySize: 50 })

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes)
    pushState(newNodes, edges)
  }, [edges, pushState])

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges)
    pushState(nodes, newEdges)
  }, [nodes, pushState])

  // 撤销
  const handleUndo = useCallback(() => {
    const state = undo()
    if (state) {
      setNodes(state.nodes)
      setEdges(state.edges)
    }
  }, [undo])

  // 重做
  const handleRedo = useCallback(() => {
    const state = redo()
    if (state) {
      setNodes(state.nodes)
      setEdges(state.edges)
    }
  }, [redo])

  const handleSave = useCallback(async () => {
    const result = await saveModel(nodes, edges, modelName, modelDescription)
    if (!result.success) {
      setExecutionError(result.error || '保存失败')
    }
  }, [nodes, edges, modelName, modelDescription, saveModel])

  // 键盘快捷键 - 必须放在 handleUndo/handleRedo/handleSave 定义之后
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z: 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      // Ctrl+Y / Cmd+Y 或 Ctrl+Shift+Z: 重做
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
      // Ctrl+S / Cmd+S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, handleSave])

  // 加载已有模型
  useEffect(() => {
    if (modelId && modelId !== 'new') {
      loadModel(modelId).then((model) => {
        if (model) {
          setNodes(model.nodes)
          setEdges(model.edges)
          setModelName(model.name)
          setModelDescription(model.description || '')
          // 初始化历史记录
          pushState(model.nodes, model.edges)
        }
      })
    }
  }, [modelId, loadModel, pushState])

  const handleNodeDoubleClick = useCallback((node: Node) => {
    setEditingNode(node)
    setShowNodeEditor(true)
  }, [])

  const handleSaveNode = useCallback((nodeId: string, newData: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: newData } : node
      )
    )
  }, [])

  const handleExecute = async () => {
    setIsExecuting(true)
    setExecutionError(null)

    try {
      const result = await executeModel(nodes, edges)

      if (result.success) {
        // 更新节点结果
        const updatedNodes = updateNodesWithResults(nodes, result.outputs)
        setNodes(updatedNodes)
      } else {
        // 显示错误
        const errorMessages = result.errors.map(e => `${e.nodeId}: ${e.message}`).join('\n')
        setExecutionError(errorMessages)
      }
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : '执行失败')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleLoadTemplate = useCallback((templateId: string) => {
    const template = getTemplateById(templateId)
    if (!template) return

    const { nodes: newNodes, edges: newEdges } = createTemplateInstance(template)
    setNodes(newNodes)
    setEdges(newEdges)
    setExecutionError(null)
  }, [])

  const handleExport = useCallback(() => {
    exportModel({
      id: modelId || 'export',
      name: modelName,
      description: modelDescription,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    })
  }, [modelId, modelName, modelDescription, nodes, edges, exportModel])

  // Excel 导出
  const handleExportExcel = useCallback(() => {
    exportModelToExcel({
      name: modelName,
      description: modelDescription,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }, [modelName, modelDescription, nodes, edges])

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检测文件类型
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (isExcel) {
      // Excel 导入
      const result = await importModelFromExcel(file)
      if (result.success && result.data) {
        setNodes(result.data.nodes)
        setEdges(result.data.edges)
        setModelName(result.data.name)
        setModelDescription(result.data.description || '')
      } else {
        setExecutionError(result.error || 'Excel 导入失败')
      }
    } else {
      // JSON 导入
      const model = await importModel(file)
      if (model) {
        setNodes(model.nodes)
        setEdges(model.edges)
        setModelName(model.name)
        setModelDescription(model.description || '')
      }
    }
    // 重置 input
    event.target.value = ''
  }, [importModel])

  // 添加节点
  const handleAddNode = useCallback((type: string, data: Record<string, unknown>) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 300 + Math.random() * 100, y: 200 + Math.random() * 100 },
      data: { ...data }
    }
    setNodes((nds) => [...nds, newNode])
    pushState([...nodes, newNode], edges)
  }, [nodes, edges, pushState])

  // 连接节点
  const handleConnectNodes = useCallback((sourceId: string, targetId: string) => {
    const newEdge: Edge = {
      id: `e${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      animated: true
    }
    setEdges((eds) => [...eds, newEdge])
    pushState(nodes, [...edges, newEdge])
  }, [nodes, edges, pushState])

  // 删除节点
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    const newNodes = nodes.filter((n) => n.id !== nodeId)
    const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
    pushState(newNodes, newEdges)
  }, [nodes, edges, pushState])

  // 更新节点
  const handleUpdateNodeFromChat = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    )
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            placeholder="模型名称"
          />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" title="撤销" onClick={handleUndo} disabled={!canUndo}>
              <Undo className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">撤销</span>
            </Button>
            <Button variant="ghost" size="sm" title="重做" onClick={handleRedo} disabled={!canRedo}>
              <Redo className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">重做</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 保存状态指示器 */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>保存中...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>未保存</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span>已保存</span>
              </>
            ) : null}
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json,.xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
            <span className="inline-flex items-center justify-center gap-2 h-7 px-2.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              导入
            </span>
          </label>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            导出
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel} title="导出为 Excel">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4" />
            保存
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            <Play className="w-4 h-4" />
            {isExecuting ? '计算中...' : '运行'}
          </Button>
        </div>
      </header>

      {/* Error display */}
      {executionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          <strong>执行错误：</strong>
          <pre className="whitespace-pre-wrap mt-1">{executionError}</pre>
        </div>
      )}

      {/* Persistence error display */}
      {persistenceError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700">
          <strong>保存警告：</strong>
          {persistenceError}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          正在加载模型...
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Node palette */}
        <aside className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">节点库</h2>
            <div className="space-y-2">
              <NodePaletteItem type="input" label="数据输入" color="blue" />
              <NodePaletteItem type="assumption" label="假设" color="purple" />
              <NodePaletteItem type="formula" label="公式计算" color="green" />
              <NodePaletteItem type="table" label="表格" color="amber" />
              <NodePaletteItem type="module" label="模块" color="indigo" />
              <NodePaletteItem type="output" label="输出" color="red" />
              <NodePaletteItem type="dcf" label="DCF估值" color="cyan" />
            </div>
          </div>

          <div className="p-4 border-t">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">模板</h2>
            <div className="space-y-2">
              {modelTemplates.map((template) => (
                <TemplateItem
                  key={template.id}
                  id={template.id}
                  label={template.name}
                  onClick={handleLoadTemplate}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ModelCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDoubleClick={handleNodeDoubleClick}
          />

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white rounded-lg shadow-sm border p-1">
            <Button variant="ghost" size="sm">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-500 px-2">100%</span>
            <Button variant="ghost" size="sm">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right panel - Chat */}
        {showChat && (
          <aside className="w-96 border-l bg-white">
            <ChatPanel
              nodes={nodes}
              edges={edges}
              onAddNode={handleAddNode}
              onConnectNodes={handleConnectNodes}
              onDeleteNode={handleDeleteNode}
              onUpdateNode={handleUpdateNodeFromChat}
            />
          </aside>
        )}
      </div>

      {/* Toggle chat button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed right-4 top-20 bg-white rounded-lg shadow-sm border p-2 hover:bg-gray-50"
      >
        {showChat ? (
          <PanelRightClose className="w-5 h-5 text-gray-600" />
        ) : (
          <PanelRightOpen className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Node Editor Dialog */}
      <NodeEditorDialog
        node={editingNode}
        open={showNodeEditor}
        onOpenChange={setShowNodeEditor}
        onSave={handleSaveNode}
      />
    </div>
  )
}

function NodePaletteItem({
  type,
  label,
  color
}: {
  type: string
  label: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 border-blue-300 text-blue-700',
    purple: 'bg-purple-100 border-purple-300 text-purple-700',
    green: 'bg-green-100 border-green-300 text-green-700',
    amber: 'bg-amber-100 border-amber-300 text-amber-700',
    indigo: 'bg-indigo-100 border-indigo-300 text-indigo-700',
    red: 'bg-red-100 border-red-300 text-red-700',
    cyan: 'bg-cyan-100 border-cyan-300 text-cyan-700'
  }

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className={`px-3 py-2 rounded-lg border cursor-grab ${colorClasses[color]} hover:shadow-sm transition-shadow`}
      draggable
      onDragStart={onDragStart}
    >
      {label}
    </div>
  )
}

function TemplateItem({
  id,
  label,
  onClick
}: {
  id: string
  label: string
  onClick: (id: string) => void
}) {
  return (
    <button
      className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  )
}