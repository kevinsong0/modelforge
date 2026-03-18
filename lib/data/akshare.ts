/**
 * ModelForge - AKShare 数据连接器
 * 用于获取中国金融市场数据
 */

import type { StockData, FinancialData, AKShareConfig } from '@/types'

/**
 * AKShare 数据获取器
 * 通过后端 API 代理访问 AKShare
 */
export class AKShareConnector {
  private apiBase: string

  constructor(apiBase: string = '/api/data/akshare') {
    this.apiBase = apiBase
  }

  /**
   * 通用请求方法
   */
  private async request(endpoint: string, params: Record<string, unknown> = {}) {
    const response = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ endpoint, params })
    })

    if (!response.ok) {
      throw new Error(`请求失败: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 获取股票基本信息
   */
  async getStockInfo(symbol: string): Promise<StockData> {
    return this.request('stock-info', { symbol })
  }

  /**
   * 获取财务数据
   */
  async getFinancials(symbol: string): Promise<FinancialData> {
    return this.request('financials', { symbol })
  }

  /**
   * 获取历史行情数据
   */
  async getMarketData(config: AKShareConfig & { symbol: string }): Promise<{
    symbol: string
    name: string
    data: Array<{
      date: string
      open: number
      high: number
      low: number
      close: number
      volume: number
    }>
  }> {
    return this.request('market-data', config as unknown as Record<string, unknown>)
  }

  /**
   * 获取行业数据
   */
  async getIndustryData(industry: string): Promise<{
    industry: string
    companies: Array<{
      symbol: string
      name: string
      metrics: Record<string, number>
    }>
  }> {
    return this.request('industry-data', { industry })
  }

  /**
   * 搜索股票
   */
  async searchStocks(keyword: string): Promise<Array<{
    symbol: string
    name: string
    exchange: string
  }>> {
    const result = await this.request('search', { keyword })
    return result.results || []
  }
}

// 导出单例实例
export const akshare = new AKShareConnector()