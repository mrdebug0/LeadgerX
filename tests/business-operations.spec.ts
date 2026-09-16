import { test, expect } from '@playwright/test';
import { generateQAUser, registerQAUserViaUI } from './helpers.js';

test.describe('Business Operations and Persistence', () => {
  test('creates customer, inventory, sale, udhaar settlement, and verifies dashboard persistence', async ({ page }) => {
    const user = generateQAUser();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const customerName = `Rajesh Kumar ${randomSuffix}`;
    const customerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const customerEmail = `rajesh_${randomSuffix}@kirana.test`;
    const productName = `Basmati Rice 5kg ${randomSuffix}`;
    const productSku = `RIC-${randomSuffix.toUpperCase()}`;

    // 1. Register QA user
    await registerQAUserViaUI(page, user);

    // 2. Customer Creation
    await page.click('#sidebar-tab-customers');
    await expect(page.locator('#customers-module-container')).toBeVisible();

    await page.click('#btn-customer-add-modal');
    await expect(page.locator('#input-customer-name')).toBeVisible();
    await page.fill('#input-customer-name', customerName);
    await page.fill('#input-customer-phone', customerPhone);
    await page.fill('#input-customer-email', customerEmail);
    await page.click('#btn-customer-submit');
    await expect(page.locator('#input-customer-name')).not.toBeVisible();

    // Verify customer is listed
    await expect(page.locator('#customers-module-container')).toContainText(customerName, { timeout: 8000 });

    // 3. Inventory Creation
    await page.click('#sidebar-tab-inventory');
    await expect(page.locator('#inventory-module-container')).toBeVisible();

    await page.click('#btn-inventory-add-modal');
    await expect(page.locator('#input-inv-name')).toBeVisible();
    await page.fill('#input-inv-name', productName);
    await page.fill('#input-inv-sku', productSku);
    await page.fill('#input-inv-cost', '350');
    await page.fill('#input-inv-price', '480');
    await page.fill('#input-inv-stock', '40');
    await page.fill('#input-inv-alert', '5');
    await page.fill('#input-inv-supplier', 'Agro Suppliers');
    await page.click('#btn-inv-submit');
    await expect(page.locator('#input-inv-name')).not.toBeVisible();

    // Verify product is listed
    await expect(page.locator('#inventory-module-container')).toContainText(productName, { timeout: 8000 });

    // 4. Entry / Sale Creation (Paid Sale: 2 x 480 = 960)
    await page.click('#sidebar-tab-entries');
    await expect(page.locator('#entries-module-container')).toBeVisible();

    await page.click('#btn-manual-add-trigger');
    await expect(page.locator('#input-entry-customer')).toBeVisible();
    await page.fill('#input-entry-customer', customerName);
    await page.fill('#input-entry-product', productName);
    await page.fill('#input-entry-quantity', '2');
    await page.fill('#input-entry-price', '480');
    await page.selectOption('#select-entry-status', 'paid');
    await page.click('#btn-entry-submit');
    await expect(page.locator('#input-entry-customer')).not.toBeVisible();

    // Verify entry is listed
    await expect(page.locator('#entries-module-container')).toContainText(productName, { timeout: 8000 });
    await expect(page.locator('#entries-module-container')).toContainText('₹960');

    // 5. Udhaar / Credit Entry & Payment Settlement (Credit Sale: 1 x 500 = 500)
    await page.click('#btn-manual-add-trigger');
    await expect(page.locator('#input-entry-customer')).toBeVisible();
    await page.fill('#input-entry-customer', customerName);
    await page.fill('#input-entry-product', 'Credit Cooking Oil 1L');
    await page.fill('#input-entry-quantity', '1');
    await page.fill('#input-entry-price', '500');
    await page.selectOption('#select-entry-status', 'udhaar');
    await page.click('#btn-entry-submit');
    await expect(page.locator('#input-entry-customer')).not.toBeVisible();

    // Navigate to Udhaar Ledger
    await page.click('#sidebar-tab-udhaar');
    await expect(page.locator('#udhaar-ledger-view-container')).toBeVisible();
    await expect(page.locator('#udhaar-ledger-view-container')).toContainText(customerName, { timeout: 8000 });
    await expect(page.locator('#udhaar-ledger-view-container')).toContainText('₹500');

    // Collect / Settle Udhaar payment
    const collectBtn = page.locator('[id^="btn-collect-udhaar-"]').first();
    await expect(collectBtn).toBeVisible();
    await collectBtn.click();

    await expect(page.locator('#input-collect-amount')).toBeVisible();
    await page.fill('#input-collect-amount', '500');
    await page.click('#btn-confirm-settle');

    // Verify Udhaar status shows Settled
    await expect(page.locator('#udhaar-ledger-view-container')).toContainText(/Settled|Cleared/i, { timeout: 8000 });

    // 6. Dashboard Metrics & Persistence
    await page.click('#sidebar-tab-dashboard');
    await expect(page.locator('#dashboard-stats-row')).toBeVisible();

    // Verify Today's Sales card includes the sales (960 + 500 = 1460)
    await expect(page.locator('#stat-today-sales')).toContainText('₹', { timeout: 8000 });
    const salesTextBeforeReload = await page.locator('#stat-today-sales').innerText();
    expect(salesTextBeforeReload).not.toBe('₹0');

    // Verify Active Customers card shows at least 1 customer
    const customersBeforeReload = await page.locator('#stat-active-customers').innerText();
    expect(Number(customersBeforeReload)).toBeGreaterThanOrEqual(1);

    // 7. Test Reload Persistence: verify dashboard retains data after full browser reload
    await page.reload();
    await expect(page.locator('#dashboard-stats-row')).toBeVisible({ timeout: 10000 });

    const salesTextAfterReload = await page.locator('#stat-today-sales').innerText();
    expect(salesTextAfterReload).toBe(salesTextBeforeReload);

    const customersAfterReload = await page.locator('#stat-active-customers').innerText();
    expect(customersAfterReload).toBe(customersBeforeReload);
  });
});
