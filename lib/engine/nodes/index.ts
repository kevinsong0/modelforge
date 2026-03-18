/**
 * ModelForge - 节点类型注册
 * 定义所有可用的节点类型及其配置
 */

import type { NodeType } from '@/types'

/**
 * 节点类型定义
 */
export const NODE_TYPES: Record<NodeType, {
  label: string
  description: string
  category: 'input' | 'processing' | 'output' | 'organization'
  icon: string
  defaultData: Record<string, unknown>
  inputs: { id: string; label: string; type: string }[]
  outputs: { id: string; label: string; type: string }[]
}> = {
  input: {
    label: '数据输入',
    description: '从外部数据源获取数据',
    category: 'input',
    icon: 'database',
    defaultData: {
      source: 'manual',
      dataType: 'stock',
      value: null
    },
    inputs: [],
    outputs: [{ id: 'output', label: '数据', type: 'any' }]
  },

  assumption: {
    label: '假设',
    description: '定义模型假设和参数',
    category: 'input',
    icon: 'variable',
    defaultData: {
      name: '新假设',
      value: 0,
      unit: '',
      description: ''
    },
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'number' }]
  },

  formula: {
    label: '公式计算',
    description: '使用公式进行计算',
    category: 'processing',
    icon: 'calculator',
    defaultData: {
      expression: '',
      inputs: []
    },
    inputs: [{ id: 'input1', label: '输入1', type: 'number' }],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },

  table: {
    label: '表格',
    description: '创建数据表格',
    category: 'processing',
    icon: 'table',
    defaultData: {
      rows: 5,
      columns: 5,
      cells: {},
      headers: ['列1', '列2', '列3', '列4', '列5']
    },
    inputs: [],
    outputs: [{ id: 'data', label: '表格数据', type: 'table' }]
  },

  reference: {
    label: '引用',
    description: '引用其他节点的输出',
    category: 'organization',
    icon: 'link',
    defaultData: {
      targetNodeId: null
    },
    inputs: [],
    outputs: [{ id: 'value', label: '引用值', type: 'any' }]
  },

  module: {
    label: '模块',
    description: '组合多个节点为可复用模块',
    category: 'organization',
    icon: 'package',
    defaultData: {
      childNodes: [],
      childEdges: [],
      inputs: [],
      outputs: []
    },
    inputs: [],
    outputs: []
  },

  output: {
    label: '输出',
    description: '模型输出结果',
    category: 'output',
    icon: 'file-output',
    defaultData: {
      name: '输出',
      format: 'number'
    },
    inputs: [{ id: 'input', label: '输入', type: 'any' }],
    outputs: []
  },

  dcf: {
    label: 'DCF 估值',
    description: '自由现金流折现估值模型',
    category: 'processing',
    icon: 'trending-up',
    defaultData: {
      inputs: {
        historicalRevenue: [100, 120, 150],
        revenueGrowthRate: 0.15,
        ebitdaMargin: 0.20,
        taxRate: 0.25,
        depreciationPercent: 0.05,
        capexPercent: 0.03,
        nwcPercent: 0.02,
        terminalGrowthRate: 0.025,
        discountRate: 0.10,
        projectionYears: 5
      },
      sensitivityEnabled: false
    },
    inputs: [
      { id: 'historicalRevenue', label: '历史收入', type: 'number[]' },
      { id: 'revenueGrowthRate', label: '收入增长率', type: 'number' },
      { id: 'ebitdaMargin', label: 'EBITDA 利润率', type: 'number' },
      { id: 'discountRate', label: '折现率 (WACC)', type: 'number' }
    ],
    outputs: [
      { id: 'enterpriseValue', label: '企业价值', type: 'number' },
      { id: 'equityValue', label: '股权价值', type: 'number' },
      { id: 'freeCashFlow', label: '自由现金流', type: 'number[]' }
    ]
  }
}

/**
 * 金融模型专用节点模板
 */
export const FINANCIAL_NODE_TEMPLATES = {
  /**
   * DCF 模型节点组
   */
  dcf: {
    label: 'DCF 估值',
    nodes: [
      {
        type: 'input' as NodeType,
        label: '历史收入',
        data: { source: 'akshare', dataType: 'financials' }
      },
      {
        type: 'assumption' as NodeType,
        label: '收入增长率',
        data: { value: 0.15, unit: '%', description: '预期年收入增长率' }
      },
      {
        type: 'assumption' as NodeType,
        label: 'EBITDA 利润率',
        data: { value: 0.20, unit: '%', description: 'EBITDA/收入' }
      },
      {
        type: 'assumption' as NodeType,
        label: '折现率 (WACC)',
        data: { value: 0.10, unit: '%', description: '加权平均资本成本' }
      },
      {
        type: 'assumption' as NodeType,
        label: '永续增长率',
        data: { value: 0.025, unit: '%', description: '终值期增长率' }
      },
      {
        type: 'formula' as NodeType,
        label: '自由现金流预测',
        data: { expression: 'revenue * ebitdaMargin * (1 - taxRate) - capex - nwcChange' }
      },
      {
        type: 'formula' as NodeType,
        label: '企业价值',
        data: { expression: 'sum(pvFCF) + terminalValue / (1 + wacc)^n' }
      },
      {
        type: 'output' as NodeType,
        label: '估值结果',
        data: { name: '企业价值', format: 'number' }
      }
    ]
  },

  /**
   * 三表模型节点组
   */
  threeStatement: {
    label: '三表模型',
    nodes: [
      {
        type: 'table' as NodeType,
        label: '利润表',
        data: {
          headers: ['收入', '成本', '毛利', '营业费用', 'EBITDA', '折旧', 'EBIT', '利息', '税前利润', '所得税', '净利润']
        }
      },
      {
        type: 'table' as NodeType,
        label: '资产负债表',
        data: {
          headers: ['现金', '应收账款', '存货', '流动资产', '固定资产', '无形资产', '总资产', '应付账款', '短期债务', '长期债务', '总负债', '股东权益']
        }
      },
      {
        type: 'table' as NodeType,
        label: '现金流量表',
        data: {
          headers: ['净利润', '折旧', '营运资本变动', '经营现金流', '资本支出', '投资现金流', '债务变动', '股息', '筹资现金流', '现金变动', '期末现金']
        }
      },
      {
        type: 'formula' as NodeType,
        label: '三表联动',
        data: { expression: 'linkIncomeStatementBalanceSheetCashFlow()' }
      }
    ]
  },

  /**
   * 可比公司分析节点组
   */
  comparableCompany: {
    label: '可比公司分析',
    nodes: [
      {
        type: 'input' as NodeType,
        label: '可比公司列表',
        data: { source: 'manual', dataType: 'company_list' }
      },
      {
        type: 'formula' as NodeType,
        label: 'PE 倍数',
        data: { expression: 'marketCap / netIncome' }
      },
      {
        type: 'formula' as NodeType,
        label: 'EV/EBITDA',
        data: { expression: 'enterpriseValue / ebitda' }
      },
      {
        type: 'formula' as NodeType,
        label: 'PB 倍数',
        data: { expression: 'marketCap / bookValue' }
      },
      {
        type: 'output' as NodeType,
        label: '估值倍数汇总',
        data: { name: '估值倍数', format: 'table' }
      }
    ]
  }
}

/**
 * 获取节点类型配置
 */
export function getNodeTypeConfig(type: NodeType) {
  return NODE_TYPES[type]
}

/**
 * 获取金融模型模板
 */
export function getFinancialTemplate(templateName: keyof typeof FINANCIAL_NODE_TEMPLATES) {
  return FINANCIAL_NODE_TEMPLATES[templateName]
}