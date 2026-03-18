/**
 * ModelForge - 注册页面
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calculator, Check } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Calculator className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              Model<span className="text-blue-600">Forge</span>
            </span>
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">创建账号</h1>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <input
                type="text"
                placeholder="你的姓名"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                placeholder="至少 8 位"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <input
                type="password"
                placeholder="再次输入密码"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button type="submit" className="w-full">
              注册
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            已有账号？{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              立即登录
            </Link>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-medium text-blue-900 mb-3">注册即享</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-blue-800">
              <Check className="w-4 h-4" />
              无限数量的模型
            </li>
            <li className="flex items-center gap-2 text-sm text-blue-800">
              <Check className="w-4 h-4" />
              AI 智能助手
            </li>
            <li className="flex items-center gap-2 text-sm text-blue-800">
              <Check className="w-4 h-4" />
              本地数据存储
            </li>
            <li className="flex items-center gap-2 text-sm text-blue-800">
              <Check className="w-4 h-4" />
              Excel 导入导出
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}