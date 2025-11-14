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
        # -> Input waiter PIN '1234' and click login to enter waiter dashboard
        frame = context.pages[-1]
        # Input waiter PIN '1234'
        elem = frame.locator('xpath=html/body/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('1234')
        

        frame = context.pages[-1]
        # Click login button to submit waiter PIN
        elem = frame.locator('xpath=html/body/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select a table (e.g., Masa 1) to create a new order with kitchen and bar category items
        frame = context.pages[-1]
        # Click on Masa 1 to create a new order
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Add one kitchen category item and one bar category item to the cart for Masa 1
        frame = context.pages[-1]
        # Add Hamburger (kitchen category) to cart
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Add one bar category item (Bira) to the cart for Masa 1
        frame = context.pages[-1]
        # Add Bira (bar category) to cart
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div[3]/div[10]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Siparişi Gönder' button to submit the order for Masa 1
        frame = context.pages[-1]
        # Click 'Siparişi Gönder' button to submit the order
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div[2]/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Open kitchen dashboard in a new tab to verify real-time reception of kitchen category items
        await page.goto('http://localhost:5173/kitchen', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Login as kitchen staff using PIN 'mutfak' to access kitchen dashboard and verify real-time updates
        frame = context.pages[-1]
        # Input kitchen staff PIN 'mutfak'
        elem = frame.locator('xpath=html/body/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('mutfak')
        

        frame = context.pages[-1]
        # Click login button to submit kitchen staff PIN
        elem = frame.locator('xpath=html/body/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Başlat' button to update the order item status to IN_PROGRESS
        frame = context.pages[-1]
        # Click 'Başlat' button to update order item status to IN_PROGRESS
        elem = frame.locator('xpath=html/body/div/div/div/div[3]/div/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Hazır' button to update the order item status to READY on kitchen dashboard
        frame = context.pages[-1]
        # Click 'Hazır' button to update order item status to READY
        elem = frame.locator('xpath=html/body/div/div/div/div[3]/div/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Open waiter dashboard in a new tab to verify real-time status updates for the order items
        await page.goto('http://localhost:5173', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Login as waiter with PIN '1234' to verify real-time status updates on waiter dashboard
        frame = context.pages[-1]
        # Input waiter PIN '1234' to login
        elem = frame.locator('xpath=html/body/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('1234')
        

        frame = context.pages[-1]
        # Click login button to submit waiter PIN
        elem = frame.locator('xpath=html/body/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Masa 1' to open order details and verify updated item statuses in real-time
        frame = context.pages[-1]
        # Click on 'Masa 1' to view order details and verify real-time status updates
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Hamburger').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bira').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Başlat').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Hazır').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 1').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    