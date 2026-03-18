/**
 * ModelForge - 模型 CRUD API
 */

import { NextRequest, NextResponse } from 'next/server'

// 模拟数据库存储
// TODO: 替换为 Supabase
const modelsStore: Map<string, unknown> = new Map()

/**
 * GET - 获取模型列表或单个模型
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const model = modelsStore.get(id)
    if (!model) {
      return NextResponse.json({ error: '模型不存在' }, { status: 404 })
    }
    return NextResponse.json(model)
  }

  // 返回模型列表
  const models = Array.from(modelsStore.entries()).map(([id, model]) => ({
    id,
    ...(model as object)
  }))

  return NextResponse.json({ models })
}

/**
 * POST - 创建模型
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const id = `model_${Date.now()}`
    const model = {
      ...body,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    modelsStore.set(id, model)

    return NextResponse.json({ success: true, id, model })
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 400 })
  }
}

/**
 * PUT - 更新模型
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id || !modelsStore.has(id)) {
      return NextResponse.json({ error: '模型不存在' }, { status: 404 })
    }

    const existing = modelsStore.get(id) as Record<string, unknown>
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    modelsStore.set(id, updated)

    return NextResponse.json({ success: true, model: updated })
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 400 })
  }
}

/**
 * DELETE - 删除模型
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id || !modelsStore.has(id)) {
    return NextResponse.json({ error: '模型不存在' }, { status: 404 })
  }

  modelsStore.delete(id)

  return NextResponse.json({ success: true })
}