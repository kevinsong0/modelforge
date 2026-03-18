/**
 * ModelForge - AI Agent 服务
 * 处理自然语言交互和模型构建建议
 */

import type { AIIntent, AIMessage, ModelNode, ModelEdge } from '@/types'

/**
 * AI Agent 配置
 */
interface AgentConfig {
  apiKey?: string
  baseURL?: string
  model?: string
}

/**
 * 模型构建 Agent
 */
export class ModelBuilderAgent {
  private config: AgentConfig
  private conversationHistory: AIMessage[] = []

  constructor(config: AgentConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseURL: config.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: config.model || 'gpt-4o'
    }
  }

  /**
   * 发送消息并获取响应
   */
  async chat(message: string, context?: {
    nodes?: ModelNode[]
    edges?: ModelEdge[]
  }): Promise<string> {
    // 添加用户消息到历史
    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    })

    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(context)

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory.map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`AI API 错误: ${response.statusText}`)
      }

      const data = await response.json()
      const assistantMessage = data.choices[0]?.message?.content || '抱歉，我无法处理这个请求。'

      // 添加助手响应到历史
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      })

      return assistantMessage
    } catch (error) {
      console.error('AI Chat Error:', error)
      throw error
    }
  }

  /**
   * 解析用户意图
   */
  async parseIntent(message: string): Promise<AIIntent> {
    const intentPrompt = `分析以下用户消息，识别用户意图。返回 JSON 格式：

消息: "${message}"

可能的操作类型：
- create: 创建新节点或模型
- modify: 修改现有节点或模型
- delete: 删除节点或元素
- query: 查询数据或模型信息
- explain: 解释模型或计算

返回格式：
{
  "action": "操作类型",
  "target": "目标对象",
  "params": { 具体参数 },
  "confidence": 0.0-1.0
}`

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: intentPrompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      })

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      return JSON.parse(content)
    } catch (error) {
      console.error('Intent parsing error:', error)
      return {
        action: 'query',
        target: 'model',
        params: {},
        confidence: 0
      }
    }
  }

  /**
   * 生成节点建议
   */
  async suggestNodes(description: string): Promise<Partial<ModelNode>[]> {
    const prompt = `根据以下描述，建议需要创建的金融模型节点：

描述: "${description}"

返回节点数组，每个节点包含：
- type: 节点类型 (input, formula, assumption, table, module)
- label: 节点标签
- data: 节点数据

以 JSON 数组格式返回。`

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      })

      const data = await response.json()
      const content = data.choices[0]?.message?.content
      const parsed = JSON.parse(content)

      return parsed.nodes || []
    } catch (error) {
      console.error('Node suggestion error:', error)
      return []
    }
  }

  /**
   * 解释公式
   */
  async explainFormula(formula: string): Promise<string> {
    const prompt = `请用中文解释以下金融公式：

公式: "${formula}"

请解释：
1. 公式的含义
2. 每个变量的含义
3. 在金融分析中的应用场景`

    return this.chat(prompt)
  }

  /**
   * 清空对话历史
   */
  clearHistory(): void {
    this.conversationHistory = []
  }

  /**
   * 获取对话历史
   */
  getHistory(): AIMessage[] {
    return [...this.conversationHistory]
  }

  /**
   * 构建系统提示
   */
  private buildSystemPrompt(context?: {
    nodes?: ModelNode[]
    edges?: ModelEdge[]
  }): string {
    let prompt = `你是 ModelForge（模型锻造）的 AI 助手，专门帮助用户构建金融模型。

你的能力包括：
1. 理解金融建模需求，建议合适的节点和结构
2. 解释金融公式和估值方法
3. 帮助用户设计 DCF 模型、三表模型等
4. 连接中国金融数据源（AKShare）

金融建模专业知识：
- DCF 估值：自由现金流折现模型
- 三表建模：利润表、资产负债表、现金流量表
- 估值倍数：PE、PB、EV/EBITDA 等
- 财务分析：比率分析、趋势分析

回答时请：
1. 使用中文
2. 提供具体、可操作的建议
3. 在需要时询问澄清问题
4. 保持专业但友好`

    if (context?.nodes?.length) {
      prompt += `\n\n当前模型包含 ${context.nodes.length} 个节点`
    }

    return prompt
  }
}

// 导出单例
export const aiAgent = new ModelBuilderAgent()