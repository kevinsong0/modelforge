/**
 * ModelForge - Excel 导入导出工具
 * 支持将金融模型导出为 Excel 文件，以及从 Excel 导入数据
 */

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { Node, Edge } from '@xyflow/react'

// Excel 导出的模型数据格式
export interface ExcelModelData {
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
  createdAt: string
  updatedAt: string
}

// 从 Excel 导入的结果
export interface ExcelImportResult {
  success: boolean
  data?: ExcelModelData
  error?: string
}

// 工作表名称
const SHEETS = {
  MODEL_INFO: '模型信息',
  NODES: '节点',
  EDGES: '连接',
  ASSUMPTIONS: '假设',
  DATA: '数据'
}

/**
 * 导出模型到 Excel 文件
 */
export function exportModelToExcel(model: ExcelModelData): void {
  const workbook = XLSX.utils.book_new()

  // 1. 模型信息工作表
  const infoData = [
    ['字段', '值'],
    ['模型名称', model.name],
    ['描述', model.description || ''],
    ['节点数量', model.nodes.length],
    ['连接数量', model.edges.length],
    ['创建时间', model.createdAt],
    ['更新时间', model.updatedAt],
    ['导出工具', 'ModelForge']
  ]
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  setColumnWidth(infoSheet, [20, 50])
  XLSX.utils.book_append_sheet(workbook, infoSheet, SHEETS.MODEL_INFO)

  // 2. 节点工作表
  const nodesData = [
    ['节点ID', '类型', '标签/名称', '位置X', '位置Y', '数据(JSON)']
  ]
  model.nodes.forEach(node => {
    const label = getNodeLabel(node)
    nodesData.push([
      node.id,
      node.type || 'default',
      label,
      String(node.position?.x || 0),
      String(node.position?.y || 0),
      JSON.stringify(node.data || {})
    ])
  })
  const nodesSheet = XLSX.utils.aoa_to_sheet(nodesData)
  setColumnWidth(nodesSheet, [15, 12, 20, 10, 10, 60])
  XLSX.utils.book_append_sheet(workbook, nodesSheet, SHEETS.NODES)

  // 3. 连接工作表
  const edgesData = [
    ['连接ID', '源节点ID', '目标节点ID', '标签']
  ]
  model.edges.forEach(edge => {
    edgesData.push([
      edge.id,
      edge.source,
      edge.target,
      String(edge.label || '')
    ])
  })
  const edgesSheet = XLSX.utils.aoa_to_sheet(edgesData)
  setColumnWidth(edgesSheet, [15, 15, 15, 20])
  XLSX.utils.book_append_sheet(workbook, edgesSheet, SHEETS.EDGES)

  // 4. 假设工作表（单独列出，方便编辑）
  const assumptionNodes = model.nodes.filter(n => n.type === 'assumption')
  if (assumptionNodes.length > 0) {
    const assumptionsData = [
      ['假设名称', '值', '单位', '描述', '节点ID']
    ]
    assumptionNodes.forEach(node => {
      const data = node.data as Record<string, unknown>
      assumptionsData.push([
        String(data.name || node.id),
        String(data.value ?? ''),
        String(data.unit || ''),
        String(data.description || ''),
        node.id
      ])
    })
    const assumptionsSheet = XLSX.utils.aoa_to_sheet(assumptionsData)
    setColumnWidth(assumptionsSheet, [20, 15, 10, 40, 15])
    XLSX.utils.book_append_sheet(workbook, assumptionsSheet, SHEETS.ASSUMPTIONS)
  }

  // 5. 数据输入节点工作表（如果有表格数据）
  const inputNodes = model.nodes.filter(n =>
    n.type === 'input' || n.type === 'table'
  )
  inputNodes.forEach((node, index) => {
    const data = node.data as Record<string, unknown>
    const sheetName = `${SHEETS.DATA}_${index + 1}_${node.id.slice(0, 8)}`

    // 处理表格数据
    if (data.cells && typeof data.cells === 'object') {
      // 表格节点
      const cells = data.cells as Record<string, { value: unknown }>
      const headers = (data.headers as string[]) || []
      const rows = (data.rows as number) || 0
      const cols = (data.columns as number) || headers.length

      const tableData: unknown[][] = [headers]
      for (let r = 0; r < rows; r++) {
        const row: unknown[] = []
        for (let c = 0; c < cols; c++) {
          const cellKey = `${r}-${c}`
          row.push(cells[cellKey]?.value ?? '')
        }
        tableData.push(row)
      }
      const sheet = XLSX.utils.aoa_to_sheet(tableData)
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31)) // Excel sheet name max 31 chars
    } else if (data.value) {
      // 有值的输入节点
      const valueData = [['值']]
      if (Array.isArray(data.value)) {
        data.value.forEach(v => valueData.push([v]))
      } else {
        valueData.push([String(data.value)])
      }
      const sheet = XLSX.utils.aoa_to_sheet(valueData)
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31))
    }
  })

  // 生成并下载文件
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const fileName = `${model.name || '模型'}_${formatDate(new Date())}.xlsx`
  saveAs(blob, fileName)
}

