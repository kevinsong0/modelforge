/**
 * ModelForge - AKShare 数据代理 API
 * 通过调用 Python AKShare 服务获取真实金融数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// Python 脚本路径
const PYTHON_SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'akshare_service.py')

/**
 * 调用 Python AKShare 服务
 */
async function callPythonService(endpoint: string, params: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = JSON.stringify({ endpoint, params })

    const python = spawn('python', [PYTHON_SCRIPT_PATH, request], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })

    let stdout = ''
    let stderr = ''

    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('[AKShare] Python script error:', stderr)
        reject(new Error(`Python script failed with code ${code}: ${stderr}`))
        return
      }

      try {
        const result = JSON.parse(stdout)
        resolve(result)
      } catch (e) {
        console.error('[AKShare] Failed to parse output')
        reject(new Error(`Failed to parse Python output`))
      }
    })

    python.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`))
    })
  })
}

export async function POST(request: NextRequest) {
  const { endpoint, params } = await request.json()

  try {
    const result = await callPythonService(endpoint, params)

    // 检查 Python 返回的错误
    if (result && typeof result === 'object' && 'error' in result) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('AKShare API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '数据获取失败' },
      { status: 500 }
    )
  }
}