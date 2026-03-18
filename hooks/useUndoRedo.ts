/**
 * ModelForge - 撤销/重做 Hook
 * 使用命令模式管理状态历史
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'

interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

interface UseUndoRedoOptions {
  maxHistorySize?: number
}

interface UseUndoRedoReturn {
  canUndo: boolean
  canRedo: boolean
  undo: () => HistoryState | null
  redo: () => HistoryState | null
  pushState: (nodes: Node[], edges: Edge[]) => void
  clearHistory: () => void
}

export function useUndoRedo(options: UseUndoRedoOptions = {}): UseUndoRedoReturn {
  const { maxHistorySize = 50 } = options

  // 历史记录
  const [history, setHistory] = useState<HistoryState[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  // 防抖定时器
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastPushedState = useRef<string>('')

  // 计算是否可以撤销/重做
  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  // 生成状态哈希（用于去重）
  const getStateHash = useCallback((nodes: Node[], edges: Edge[]): string => {
    return JSON.stringify({ nodes, edges })
  }, [])

  // 推送新状态
  const pushState = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      const stateHash = getStateHash(nodes, edges)

      // 如果与上次推送的状态相同，跳过
      if (stateHash === lastPushedState.current) {
        return
      }

      lastPushedState.current = stateHash

      // 清除之前的防抖定时器
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      // 防抖推送
      debounceTimer.current = setTimeout(() => {
        setHistory((prev) => {
          // 如果当前不在最新位置，截断后面的历史
          const newHistory = prev.slice(0, currentIndex + 1)

          // 添加新状态
          newHistory.push({ nodes, edges })

          // 限制历史大小
          if (newHistory.length > maxHistorySize) {
            newHistory.shift()
            return newHistory
          }

          return newHistory
        })

        setCurrentIndex((prev) => Math.min(prev + 1, maxHistorySize - 1))
      }, 300)
    },
    [currentIndex, maxHistorySize, getStateHash]
  )

  // 撤销
  const undo = useCallback((): HistoryState | null => {
    if (!canUndo) return null

    const newIndex = currentIndex - 1
    setCurrentIndex(newIndex)

    const state = history[newIndex]
    if (state) {
      lastPushedState.current = getStateHash(state.nodes, state.edges)
    }

    return state
  }, [canUndo, currentIndex, history, getStateHash])

  // 重做
  const redo = useCallback((): HistoryState | null => {
    if (!canRedo) return null

    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)

    const state = history[newIndex]
    if (state) {
      lastPushedState.current = getStateHash(state.nodes, state.edges)
    }

    return state
  }, [canRedo, currentIndex, history, getStateHash])

  // 清空历史
  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
    lastPushedState.current = ''
  }, [])

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clearHistory
  }
}