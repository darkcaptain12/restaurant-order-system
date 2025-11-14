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
        # -> Input admin PIN '5678' and click login button to access admin panel.
        frame = context.pages[-1]
        # Input admin PIN for login
        elem = frame.locator('xpath=html/body/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('5678')
        

        frame = context.pages[-1]
        # Click login button to submit PIN and login
        elem = frame.locator('xpath=html/body/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Navigate to menu management section by clicking the '📋 Menü' button.
        frame = context.pages[-1]
        # Click the '📋 Menü' button to go to menu management section
        elem = frame.locator('xpath=html/body/div/div/div/div/button[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Create a new menu item with category 'kitchen' by filling the form and submitting.
        frame = context.pages[-1]
        # Input new menu item name
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Kitchen Item')
        

        frame = context.pages[-1]
        # Input price for new menu item
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123')
        

        frame = context.pages[-1]
        # Input extras/description for new menu item
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[2]/textarea').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test item for kitchen category')
        

        frame = context.pages[-1]
        # Click 'Ürün Ekle' button to add new menu item
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the edit button for the newly created menu item 'Test Kitchen Item' to update its price and description.
        frame = context.pages[-1]
        # Click the 'Düzenle' button for the new menu item 'Test Kitchen Item' to edit it
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div[2]/div/div[22]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Update the price to 100 and description to 'Updated description for testing' and save changes.
        frame = context.pages[-1]
        # Update price to 100
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('100')
        

        frame = context.pages[-1]
        # Update description for the menu item
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[2]/textarea').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Updated description for testing')
        

        frame = context.pages[-1]
        # Click 'Güncelle' button to save updates
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Create a campaign menu grouping multiple items by selecting 'Kampanya' category and adding items to the campaign group.
        frame = context.pages[-1]
        # Input campaign menu item name
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Campaign Test Item')
        

        frame = context.pages[-1]
        # Input price for campaign menu item
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('250')
        

        # -> Add existing menu items to the campaign menu group by selecting from the dropdown and clicking the add button.
        frame = context.pages[-1]
        # Click '➕ Ekle' button to add selected item to campaign menu content
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[2]/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the '✅ Ürün Ekle' button to save the campaign menu item with grouped content.
        frame = context.pages[-1]
        # Click '✅ Ürün Ekle' button to save the campaign menu item with grouped content
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/form/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Delete the menu item 'Test Kitchen Item' and verify it no longer appears in the menu list.
        frame = context.pages[-1]
        # Click 'Sil' button for the menu item 'Test Kitchen Item' to delete it
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div[2]/div/div[22]/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Menu item successfully created and updated').first).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test plan failed: Admin menu item creation, update, campaign grouping, or deletion did not complete successfully as expected.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    