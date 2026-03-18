"""
ModelForge AI Settings Test
Test custom AI model configuration with Alibaba Cloud Bailian API (GLM-5)
"""

import sys
import io
# Force UTF-8 encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import os
import time

# Test configuration
BASE_URL = 'http://localhost:3000'
SCREENSHOT_DIR = '/tmp/modelforge_ai_test'

# AI Settings for testing
# Note: Replace with actual API key from Alibaba Cloud Bailian
TEST_AI_CONFIG = {
    'provider': 'custom',
    'api_key': 'test-api-key-placeholder',  # Will need real key
    'base_url': 'https://dashscope.aliyuncs.com/compatible-mode/v1',  # Alibaba Cloud DashScope
    'model': 'glm-5'
}

def test_ai_settings():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Enable console logging
        page.on('console', lambda msg: print(f'[Console] {msg.type}: {msg.text}'))

        # Create screenshot directory
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)

        print("=" * 60)
        print("ModelForge AI Settings Test")
        print("=" * 60)

        # Step 1: Navigate to settings page
        print("\n1. Navigate to Settings page...")
        page.goto(f'{BASE_URL}/settings')
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f'{SCREENSHOT_DIR}/01_settings_page.png', full_page=True)
        print("   Screenshot saved: 01_settings_page.png")

        # Step 2: Check settings page structure
        print("\n2. Analyzing settings page...")

        # Check for AI configuration section
        ai_section = page.locator('text=AI 配置').count()
        print(f"   AI configuration section: {'✓ Found' if ai_section > 0 else '✗ Not found'}")

        # Check for provider selector
        provider_select = page.locator('select').first
        if provider_select:
            print("   ✓ Provider selector found")

        # Check for API Key input
        api_key_input = page.locator('input[type="password"]').count()
        print(f"   API Key input: {'✓ Found' if api_key_input > 0 else '✗ Not found'}")

        # Check for custom provider option
        custom_option = page.locator('option[value="custom"]').count()
        print(f"   Custom provider option: {'✓ Found' if custom_option > 0 else '✗ Not found'}")

        # Step 3: Configure custom AI settings
        print("\n3. Configuring custom AI settings...")

        # Select custom provider
        provider_select.select_option(value='custom')
        print("   Selected provider: Custom")
        time.sleep(0.5)

        # Fill API Key
        api_key_field = page.locator('input[type="password"]').first
        if api_key_field:
            api_key_field.fill(TEST_AI_CONFIG['api_key'])
            print(f"   Filled API Key: {TEST_AI_CONFIG['api_key'][:10]}...")

        # Fill Base URL
        base_url_inputs = page.locator('input[type="url"]').all()
        for inp in base_url_inputs:
            placeholder = inp.get_attribute('placeholder')
            if placeholder and 'api.example.com' in placeholder:
                inp.fill(TEST_AI_CONFIG['base_url'])
                print(f"   Filled Base URL: {TEST_AI_CONFIG['base_url']}")
                break

        # Fill Model name
        model_inputs = page.locator('input[type="text"]').all()
        for inp in model_inputs:
            placeholder = inp.get_attribute('placeholder')
            if placeholder and ('glm' in placeholder.lower() or 'deepseek' in placeholder.lower()):
                inp.fill(TEST_AI_CONFIG['model'])
                print(f"   Filled Model: {TEST_AI_CONFIG['model']}")
                break

        # Take screenshot of configured settings
        page.screenshot(path=f'{SCREENSHOT_DIR}/02_configured_settings.png', full_page=True)
        print("   Screenshot saved: 02_configured_settings.png")

        # Step 4: Save settings
        print("\n4. Saving settings...")

        save_button = page.locator('button:has-text("保存配置")').first
        if save_button:
            save_button.click()
            print("   Clicked save button")

            # Wait for save confirmation
            time.sleep(1)

            # Check for success indicator
            saved_text = page.locator('text=已保存').count()
            if saved_text > 0:
                print("   ✓ Settings saved successfully")
            else:
                print("   Checking localStorage...")

            page.screenshot(path=f'{SCREENSHOT_DIR}/03_after_save.png', full_page=True)
            print("   Screenshot saved: 03_after_save.png")

        # Step 5: Verify localStorage
        print("\n5. Verifying localStorage...")

        stored_settings = page.evaluate('''
            () => {
                const saved = localStorage.getItem('modelforge_ai_settings');
                if (saved) {
                    return JSON.parse(saved);
                }
                return null;
            }
        ''')

        if stored_settings:
            print("   ✓ Settings found in localStorage:")
            print(f"     Provider: {stored_settings.get('provider', 'N/A')}")
            print(f"     API Key: {stored_settings.get('apiKey', 'N/A')[:10]}...")
            print(f"     Base URL: {stored_settings.get('baseURL', 'N/A')}")
            print(f"     Model: {stored_settings.get('model', 'N/A')}")
        else:
            print("   ✗ No settings found in localStorage")

        # Step 6: Navigate to model editor
        print("\n6. Navigate to model editor...")

        page.goto(f'{BASE_URL}/model/new')
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f'{SCREENSHOT_DIR}/04_model_editor.png', full_page=True)
        print("   Screenshot saved: 04_model_editor.png")

        # Check for chat panel
        chat_panel = page.locator('text=AI 助手').count()
        print(f"   Chat panel: {'✓ Found' if chat_panel > 0 else '✗ Not found'}")

        # Step 7: Test AI chat
        print("\n7. Testing AI chat functionality...")

        # Find chat input
        chat_input = page.locator('input[placeholder*="输入消息"]').first
        if chat_input:
            chat_input.fill('你好，请介绍一下你自己')
            print("   Filled test message: 你好，请介绍一下你自己")

            page.screenshot(path=f'{SCREENSHOT_DIR}/05_before_send.png', full_page=True)
            print("   Screenshot saved: 05_before_send.png")

            # Click send button
            send_button = page.locator('button').filter(has_text='').last  # Send icon button
            send_buttons = page.locator('button').all()
            for btn in send_buttons:
                # The send button is near the input
                parent = btn.locator('xpath=..')
                if parent.locator('input[placeholder*="输入消息"]').count() > 0:
                    btn.click()
                    print("   Clicked send button")
                    break

            # Wait for response
            time.sleep(3)

            # Check for loading indicator
            loading = page.locator('.animate-spin').count()
            print(f"   Loading indicator: {'✓ Present' if loading > 0 else '✗ Not present'}")

            # Wait more for response
            time.sleep(5)

            page.screenshot(path=f'{SCREENSHOT_DIR}/06_after_chat.png', full_page=True)
            print("   Screenshot saved: 06_after_chat.png")

            # Check for response or error
            error_msg = page.locator('text=AI 功能尚未配置').count()
            if error_msg > 0:
                print("   ⚠ AI not configured message detected")
                print("   This is expected if API key is placeholder")

            response_msg = page.locator('.bg-gray-100').count()
            if response_msg > 0:
                print(f"   ✓ Response container found ({response_msg} elements)")
        else:
            print("   ✗ Chat input not found")

        # Final summary
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        print(f"Screenshots saved to: {SCREENSHOT_DIR}")
        print("\nTest completed. Check screenshots for visual verification.")
        print("\nNote: For full testing, replace 'test-api-key-placeholder'")
        print("with actual Alibaba Cloud Bailian API key.")

        browser.close()

if __name__ == "__main__":
    test_ai_settings()