/**
 * 从 Excel 文件导入模型
 */
export async function importModelFromExcel(file: File): Promise<ExcelImportResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // 读取模型信息
    const infoSheet = workbook.Sheets[SHEETS.MODEL_INFO]
    if (!infoSheet) {
      return { success: false, error: 'Excel 文件格式不正确：缺少模型信息工作表' }
    }

    const infoData = XLSX.utils.sheet_to_json(infoSheet, { header: 1 }) as unknown[][]
    const infoMap = new Map<string, unknown>()
    infoData.forEach(row => {
      if (Array.isArray(row) && row.length >= 2) {
        infoMap.set(String(row[0]), row[1])
      }
    })

    // 读取节点
    const nodesSheet = workbook.Sheets[SHEETS.NODES]
    if (!nodesSheet) {
      return { success: false, error: 'Excel 文件格式不正确：缺少节点工作表' }
    }

    const nodesData = XLSX.utils.sheet_to_json(nodesSheet, { header: 1 }) as unknown[][]
    const nodes: Node[] = []

    // 跳过表头
    for (let i = 1; i < nodesData.length; i++) {
      const row = nodesData[i]
      if (Array.isArray(row) && row.length >= 6) {
        const node: Node = {
          id: String(row[0]),
          type: String(row[1]),
          position: {
            x: parseFloat(String(row[3])) || 0,
            y: parseFloat(String(row[4])) || 0
          },
          data: parseJSONSafe(String(row[5]))
        }
        nodes.push(node)
      }
    }

    // 读取连接
    const edgesSheet = workbook.Sheets[SHEETS.EDGES]
    const edges: Edge[] = []

    if (edgesSheet) {
      const edgesData = XLSX.utils.sheet_to_json(edgesSheet, { header: 1 }) as unknown[][]
      // 跳过表头
      for (let i = 1; i < edgesData.length; i++) {
        const row = edgesData[i]
        if (Array.isArray(row) && row.length >= 3) {
          const edge: Edge = {
            id: String(row[0]),
            source: String(row[1]),
            target: String(row[2]),
            label: row[3] ? String(row[3]) : undefined,
            animated: true
          }
          edges.push(edge)
        }
      }
    }

    // 读取假设（覆盖节点中的假设值）
    const assumptionsSheet = workbook.Sheets[SHEETS.ASSUMPTIONS]
    if (assumptionsSheet) {
      const assumptionsData = XLSX.utils.sheet_to_json(assumptionsSheet, { header: 1 }) as unknown[][]
      // 跳过表头
      for (let i = 1; i < assumptionsData.length; i++) {
        const row = assumptionsData[i]
        if (Array.isArray(row) && row.length >= 5) {
          const nodeId = String(row[4])
          const node = nodes.find(n => n.id === nodeId)
          if (node && node.type === 'assumption') {
            node.data = {
              ...node.data,
              name: String(row[0]),
              value: parseNumericValue(row[1]),
              unit: String(row[2] || ''),
              description: String(row[3] || '')
            }
          }
        }
      }
    }

    // 读取数据工作表（如果有）
    const dataSheetNames = workbook.SheetNames.filter(name =>
      name.startsWith(SHEETS.DATA + '_')
    )

    dataSheetNames.forEach(sheetName => {
      // 提取节点ID（格式：数据_序号_节点ID前8位）
      const parts = sheetName.split('_')
      if (parts.length >= 3) {
        const nodeIdPrefix = parts.slice(2).join('_')
        const node = nodes.find(n => n.id.startsWith(nodeIdPrefix))
        if (node) {
          const dataSheet = workbook.Sheets[sheetName]
          const data = XLSX.utils.sheet_to_json(dataSheet, { header: 1 }) as unknown[][]
          if (data.length > 0) {
            // 检测是否有表头（第一行是字符串数组）
            const hasHeaders = data[0].every(cell => typeof cell === 'string')
            if (hasHeaders && data.length > 1) {
              // 表格数据
              const headers = data[0] as string[]
              const cells: Record<string, { value: unknown }> = {}
              for (let r = 1; r < data.length; r++) {
                for (let c = 0; c < headers.length; c++) {
                  cells[`${r - 1}-${c}`] = { value: data[r][c] ?? '' }
                }
              }
              node.data = {
                ...node.data,
                headers,
                rows: data.length - 1,
                columns: headers.length,
                cells
              }
            } else {
              // 单列数据
              const values = data.flat().filter(v => v !== undefined && v !== '')
              node.data = {
                ...node.data,
                value: values.length === 1 ? values[0] : values
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: {
        name: String(infoMap.get('模型名称') || '导入的模型'),
        description: String(infoMap.get('描述') || ''),
        nodes,
        edges,
        createdAt: String(infoMap.get('创建时间') || new Date().toISOString()),
        updatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导入失败'
    }
  }
}

/**
 * 从 Excel 导入数据到特定节点
 */
export async function importDataFromExcel(
  file: File,
  nodeId: string,
  targetType: 'table' | 'array' | 'object'
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]

    let data: unknown

    switch (targetType) {
      case 'table':
        // 转换为表格格式
        if (rawData.length === 0) {
          data = { headers: [], rows: 0, columns: 0, cells: {} }
        } else {
          const headers = (rawData[0] as string[]) || []
          const cells: Record<string, { value: unknown }> = {}
          for (let r = 1; r < rawData.length; r++) {
            for (let c = 0; c < headers.length; c++) {
              cells[`${r - 1}-${c}`] = { value: rawData[r][c] ?? '' }
            }
          }
          data = {
            headers,
            rows: rawData.length - 1,
            columns: headers.length,
            cells
          }
        }
        break

      case 'array':
        // 转换为数组
        data = rawData.flat()
        break

      case 'object':
        // 转换为键值对对象
        const obj: Record<string, unknown> = {}
        rawData.forEach(row => {
          if (Array.isArray(row) && row.length >= 2) {
            obj[String(row[0])] = row[1]
          }
        })
        data = obj
        break
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导入失败'
    }
  }
}

/**
 * 导出节点数据到 Excel（用于单个节点）
 */
export function exportNodeDataToExcel(
  node: Node,
  fileName?: string
): void {
  const workbook = XLSX.utils.book_new()
  const data = node.data as Record<string, unknown>

  let sheetData: unknown[][]

  if (data.cells && typeof data.cells === 'object') {
    // 表格数据
    const cells = data.cells as Record<string, { value: unknown }>
    const headers = (data.headers as string[]) || []
    const rows = (data.rows as number) || 0
    const cols = (data.columns as number) || headers.length

    sheetData = [headers]
    for (let r = 0; r < rows; r++) {
      const row: unknown[] = []
      for (let c = 0; c < cols; c++) {
        const cellKey = `${r}-${c}`
        row.push(cells[cellKey]?.value ?? '')
      }
      sheetData.push(row)
    }
  } else if (data.value) {
    // 单值或数组
    if (Array.isArray(data.value)) {
      sheetData = data.value.map(v => [v])
    } else {
      sheetData = [[data.value]]
    }
  } else {
    sheetData = [['无数据']]
  }

  const sheet = XLSX.utils.aoa_to_sheet(sheetData)
  XLSX.utils.book_append_sheet(workbook, sheet, '数据')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const name = fileName || `${getNodeLabel(node)}_${formatDate(new Date())}.xlsx`
  saveAs(blob, name)
}

// ============ 辅助函数 ============

function getNodeLabel(node: Node): string {
  const data = node.data as Record<string, unknown>
  if (data.label) return String(data.label)
  if (data.name) return String(data.name)
  return node.id
}

function setColumnWidth(sheet: XLSX.WorkSheet, widths: number[]): void {
  sheet['!cols'] = widths.map(w => ({ wch: w }))
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function parseJSONSafe(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str)
  } catch {
    return {}
  }
}

function parseNumericValue(value: unknown): number | string {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const num = parseFloat(value)
    return isNaN(num) ? value : num
  }
  return String(value)
}