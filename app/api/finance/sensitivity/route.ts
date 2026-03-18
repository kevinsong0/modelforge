/**
 * ModelForge - 敏感性分析 API
 * 对 DCF 模型进行敏感性分析
 */

import { NextRequest, NextResponse } from 'next/server'
import { DCFModel } from '@/lib/finance/dcf'
import type { DCFInputs, SensitivityMatrix } from '@/types'

/**
 * 敏感性分析请求格式
 */
interface SensitivityRequest {
  baseValue?: number  // 基础收入
  variable1?: string   // 第一个变量名 (wacc, growthRate, ebitdaMargin 等)
  range1?: number[]    // 第一个变量的范围
  variable2?: string   // 第二个变量名
  range2?: number[]    // 第二个变量的范围

  // 完整 DCF 输入（可选）
  dcfInputs?: Partial<DCFInputs>

  // 或使用简化参数
  waccRange?: { min: number; max: number; step: number }
  growthRange?: { min: number; max: number; step: number }
}

export async function POST(request: NextRequest) {
  try {
    const body: SensitivityRequest = await request.json()

    // 构建 DCF 输入
    const dcfInputs: DCFInputs = {
      historicalRevenue: body.dcfInputs?.historicalRevenue ||
        (body.baseValue ? [body.baseValue] : [1000000000]),
      revenueGrowthRate: body.dcfInputs?.revenueGrowthRate || 0.1,
      ebitdaMargin: body.dcfInputs?.ebitdaMargin || 0.2,
      taxRate: body.dcfInputs?.taxRate || 0.25,
      depreciationPercent: body.dcfInputs?.depreciationPercent || 0.05,
      capexPercent: body.dcfInputs?.capexPercent || 0.06,
      nwcPercent: body.dcfInputs?.nwcPercent || 0.1,
      terminalGrowthRate: body.dcfInputs?.terminalGrowthRate || 0.02,
      discountRate: body.dcfInputs?.discountRate || 0.1,
      projectionYears: body.dcfInputs?.projectionYears || 5
    }

    const model = new DCFModel(dcfInputs)

    // 解析敏感性分析范围
    let sensitivityMatrix: SensitivityMatrix

    // 方式1：使用 range1/range2 格式
    if (body.range1 && body.range2) {
      const var1 = body.variable1 || 'wacc'
      const var2 = body.variable2 || 'growthRate'

      // 根据变量类型确定哪个是 WACC，哪个是增长率
      const waccValues = var1.toLowerCase().includes('wacc') || var1.toLowerCase().includes('discount')
        ? body.range1
        : body.range2
      const growthValues = var1.toLowerCase().includes('growth')
        ? body.range1
        : body.range2

      // 计算矩阵
      const values: number[][] = []
      const waccList = waccValues || [0.08, 0.10, 0.12, 0.14, 0.16]
      const growthList = growthValues || [0.01, 0.02, 0.03, 0.04, 0.05]

      for (const wacc of waccList) {
        const row: number[] = []
        for (const growth of growthList) {
          const modifiedInputs = { ...dcfInputs, discountRate: wacc, terminalGrowthRate: growth }
          const tempModel = new DCFModel(modifiedInputs)
          const output = tempModel.calculate()
          row.push(output.enterpriseValue)
        }
        values.push(row)
      }

      sensitivityMatrix = {
        waccValues: waccList,
        growthValues: growthList,
        values
      }
    }
    // 方式2：使用 waccRange/growthRange 格式
    else if (body.waccRange || body.growthRange) {
      const waccRange = body.waccRange || { min: 0.08, max: 0.16, step: 0.02 }
      const growthRange = body.growthRange || { min: 0.01, max: 0.05, step: 0.01 }

      sensitivityMatrix = model.sensitivityAnalysis(
        waccRange.min,
        waccRange.max,
        waccRange.step,
        growthRange.min,
        growthRange.max,
        growthRange.step
      )
    }
    // 方式3：使用默认范围
    else {
      sensitivityMatrix = model.sensitivityAnalysis()
    }

    // 计算基础 DCF 结果
    const baseResult = model.calculate()

    return NextResponse.json({
      success: true,
      baseInputs: dcfInputs,
      baseResult: {
        enterpriseValue: baseResult.enterpriseValue,
        equityValue: baseResult.equityValue,
        terminalValue: baseResult.terminalValue
      },
      matrix: sensitivityMatrix
    })

  } catch (error) {
    console.error('敏感性分析错误:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '敏感性分析失败',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/finance/sensitivity',
    description: 'DCF 模型敏感性分析',
    method: 'POST',
    inputFields: {
      baseValue: 'number - 基础收入',
      variable1: 'string - 第一个变量名 (wacc, growthRate 等)',
      range1: 'number[] - 第一个变量的范围',
      variable2: 'string - 第二个变量名',
      range2: 'number[] - 第二个变量的范围',
      dcfInputs: 'object - 完整 DCF 输入参数',
      waccRange: '{ min, max, step } - WACC 范围',
      growthRange: '{ min, max, step } - 增长率范围'
    },
    outputFields: {
      baseResult: 'object - 基础 DCF 计算结果',
      matrix: 'object - 敏感性分析矩阵 (waccValues, growthValues, values)'
    }
  })
}