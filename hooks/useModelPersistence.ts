/**
 * ModelForge - 模型持久化钩子
 * 支持本地存储和服务器同步
 */

import { useState, useCallback, useEffect } from 'react'
import type { Node, Edge } from '@xyflow/react'

export interface SavedModel {
  id: string
  name: string
  description?: string
  nodes: Node[]
  edges: Edge[]
  createdAt: string
  updatedAt: string
  version: number
}

export interface ModelPersistenceState {
  isSaving: boolean
  isLoading: boolean
  lastSaved: Date | null
  error: string | null
  hasUnsavedChanges: boolean
}

const STORAGE_KEY = 'modelforge_models'
const AUTO_SAVE_DELAY = 2000 // 2秒自动保存

export function useModelPersistence(modelId: string | null) {
  const [state, setState] = useState<ModelPersistenceState>({
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    error: null,
    hasUnsavedChanges: false
  })

  const [pendingSave, setPendingSave] = useState<{
    nodes: Node[]
    edges: Edge[]
    name: string
    description?: string
  } | null>(null)

  // 从本地存储加载模型列表
  const loadModelList = useCallback((): SavedModel[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch (err) {
      console.error('加载模型列表失败:', err)
    }
    return []
  }, [])

  // 保存模型列表到本地存储
  const saveModelList = useCallback((models: SavedModel[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(models))
    } catch (err) {
      console.error('保存模型列表失败:', err)
    }
  }, [])

  // 加载单个模型
  const loadModel = useCallback(async (id: string): Promise<SavedModel | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // 先从本地存储加载
      const models = loadModelList()
      const localModel = models.find(m => m.id === id)

      if (localModel) {
        setState(prev => ({ ...prev, isLoading: false }))
        return localModel
      }

      // 如果本地没有，尝试从服务器加载
      const response = await fetch(`/api/models?id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setState(prev => ({ ...prev, isLoading: false }))
        return data
      }

      setState(prev => ({ ...prev, isLoading: false, error: '模型不存在' }))
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
      return null
    }
  }, [loadModelList])

  // 保存模型
  const saveModel = useCallback(async (
    nodes: Node[],
    edges: Edge[],
    name: string,
    description?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    setState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      const now = new Date().toISOString()
      const id = modelId || `model_${Date.now()}`

      const model: SavedModel = {
        id,
        name,
        description,
        nodes,
        edges,
        createdAt: modelId ? now : now,
        updatedAt: now,
        version: 1
      }

      // 保存到本地存储
      const models = loadModelList()
      const existingIndex = models.findIndex(m => m.id === id)

      if (existingIndex >= 0) {
        model.createdAt = models[existingIndex].createdAt
        model.version = (models[existingIndex].version || 0) + 1
        models[existingIndex] = model
      } else {
        models.push(model)
      }

      saveModelList(models)

      // 同时保存到服务器
      try {
        await fetch('/api/models', {
          method: modelId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model)
        })
      } catch {
        // 服务器保存失败不影响本地保存
        console.warn('服务器同步失败，已保存到本地')
      }

      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }))

      return { success: true, id }
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败'
      setState(prev => ({ ...prev, isSaving: false, error: message }))
      return { success: false, error: message }
    }
  }, [modelId, loadModelList, saveModelList])

  // 删除模型
  const deleteModel = useCallback(async (id: string): Promise<boolean> => {
    try {
      // 从本地存储删除
      const models = loadModelList()
      const filtered = models.filter(m => m.id !== id)
      saveModelList(filtered)

      // 从服务器删除
      await fetch(`/api/models?id=${id}`, { method: 'DELETE' })

      return true
    } catch (err) {
      console.error('删除模型失败:', err)
      return false
    }
  }, [loadModelList, saveModelList])

  // 标记有未保存的更改
  const markUnsaved = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: true }))
  }, [])

  // 导出模型为 JSON 文件
  const exportModel = useCallback((model: SavedModel) => {
    const json = JSON.stringify(model, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${model.name || 'model'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  // 从 JSON 文件导入模型
  const importModel = useCallback((file: File): Promise<SavedModel | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const model = JSON.parse(content) as SavedModel

          // 验证模型结构
          if (!model.nodes || !model.edges) {
            throw new Error('无效的模型文件')
          }

          // 生成新 ID 避免冲突
          model.id = `model_${Date.now()}`
          model.createdAt = new Date().toISOString()
          model.updatedAt = model.createdAt

          // 保存到本地
          const models = loadModelList()
          models.push(model)
          saveModelList(models)

          resolve(model)
        } catch (err) {
          console.error('导入模型失败:', err)
          resolve(null)
        }
      }
      reader.readAsText(file)
    })
  }, [loadModelList, saveModelList])

  return {
    ...state,
    loadModel,
    loadModelList,
    saveModel,
    deleteModel,
    markUnsaved,
    exportModel,
    importModel
  }
}