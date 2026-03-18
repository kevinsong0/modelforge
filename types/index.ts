/**
 * ModelForge - 金融建模平台类型定义
 */

// ============================================
// 核心节点类型
// ============================================

export type NodeType =
  | 'input'        // 数据输入节点
  | 'output'       // 输出节点
  | 'formula'      // 公式计算节点
  | 'table'        // 表格节点
  | 'assumption'   // 假设节点
  | 'reference'    // 引用节点
  | 'module'       // 模块节点（组合多个节点）
  | 'dcf'          // DCF 估值节点

export interface BaseNode {
  id: string
  type: NodeType
  label: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface InputNode extends BaseNode {
  type: 'input'
  data: {
    source: 'manual' | 'akshare' | 'excel' | 'api'
    dataType: 'stock' | 'financials' | 'market' | 'custom'
    symbol?: string  // 股票代码，用于 AKShare 数据源
    value?: unknown
    config?: Record<string, unknown>
  }
}

export interface FormulaNode extends BaseNode {
  type: 'formula'
  data: {
    expression: string  // DSL 表达式
    inputs: string[]    // 输入节点 ID 列表
    output?: number | string
  }
}

export interface TableNode extends BaseNode {
  type: 'table'
  data: {
    rows: number
    columns: number
    cells: Record<string, { value: unknown; formula?: string }>
    headers: string[]
  }
}

export interface AssumptionNode extends BaseNode {
  type: 'assumption'
  data: {
    name: string
    value: number | string
    unit?: string
    description?: string
    sensitivity?: { min: number; max: number; step: number }
  }
}

export interface ModuleNode extends BaseNode {
  type: 'module'
  data: {
    childNodes: string[]
    childEdges: string[]
    inputs: { id: string; label: string }[]
    outputs: { id: string; label: string }[]
  }
}

export interface OutputNode extends BaseNode {
  type: 'output'
  data: {
    name: string
    format: 'number' | 'text' | 'table' | 'chart'
    chartType?: 'line' | 'bar' | 'pie'
    value?: unknown
  }
}

export interface DCFNode extends BaseNode {
  type: 'dcf'
  data: {
    inputs: Partial<DCFInputs>
    outputs?: DCFOutputs
    sensitivityEnabled?: boolean
    sensitivityRange?: {
      waccRange: { min: number; max: number; step: number }
      growthRange: { min: number; max: number; step: number }
    }
  }
}

export type ModelNode = InputNode | FormulaNode | TableNode | AssumptionNode | ModuleNode | OutputNode | DCFNode

// ============================================
// 边（连接）类型
// ============================================

export interface ModelEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  animated?: boolean
}

// ============================================
// 模型类型
// ============================================

export interface FinancialModel {
  id: string
  name: string
  description?: string
  nodes: ModelNode[]
  edges: ModelEdge[]
  variables: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  userId: string
}

// ============================================
// 计算引擎类型
// ============================================

export interface ExecutionContext {
  variables: Map<string, unknown>
  results: Map<string, unknown>
  auditLog: AuditEntry[]
}

export interface AuditEntry {
  nodeId: string
  timestamp: Date
  operation: string
  inputs: Record<string, unknown>
  output: unknown
  duration: number
}

export interface ExecutionResult {
  success: boolean
  outputs: Record<string, unknown>
  auditLog: AuditEntry[]
  errors: { nodeId: string; message: string }[]
}

// ============================================
// AI 相关类型
// ============================================

export interface AIIntent {
  action: 'create' | 'modify' | 'delete' | 'query' | 'explain'
  target: 'node' | 'edge' | 'model' | 'formula' | 'data'
  params: Record<string, unknown>
  confidence: number
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface AIConversation {
  id: string
  messages: AIMessage[]
  modelId: string
  createdAt: Date
}

// ============================================
// 数据源类型
// ============================================

export interface DataSource {
  type: 'akshare' | 'excel' | 'api' | 'manual'
  config: Record<string, unknown>
}

export interface AKShareConfig {
  symbol: string
  dataType: 'stock_info' | 'financials' | 'market_data' | 'industry_data'
  startDate?: string
  endDate?: string
}

export interface StockData {
  symbol: string
  name: string
  price?: number
  financials?: FinancialData
  marketData?: MarketDataPoint[]
}

export interface FinancialData {
  revenue: number
  netIncome: number
  totalAssets: number
  totalLiabilities: number
  equity: number
  cashFlow: {
    operating: number
    investing: number
    financing: number
  }
}

export interface MarketDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// ============================================
// 金融模型特定类型
// ============================================

export interface DCFInputs {
  historicalRevenue: number[]
  revenueGrowthRate: number
  ebitdaMargin: number
  taxRate: number
  depreciationPercent: number
  capexPercent: number
  nwcPercent: number
  terminalGrowthRate: number
  discountRate: number
  projectionYears: number
}

export interface DCFOutputs {
  projectedRevenue: number[]
  projectedEBITDA: number[]
  freeCashFlow: number[]
  terminalValue: number
  presentValueFCF: number[]
  enterpriseValue: number
  equityValue: number
  perShareValue: number
  sensitivityMatrix?: SensitivityMatrix
}

export interface SensitivityMatrix {
  waccValues: number[]
  growthValues: number[]
  values: number[][] // enterprise values for each wacc/growth combination
}

export interface ThreeStatementModel {
  incomeStatement: IncomeStatement
  balanceSheet: BalanceSheet
  cashFlowStatement: CashFlowStatement
}

export interface IncomeStatement {
  revenue: number
  costOfGoodsSold: number
  grossProfit: number
  operatingExpenses: number
  ebitda: number
  depreciation: number
  ebit: number
  interest: number
  ebt: number
  taxes: number
  netIncome: number
}

export interface BalanceSheet {
  // Assets
  cash: number
  accountsReceivable: number
  inventory: number
  currentAssets: number
  propertyPlantEquipment: number
  intangibleAssets: number
  totalAssets: number
  // Liabilities
  accountsPayable: number
  shortTermDebt: number
  currentLiabilities: number
  longTermDebt: number
  totalLiabilities: number
  // Equity
  shareholdersEquity: number
}

export interface CashFlowStatement {
  operatingCashFlow: number
  investingCashFlow: number
  financingCashFlow: number
  netCashFlow: number
  beginningCash: number
  endingCash: number
}