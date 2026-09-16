import { test, expect } from '@playwright/test';
import { generateQAUser, registerQAUserViaUI } from './helpers.js';

test.describe('Fresh Account Initial State', () => {
  test('fresh account starts with zero business data across all modules and APIs', async ({ page }) => {
    const user = generateQAUser();
    await registerQAUserViaUI(page, user);

    // 1. Verify dashboard initial KPI metric cards show 0
    await expect(page.locator('#stat-today-sales')).toContainText('₹0');
    await expect(page.locator('#stat-pending-udhaar')).toContainText('₹0');
    await expect(page.locator('#stat-active-customers')).toHaveText('0');
    await expect(page.locator('#stat-low-stock')).toHaveText('0');

    // 2. Verify backend /api/summary returns zeroes
    const token = await page.evaluate(() => localStorage.getItem('leadgerx_token'));
    const storeId = await page.evaluate(() => localStorage.getItem('leadgerx_active_store_id'));

    const summaryResponse = await page.request.get('/api/summary', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-store-id': storeId || '',
      },
    });
    expect(summaryResponse.status()).toBe(200);
    const summaryData = await summaryResponse.json();
    expect(summaryData.todaySales).toBe(0);
    expect(summaryData.pendingUdhaar).toBe(0);
    expect(summaryData.customerCount).toBe(0);
    expect(summaryData.inventoryCount).toBe(0);
    expect(summaryData.entryCount).toBe(0);

    // 3. Verify Empty state on Entries view
    await page.click('#sidebar-tab-entries');
    await expect(page.locator('#entries-module-container')).toBeVisible();
    await expect(page.locator('body')).toContainText(/No transaction logs found|Add Log Entry/);

    // 4. Verify Empty state on Customers view
    await page.click('#sidebar-tab-customers');
    await expect(page.locator('#customers-module-container')).toBeVisible();
    await expect(page.locator('body')).toContainText(/No registered customers found|Add Store Customer/);

    // 5. Verify Empty state on Inventory view
    await page.click('#sidebar-tab-inventory');
    await expect(page.locator('#inventory-module-container')).toBeVisible();
    await expect(page.locator('body')).toContainText(/No products found|Add Store Product/);

    // 6. Verify Empty state on Udhaar view
    await page.click('#sidebar-tab-udhaar');
    await expect(page.locator('#udhaar-ledger-view-container')).toBeVisible();
    await expect(page.locator('body')).toContainText(/No pending client udhaar records registered/);
  });
});
