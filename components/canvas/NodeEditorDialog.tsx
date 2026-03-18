/**
 * ModelForge - 节点编辑对话框
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { Node } from '@xyflow/react'
import { useAkshareData } from '@/hooks/useAkshareData'
import type { SearchResult, FinancialData } from '@/hooks/useAkshareData'
import { Loader2, Search } from 'lucide-react'

interface NodeEditorDialogProps {
  node: Node | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (nodeId: string, newData: Record<string, unknown>) => void
}

export function NodeEditorDialog({
  node,
  open,
  onOpenChange,
  onSave
}: NodeEditorDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null)
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const { loading: akshareLoading, error: akshareError, searchStocks, getFinancials } = useAkshareData()

  // 防抖搜索
  const performSearch = useCallback(
    async (keyword: string) => {
      if (!keyword || keyword.length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const results = await searchStocks(keyword)
        setSearchResults(results.slice(0, 10)) // 限制显示10条
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [searchStocks]
  )

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchKeyword)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchKeyword, performSearch])

  // 初始化表单数据
  useEffect(() => {
    if (node) {
      setFormData({ ...node.data })
      // 如果有已选择的股票，恢复状态
      if (node.data.selectedStock) {
        setSelectedStock(node.data.selectedStock as SearchResult)
      }
      if (node.data.financialData) {
        setFinancialData(node.data.financialData as FinancialData)
      }
    }
  }, [node])

  // 选择股票后获取财务数据
  const handleSelectStock = async (stock: SearchResult) => {
    setSelectedStock(stock)
    setSearchResults([])
    setSearchKeyword('')
    setIsLoadingData(true)
    try {
      const data = await getFinancials(stock.symbol)
      setFinancialData(data)
      // 更新表单数据
      setFormData((prev) => ({
        ...prev,
        stockCode: stock.symbol,
        stockName: stock.name,
        selectedStock: stock,
        financialData: data
      }))
    } catch {
      // 获取失败时清空
      setFinancialData(null)
    } finally {
      setIsLoadingData(false)
    }
  }

  if (!node) return null

  const handleSave = () => {
    onSave(node.id, formData)
    onOpenChange(false)
  }

  const renderInputNodeEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">标签名称</Label>
        <Input
          id="label"
          value={(formData.label as string) || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="输入节点标签"
        />
      </div>
      <div>
        <Label htmlFor="source">数据来源</Label>
        <Select
          value={(formData.source as string) || 'manual'}
          onValueChange={(value) => setFormData({ ...formData, source: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择数据来源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">手动输入</SelectItem>
            <SelectItem value="akshare">AKShare 数据</SelectItem>
            <SelectItem value="upload">文件上传</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="dataType">数据类型</Label>
        <Select
          value={(formData.dataType as string) || 'number'}
          onValueChange={(value) => setFormData({ ...formData, dataType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择数据类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">数值</SelectItem>
            <SelectItem value="text">文本</SelectItem>
            <SelectItem value="financials">财务数据</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 手动输入 */}
      {formData.source === 'manual' && (
        <div>
          <Label htmlFor="value">值</Label>
          <Input
            id="value"
            type="number"
            value={(formData.value as number) || 0}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
          />
        </div>
      )}

      {/* AKShare 数据选择 */}
      {formData.source === 'akshare' && (
        <div className="space-y-3">
          <Label>股票搜索</Label>
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="输入股票代码或名称搜索..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* 搜索结果下拉 */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => handleSelectStock(stock)}
                  >
                    <div>
                      <span className="font-medium">{stock.symbol}</span>
                      <span className="text-gray-500 ml-2">{stock.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{stock.exchange}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 搜索中状态 */}
            {isSearching && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">搜索中...</span>
              </div>
            )}
          </div>

          {/* 已选择的股票 */}
          {selectedStock && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-blue-700">{selectedStock.symbol}</span>
                  <span className="text-blue-600 ml-2">{selectedStock.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStock(null)
                    setFinancialData(null)
                    setFormData((prev) => ({
                      ...prev,
                      stockCode: undefined,
                      stockName: undefined,
                      selectedStock: undefined,
                      financialData: undefined
                    }))
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  清除
                </button>
              </div>
            </div>
          )}

          {/* 加载财务数据中 */}
          {isLoadingData && (
            <div className="flex items-center justify-center p-4 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">获取财务数据中...</span>
            </div>
          )}

          {/* 显示财务数据摘要 */}
          {financialData && !isLoadingData && (
            <div className="p-3 bg-gray-50 border rounded-lg space-y-2">
              <div className="text-sm font-medium text-gray-700">
                {financialData.name} ({financialData.year}) 财务数据
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">营业收入:</span>
                  <span className="ml-1 font-medium">
                    {(financialData.incomeStatement.revenue / 1e8).toFixed(2)}亿
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">净利润:</span>
                  <span className="ml-1 font-medium">
                    {(financialData.incomeStatement.netIncome / 1e8).toFixed(2)}亿
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">总资产:</span>
                  <span className="ml-1 font-medium">
                    {(financialData.balanceSheet.totalAssets / 1e8).toFixed(2)}亿
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">经营现金流:</span>
                  <span className="ml-1 font-medium">
                    {(financialData.cashFlow.operating / 1e8).toFixed(2)}亿
                  </span>
                </div>
              </div>
            </div>
          )}

          {akshareError && (
            <div className="text-sm text-red-500">{akshareError}</div>
          )}
        </div>
      )}
    </div>
  )

  const renderAssumptionNodeEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">假设名称</Label>
        <Input
          id="name"
          value={(formData.name as string) || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="如：收入增长率"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="value">数值</Label>
          <Input
            id="value"
            type="number"
            value={(formData.value as number) || 0}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="unit">单位</Label>
          <Input
            id="unit"
            value={(formData.unit as string) || ''}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="如：%"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={(formData.description as string) || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="说明此假设的依据"
          rows={3}
        />
      </div>
    </div>
  )

  const renderFormulaNodeEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">公式名称</Label>
        <Input
          id="label"
          value={(formData.label as string) || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="如：收入预测"
        />
      </div>
      <div>
        <Label htmlFor="expression">公式表达式</Label>
        <Textarea
          id="expression"
          value={(formData.expression as string) || ''}
          onChange={(e) => setFormData({ ...formData, expression: e.target.value })}
          placeholder="如：revenue * (1 + growth_rate)"
          rows={3}
          className="font-mono"
        />
      </div>
      <div className="text-xs text-gray-500">
        <p className="font-medium mb-1">支持的函数：</p>
        <p>sum, avg, max, min, abs, round, floor, ceil, sqrt, pow, log, exp</p>
      </div>
    </div>
  )

  const renderTableNodeEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">表格名称</Label>
        <Input
          id="label"
          value={(formData.label as string) || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        />
      </div>
      <div>
        <Label>表头设置</Label>
        <div className="text-sm text-gray-500 mt-1">
          当前表头: {((formData.headers as string[]) || []).join(', ')}
        </div>
        <p className="text-xs text-gray-400 mt-2">表格数据编辑功能开发中...</p>
      </div>
    </div>
  )

  const renderModuleNodeEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">模块名称</Label>
        <Input
          id="label"
          value={(formData.label as string) || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        />
      </div>
      <div className="text-sm text-gray-500">
        包含 {((formData.childNodes as string[]) || []).length} 个子节点
      </div>
      <p className="text-xs text-gray-400">模块内部结构编辑功能开发中...</p>
    </div>
  )

  const renderOutputNodeEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">输出名称</Label>
        <Input
          id="name"
          value={(formData.name as string) || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="format">输出格式</Label>
        <Select
          value={(formData.format as string) || 'number'}
          onValueChange={(value) => setFormData({ ...formData, format: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择输出格式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">数值</SelectItem>
            <SelectItem value="text">文本</SelectItem>
            <SelectItem value="table">表格</SelectItem>
            <SelectItem value="chart">图表</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.format === 'chart' && (
        <div>
          <Label htmlFor="chartType">图表类型</Label>
          <Select
            value={(formData.chartType as string) || 'bar'}
            onValueChange={(value) => setFormData({ ...formData, chartType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择图表类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">柱状图</SelectItem>
              <SelectItem value="line">折线图</SelectItem>
              <SelectItem value="pie">饼图</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )

  const renderEditor = () => {
    switch (node.type) {
      case 'input':
        return renderInputNodeEditor()
      case 'assumption':
        return renderAssumptionNodeEditor()
      case 'formula':
        return renderFormulaNodeEditor()
      case 'table':
        return renderTableNodeEditor()
      case 'module':
        return renderModuleNodeEditor()
      case 'output':
        return renderOutputNodeEditor()
      default:
        return <div>未知节点类型</div>
    }
  }

  const getNodeTitle = () => {
    const titles: Record<string, string> = {
      input: '数据输入',
      assumption: '假设',
      formula: '公式计算',
      table: '表格',
      module: '模块',
      output: '输出'
    }
    return titles[node.type || ''] || '节点'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑{getNodeTitle()}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{renderEditor()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}