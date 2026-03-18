/**
 * ModelForge - Excel 导出 API
 * 将模型导出为 Excel 文件
 */

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * 导出请求格式
 */
interface ExportRequest {
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
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()

    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 1. 模型信息表
    const modelInfo = [
      ['字段', '值'],
      ['模型名称', body.name || '未命名模型'],
      ['描述', body.description || ''],
      ['节点数量', body.nodes?.length || 0],
      ['连接数量', body.edges?.length || 0],
      ['导出时间', new Date().toLocaleString('zh-CN')],
    ]
    const modelInfoSheet = XLSX.utils.aoa_to_sheet(modelInfo)
    XLSX.utils.book_append_sheet(workbook, modelInfoSheet, '模型信息')

    // 2. 节点表
    if (body.nodes && body.nodes.length > 0) {
      const nodesData = [
        ['ID', '类型', 'X坐标', 'Y坐标', '名称', '数据'],
        ...body.nodes.map(node => [
          node.id,
          node.type,
          node.position?.x || 0,
          node.position?.y || 0,
          node.data?.name || node.data?.label || '',
          JSON.stringify(node.data)
        ])
      ]
      const nodesSheet = XLSX.utils.aoa_to_sheet(nodesData)
      XLSX.utils.book_append_sheet(workbook, nodesSheet, '节点')
    }

    // 3. 连接表
    if (body.edges && body.edges.length > 0) {
      const edgesData = [
        ['ID', '源节点', '目标节点'],
        ...body.edges.map(edge => [
          edge.id,
          edge.source,
          edge.target
        ])
      ]
      const edgesSheet = XLSX.utils.aoa_to_sheet(edgesData)
      XLSX.utils.book_append_sheet(workbook, edgesSheet, '连接')
    }

    // 4. 假设表（筛选 assumption 类型节点）
    const assumptionNodes = body.nodes?.filter(n => n.type === 'assumption') || []
    if (assumptionNodes.length > 0) {
      const assumptionsData = [
        ['ID', '名称', '值', '单位', '描述'],
        ...assumptionNodes.map(node => [
          node.id,
          node.data?.name || '',
          node.data?.value ?? '',
          node.data?.unit || '',
          node.data?.description || ''
        ])
      ]
      const assumptionsSheet = XLSX.utils.aoa_to_sheet(assumptionsData)
      XLSX.utils.book_append_sheet(workbook, assumptionsSheet, '假设')
    }

    // 5. DCF 节点数据
    const dcfNodes = body.nodes?.filter(n => n.type === 'dcf') || []
    if (dcfNodes.length > 0) {
      const dcfData = []
      dcfData.push(['DCF 节点数据'])

      dcfNodes.forEach(node => {
        const inputs = node.data?.inputs as Record<string, unknown> || {}
        const outputs = node.data?.outputs as Record<string, unknown> || {}

        dcfData.push([])
        dcfData.push([`节点: ${node.id}`])
        dcfData.push(['输入参数'])
        dcfData.push(['参数', '值'])
        Object.entries(inputs).forEach(([key, value]) => {
          dcfData.push([key, String(value)])
        })

        if (Object.keys(outputs).length > 0) {
          dcfData.push([])
          dcfData.push(['输出结果'])
          dcfData.push(['指标', '值'])
          Object.entries(outputs).forEach(([key, value]) => {
            if (key !== 'sensitivityMatrix' && !Array.isArray(value)) {
              dcfData.push([key, String(value)])
            }
          })
        }
      })

      const dcfSheet = XLSX.utils.aoa_to_sheet(dcfData)
      XLSX.utils.book_append_sheet(workbook, dcfSheet, 'DCF数据')
    }

    // 6. 变量表
    if (body.variables && Object.keys(body.variables).length > 0) {
      const variablesData = [
        ['变量名', '值'],
        ...Object.entries(body.variables).map(([key, value]) => [
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        ])
      ]
      const variablesSheet = XLSX.utils.aoa_to_sheet(variablesData)
      XLSX.utils.book_append_sheet(workbook, variablesSheet, '变量')
    }

    // 生成 Excel 文件 buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 返回文件
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(body.name || 'model')}.xlsx"`,
        'Content-Length': String(buffer.length)
      }
    })

  } catch (error) {
    console.error('Excel 导出错误:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Excel 导出失败',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/excel/export',
    description: '将模型导出为 Excel 文件',
    method: 'POST',
    inputFields: {
      name: 'string - 模型名称',
      description: 'string - 模型描述',
      nodes: 'array - 节点列表',
      edges: 'array - 连接列表',
      variables: 'object - 变量字典'
    },
    output: 'Excel 文件 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)'
  })
}