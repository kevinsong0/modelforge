/**
 * ModelForge - DCF 计算 API
 * 自由现金流折现模型计算接口
 */

import { NextRequest, NextResponse } from 'next/server'
import { DCFModel, calculateDCF } from '@/lib/finance/dcf'
import type { DCFInputs, DCFOutputs } from '@/types'

/**
 * API 请求输入格式（兼容测试格式）
 */
interface DCFRequestInput {
  revenue?: number
  historicalRevenue?: number[]
  revenueGrowthRate: number
  ebitdaMargin: number
  taxRate: number
  depreciationPercent: number
  capitalExpenditurePercent?: number  // 映射到 capexPercent
  capexPercent?: number
  workingCapitalPercent?: number  // 映射到 nwcPercent
  nwcPercent?: number
  wacc?: number  // 映射到 discountRate
  discountRate?: number
  terminalGrowthRate: number
  projectionYears: number
  includeSensitivity?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: DCFRequestInput = await request.json()

    // 字段映射：将测试输入格式转换为 DCFInputs 格式
    const dcfInputs: DCFInputs = {
      historicalRevenue: body.historicalRevenue ||
        (body.revenue ? [body.revenue] : [1000000000]),  // 默认 10 亿
      revenueGrowthRate: body.revenueGrowthRate || 0.1,
      ebitdaMargin: body.ebitdaMargin || 0.2,
      taxRate: body.taxRate || 0.25,
      depreciationPercent: body.depreciationPercent || 0.05,
      capexPercent: body.capexPercent ?? body.capitalExpenditurePercent ?? 0.06,
      nwcPercent: body.nwcPercent ?? body.workingCapitalPercent ?? 0.1,
      terminalGrowthRate: body.terminalGrowthRate || 0.02,
      discountRate: body.discountRate ?? body.wacc ?? 0.1,
      projectionYears: body.projectionYears || 5
    }

    // 执行 DCF 计算
    const model = new DCFModel(dcfInputs)
    const outputs: DCFOutputs = model.calculate()

    // 可选：包含敏感性分析
    if (body.includeSensitivity !== false) {
      try {
        outputs.sensitivityMatrix = model.sensitivityAnalysis(
          0.08,  // waccMin
          0.16,  // waccMax
          0.02,  // waccStep
          0.01,  // growthMin
          0.05,  // growthMax
          0.01   // growthStep
        )
      } catch (e) {
        console.error('敏感性分析计算失败:', e)
      }
    }

    return NextResponse.json({
      success: true,
      inputs: dcfInputs,
      outputs: {
        enterpriseValue: outputs.enterpriseValue,
        equityValue: outputs.equityValue,
        perShareValue: outputs.perShareValue,
        terminalValue: outputs.terminalValue,
        projectedRevenue: outputs.projectedRevenue,
        projectedEBITDA: outputs.projectedEBITDA,
        freeCashFlow: outputs.freeCashFlow,
        presentValueFCF: outputs.presentValueFCF,
        sensitivityMatrix: outputs.sensitivityMatrix
      }
    })

  } catch (error) {
    console.error('DCF 计算错误:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'DCF 计算失败',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/finance/dcf',
    description: 'DCF 自由现金流折现模型计算',
    method: 'POST',
    inputFields: {
      revenue: 'number - 基期收入（可选，将转换为 historicalRevenue 数组）',
      historicalRevenue: 'number[] - 历史收入数组',
      revenueGrowthRate: 'number - 收入增长率',
      ebitdaMargin: 'number - EBITDA 利润率',
      taxRate: 'number - 税率',
      depreciationPercent: 'number - 折旧占收入比例',
      capitalExpenditurePercent: 'number - 资本支出占收入比例（映射到 capexPercent）',
      capexPercent: 'number - 资本支出占收入比例',
      workingCapitalPercent: 'number - 营运资金占收入比例（映射到 nwcPercent）',
      nwcPercent: 'number - 营运资金占收入比例',
      wacc: 'number - 加权平均资本成本（映射到 discountRate）',
      discountRate: 'number - 折现率',
      terminalGrowthRate: 'number - 永续增长率',
      projectionYears: 'number - 预测年数',
      includeSensitivity: 'boolean - 是否包含敏感性分析（默认 true）'
    },
    outputFields: {
      enterpriseValue: 'number - 企业价值',
      equityValue: 'number - 股权价值',
      perShareValue: 'number - 每股价值',
      terminalValue: 'number - 终值',
      projectedRevenue: 'number[] - 预测收入',
      projectedEBITDA: 'number[] - 预测 EBITDA',
      freeCashFlow: 'number[] - 自由现金流',
      presentValueFCF: 'number[] - 自由现金流现值',
      sensitivityMatrix: 'object - 敏感性分析矩阵'
    }
  })
}