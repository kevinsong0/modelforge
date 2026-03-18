"""
ModelForge Functional Testing Script
Tests Excel import/export and basic node operations
"""

import sys
import io
# Force UTF-8 encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import os
import time

def test_modelforge():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Enable console logging
        page.on('console', lambda msg: print(f'[Console] {msg.type}: {msg.text}'))

        print("1. Navigating to model editor...")
        page.goto('http://localhost:3000/model/new')
        page.wait_for_load_state('networkidle')

        # Take initial screenshot
        os.makedirs('/tmp/modelforge_test', exist_ok=True)
        page.screenshot(path='/tmp/modelforge_test/01_initial.png', full_page=True)
        print("   Screenshot saved: 01_initial.png")

        # 2. Test page structure
        print("\n2. Analyzing page structure...")

        # Check for toolbar elements
        toolbar_elements = {
            'model_name_input': page.locator('input[placeholder="模型名称"]').count(),
            'undo_button': page.locator('button[title="撤销"]').count(),
            'redo_button': page.locator('button[title="重做"]').count(),
            'import_button': page.locator('text=导入').count(),
            'export_button': page.locator('text=导出').count(),
            'excel_button': page.locator('text=Excel').count(),
            'save_button': page.locator('text=保存').count(),
            'run_button': page.locator('text=运行').count(),
        }

        print("   Toolbar elements found:")
        for name, count in toolbar_elements.items():
            status = "✓" if count > 0 else "✗"
            print(f"     {status} {name}: {count}")

        # Check for node palette
        node_palette = page.locator('text=节点库').count()
        print(f"   Node palette: {'✓ Found' if node_palette > 0 else '✗ Not found'}")

        # Check for template section
        templates = page.locator('text=模板').count()
        print(f"   Templates section: {'✓ Found' if templates > 0 else '✗ Not found'}")

        # Check for canvas
        canvas = page.locator('.react-flow').count()
        print(f"   Canvas (.react-flow): {'✓ Found' if canvas > 0 else '✗ Not found'}")

        # Check for chat panel
        chat_panel = page.locator('text=AI 助手').count()
        print(f"   Chat panel: {'✓ Found' if chat_panel > 0 else '✗ Not found'}")

        # 3. Test Excel Export
        print("\n3. Testing Excel Export...")

        # Set model name
        model_name_input = page.locator('input[placeholder="模型名称"]').first
        if model_name_input:
            model_name_input.fill('测试模型_自动测试')
            print("   Set model name: 测试模型_自动测试")

        # Click Excel export button
        excel_button = page.locator('button:has-text("Excel")').first
        if excel_button:
            # Start waiting for download before clicking
            with page.expect_download(timeout=10000) as download_info:
                excel_button.click()

            download = download_info.value
            download_path = f'/tmp/modelforge_test/{download.suggested_filename}'
            download.save_as(download_path)
            print(f"   ✓ Excel file downloaded: {download.suggested_filename}")
            print(f"   Saved to: {download_path}")
        else:
            print("   ✗ Excel button not found")

        # 4. Test node palette interactions
        print("\n4. Testing node palette...")

        # Get all node palette items
        node_types = ['数据输入', '假设', '公式计算', '表格', '模块', '输出', 'DCF估值']
        found_nodes = []

        for node_type in node_types:
            count = page.locator(f'text={node_type}').count()
            if count > 0:
                found_nodes.append(node_type)
                print(f"   ✓ {node_type}")

        print(f"   Total node types found: {len(found_nodes)}/{len(node_types)}")

        # 5. Test template loading
        print("\n5. Testing templates...")

        # Click first template if available
        template_buttons = page.locator('button:has-text("估值")').all()
        if template_buttons:
            template_buttons[0].click()
            page.wait_for_timeout(1000)
            page.screenshot(path='/tmp/modelforge_test/02_after_template.png', full_page=True)
            print("   ✓ Clicked first template")
            print("   Screenshot saved: 02_after_template.png")
        else:
            print("   No template buttons found")

        # 6. Test Run button
        print("\n6. Testing Run button...")

        run_button = page.locator('button:has-text("运行")').first
        if run_button:
            run_button.click()
            print("   Clicked Run button")
            page.wait_for_timeout(2000)

            # Check for execution state
            running_text = page.locator('text=计算中').count()
            if running_text > 0:
                print("   ✓ Execution started (showing '计算中...')")
                page.wait_for_timeout(3000)

            page.screenshot(path='/tmp/modelforge_test/03_after_run.png', full_page=True)
            print("   Screenshot saved: 03_after_run.png")
        else:
            print("   ✗ Run button not found")

        # 7. Final state
        print("\n7. Capturing final state...")
        page.screenshot(path='/tmp/modelforge_test/04_final.png', full_page=True)
        print("   Screenshot saved: 04_final.png")

        # Check for errors
        error_alerts = page.locator('.bg-red-50').count()
        if error_alerts > 0:
            error_text = page.locator('.bg-red-50').text_content()
            print(f"   ⚠ Error detected: {error_text}")

        browser.close()

        print("\n" + "="*50)
        print("Testing complete!")
        print("Screenshots saved to: /tmp/modelforge_test/")
        print("="*50)

if __name__ == "__main__":
    test_modelforge()