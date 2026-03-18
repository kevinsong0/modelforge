/**
 * ModelForge - 三表建模
 * 利润表、资产负债表、现金流量表
 */

import type { ThreeStatementModel, IncomeStatement, BalanceSheet, CashFlowStatement } from '@/types'

/**
 * 利润表计算
 */
export function calculateIncomeStatement(params: {
  revenue: number
  cogsPercent: number
  grossMargin?: number
  operatingExpensesPercent: number
  depreciation: number
  interest: number
  taxRate: number
}): IncomeStatement {
  const { revenue, cogsPercent, operatingExpensesPercent, depreciation, interest, taxRate } = params

  const costOfGoodsSold = revenue * cogsPercent
  const grossProfit = revenue - costOfGoodsSold
  const operatingExpenses = revenue * operatingExpensesPercent
  const ebitda = grossProfit - operatingExpenses
  const ebit = ebitda - depreciation
  const ebt = ebit - interest
  const taxes = ebt > 0 ? ebt * taxRate : 0
  const netIncome = ebt - taxes

  return {
    revenue,
    costOfGoodsSold,
    grossProfit,
    operatingExpenses,
    ebitda,
    depreciation,
    ebit,
    interest,
    ebt,
    taxes,
    netIncome
  }
}

/**
 * 资产负债表计算
 */
export function calculateBalanceSheet(params: {
  // 资产
  cash: number
  accountsReceivable: number
  inventory: number
  propertyPlantEquipment: number
  intangibleAssets: number
  // 负债
  accountsPayable: number
  shortTermDebt: number
  longTermDebt: number
  // 权益
  shareholdersEquity: number
}): BalanceSheet {
  const {
    cash,
    accountsReceivable,
    inventory,
    propertyPlantEquipment,
    intangibleAssets,
    accountsPayable,
    shortTermDebt,
    longTermDebt,
    shareholdersEquity
  } = params

  const currentAssets = cash + accountsReceivable + inventory
  const totalAssets = currentAssets + propertyPlantEquipment + intangibleAssets
  const currentLiabilities = accountsPayable + shortTermDebt
  const totalLiabilities = currentLiabilities + longTermDebt

  return {
    cash,
    accountsReceivable,
    inventory,
    currentAssets,
    propertyPlantEquipment,
    intangibleAssets,
    totalAssets,
    accountsPayable,
    shortTermDebt,
    currentLiabilities,
    longTermDebt,
    totalLiabilities,
    shareholdersEquity
  }
}

/**
 * 现金流量表计算
 */
export function calculateCashFlowStatement(params: {
  // 经营活动
  netIncome: number
  depreciation: number
  changeInWorkingCapital: number
  // 投资活动
  capex: number
  acquisitions: number
  // 筹资活动
  debtIssuance: number
  debtRepayment: number
  dividends: number
  shareRepurchase: number
  // 期初现金
  beginningCash: number
}): CashFlowStatement {
  const {
    netIncome,
    depreciation,
    changeInWorkingCapital,
    capex,
    acquisitions,
    debtIssuance,
    debtRepayment,
    dividends,
    shareRepurchase,
    beginningCash
  } = params

  const operatingCashFlow = netIncome + depreciation + changeInWorkingCapital
  const investingCashFlow = -capex - acquisitions
  const financingCashFlow = debtIssuance - debtRepayment - dividends - shareRepurchase
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow
  const endingCash = beginningCash + netCashFlow

  return {
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    netCashFlow,
    beginningCash,
    endingCash
  }
}

/**
 * 完整三表模型
 */
export function buildThreeStatementModel(params: {
  revenue: number
  revenueGrowth: number
  cogsPercent: number
  operatingExpensesPercent: number
  taxRate: number
  depreciation: number
  capex: number
  changeInWorkingCapital: number
  interest: number
  beginningCash: number
  debt: number
  equity: number
}): ThreeStatementModel {
  const incomeStatement = calculateIncomeStatement({
    revenue: params.revenue,
    cogsPercent: params.cogsPercent,
    operatingExpensesPercent: params.operatingExpensesPercent,
    depreciation: params.depreciation,
    interest: params.interest,
    taxRate: params.taxRate
  })

  const cashFlowStatement = calculateCashFlowStatement({
    netIncome: incomeStatement.netIncome,
    depreciation: params.depreciation,
    changeInWorkingCapital: params.changeInWorkingCapital,
    capex: params.capex,
    acquisitions: 0,
    debtIssuance: 0,
    debtRepayment: 0,
    dividends: 0,
    shareRepurchase: 0,
    beginningCash: params.beginningCash
  })

  const balanceSheet = calculateBalanceSheet({
    cash: cashFlowStatement.endingCash,
    accountsReceivable: params.revenue * 0.1, // 假设应收账款为收入的10%
    inventory: params.revenue * params.cogsPercent * 0.2, // 假设存货为成本的20%
    propertyPlantEquipment: 1000, // 需要实际数据
    intangibleAssets: 0,
    accountsPayable: params.revenue * params.cogsPercent * 0.1,
    shortTermDebt: params.debt * 0.2,
    longTermDebt: params.debt * 0.8,
    shareholdersEquity: params.equity
  })

  return {
    incomeStatement,
    balanceSheet,
    cashFlowStatement
  }
}

/**
 * 财务比率计算
 */
export const FinancialRatios = {
  /**
   * 流动比率
   */
  currentRatio(bs: BalanceSheet): number {
    return bs.currentAssets / bs.currentLiabilities
  },

  /**
   * 速动比率
   */
  quickRatio(bs: BalanceSheet): number {
    return (bs.cash + bs.accountsReceivable) / bs.currentLiabilities
  },

  /**
   * 资产负债率
   */
  debtToAssets(bs: BalanceSheet): number {
    return bs.totalLiabilities / bs.totalAssets
  },

  /**
   * 权益乘数
   */
  equityMultiplier(bs: BalanceSheet): number {
    return bs.totalAssets / bs.shareholdersEquity
  },

  /**
   * 毛利率
   */
  grossMargin(is: IncomeStatement): number {
    return is.grossProfit / is.revenue
  },

  /**
   * 净利率
   */
  netMargin(is: IncomeStatement): number {
    return is.netIncome / is.revenue
  },

  /**
   * ROE (净资产收益率)
   */
  roe(is: IncomeStatement, bs: BalanceSheet): number {
    return is.netIncome / bs.shareholdersEquity
  },

  /**
   * ROA (总资产收益率)
   */
  roa(is: IncomeStatement, bs: BalanceSheet): number {
    return is.netIncome / bs.totalAssets
  },

  /**
   * EBITDA 利润率
   */
  ebitdaMargin(is: IncomeStatement): number {
    return is.ebitda / is.revenue
  }
}