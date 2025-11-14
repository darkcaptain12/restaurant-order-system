import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Input PIN '1' and click login button to enter the system.
        frame = context.pages[-1]
        # Input PIN '1' into the password field
        elem = frame.locator('xpath=html/body/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('1')
        

        frame = context.pages[-1]
        # Click the login button to submit PIN
        elem = frame.locator('xpath=html/body/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the '📋 Menü' button to access menu items for CRUD operations.
        frame = context.pages[-1]
        # Click on the '📋 Menü' button to access menu items for CRUD operations
        elem = frame.locator('xpath=html/body/div/div/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Add a menu item to the cart by clicking the '➕ Sepete Ekle' button for 'Hamburger'.
        frame = context.pages[-1]
        # Click '➕ Sepete Ekle' button for Hamburger to add it to the cart
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the '🪑 Masalar' tab to select a table for the order.
        frame = context.pages[-1]
        # Click on the '🪑 Masalar' tab to select a table
        elem = frame.locator('xpath=html/body/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Masa 2' (table 2) to assign the current cart order to this table.
        frame = context.pages[-1]
        # Click on 'Masa 2' to select this table for the order
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Add 'Hamburger' to the cart for 'Masa 2' by clicking '➕ Sepete Ekle' button.
        frame = context.pages[-1]
        # Click '➕ Sepete Ekle' button for Hamburger to add it to the cart for Masa 2
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the '✅ Siparişi Gönder' button to send the order for Masa 2.
        frame = context.pages[-1]
        # Click the '✅ Siparişi Gönder' button to send the order for Masa 2
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div[2]/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Navigate to the orders page to inspect orders and completed orders JSON files for data consistency.
        frame = context.pages[-1]
        # Click on '📦 Siparişlerim' button to view orders and inspect related JSON files
        elem = frame.locator('xpath=html/body/div/div/div/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Navigate back to 'Masalar' tab to select a table and view orders for inspection.
        frame = context.pages[-1]
        # Click on '🪑 Masalar' tab to select a table and view orders
        elem = frame.locator('xpath=html/body/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Open a new tab to access the server file system or API to inspect users.json, menu.json, orders.json, and completed-orders.json for data consistency.
        await page.goto('http://localhost:5173/admin', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Log in as admin using PIN '5678' to gain access to admin panel and inspect JSON files for persistence verification.
        frame = context.pages[-1]
        # Input admin PIN '5678' to login
        elem = frame.locator('xpath=html/body/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('5678')
        

        frame = context.pages[-1]
        # Click login button to submit admin PIN
        elem = frame.locator('xpath=html/body/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the '👥 Personel' tab to inspect user data and verify persistence in users.json.
        frame = context.pages[-1]
        # Click on the '👥 Personel' tab to inspect user data
        elem = frame.locator('xpath=html/body/div/div/div/div/button[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Add a new personnel user with username 'test_add_user', PIN '9999', and role 'Garson' to test user creation and persistence.
        frame = context.pages[-1]
        # Input username 'test_add_user'
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('test_add_user')
        

        frame = context.pages[-1]
        # Input PIN '9999'
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('9999')
        

        frame = context.pages[-1]
        # Click '✅ Personel Ekle' button to add new personnel user
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the '📋 Menü' tab to inspect menu items and verify persistence in menu.json.
        frame = context.pages[-1]
        # Click on the '📋 Menü' tab to inspect menu items
        elem = frame.locator('xpath=html/body/div/div/div/div/button[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Hamburger').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Pizza Margherita').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Tavuk Şiş').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Lahmacun').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Döner').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Köfte').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Balık').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Salata').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çorba').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Makarna').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bira').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Şarap').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kokteyl').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Meyve Suyu').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kahve').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çay').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kola').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Su').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Baklava').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sütlaç').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Tiramisu').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Dondurma').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Cheesecake').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Brownie').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kampanya Menü 1').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kampanya Menü 2').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kampanya Menü 3').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Menü 5').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Test Kitchen Item').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Campaign Test Item').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=test_add_user').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    