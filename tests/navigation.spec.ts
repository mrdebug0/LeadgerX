import { test, expect } from '@playwright/test';
import { generateQAUser, registerQAUserViaUI } from './helpers.js';

test.describe('Basic UI Navigation', () => {
  test('navigates seamlessly through Dashboard, Customers, Inventory, Entries, Udhaar and Settings', async ({ page }) => {
    const user = generateQAUser();
    await registerQAUserViaUI(page, user);

    // 1. Initial view is Dashboard
    await expect(page.locator('#dashboard-stats-row')).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Customers
    await page.click('#sidebar-tab-customers');
    await expect(page.locator('#customers-module-container')).toBeVisible();
    await expect(page.locator('body')).toContainText('Customer Udhaar Accounts');

    // 3. Navigate to Inventory
    await page.click('#sidebar-tab-inventory');
    await expect(page.locator('#inventory-module-container')).toBeVisible();
    await expect(page.locator('body')).toContainText('Inventory & Stock Books');

    // 4. Navigate to Entries
    await page.click('#sidebar-tab-entries');
    await expect(page.locator('#entries-module-container')).toBeVisible();
    await expect(page.locator('body')).toContainText('Bookkeeping Ledger');

    // 5. Navigate to Udhaar Ledger
    await page.click('#sidebar-tab-udhaar');
    await expect(page.locator('#udhaar-ledger-view-container')).toBeVisible();
    await expect(page.locator('body')).toContainText('Udhaar Credit Ledger');

    // 6. Navigate to Settings
    await page.click('#sidebar-tab-settings');
    await expect(page.locator('#settings-module-container')).toBeVisible();
    await expect(page.locator('body')).toContainText('Settings & Branding');

    // 7. Return to Dashboard
    await page.click('#sidebar-tab-dashboard');
    await expect(page.locator('#dashboard-stats-row')).toBeVisible();
  });
});
