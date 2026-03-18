/**
 * ModelForge - 输出节点图表组件
 */

'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color?: string
  }[]
}

export interface OutputChartProps {
  type: 'line' | 'bar' | 'pie'
  data: ChartData
  title?: string
  height?: number
}

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16'  // lime
]

export function OutputChart({ type, data, title, height = 200 }: OutputChartProps) {
  const chartData = useMemo(() => {
    return data.labels.map((label, index) => {
      const point: Record<string, unknown> = { name: label }
      data.datasets.forEach(dataset => {
        point[dataset.label] = dataset.data[index]
      })
      return point
    })
  }, [data])

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.color || COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={dataset.color || COLORS[index % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        const pieData = data.labels.map((label, index) => ({
          name: label,
          value: data.datasets[0]?.data[index] || 0
        }))

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={height / 3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <div>未知图表类型</div>
    }
  }

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      )}
      {renderChart()}
    </div>
  )
}

// 格式化数值显示
export function formatValue(value: unknown, format: string): string {
  if (typeof value !== 'number') {
    return String(value)
  }

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
      }).format(value)
    case 'percent':
      return `${(value * 100).toFixed(2)}%`
    case 'million':
      return `${(value / 1e6).toFixed(2)}M`
    case 'billion':
      return `${(value / 1e8).toFixed(2)}亿`
    case 'number':
    default:
      return new Intl.NumberFormat('zh-CN').format(value)
  }
}

// 从节点数据生成图表数据
export function generateChartData(
  data: Record<string, unknown>,
  format?: string
): ChartData | null {
  // 如果数据本身就是 ChartData 格式
  if (data.labels && data.datasets) {
    return data as unknown as ChartData
  }

  // 如果是数组数据
  if (Array.isArray(data)) {
    const labels = data.map((_, i) => `项目${i + 1}`)
    const values = data.map(v => typeof v === 'number' ? v : 0)

    return {
      labels,
      datasets: [{
        label: '数值',
        data: values
      }]
    }
  }

  // 如果是键值对对象
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data).filter(([, v]) => typeof v === 'number')
    if (entries.length > 0) {
      return {
        labels: entries.map(([k]) => k),
        datasets: [{
          label: '数值',
          data: entries.map(([, v]) => v as number)
        }]
      }
    }
  }

  return null
}