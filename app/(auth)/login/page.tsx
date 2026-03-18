/**
 * ModelForge - 登录页面
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calculator } from 'lucide-react'

export default function LoginPage() {
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
          <h1 className="text-xl font-semibold text-gray-900 mb-6">登录</h1>

          <form className="space-y-4">
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
                placeholder="••••••••"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                忘记密码？
              </a>
            </div>

            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            还没有账号？{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}