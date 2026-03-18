/**
 * ModelForge - 计算引擎核心
 * 基于有向无环图的确定性执行引擎
 */

import type { ModelNode, ModelEdge, ExecutionContext, ExecutionResult, AuditEntry, InputNode, FormulaNode, ModuleNode, OutputNode, DCFNode, DCFInputs, DCFOutputs } from '@/types'
import { DCFModel } from '@/lib/finance/dcf'

/**
 * 计算图 - 表示金融模型的有向无环图
 */
export class ComputationGraph {
  private nodes: Map<string, ModelNode> = new Map()
  private edges: Map<string, ModelEdge> = new Map()
  private adjacencyList: Map<string, string[]> = new Map()
  private reverseAdjacencyList: Map<string, string[]> = new Map()

  constructor(nodes: ModelNode[] = [], edges: ModelEdge[] = []) {
    nodes.forEach(node => this.addNode(node))
    edges.forEach(edge => this.addEdge(edge))
  }

  addNode(node: ModelNode): void {
    this.nodes.set(node.id, node)
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, [])
    }
    if (!this.reverseAdjacencyList.has(node.id)) {
      this.reverseAdjacencyList.set(node.id, [])
    }
  }

  addEdge(edge: ModelEdge): void {
    this.edges.set(edge.id, edge)

    // 构建邻接表
    const successors = this.adjacencyList.get(edge.source) || []
    successors.push(edge.target)
    this.adjacencyList.set(edge.source, successors)

    // 构建反向邻接表（用于获取前驱节点）
    const predecessors = this.reverseAdjacencyList.get(edge.target) || []
    predecessors.push(edge.source)
    this.reverseAdjacencyList.set(edge.target, predecessors)
  }

  getNode(id: string): ModelNode | undefined {
    return this.nodes.get(id)
  }

  getEdges(): ModelEdge[] {
    return Array.from(this.edges.values())
  }

  /**
   * 拓扑排序 - 确定执行顺序
   */
  topologicalSort(): string[] {
    const inDegree = new Map<string, number>()
    const result: string[] = []

    // 初始化入度
    this.nodes.forEach((_, id) => {
      inDegree.set(id, 0)
    })

    // 计算入度
    this.edges.forEach(edge => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    })

    // Kahn 算法
    const queue: string[] = []
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id)
      }
    })

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      result.push(nodeId)

      const successors = this.adjacencyList.get(nodeId) || []
      successors.forEach(successorId => {
        const newDegree = (inDegree.get(successorId) || 0) - 1
        inDegree.set(successorId, newDegree)
        if (newDegree === 0) {
          queue.push(successorId)
        }
      })
    }

    // 检测循环依赖
    if (result.length !== this.nodes.size) {
      throw new Error('检测到循环依赖，无法进行拓扑排序')
    }

    return result
  }

  /**
   * 获取节点的前驱节点
   */
  getPredecessors(nodeId: string): string[] {
    return this.reverseAdjacencyList.get(nodeId) || []
  }

  /**
   * 获取节点的后继节点
   */
  getSuccessors(nodeId: string): string[] {
    return this.adjacencyList.get(nodeId) || []
  }

  /**
   * 导出为 JSON
   */
  toJSON(): { nodes: ModelNode[]; edges: ModelEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    }
  }
}

/**
 * 执行引擎 - 执行计算图
 */
export class ExecutionEngine {
  private context: ExecutionContext = {
    variables: new Map(),
    results: new Map(),
    auditLog: []
  }

  constructor() {
    this.reset()
  }

  reset(): void {
    this.context = {
      variables: new Map(),
      results: new Map(),
      auditLog: []
    }
  }

