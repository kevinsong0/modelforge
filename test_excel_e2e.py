"""
ModelForge Phase 2 MVP - Excel Import/Export E2E Test
Tests complete Excel workflow: export -> import -> verify
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import os
import time
import json
import tempfile

BASE_URL = 'http://localhost:3000'
SCREENSHOT_DIR = '/tmp/modelforge_excel_test'

def take_screenshot(page, name):
    path = f'{SCREENSHOT_DIR}/{name}.png'
    page.screenshot(path=path, full_page=True)
    print(f"   截图: {name}.png")
    return path

def test_excel_workflow():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.on('console', lambda msg: print(f'[Console] {msg.type}: {msg.text}'))

        print("=" * 60)
        print("ModelForge Excel 导入/导出 E2E 测试")
        print("=" * 60)

        # Navigate to the application first
        page.goto(f'{BASE_URL}/model/new')
        page.wait_for_load_state('networkidle')
        take_screenshot(page, '01_app_loaded')

        # ========================================
        # Test 1: Export Model to Excel
        # ========================================
        print("\n【测试 1】导出模型到 Excel")
        print("-" * 40)

        # Create a comprehensive model for export
        sample_model = {
            "name": "DCF估值测试模型",
            "description": "Phase 2 MVP Excel 导入导出完整测试",
            "nodes": [
                {
                    "id": "assumption_1",
                    "type": "assumption",
                    "position": {"x": 100, "y": 100},
                    "data": {"name": "收入增长率", "value": 0.15, "unit": "%", "description": "年化收入增长率"}
                },
                {
                    "id": "assumption_2",
                    "type": "assumption",
                    "position": {"x": 100, "y": 200},
                    "data": {"name": "EBITDA利润率", "value": 0.25, "unit": "%", "description": "EBITDA占收入比例"}
                },
                {
                    "id": "assumption_3",
                    "type": "assumption",
                    "position": {"x": 100, "y": 300},
                    "data": {"name": "WACC", "value": 0.12, "unit": "%", "description": "加权平均资本成本"}
                },
                {
                    "id": "assumption_4",
                    "type": "assumption",
                    "position": {"x": 100, "y": 400},
                    "data": {"name": "永续增长率", "value": 0.03, "unit": "%", "description": "终值计算用增长率"}
                },
                {
                    "id": "dcf_1",
                    "type": "dcf",
                    "position": {"x": 400, "y": 200},
                    "data": {
                        "label": "DCF估值",
                        "inputs": {
                            "baseRevenue": 1000000000,
                            "growthRate": 0.15,
                            "ebitdaMargin": 0.25,
                            "taxRate": 0.25,
                            "wacc": 0.12,
                            "terminalGrowth": 0.03
                        },
                        "outputs": {
                            "enterpriseValue": 5000000000,
                            "equityValue": 4500000000
                        }
                    }
                },
                {
                    "id": "output_1",
                    "type": "output",
                    "position": {"x": 700, "y": 200},
                    "data": {"name": "估值结果", "value": "50亿元"}
                }
            ],
            "edges": [
                {"id": "edge_1", "source": "assumption_1", "target": "dcf_1"},
                {"id": "edge_2", "source": "assumption_2", "target": "dcf_1"},
                {"id": "edge_3", "source": "assumption_3", "target": "dcf_1"},
                {"id": "edge_4", "source": "assumption_4", "target": "dcf_1"},
                {"id": "edge_5", "source": "dcf_1", "target": "output_1"}
            ],
            "variables": {
                "projectName": "测试项目",
                "valuationDate": "2024-01-01",
                "currency": "CNY"
            }
        }

        # Test Excel export
        export_result = page.evaluate('''
            async (model) => {
                try {
                    const response = await fetch('/api/excel/export', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(model)
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const arrayBuffer = await blob.arrayBuffer();
                        // Convert to base64 for transfer
                        const bytes = new Uint8Array(arrayBuffer);
                        let binary = '';
                        for (let i = 0; i < bytes.length; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        return {
                            success: true,
                            size: blob.size,
                            type: blob.type,
                            base64: btoa(binary)
                        };
                    } else {
                        const error = await response.json();
                        return { success: false, error: error.error || 'Export failed' };
                    }
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        ''', sample_model)

        exported_file_path = None
        if export_result.get('success'):
            print(f"   ✓ Excel 导出成功")
            print(f"   文件大小: {export_result['size']} bytes")
            print(f"   文件类型: {export_result['type']}")

            # Save to temp file for import test
            import base64
            xlsx_data = base64.b64decode(export_result['base64'])
            exported_file_path = '/tmp/test_model.xlsx'
            with open(exported_file_path, 'wb') as f:
                f.write(xlsx_data)
            print(f"   临时文件: {exported_file_path}")
        else:
            print(f"   ✗ Excel 导出失败: {export_result.get('error', '未知错误')}")
            return

        # ========================================
        # Test 2: Import Excel File
        # ========================================
        print("\n【测试 2】导入 Excel 文件")
        print("-" * 40)

        # Read the exported file and import it
        with open(exported_file_path, 'rb') as f:
            file_content = f.read()

        # Use JavaScript to create a File object and upload
        import_result = page.evaluate('''
            async ({ fileData, fileName }) => {
                try {
                    // Create File object from base64
                    const byteCharacters = atob(fileData);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const file = new File([byteArray], fileName, {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    });

                    // Create form data
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await fetch('/api/excel/import', {
                        method: 'POST',
                        body: formData
                    });

                    return await response.json();
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }
        ''', {
            'fileData': export_result['base64'],
            'fileName': 'test_model.xlsx'
        })

        if import_result.get('success'):
            print(f"   ✓ Excel 导入成功")
            print(f"   模型名称: {import_result.get('name', 'N/A')}")
            print(f"   模型描述: {import_result.get('description', 'N/A')}")
            print(f"   节点数量: {len(import_result.get('nodes', []))}")
            print(f"   连接数量: {len(import_result.get('edges', []))}")
            print(f"   变量数量: {len(import_result.get('variables', {}))}")

            # ========================================
            # Test 3: Verify Data Integrity
            # ========================================
            print("\n【测试 3】数据完整性验证")
            print("-" * 40)

            errors = []

            # Check model name
            if import_result.get('name') != sample_model['name']:
                errors.append(f"模型名称不匹配: 期望 '{sample_model['name']}', 实际 '{import_result.get('name')}'")
            else:
                print(f"   ✓ 模型名称正确")

            # Check nodes
            imported_nodes = {n['id']: n for n in import_result.get('nodes', [])}
            for original_node in sample_model['nodes']:
                node_id = original_node['id']
                if node_id not in imported_nodes:
                    errors.append(f"节点缺失: {node_id}")
                    continue

                imported_node = imported_nodes[node_id]

                # Check type
                if imported_node['type'] != original_node['type']:
                    errors.append(f"节点 {node_id} 类型不匹配")

                # Check position
                orig_pos = original_node['position']
                imp_pos = imported_node.get('position', {})
                if abs(orig_pos.get('x', 0) - imp_pos.get('x', 0)) > 1 or \
                   abs(orig_pos.get('y', 0) - imp_pos.get('y', 0)) > 1:
                    errors.append(f"节点 {node_id} 位置不匹配")

            print(f"   ✓ 节点验证完成 ({len(imported_nodes)} 个节点)")

            # Check edges
            imported_edges = import_result.get('edges', [])
            original_edge_count = len(sample_model['edges'])
            imported_edge_count = len(imported_edges)
            if imported_edge_count != original_edge_count:
                errors.append(f"连接数量不匹配: 期望 {original_edge_count}, 实际 {imported_edge_count}")
            else:
                print(f"   ✓ 连接验证完成 ({imported_edge_count} 条连接)")

            # Check variables
            imported_vars = import_result.get('variables', {})
            for key, value in sample_model['variables'].items():
                if key not in imported_vars:
                    errors.append(f"变量缺失: {key}")
                elif str(imported_vars[key]) != str(value):
                    errors.append(f"变量 {key} 值不匹配")
            print(f"   ✓ 变量验证完成 ({len(imported_vars)} 个变量)")

            # Report results
            if errors:
                print(f"\n   发现 {len(errors)} 个问题:")
                for error in errors[:5]:  # Show first 5 errors
                    print(f"      - {error}")
            else:
                print(f"\n   ✓ 所有数据验证通过!")

        else:
            print(f"   ✗ Excel 导入失败: {import_result.get('error', '未知错误')}")

        take_screenshot(page, 'excel_test_final')

        # ========================================
        # Test Summary
        # ========================================
        print("\n" + "=" * 60)
        print("测试总结")
        print("=" * 60)
        print("Excel 导入/导出 E2E 测试完成!")
        print(f"截图目录: {SCREENSHOT_DIR}")

        browser.close()

if __name__ == "__main__":
    test_excel_workflow()