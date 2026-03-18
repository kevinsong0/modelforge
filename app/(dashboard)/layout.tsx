/**
 * ModelForge - Dashboard 布局
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Calculator,
  LayoutDashboard,
  Settings,
  LogOut,
  Plus
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/models', label: '我的模型', icon: LayoutDashboard },
    { href: '/settings', label: '设置', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r shadow-sm z-40">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Model<span className="text-blue-600">Forge</span>
            </span>
          </Link>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">用户</p>
              <p className="text-xs text-gray-500 truncate">user@example.com</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <LogOut className="w-4 h-4" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}