  /**
   * 执行计算图
   */
  async execute(graph: ComputationGraph): Promise<ExecutionResult> {
    const errors: { nodeId: string; message: string }[] = []

    try {
      const executionOrder = graph.topologicalSort()

      for (const nodeId of executionOrder) {
        const node = graph.getNode(nodeId)
        if (!node) {
          errors.push({ nodeId, message: '节点不存在' })
          continue
        }

        try {
          await this.executeNode(node, graph)
        } catch (error) {
          errors.push({
            nodeId,
            message: error instanceof Error ? error.message : '执行失败'
          })
        }
      }

      return {
        success: errors.length === 0,
        outputs: Object.fromEntries(this.context.results),
        auditLog: this.context.auditLog,
        errors
      }
    } catch (error) {
      return {
        success: false,
        outputs: {},
        auditLog: this.context.auditLog,
        errors: [{ nodeId: 'graph', message: error instanceof Error ? error.message : '执行失败' }]
      }
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(node: ModelNode, graph: ComputationGraph): Promise<void> {
    const startTime = performance.now()
    const inputs: Record<string, unknown> = {}

    // 收集输入
    const predecessorIds = graph.getPredecessors(node.id)
    for (const predId of predecessorIds) {
      const result = this.context.results.get(predId)
      if (result !== undefined) {
        inputs[predId] = result
      }
    }

    // 根据节点类型执行
    let output: unknown

    switch (node.type) {
      case 'input':
        output = await this.executeInputNode(node)
        break
      case 'formula':
        output = await this.executeFormulaNode(node, inputs)
        break
      case 'assumption':
        output = node.data.value
        break
      case 'table':
        output = node.data.cells
        break
      case 'module':
        output = await this.executeModuleNode(node)
        break
      case 'output':
        // 输出节点接收前驱节点的值并传递
        output = Object.keys(inputs).length > 0 ? inputs[Object.keys(inputs)[0]] : null
        break
      case 'dcf':
        output = await this.executeDCFNode(node, inputs)
        break
      default: {
        // 类型安全的 exhaustive check
        const _exhaustive: never = node
        output = _exhaustive
      }
    }

    // 记录结果
    this.context.results.set(node.id, output)

    // 记录审计日志
    const auditEntry: AuditEntry = {
      nodeId: node.id,
      timestamp: new Date(),
      operation: node.type,
      inputs,
      output,
      duration: performance.now() - startTime
    }
    this.context.auditLog.push(auditEntry)
  }

  private async executeInputNode(node: InputNode): Promise<unknown> {
    // 如果已有值，直接返回
    if (node.data.value !== undefined && node.data.value !== null) {
      return node.data.value
    }

    // 根据 source 获取数据
    if (node.data.source === 'akshare') {
      return this.fetchAkshareData(node)
    }

    return null
  }

  /**
   * 从 AKShare 获取数据
   */
  private async fetchAkshareData(node: InputNode): Promise<unknown> {
    const symbol = node.data.symbol
    if (!symbol) {
      throw new Error('AKShare 数据源需要指定股票代码 (symbol)')
    }

    try {
      const response = await fetch('/api/data/akshare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          endpoint: node.data.dataType === 'financials' ? 'financials' :
                   node.data.dataType === 'market' ? 'market-data' :
                   'stock-info',
          params: { symbol }
        })
      })

      if (!response.ok) {
        throw new Error(`AKShare API 错误: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('AKShare 数据获取失败:', error)
      throw error
    }
  }

  private async executeFormulaNode(
    node: FormulaNode,
    inputs: Record<string, unknown>
  ): Promise<unknown> {
    // 公式求值 - 使用安全的表达式解析器
    const expression = node.data.expression
    if (!expression) {
      throw new Error('公式表达式不能为空')
    }

    // TODO: 实现安全的公式求值器
    // 目前使用简单的占位逻辑
    return this.evaluateExpression(expression, inputs)
  }

  private async executeModuleNode(node: ModuleNode): Promise<unknown> {
    // 模块节点包含子图，需要递归执行
    // TODO: 实现子图执行
    return node.data
  }

  /**
   * 执行 DCF 估值节点
   */
  private async executeDCFNode(
    node: DCFNode,
    inputs: Record<string, unknown>
  ): Promise<DCFOutputs> {
    const dcfInputs = node.data.inputs

    // 从输入中收集缺失的参数
    const completeInputs: DCFInputs = {
      historicalRevenue: dcfInputs.historicalRevenue ?? (inputs.historicalRevenue as number[]) ?? [100, 120, 150],
      revenueGrowthRate: dcfInputs.revenueGrowthRate ?? (inputs.revenueGrowthRate as number) ?? 0.15,
      ebitdaMargin: dcfInputs.ebitdaMargin ?? (inputs.ebitdaMargin as number) ?? 0.20,
      taxRate: dcfInputs.taxRate ?? (inputs.taxRate as number) ?? 0.25,
      depreciationPercent: dcfInputs.depreciationPercent ?? (inputs.depreciationPercent as number) ?? 0.05,
      capexPercent: dcfInputs.capexPercent ?? (inputs.capexPercent as number) ?? 0.03,
      nwcPercent: dcfInputs.nwcPercent ?? (inputs.nwcPercent as number) ?? 0.02,
      terminalGrowthRate: dcfInputs.terminalGrowthRate ?? (inputs.terminalGrowthRate as number) ?? 0.025,
      discountRate: dcfInputs.discountRate ?? (inputs.discountRate as number) ?? 0.10,
      projectionYears: dcfInputs.projectionYears ?? (inputs.projectionYears as number) ?? 5
    }

    // 创建 DCF 模型实例并计算
    const dcfModel = new DCFModel(completeInputs)
    const outputs = dcfModel.calculate()

    // 如果启用敏感性分析，也计算敏感性矩阵
    if (node.data.sensitivityEnabled && node.data.sensitivityRange) {
      const { waccRange, growthRange } = node.data.sensitivityRange
      outputs.sensitivityMatrix = dcfModel.sensitivityAnalysis(
        waccRange.min,
        waccRange.max,
        waccRange.step,
        growthRange.min,
        growthRange.max,
        growthRange.step
      )
    }

    return outputs
  }

  /**
   * 安全的表达式求值
   * 注意：生产环境应使用专门的公式解析库
   */
  private evaluateExpression(
    expression: string,
    variables: Record<string, unknown>
  ): number | string {
    // 创建安全的执行上下文
    const safeFunctions = {
      sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
      avg: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
      max: Math.max,
      min: Math.min,
      abs: Math.abs,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      sqrt: Math.sqrt,
      pow: Math.pow,
      log: Math.log,
      exp: Math.exp
    }

    try {
      // 简单的变量替换
      let evalExpression = expression
      for (const [key, value] of Object.entries(variables)) {
        if (typeof value === 'number') {
          evalExpression = evalExpression.replace(
            new RegExp(`\\b${key}\\b`, 'g'),
            String(value)
          )
        }
      }

      // 使用 Function 构造器进行安全求值（受限环境）
      const funcNames = Object.keys(safeFunctions).join(',')
      const funcValues = Object.values(safeFunctions)
      const fn = new Function(funcNames, `"use strict"; return (${evalExpression})`)

      return fn(...funcValues)
    } catch (error) {
      console.error('Expression evaluation error:', error)
      return expression // 返回原始表达式作为回退
    }
  }

  /**
   * 获取审计日志
   */
  getAuditLog(): AuditEntry[] {
    return this.context.auditLog
  }
}