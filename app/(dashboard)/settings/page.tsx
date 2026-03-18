/**
 * ModelForge - 设置页面
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Key, Globe, Bell, Shield, HelpCircle, Check, Loader2 } from 'lucide-react'

// localStorage key for AI settings
const AI_SETTINGS_KEY = 'modelforge_ai_settings'

interface AISettings {
  provider: string
  apiKey: string
  baseURL: string
  model: string
}

// Default settings for each provider
const PROVIDER_DEFAULTS: Record<string, { baseURL: string; model: string }> = {
  openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
  anthropic: { baseURL: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
  azure: { baseURL: '', model: 'gpt-4o' },
  custom: { baseURL: '', model: '' }
}

export default function SettingsPage() {
  const [apiProvider, setApiProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')
  const [baseURL, setBaseURL] = useState('')
  const [model, setModel] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(AI_SETTINGS_KEY)
    if (saved) {
      try {
        const settings: AISettings = JSON.parse(saved)
        setApiProvider(settings.provider || 'openai')
        setApiKey(settings.apiKey || '')
        setBaseURL(settings.baseURL || '')
        setModel(settings.model || '')
      } catch (e) {
        console.error('Failed to load AI settings:', e)
      }
    }
  }, [])

  // Update URL and model when provider changes
  const handleProviderChange = (newProvider: string) => {
    setApiProvider(newProvider)
    const defaults = PROVIDER_DEFAULTS[newProvider]
    if (defaults && newProvider !== 'custom') {
      setBaseURL(defaults.baseURL)
      setModel(defaults.model)
    }
  }

  // Save settings to localStorage
  const handleSave = () => {
    setIsSaving(true)
    setSaveSuccess(false)

    const settings: AISettings = {
      provider: apiProvider,
      apiKey,
      baseURL: apiProvider === 'custom' ? baseURL : PROVIDER_DEFAULTS[apiProvider]?.baseURL || baseURL,
      model: apiProvider === 'custom' ? model : PROVIDER_DEFAULTS[apiProvider]?.model || model
    }

    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))

    // Simulate async save for UX feedback
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }, 500)
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">设置</h1>

      <div className="space-y-8">
        {/* AI 设置 */}
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">AI 配置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI 服务提供商
              </label>
              <select
                value={apiProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="azure">Azure OpenAI</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                你的 API Key 仅存储在本地浏览器，不会上传到服务器
              </p>
            </div>

            {/* Base URL - show for Azure and Custom */}
            {(apiProvider === 'azure' || apiProvider === 'custom') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API 地址 (Base URL)
                </label>
                <input
                  type="url"
                  value={baseURL}
                  onChange={(e) => setBaseURL(e.target.value)}
                  placeholder={apiProvider === 'custom' ? 'https://api.example.com/v1' : 'https://your-resource.openai.azure.com/openai/deployments/your-deployment'}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {apiProvider === 'custom'
                    ? '输入 OpenAI 兼容的 API 地址，如：https://dashscope.aliyuncs.com/compatible-mode/v1'
                    : 'Azure OpenAI 端点地址'}
                </p>
              </div>
            )}

            {/* Model - show for Azure and Custom */}
            {(apiProvider === 'azure' || apiProvider === 'custom') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模型名称
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={apiProvider === 'custom' ? 'glm-4, qwen-turbo, deepseek-chat...' : 'gpt-4o'}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {apiProvider === 'custom'
                    ? '输入模型 ID，如：glm-4, qwen-turbo, deepseek-chat, gpt-4o-mini 等'
                    : 'Azure 部署的模型名称'}
                </p>
              </div>
            )}

            {/* Current config summary */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-700 mb-1">当前配置：</p>
              <p className="text-gray-600">
                提供商: <span className="font-mono">{apiProvider === 'custom' ? '自定义' : apiProvider}</span>
              </p>
              <p className="text-gray-600">
                模型: <span className="font-mono">{model || PROVIDER_DEFAULTS[apiProvider]?.model || '未设置'}</span>
              </p>
              <p className="text-gray-600">
                API 地址: <span className="font-mono text-xs">{baseURL || PROVIDER_DEFAULTS[apiProvider]?.baseURL || '未设置'}</span>
              </p>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已保存
                </>
              ) : (
                '保存配置'
              )}
            </Button>
          </div>
        </section>

        {/* 数据源设置 */}
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">数据源</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">AKShare</p>
                <p className="text-sm text-gray-500">中国 A 股市场数据（免费）</p>
              </div>
              <span className="text-green-600 text-sm font-medium">已连接</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
              <div>
                <p className="font-medium text-gray-900">Wind</p>
                <p className="text-sm text-gray-500">专业金融数据（企业版）</p>
              </div>
              <span className="text-gray-400 text-sm">未配置</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
              <div>
                <p className="font-medium text-gray-900">Choice</p>
                <p className="text-sm text-gray-500">东方财富数据（企业版）</p>
              </div>
              <span className="text-gray-400 text-sm">未配置</span>
            </div>
          </div>
        </section>

        {/* 通知设置 */}
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">通知</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-gray-700">模型计算完成通知</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-gray-700">产品更新通知</span>
            </label>
          </div>
        </section>

        {/* 安全设置 */}
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">安全</h2>
          </div>

          <div className="space-y-3">
            <Button variant="outline">修改密码</Button>
            <p className="text-sm text-gray-500">
              你的所有模型数据都存储在本地，我们无法访问你的数据
            </p>
          </div>
        </section>

        {/* 帮助 */}
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">帮助与支持</h2>
          </div>

          <div className="space-y-2">
            <a href="#" className="block text-blue-600 hover:underline">使用文档</a>
            <a href="#" className="block text-blue-600 hover:underline">API 文档</a>
            <a href="#" className="block text-blue-600 hover:underline">常见问题</a>
            <a href="https://github.com" className="block text-blue-600 hover:underline">GitHub</a>
          </div>
        </section>
      </div>
    </div>
  )
}