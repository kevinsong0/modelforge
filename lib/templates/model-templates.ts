/**
 * ModelForge - 金融模型模板
 * 预定义的模型模板，用于快速创建常用模型
 */

import type { Node, Edge } from '@xyflow/react'

export interface ModelTemplate {
  id: string
  name: string
  description: string
  category: 'valuation' | 'financial' | 'analysis'
  nodes: Node[]
  edges: Edge[]
}

// DCF 估值模型模板
export const dcfTemplate: ModelTemplate = {
  id: 'dcf-valuation',
  name: 'DCF 估值模型',
  description: '现金流折现模型，用于企业估值',
  category: 'valuation',
  nodes: [
    {
      id: 'input-revenue',
      type: 'input',
      position: { x: 50, y: 50 },
      data: { label: '历史收入', source: 'manual', dataType: 'financials', value: 100000000 }
    },
    {
      id: 'assumption-growth',
      type: 'assumption',
      position: { x: 50, y: 180 },
      data: { name: '收入增长率', value: 15, unit: '%', description: '预期年收入增长率' }
    },
    {
      id: 'assumption-ebitda',
      type: 'assumption',
      position: { x: 50, y: 310 },
      data: { name: 'EBITDA 利润率', value: 20, unit: '%', description: 'EBITDA/收入' }
    },
    {
      id: 'assumption-tax',
      type: 'assumption',
      position: { x: 50, y: 440 },
      data: { name: '税率', value: 25, unit: '%', description: '企业所得税率' }
    },
    {
      id: 'assumption-wacc',
      type: 'assumption',
      position: { x: 50, y: 570 },
      data: { name: 'WACC', value: 10, unit: '%', description: '加权平均资本成本' }
    },
    {
      id: 'assumption-terminal',
      type: 'assumption',
      position: { x: 50, y: 700 },
      data: { name: '永续增长率', value: 3, unit: '%', description: '终值期增长率' }
    },
    {
      id: 'formula-revenue-proj',
      type: 'formula',
      position: { x: 350, y: 100 },
      data: {
        label: '收入预测',
        expression: 'input-revenue * (1 + assumption-growth/100)',
        output: null
      }
    },
    {
      id: 'formula-ebitda-proj',
      type: 'formula',
      position: { x: 350, y: 230 },
      data: {
        label: 'EBITDA 预测',
        expression: 'formula-revenue-proj * assumption-ebitda/100',
        output: null
      }
    },
    {
      id: 'formula-fcf',
      type: 'formula',
      position: { x: 350, y: 360 },
      data: {
        label: '自由现金流',
        expression: 'formula-ebitda-proj * (1 - assumption-tax/100)',
        output: null
      }
    },
    {
      id: 'output-ev',
      type: 'output',
      position: { x: 650, y: 200 },
      data: { name: '企业价值', format: 'number', value: null }
    },
    {
      id: 'output-equity',
      type: 'output',
      position: { x: 650, y: 350 },
      data: { name: '股权价值', format: 'number', value: null }
    }
  ],
  edges: [
    { id: 'e1', source: 'input-revenue', target: 'formula-revenue-proj', animated: true },
    { id: 'e2', source: 'assumption-growth', target: 'formula-revenue-proj', animated: true },
    { id: 'e3', source: 'formula-revenue-proj', target: 'formula-ebitda-proj', animated: true },
    { id: 'e4', source: 'assumption-ebitda', target: 'formula-ebitda-proj', animated: true },
    { id: 'e5', source: 'formula-ebitda-proj', target: 'formula-fcf', animated: true },
    { id: 'e6', source: 'assumption-tax', target: 'formula-fcf', animated: true },
    { id: 'e7', source: 'formula-fcf', target: 'output-ev', animated: true },
    { id: 'e8', source: 'assumption-wacc', target: 'output-ev', animated: true },
    { id: 'e9', source: 'output-ev', target: 'output-equity', animated: true }
  ]
}

