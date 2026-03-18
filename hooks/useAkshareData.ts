/**
 * ModelForge - AKShare 数据获取钩子
 */

import { useState, useCallback } from 'react'

export interface StockInfo {
  symbol: string
  name: string
  industry: string
  listDate: string
  marketCap: number
}

export interface FinancialData {
  symbol: string
  name: string
  year: number
  incomeStatement: {
    revenue: number
    costOfGoodsSold: number
    grossProfit: number
    operatingExpenses: number
    ebitda: number
    netIncome: number
  }
  balanceSheet: {
    totalAssets: number
    totalLiabilities: number
    shareholdersEquity: number
    cash: number
  }
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

export interface SearchResult {
  symbol: string
  name: string
  exchange: string
}

export function useAkshareData() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (endpoint: string, params: Record<string, unknown>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/data/akshare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, params })
      })

      if (!response.ok) {
        throw new Error('数据获取失败')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getStockInfo = useCallback(async (symbol: string): Promise<StockInfo> => {
    return fetchData('stock-info', { symbol })
  }, [fetchData])

  const getFinancials = useCallback(async (symbol: string): Promise<FinancialData> => {
    return fetchData('financials', { symbol })
  }, [fetchData])

  const getMarketData = useCallback(async (
    symbol: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ symbol: string; name: string; data: MarketDataPoint[] }> => {
    return fetchData('market-data', { symbol, startDate, endDate })
  }, [fetchData])

  const searchStocks = useCallback(async (keyword: string): Promise<SearchResult[]> => {
    return fetchData('search', { keyword })
  }, [fetchData])

  return {
    loading,
    error,
    getStockInfo,
    getFinancials,
    getMarketData,
    searchStocks
  }
}