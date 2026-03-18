/**
 * ModelForge - DCF 估值模型
 * 自由现金流折现模型计算
 */

import type { DCFInputs, DCFOutputs, SensitivityMatrix } from '@/types'

/**
 * DCF 模型计算器
 */
export class DCFModel {
  private inputs: DCFInputs

  constructor(inputs: DCFInputs) {
    this.inputs = inputs
  }

  /**
   * 执行 DCF 计算
   */
  calculate(): DCFOutputs {
    const {
      historicalRevenue,
      revenueGrowthRate,
      ebitdaMargin,
      taxRate,
      depreciationPercent,
      capexPercent,
      nwcPercent,
      terminalGrowthRate,
      discountRate,
      projectionYears
    } = this.inputs

    // 1. 预测收入
    const projectedRevenue = this.projectRevenue(
      historicalRevenue[historicalRevenue.length - 1],
      revenueGrowthRate,
      projectionYears
    )

    // 2. 预测 EBITDA
    const projectedEBITDA = projectedRevenue.map(rev => rev * ebitdaMargin)

    // 3. 计算自由现金流
    const freeCashFlow = projectedEBITDA.map((ebitda, index) => {
      const depreciation = projectedRevenue[index] * depreciationPercent
      const ebit = ebitda - depreciation
      const taxes = ebit > 0 ? ebit * taxRate : 0
      const nopat = ebit - taxes
      const capex = projectedRevenue[index] * capexPercent
      const nwcChange = index === 0 ? 0 : (projectedRevenue[index] - projectedRevenue[index - 1]) * nwcPercent

      return nopat + depreciation - capex - nwcChange
    })

    // 4. 计算终值
    const terminalValue = this.calculateTerminalValue(
      freeCashFlow[freeCashFlow.length - 1],
      terminalGrowthRate,
      discountRate
    )

    // 5. 计算现值
    const presentValueFCF = freeCashFlow.map((fcf, index) => {
      return fcf / Math.pow(1 + discountRate, index + 1)
    })

    const terminalPresentValue = terminalValue / Math.pow(1 + discountRate, projectionYears)

    // 6. 计算企业价值
    const enterpriseValue = presentValueFCF.reduce((sum, pv) => sum + pv, 0) + terminalPresentValue

    // 注意：权益价值需要从外部传入净债务
    const outputs: DCFOutputs = {
      projectedRevenue,
      projectedEBITDA,
      freeCashFlow,
      terminalValue,
      presentValueFCF,
      enterpriseValue,
      equityValue: enterpriseValue, // 需要减去净债务
      perShareValue: 0 // 需要股份数
    }

    return outputs
  }

  /**
   * 预测收入
   */
  private projectRevenue(
    baseRevenue: number,
    growthRate: number,
    years: number
  ): number[] {
    const projections: number[] = []
    let revenue = baseRevenue

    for (let i = 0; i < years; i++) {
      revenue *= (1 + growthRate)
      projections.push(revenue)
    }

    return projections
  }

  /**
   * 计算终值 (Gordon Growth Model)
   */
  private calculateTerminalValue(
    finalFCF: number,
    terminalGrowthRate: number,
    discountRate: number
  ): number {
    if (discountRate <= terminalGrowthRate) {
      throw new Error('折现率必须大于永续增长率')
    }

    return (finalFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate)
  }

  /**
   * 敏感性分析
   * @param waccMin WACC 最小值
   * @param waccMax WACC 最大值
   * @param waccStep WACC 步长
   * @param growthMin 增长率最小值
   * @param growthMax 增长率最大值
   * @param growthStep 增长率步长
   * @returns 敏感性矩阵
   */
  sensitivityAnalysis(
    waccMin: number = 0.08,
    waccMax: number = 0.12,
    waccStep: number = 0.01,
    growthMin: number = 0.01,
    growthMax: number = 0.03,
    growthStep: number = 0.005
  ): SensitivityMatrix {
    // 生成 WACC 和增长率范围
    const waccValues: number[] = []
    const growthValues: number[] = []

    for (let wacc = waccMin; wacc <= waccMax + 0.0001; wacc += waccStep) {
      waccValues.push(Math.round(wacc * 1000) / 1000)
    }

    for (let growth = growthMin; growth <= growthMax + 0.0001; growth += growthStep) {
      growthValues.push(Math.round(growth * 1000) / 1000)
    }

    // 计算企业价值矩阵
    const values: number[][] = []

    for (const wacc of waccValues) {
      const row: number[] = []
      for (const growth of growthValues) {
        const modifiedInputs = { ...this.inputs, discountRate: wacc, terminalGrowthRate: growth }
        const dcf = new DCFModel(modifiedInputs)
        const output = dcf.calculate()
        row.push(output.enterpriseValue)
      }
      values.push(row)
    }

    return {
      waccValues,
      growthValues,
      values
    }
  }
}

/**
 * 快速 DCF 计算
 */
export function calculateDCF(inputs: DCFInputs): DCFOutputs {
  const model = new DCFModel(inputs)
  return model.calculate()
}