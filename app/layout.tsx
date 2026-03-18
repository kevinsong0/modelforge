/**
 * ModelForge - 根布局
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ModelForge - 模型锻造',
  description: '锻造可靠、可审计的金融模型',
  keywords: ['金融建模', 'DCF', '估值', '财务分析', 'PE', 'VC']
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}