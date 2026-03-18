/**
 * ModelForge - AI 聊天面板
 * 增强版：支持模型上下文感知和节点操作
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Send, Loader2, Sparkles, Plus, Link2, Trash2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Node, Edge } from '@xyflow/react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: SuggestedAction[]
}

interface SuggestedAction {
  type: 'add_node' | 'connect_nodes' | 'delete_node' | 'set_value'
  label: string
  data?: Record<string, unknown>
}

interface ChatPanelProps {
  nodes?: Node[]
  edges?: Edge[]
  onAddNode?: (type: string, data: Record<string, unknown>) => void
  onConnectNodes?: (sourceId: string, targetId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onUpdateNode?: (nodeId: string, data: Record<string, unknown>) => void
  className?: string
}

export function ChatPanel({
  nodes = [],
  edges = [],
  onAddNode,
  onConnectNodes,
  onDeleteNode,
  onUpdateNode,
  className
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 ModelForge 的 AI 助手。我可以帮助你构建金融模型，比如 DCF 估值模型、三表模型等。\n\n你可以尝试：\n• "帮我创建一个 DCF 模型"\n• "添加收入增长率假设"\n• "连接节点1到节点4"',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 处理建议操作
  const handleAction = useCallback((action: SuggestedAction) => {
    switch (action.type) {
      case 'add_node':
        onAddNode?.(action.data?.nodeType as string, action.data?.nodeData as Record<string, unknown>)
        break
      case 'connect_nodes':
        onConnectNodes?.(action.data?.sourceId as string, action.data?.targetId as string)
        break
      case 'delete_node':
        onDeleteNode?.(action.data?.nodeId as string)
        break
      case 'set_value':
        onUpdateNode?.(action.data?.nodeId as string, action.data?.nodeData as Record<string, unknown>)
        break
    }
  }, [onAddNode, onConnectNodes, onDeleteNode, onUpdateNode])

  // localStorage key for AI settings
  const AI_SETTINGS_KEY = 'modelforge_ai_settings'

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 构建模型上下文
      const modelContext = {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodeTypes: nodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label || n.data?.name })),
        recentConnections: edges.slice(-3).map(e => ({ source: e.source, target: e.target }))
      }

      // 读取 AI 设置
      let aiSettings = undefined
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(AI_SETTINGS_KEY)
        if (saved) {
          try {
            aiSettings = JSON.parse(saved)
          } catch (e) {
            console.error('Failed to parse AI settings:', e)
          }
        }
      }

      // 调用 AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          modelContext,
          aiSettings
        })
      })

      if (!response.ok) {
        throw new Error('AI 响应失败')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || '抱歉，我无法处理这个请求。',
        timestamp: new Date(),
        actions: data.suggestedActions
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 快捷操作
  const quickActions = [
    { label: '创建 DCF 模型', prompt: '帮我创建一个 DCF 估值模型' },
    { label: '添加假设节点', prompt: '添加一个收入增长率假设节点' },
    { label: '分析当前模型', prompt: '分析一下我当前模型的结构' }
  ]

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <span className="font-medium">AI 助手</span>
        <span className="ml-auto text-xs text-gray-400">
          {nodes.length} 节点 | {edges.length} 连接
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className="flex flex-col gap-2 max-w-[80%]">
              <div
                className={cn(
                  'rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {/* 建议操作按钮 */}
              {message.actions && message.actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(action)}
                      className="inline-flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition-colors"
                    >
                      {action.type === 'add_node' && <Plus className="w-3 h-3" />}
                      {action.type === 'connect_nodes' && <Link2 className="w-3 h-3" />}
                      {action.type === 'delete_node' && <Trash2 className="w-3 h-3" />}
                      {action.type === 'set_value' && <Lightbulb className="w-3 h-3" />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => setInput(action.prompt)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="输入消息... (Shift+Enter 换行)"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}