/**
 * ModelForge - 首页
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Calculator,
  Database,
  LineChart,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Model<span className="text-blue-600">Forge</span>
            </span>
            <span className="text-sm text-gray-500 ml-2">模型锻造</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/models" className="text-gray-600 hover:text-gray-900">
              我的模型
            </Link>
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/signup">
              <Button>开始使用</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            锻造可靠、可审计的
            <br />
            <span className="text-blue-600">金融模型</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            ModelForge 是专为投资分析师打造的 AI 原生金融建模工具。
            通过可视化节点编辑，构建 DCF 估值、三表模型，每一步都可追溯、可审计。
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/models">
              <Button size="lg" className="gap-2">
                开始建模 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              观看演示
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20 bg-slate-50 rounded-3xl">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          为什么选择 ModelForge
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calculator className="w-8 h-8 text-blue-600" />}
            title="可视化建模"
            description="拖拽式节点编辑，直观构建复杂金融模型。支持 DCF、三表、可比公司分析等模板。"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-green-600" />}
            title="完全可追溯"
            description="每个计算结果都可追溯到数据源。自动生成审计日志，满足合规要求。"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-amber-600" />}
            title="AI 辅助"
            description="智能助手帮你构建模型、解释公式、获取数据。用自然语言描述需求即可。"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8 text-purple-600" />}
            title="数据集成"
            description="内置 AKShare 数据源，直接获取 A 股财务数据。支持 Excel 导入导出。"
          />
          <FeatureCard
            icon={<LineChart className="w-8 h-8 text-red-600" />}
            title="敏感性分析"
            description="一键生成敏感性分析表，快速了解关键假设对估值的影响。"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">准备好构建你的第一个模型了吗？</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            免费开始，无需信用卡。本地优先，你的数据始终在你的掌控之中。
          </p>
          <Link href="/models">
            <Button size="lg" variant="secondary" className="gap-2">
              免费开始 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <span>ModelForge © 2024</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">使用条款</a>
            <a href="#" className="hover:text-gray-900">隐私政策</a>
            <a href="https://github.com" className="hover:text-gray-900">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}