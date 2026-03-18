/**
 * ModelForge - AI 聊天 API
 * 支持模型上下文感知和建议操作
 * 使用 ModelBuilderAgent 连接真实 LLM
 */

import { NextRequest, NextResponse } from 'next/server'
import { ModelBuilderAgent } from '@/lib/ai/agent'
import type { ModelNode, ModelEdge } from '@/types'

// 模型上下文接口
interface ModelContext {
  nodeCount: number
  edgeCount: number
  nodeTypes: Array<{ id: string; type: string; label?: string }>
  recentConnections: Array<{ source: string; target: string }>
}

// 建议操作接口
interface SuggestedAction {
  type: 'add_node' | 'connect_nodes' | 'delete_node' | 'set_value'
  label: string
  data?: Record<string, unknown>
}

// 默认节点数据模板
const defaultNodeData: Record<string, Record<string, unknown>> = {
  input: { label: '数据输入', source: 'manual', dataType: 'number' },
  assumption: { name: '假设', value: 0, unit: '', description: '' },
  formula: { label: '公式计算', expression: '', output: null },
  table: { label: '表格', headers: ['列1', '列2', '列3'], cells: {} },
  module: { label: '模块', childNodes: [], inputs: [], outputs: [] },
  output: { name: '输出', format: 'number', value: null, chartType: 'bar' },
  dcf: { label: 'DCF 估值', sensitivityEnabled: false }
}

// AI 设置接口
interface AISettings {
  provider: string
  apiKey: string
  baseURL: string
  model: string
}

// 创建 AI Agent 实例
const createAgent = (settings?: AISettings) => {
  // 优先使用用户传入的设置，其次使用环境变量
  return new ModelBuilderAgent({
    apiKey: settings?.apiKey || process.env.OPENAI_API_KEY,
    baseURL: settings?.baseURL || process.env.OPENAI_BASE_URL,
    model: settings?.model || process.env.OPENAI_MODEL
  })
}

/**
 * 解析 AI 响应中的操作建议
 */
function parseSuggestedActions(response: string, modelContext?: ModelContext): SuggestedAction[] {
  const actions: SuggestedAction[] = []

  // 根据关键词和上下文生成建议操作
  const lowerResponse = response.toLowerCase()

  // DCF 相关建议
  if (lowerResponse.includes('dcf') || lowerResponse.includes('估值')) {
    if (modelContext && !modelContext.nodeTypes.some(n => n.type === 'dcf')) {
      actions.push({
        type: 'add_node',
        label: '添加 DCF 估值节点',
        data: { nodeType: 'dcf', nodeData: defaultNodeData.dcf }
      })
    }
  }

  // 假设相关建议
  if (lowerResponse.includes('假设') || lowerResponse.includes('参数')) {
    if (modelContext && !modelContext.nodeTypes.some(n => n.type === 'assumption')) {
      actions.push({
        type: 'add_node',
        label: '添加假设节点',
        data: { nodeType: 'assumption', nodeData: { ...defaultNodeData.assumption, name: '新假设', value: 0 } }
      })
    }
  }

  // 数据输入相关建议
  if (lowerResponse.includes('数据') || lowerResponse.includes('输入') || lowerResponse.includes('股票')) {
    if (modelContext && !modelContext.nodeTypes.some(n => n.type === 'input')) {
      actions.push({
        type: 'add_node',
        label: '添加数据输入节点',
        data: { nodeType: 'input', nodeData: { ...defaultNodeData.input, source: 'akshare', dataType: 'financials' } }
      })
    }
  }

  // 公式相关建议
  if (lowerResponse.includes('公式') || lowerResponse.includes('计算')) {
    if (modelContext && !modelContext.nodeTypes.some(n => n.type === 'formula')) {
      actions.push({
        type: 'add_node',
        label: '添加公式节点',
        data: { nodeType: 'formula', nodeData: defaultNodeData.formula }
      })
    }
  }

  // 输出相关建议
  if (lowerResponse.includes('输出') || lowerResponse.includes('结果')) {
    if (modelContext && !modelContext.nodeTypes.some(n => n.type === 'output')) {
      actions.push({
        type: 'add_node',
        label: '添加输出节点',
        data: { nodeType: 'output', nodeData: defaultNodeData.output }
      })
    }
  }

  return actions
}

/**
 * 构建上下文描述
 */
function buildContextDescription(modelContext?: ModelContext): string {
  if (!modelContext || modelContext.nodeCount === 0) {
    return '当前模型为空，没有任何节点。'
  }

  const nodeTypeCounts: Record<string, number> = {}
  modelContext.nodeTypes.forEach(n => {
    nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] || 0) + 1
  })

  let desc = `当前模型包含 ${modelContext.nodeCount} 个节点，${modelContext.edgeCount} 条连接。\n`
  desc += `节点类型分布：${Object.entries(nodeTypeCounts).map(([type, count]) => `${type}(${count})`).join('、')}。\n`

  if (modelContext.recentConnections.length > 0) {
    desc += `最近的连接：${modelContext.recentConnections.slice(0, 3).map(c => `${c.source}→${c.target}`).join('、')}。`
  }

  return desc
}

export async function POST(request: NextRequest) {
  try {
    const { message, modelContext, aiSettings } = await request.json() as {
      message?: string
      modelContext?: ModelContext
      aiSettings?: AISettings
    }

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    // 检查是否有可用的 API Key（环境变量或用户设置）
    const hasApiKey = process.env.OPENAI_API_KEY || aiSettings?.apiKey
    if (!hasApiKey) {
      // 如果没有配置 API Key，返回提示信息
      return NextResponse.json({
        response: `⚠️ AI 功能尚未配置。

请在项目根目录创建 \`.env.local\` 文件并配置以下环境变量：

\`\`\`
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
\`\`\`

支持 OpenAI 兼容的 API（如 DeepSeek、Kimi、XAI 等）。

配置完成后重启开发服务器即可使用 AI 助手功能。`,
        suggestedActions: []
      })
    }

    // 创建 Agent 并发送消息
    const agent = createAgent(aiSettings)

    // 构建上下文
    const contextDescription = buildContextDescription(modelContext)
    const enhancedMessage = `${message}\n\n【模型上下文】\n${contextDescription}`

    // 获取 AI 响应
    const response = await agent.chat(enhancedMessage, {
      nodes: modelContext?.nodeTypes as unknown as ModelNode[],
      edges: []
    })

    // 解析建议操作
    const suggestedActions = parseSuggestedActions(response, modelContext)

    return NextResponse.json({ response, suggestedActions })
  } catch (error) {
    console.error('AI Chat API Error:', error)

    // 返回更友好的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        response: `抱歉，AI 服务暂时遇到问题：${errorMessage}\n\n请检查：\n1. API Key 是否正确\n2. API Base URL 是否可访问\n3. 模型名称是否正确`,
        suggestedActions: []
      },
      { status: 200 } // 返回 200 以便前端正常显示错误信息
    )
  }
}