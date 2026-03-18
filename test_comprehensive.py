"""
ModelForge Phase 2 MVP - 综合功能测试
Tests: AKShare, AI Chat, Node Editor UI, Full Workflow
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import os
import time
import json

BASE_URL = 'http://localhost:3000'
SCREENSHOT_DIR = '/tmp/modelforge_comprehensive'

def take_screenshot(page, name):
    path = f'{SCREENSHOT_DIR}/{name}.png'
    page.screenshot(path=path, full_page=True)
    print(f"   截图: {name}.png")
    return path

def test_comprehensive():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    results = {
        'akshare': {'passed': 0, 'failed': 0, 'details': []},
        'ai_chat': {'passed': 0, 'failed': 0, 'details': []},
        'node_editor': {'passed': 0, 'failed': 0, 'details': []},
        'workflow': {'passed': 0, 'failed': 0, 'details': []}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.on('console', lambda msg: print(f'[Console] {msg.type}: {msg.text}'))

        print("=" * 60)
        print("ModelForge Phase 2 MVP 综合功能测试")
        print("=" * 60)

        # Navigate to app
        page.goto(f'{BASE_URL}/model/new')
        page.wait_for_load_state('networkidle')
        take_screenshot(page, '01_app_loaded')

        # ========================================
        # Test 1: AKShare Data API
        # ========================================
        print("\n【测试 1】AKShare 数据获取")
        print("-" * 40)

        # Test stock info
        akshare_tests = [
            ('stock-info', {'symbol': '000001'}),
            ('market-data', {'symbol': '600000'}),
        ]

        for endpoint, params in akshare_tests:
            result = page.evaluate('''
                async ({ endpoint, params }) => {
                    try {
                        const response = await fetch('/api/data/akshare', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ endpoint, params })
                        });
                        return await response.json();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
            ''', {'endpoint': endpoint, 'params': params})

            if 'error' in result:
                print(f"   ○ {endpoint}: {result['error'][:60]}...")
                results['akshare']['failed'] += 1
                results['akshare']['details'].append(f"{endpoint}: 需要 Python 环境")
            else:
                print(f"   ✓ {endpoint}: 数据获取成功")
                results['akshare']['passed'] += 1
                results['akshare']['details'].append(f"{endpoint}: OK")

        # ========================================
        # Test 2: AI Chat API
        # ========================================
        print("\n【测试 2】AI 助手")
        print("-" * 40)

        # Test AI chat without API key (should return config instructions)
        ai_result = page.evaluate('''
            async () => {
                try {
                    const response = await fetch('/api/ai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: '帮我创建一个DCF估值模型',
                            modelContext: { nodeCount: 0, edgeCount: 0, nodeTypes: [], recentConnections: [] }
                        })
                    });
                    return await response.json();
                } catch (e) {
                    return { error: e.message };
                }
            }
        ''')

        if ai_result.get('response'):
            response_text = ai_result['response']
            if 'AI 功能尚未配置' in response_text or 'API Key' in response_text:
                print("   ○ AI 助手: 需要 API Key 配置")
                results['ai_chat']['details'].append("需要配置 OPENAI_API_KEY")
            else:
                print("   ✓ AI 助手: 响应正常")
                print(f"      响应预览: {response_text[:100]}...")
                results['ai_chat']['passed'] += 1
                results['ai_chat']['details'].append("AI 响应正常")

            if ai_result.get('suggestedActions'):
                print(f"   ✓ 建议操作: {len(ai_result['suggestedActions'])} 个")
        else:
            print(f"   ✗ AI 助手: {ai_result.get('error', '未知错误')}")
            results['ai_chat']['failed'] += 1

        # ========================================
        # Test 3: Node Editor UI
        # ========================================
        print("\n【测试 3】节点编辑器 UI")
        print("-" * 40)

        # Check node palette
        node_types = ['假设', '公式', '表格', '输出', 'DCF', '数据输入']
        for node_type in node_types:
            count = page.locator(f'text={node_type}').count()
            if count > 0:
                print(f"   ✓ 节点类型 '{node_type}': 可用")
                results['node_editor']['passed'] += 1
            else:
                print(f"   ○ 节点类型 '{node_type}': 未找到")
                results['node_editor']['failed'] += 1

        # Check toolbar buttons
        toolbar_checks = [
            ('保存', 'button:has-text("保存")'),
            ('导入', 'label:has-text("导入")'),
            ('导出', 'button:has-text("导出")'),
            ('撤销', 'button:has-text("撤销")'),
            ('重做', 'button:has-text("重做")'),
        ]

        for name, selector in toolbar_checks:
            count = page.locator(selector).count()
            if count > 0:
                print(f"   ✓ 工具栏 '{name}': 存在")
                results['node_editor']['passed'] += 1
            else:
                print(f"   ○ 工具栏 '{name}': 未找到")
                results['node_editor']['failed'] += 1
                results['node_editor']['details'].append(f"{name}: 未找到")

        # Check canvas
        canvas = page.locator('.react-flow__pane').count()
        if canvas > 0:
            print("   ✓ ReactFlow 画布: 已渲染")
            results['node_editor']['passed'] += 1
        else:
            print("   ○ ReactFlow 画布: 未找到")
            results['node_editor']['failed'] += 1

        take_screenshot(page, '02_node_editor')

        # ========================================
        # Test 4: Full Workflow - DCF Valuation
        # ========================================
        print("\n【测试 4】完整工作流 - DCF 估值")
        print("-" * 40)

        # Step 1: Calculate DCF
        dcf_input = {
            "revenue": 2000000000,  # 20亿
            "revenueGrowthRate": 0.12,
            "ebitdaMargin": 0.22,
            "taxRate": 0.25,
            "depreciationPercent": 0.04,
            "capitalExpenditurePercent": 0.05,
            "workingCapitalPercent": 0.08,
            "wacc": 0.10,
            "terminalGrowthRate": 0.025,
            "projectionYears": 5,
            "includeSensitivity": True
        }

        dcf_result = page.evaluate('''
            async (input) => {
                const response = await fetch('/api/finance/dcf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input)
                });
                return await response.json();
            }
        ''', dcf_input)

        if dcf_result.get('success'):
            print("   ✓ DCF 计算: 成功")
            results['workflow']['passed'] += 1

            outputs = dcf_result.get('outputs', {})
            ev = outputs.get('enterpriseValue', 0)
            eq = outputs.get('equityValue', 0)
            tv = outputs.get('terminalValue', 0)

            if ev:
                print(f"      企业价值: {ev/1e8:.2f} 亿元")
            if eq:
                print(f"      股权价值: {eq/1e8:.2f} 亿元")
            if tv:
                print(f"      终值: {tv/1e8:.2f} 亿元")

            if outputs.get('sensitivityMatrix'):
                print("      ✓ 敏感性分析: 已包含")
                results['workflow']['passed'] += 1
        else:
            print(f"   ✗ DCF 计算: {dcf_result.get('error', '未知错误')}")
            results['workflow']['failed'] += 1

        # Step 2: Export to Excel
        export_model = {
            "name": "DCF估值分析报告",
            "description": f"企业价值: {dcf_result.get('outputs', {}).get('enterpriseValue', 0)/1e8:.2f}亿元",
            "nodes": [
                {"id": "n1", "type": "assumption", "position": {"x": 100, "y": 100},
                 "data": {"name": "收入", "value": 2000000000, "unit": "元"}},
                {"id": "n2", "type": "assumption", "position": {"x": 100, "y": 200},
                 "data": {"name": "增长率", "value": 0.12, "unit": "%"}},
                {"id": "n3", "type": "assumption", "position": {"x": 100, "y": 300},
                 "data": {"name": "WACC", "value": 0.10, "unit": "%"}},
                {"id": "n4", "type": "dcf", "position": {"x": 400, "y": 200},
                 "data": {"label": "DCF估值", "inputs": dcf_input, "outputs": dcf_result.get('outputs', {})}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n4"},
                {"id": "e2", "source": "n2", "target": "n4"},
                {"id": "e3", "source": "n3", "target": "n4"}
            ]
        }

        export_result = page.evaluate('''
            async (model) => {
                const response = await fetch('/api/excel/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(model)
                });
                if (response.ok) {
                    const blob = await response.blob();
                    return { success: true, size: blob.size };
                }
                return { success: false, error: await response.text() };
            }
        ''', export_model)

        if export_result.get('success'):
            print(f"   ✓ Excel 导出: {export_result['size']} bytes")
            results['workflow']['passed'] += 1
        else:
            print(f"   ✗ Excel 导出: {export_result.get('error', '失败')}")
            results['workflow']['failed'] += 1

        # Step 3: Sensitivity Analysis
        sensi_result = page.evaluate('''
            async () => {
                const response = await fetch('/api/finance/sensitivity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        baseValue: 2000000000,
                        waccRange: { min: 0.08, max: 0.14, step: 0.01 },
                        growthRange: { min: 0.02, max: 0.05, step: 0.01 }
                    })
                });
                return await response.json();
            }
        ''')

        if sensi_result.get('matrix'):
            matrix = sensi_result['matrix']
            values = matrix.get('values', [])
            if values and len(values) > 0:
                print(f"   ✓ 敏感性分析: {len(matrix.get('waccValues', []))}x{len(matrix.get('growthValues', []))} 矩阵")
                results['workflow']['passed'] += 1
            else:
                print("   ○ 敏感性分析: 矩阵为空")
                results['workflow']['failed'] += 1
        else:
            print(f"   ✗ 敏感性分析: {sensi_result.get('error', '未知错误')}")
            results['workflow']['failed'] += 1

        take_screenshot(page, '03_workflow_complete')

        # ========================================
        # Test Summary
        # ========================================
        print("\n" + "=" * 60)
        print("测试总结")
        print("=" * 60)

        total_passed = 0
        total_failed = 0

        for category, stats in results.items():
            passed = stats['passed']
            failed = stats['failed']
            total_passed += passed
            total_failed += failed
            status = "✓" if failed == 0 else "○"
            print(f"{status} {category}: {passed} 通过, {failed} 失败")
            if stats['details']:
                for detail in stats['details'][:3]:
                    print(f"      - {detail}")

        print(f"\n总计: {total_passed} 通过, {total_failed} 失败")
        print(f"截图目录: {SCREENSHOT_DIR}")
        print("\nPhase 2 MVP 综合功能测试完成!")

        browser.close()

        return total_failed == 0

if __name__ == "__main__":
    success = test_comprehensive()
    sys.exit(0 if success else 1)