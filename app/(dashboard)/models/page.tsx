/**
 * ModelForge - 模型列表页面
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Search,
  MoreVertical,
  Calculator,
  Clock,
  Trash2,
  Copy
} from 'lucide-react'

// 模拟数据
const mockModels = [
  {
    id: '1',
    name: '贵州茅台 DCF 估值模型',
    description: '基于 2023 年财报的 DCF 估值分析',
    nodes: 12,
    edges: 15,
    updatedAt: '2024-01-15',
    status: 'completed'
  },
  {
    id: '2',
    name: '宁德时代三表模型',
    description: '利润表、资产负债表、现金流量表联动',
    nodes: 8,
    edges: 10,
    updatedAt: '2024-01-10',
    status: 'draft'
  },
  {
    id: '3',
    name: '可比公司分析 - 白酒行业',
    description: 'PE、PB、EV/EBITDA 倍数对比',
    nodes: 6,
    edges: 8,
    updatedAt: '2024-01-05',
    status: 'completed'
  }
]

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [models] = useState(mockModels)

  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的模型</h1>
          <p className="text-gray-500 mt-1">管理和编辑你的金融模型</p>
        </div>
        <Link href="/model/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            新建模型
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索模型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Model Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}

        {/* Empty state */}
        {filteredModels.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">没有找到匹配的模型</p>
          </div>
        )}

        {/* New model card */}
        <Link
          href="/model/new"
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <Plus className="w-8 h-8 mb-2" />
          <span>创建新模型</span>
        </Link>
      </div>
    </div>
  )
}

function ModelCard({ model }: { model: typeof mockModels[0] }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{model.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  model.status === 'completed'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-yellow-100 text-yellow-600'
                }`}
              >
                {model.status === 'completed' ? '已完成' : '草稿'}
              </span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">{model.description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{model.nodes} 节点</span>
          <span>{model.edges} 连接</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {model.updatedAt}
          </span>
        </div>
      </div>

      <div className="border-t px-6 py-3 flex justify-between">
        <Link href={`/model/${model.id}`}>
          <Button variant="ghost" size="sm">
            编辑
          </Button>
        </Link>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}