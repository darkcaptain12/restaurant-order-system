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
        # -> Input admin PIN '5678' and click login button to access dashboard.
        frame = context.pages[-1]
        # Input admin PIN to login
        elem = frame.locator('xpath=html/body/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('5678')
        

        frame = context.pages[-1]
        # Click login button to submit PIN and login
        elem = frame.locator('xpath=html/body/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the 'Günlük' (Daily) button to view daily sales report and verify its correctness.
        frame = context.pages[-1]
        # Click on 'Günlük' (Daily) button to view daily sales report
        elem = frame.locator('xpath=html/body/div/div/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the 'Haftalık' (Weekly) button to view weekly sales report and verify its correctness.
        frame = context.pages[-1]
        # Click on 'Haftalık' (Weekly) button to view weekly sales report
        elem = frame.locator('xpath=html/body/div/div/div/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the 'Aylık' (Monthly) button to view monthly sales report and verify its correctness.
        frame = context.pages[-1]
        # Click on 'Aylık' (Monthly) button to view monthly sales report
        elem = frame.locator('xpath=html/body/div/div/div/div/button[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the 'Personel' (Staff) tab to view and verify staff sales breakdown.
        frame = context.pages[-1]
        # Click on 'Personel' (Staff) tab to view staff sales breakdown
        elem = frame.locator('xpath=html/body/div/div/div/div/button[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the 'Menü' (Menu) tab to view and verify top products sales data.
        frame = context.pages[-1]
        # Click on 'Menü' (Menu) tab to view top products sales data
        elem = frame.locator('xpath=html/body/div/div/div/div/button[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Extract sales data or revenue contribution for top products if available, or verify product list completeness and prices.
        await page.mouse.wheel(0, 500)
        

        # -> Click on the 'Kasa' (Cash Register) tab to view and verify payment breakdowns and confirm they match reported revenue.
        frame = context.pages[-1]
        # Click on 'Kasa' (Cash Register) tab to view payment breakdowns
        elem = frame.locator('xpath=html/body/div/div/header/div/div[2]/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=💰').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kasa Paneli').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Çıkış Yap').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa Düzeni').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=💰').nth(1)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 1').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=4 sipariş').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=700 ₺').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=💰').nth(2)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 2').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=1 sipariş').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=150 ₺').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=🪑').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 3').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 4').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 5').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 6').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 7').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 8').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 9').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 10').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 11').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 12').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 13').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 14').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 15').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 16').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 17').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 18').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 19').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa 20').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=💰').nth(3)).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Masa seçin').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    