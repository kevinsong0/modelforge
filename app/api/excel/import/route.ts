/**
 * ModelForge - Excel 导入 API
 * 从 Excel 文件导入模型数据
 */

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * 导入响应格式
 */
interface ImportResult {
  success: boolean
  name?: string
  description?: string
  nodes?: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: Record<string, unknown>
  }>
  edges?: Array<{
    id: string
    source: string
    target: string
  }>
  variables?: Record<string, unknown>
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未提供文件' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 解析 Excel 文件
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    const result: ImportResult = {
      success: true,
      nodes: [],
      edges: [],
      variables: {}
    }

    // 1. 读取模型信息表
    if (workbook.SheetNames.includes('模型信息')) {
      const modelInfoSheet = workbook.Sheets['模型信息']
      const modelInfoData = XLSX.utils.sheet_to_json(modelInfoSheet, { header: ['field', 'value'] }) as Array<{ field: string; value: unknown }>

      modelInfoData.forEach(row => {
        if (row.field === '模型名称') result.name = String(row.value || '')
        if (row.field === '描述') result.description = String(row.value || '')
      })
    }

    // 2. 读取节点表
    if (workbook.SheetNames.includes('节点')) {
      const nodesSheet = workbook.Sheets['节点']
      const nodesData = XLSX.utils.sheet_to_json(nodesSheet) as Array<{
        ID: string
        类型: string
        'X坐标': number
        'Y坐标': number
        名称: string
        数据: string
      }>

      result.nodes = nodesData.map(row => ({
        id: row.ID,
        type: row.类型,
        position: { x: row['X坐标'] || 0, y: row['Y坐标'] || 0 },
        data: parseNodeData(row.数据, row.名称, row.类型)
      }))
    }

    // 3. 读取连接表
    if (workbook.SheetNames.includes('连接')) {
      const edgesSheet = workbook.Sheets['连接']
      const edgesData = XLSX.utils.sheet_to_json(edgesSheet) as Array<{
        ID: string
        '源节点': string
        '目标节点': string
      }>

      result.edges = edgesData.map(row => ({
        id: row.ID,
        source: row['源节点'],
        target: row['目标节点']
      }))
    }

    // 4. 读取假设表
    if (workbook.SheetNames.includes('假设') && result.nodes) {
      const assumptionsSheet = workbook.Sheets['假设']
      const assumptionsData = XLSX.utils.sheet_to_json(assumptionsSheet) as Array<{
        ID: string
        名称: string
        值: string | number
        单位: string
        描述: string
      }>

      // 更新节点数据中的假设值
      assumptionsData.forEach(assumption => {
        const node = result.nodes!.find(n => n.id === assumption.ID)
        if (node) {
          node.data = {
            ...node.data,
            name: assumption.名称,
            value: typeof assumption.值 === 'string' ? parseFloat(assumption.值) || assumption.值 : assumption.值,
            unit: assumption.单位,
            description: assumption.描述
          }
        }
      })
    }

    // 5. 读取变量表
    if (workbook.SheetNames.includes('变量')) {
      const variablesSheet = workbook.Sheets['变量']
      const variablesData = XLSX.utils.sheet_to_json(variablesSheet) as Array<{
        '变量名': string
        '值': string
      }>

      result.variables = {}
      variablesData.forEach(row => {
        try {
          result.variables![row['变量名']] = JSON.parse(row['值'])
        } catch {
          result.variables![row['变量名']] = row['值']
        }
      })
    }

    // 6. 读取 DCF 数据（如果有）
    if (workbook.SheetNames.includes('DCF数据') && result.nodes) {
      const dcfSheet = workbook.Sheets['DCF数据']
      const dcfData = XLSX.utils.sheet_to_json(dcfSheet, { header: 1 }) as unknown[][]

      let currentNodeId: string | null = null
      let currentSection: 'inputs' | 'outputs' | null = null
      const dcfNodeData: Record<string, { inputs: Record<string, unknown>; outputs: Record<string, unknown> }> = {}

      dcfData.forEach(row => {
        const rowStr = String(row[0] || '')

        // 检测节点标识
        if (rowStr.startsWith('节点:')) {
          currentNodeId = rowStr.replace('节点:', '').trim()
          dcfNodeData[currentNodeId] = { inputs: {}, outputs: {} }
          currentSection = null
        }
        // 检测节标题
        else if (rowStr === '输入参数') {
          currentSection = 'inputs'
        } else if (rowStr === '输出结果') {
          currentSection = 'outputs'
        }
        // 读取参数值
        else if (currentNodeId && currentSection && row[0] && row[1]) {
          const key = String(row[0])
          const value = parseValue(row[1])
          dcfNodeData[currentNodeId][currentSection][key] = value
        }
      })

      // 更新 DCF 节点数据
      Object.entries(dcfNodeData).forEach(([nodeId, data]) => {
        const node = result.nodes!.find(n => n.id === nodeId)
        if (node) {
          node.data = {
            ...node.data,
            inputs: data.inputs,
            outputs: data.outputs
          }
        }
      })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Excel 导入错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Excel 导入失败'
      },
      { status: 500 }
    )
  }
}

/**
 * 解析节点数据 JSON
 */
function parseNodeData(dataStr: string, name: string, type: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(dataStr)
    return {
      ...parsed,
      name: name || parsed.name || parsed.label,
      label: name || parsed.name || parsed.label
    }
  } catch {
    return {
      name,
      label: name,
      type
    }
  }
}

/**
 * 解析值，尝试转换为数字或保持字符串
 */
function parseValue(value: unknown): string | number | boolean {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return String(value)

  // 尝试解析为数字
  const num = parseFloat(value)
  if (!isNaN(num) && isFinite(num)) return num

  // 尝试解析为布尔值
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false

  return value
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/excel/import',
    description: '从 Excel 文件导入模型数据',
    method: 'POST',
    inputFormat: 'multipart/form-data (file field)',
    outputFields: {
      success: 'boolean - 导入是否成功',
      name: 'string - 模型名称',
      description: 'string - 模型描述',
      nodes: 'array - 节点列表',
      edges: 'array - 连接列表',
      variables: 'object - 变量字典'
    }
  })
}