// 三表模型模板
export const threeStatementTemplate: ModelTemplate = {
  id: 'three-statement',
  name: '三表模型',
  description: '利润表、资产负债表、现金流量表联动模型',
  category: 'financial',
  nodes: [
    {
      id: 'input-revenue',
      type: 'input',
      position: { x: 50, y: 50 },
      data: { label: '营业收入', source: 'manual', dataType: 'number', value: 1000000 }
    },
    {
      id: 'assumption-cogs',
      type: 'assumption',
      position: { x: 50, y: 180 },
      data: { name: '营业成本率', value: 60, unit: '%', description: 'COGS/收入' }
    },
    {
      id: 'assumption-sga',
      type: 'assumption',
      position: { x: 50, y: 310 },
      data: { name: '销售管理费用率', value: 15, unit: '%', description: 'SGA/收入' }
    },
    {
      id: 'assumption-depreciation',
      type: 'assumption',
      position: { x: 50, y: 440 },
      data: { name: '折旧率', value: 5, unit: '%', description: '折旧/固定资产' }
    },
    {
      id: 'formula-gross-profit',
      type: 'formula',
      position: { x: 350, y: 100 },
      data: {
        label: '毛利润',
        expression: 'input-revenue * (1 - assumption-cogs/100)',
        output: null
      }
    },
    {
      id: 'formula-ebitda',
      type: 'formula',
      position: { x: 350, y: 230 },
      data: {
        label: 'EBITDA',
        expression: 'formula-gross-profit - input-revenue * assumption-sga/100',
        output: null
      }
    },
    {
      id: 'formula-ebit',
      type: 'formula',
      position: { x: 350, y: 360 },
      data: {
        label: 'EBIT',
        expression: 'formula-ebitda - input-revenue * assumption-depreciation/100',
        output: null
      }
    },
    {
      id: 'output-income',
      type: 'output',
      position: { x: 650, y: 200 },
      data: { name: '净利润', format: 'number', value: null }
    },
    {
      id: 'table-bs',
      type: 'table',
      position: { x: 650, y: 350 },
      data: {
        label: '资产负债表',
        headers: ['项目', '金额'],
        cells: {
          '0-0': { value: '资产' },
          '1-0': { value: '负债' },
          '2-0': { value: '权益' }
        }
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'input-revenue', target: 'formula-gross-profit', animated: true },
    { id: 'e2', source: 'assumption-cogs', target: 'formula-gross-profit', animated: true },
    { id: 'e3', source: 'formula-gross-profit', target: 'formula-ebitda', animated: true },
    { id: 'e4', source: 'input-revenue', target: 'formula-ebitda', animated: true },
    { id: 'e5', source: 'assumption-sga', target: 'formula-ebitda', animated: true },
    { id: 'e6', source: 'formula-ebitda', target: 'formula-ebit', animated: true },
    { id: 'e7', source: 'input-revenue', target: 'formula-ebit', animated: true },
    { id: 'e8', source: 'assumption-depreciation', target: 'formula-ebit', animated: true },
    { id: 'e9', source: 'formula-ebit', target: 'output-income', animated: true }
  ]
}

// 可比公司分析模板
export const comparableTemplate: ModelTemplate = {
  id: 'comparable-analysis',
  name: '可比公司分析',
  description: '基于可比公司的估值倍数分析',
  category: 'analysis',
  nodes: [
    {
      id: 'table-comps',
      type: 'table',
      position: { x: 50, y: 50 },
      data: {
        label: '可比公司',
        headers: ['公司', '市值', 'EV', 'EBITDA', 'P/E', 'EV/EBITDA'],
        cells: {
          '0-0': { value: '公司A' },
          '0-1': { value: 1000 },
          '0-2': { value: 1200 },
          '0-3': { value: 100 },
          '1-0': { value: '公司B' },
          '1-1': { value: 2000 },
          '1-2': { value: 2400 },
          '1-3': { value: 200 }
        }
      }
    },
    {
      id: 'input-target-ebitda',
      type: 'input',
      position: { x: 50, y: 300 },
      data: { label: '目标公司 EBITDA', source: 'manual', dataType: 'number', value: 150 }
    },
    {
      id: 'formula-avg-multiple',
      type: 'formula',
      position: { x: 350, y: 150 },
      data: {
        label: '平均 EV/EBITDA',
        expression: 'avg(12, 12)',
        output: null
      }
    },
    {
      id: 'formula-ev-estimate',
      type: 'formula',
      position: { x: 350, y: 300 },
      data: {
        label: '估值 EV',
        expression: 'input-target-ebitda * formula-avg-multiple',
        output: null
      }
    },
    {
      id: 'output-valuation',
      type: 'output',
      position: { x: 650, y: 220 },
      data: { name: '估值区间', format: 'number', value: null }
    }
  ],
  edges: [
    { id: 'e1', source: 'input-target-ebitda', target: 'formula-ev-estimate', animated: true },
    { id: 'e2', source: 'formula-avg-multiple', target: 'formula-ev-estimate', animated: true },
    { id: 'e3', source: 'formula-ev-estimate', target: 'output-valuation', animated: true }
  ]
}

// 所有模板列表
export const modelTemplates: ModelTemplate[] = [
  dcfTemplate,
  threeStatementTemplate,
  comparableTemplate
]

// 根据 ID 获取模板
export function getTemplateById(id: string): ModelTemplate | undefined {
  return modelTemplates.find(t => t.id === id)
}

// 创建模板实例（生成新的节点 ID）
export function createTemplateInstance(template: ModelTemplate): { nodes: Node[]; edges: Edge[] } {
  const idMap = new Map<string, string>()

  // 生成新的节点 ID
  const newNodes = template.nodes.map(node => {
    const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    idMap.set(node.id, newId)
    return {
      ...node,
      id: newId
    }
  })

  // 更新边的引用
  const newEdges = template.edges.map(edge => ({
    ...edge,
    id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: idMap.get(edge.source) || edge.source,
    target: idMap.get(edge.target) || edge.target
  }))

  return { nodes: newNodes, edges: newEdges }
}