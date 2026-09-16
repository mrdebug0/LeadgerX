import { test, expect } from '@playwright/test';
import { generateQAUser, loginQAUserViaUI } from './helpers.js';

test.describe('Security & Multi-Tenant Data Isolation', () => {
  test('unauthorized access returns 401 and cross-tenant access returns 403', async ({ request }) => {
    // 1. Missing authentication token returns 401 Unauthorized
    const unauthEndpoints = ['/api/entries', '/api/customers', '/api/inventory', '/api/summary'];
    for (const endpoint of unauthEndpoints) {
      const res = await request.get(endpoint);
      expect(res.status(), `Expected 401 for ${endpoint}`).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/Unauthorized/i);
    }

    // 2. Tampered / invalid JWT token returns 401
    const invalidRes = await request.get('/api/entries', {
      headers: { Authorization: 'Bearer invalid.tampered.token' },
    });
    expect(invalidRes.status()).toBe(401);

    // 3. Create two unique users (User A and User B) to test cross-tenant 403
    const userA = generateQAUser();
    const userB = generateQAUser();

    const regARes = await request.post('/api/auth/register', { data: userA });
    expect(regARes.status()).toBe(200);
    const authA = await regARes.json();

    const regBRes = await request.post('/api/auth/register', { data: userB });
    expect(regBRes.status()).toBe(200);
    const authB = await regBRes.json();

    const tokenA = authA.token;
    const storeIdB = authB.storeId;

    // User A attempting to access User B's store returns 403 Forbidden
    const crossTenantRes = await request.get('/api/entries', {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'x-store-id': storeIdB,
      },
    });
    expect(crossTenantRes.status()).toBe(403);
    const crossTenantJson = await crossTenantRes.json();
    expect(crossTenantJson.success).toBe(false);
    expect(crossTenantJson.error).toMatch(/Forbidden/i);
  });

  test('strict two-user and store data isolation between distinct accounts', async ({ page, request }) => {
    const userA = generateQAUser();
    const userB = generateQAUser();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // Register User A & seed data
    const regARes = await request.post('/api/auth/register', { data: userA });
    expect(regARes.status()).toBe(200);
    const dataA = await regARes.json();
    expect(dataA.success).toBe(true);
    const tokenA = dataA.token;
    const storeA = dataA.storeId;

    const customerAName = `Isolated Customer A ${randomSuffix}`;
    const productAName = `Isolated Product A ${randomSuffix}`;

    await request.post('/api/customers', {
      headers: { Authorization: `Bearer ${tokenA}`, 'x-store-id': storeA },
      data: { name: customerAName, phone: '9100000001', email: 'customera@test.com' },
    });

    await request.post('/api/inventory', {
      headers: { Authorization: `Bearer ${tokenA}`, 'x-store-id': storeA },
      data: { name: productAName, category: 'Groceries', sku: `SKU-A-${randomSuffix}`, purchasePrice: 50, sellingPrice: 90, stock: 20 },
    });

    // Register User B & seed distinct data
    const regBRes = await request.post('/api/auth/register', { data: userB });
    expect(regBRes.status()).toBe(200);
    const dataB = await regBRes.json();
    expect(dataB.success).toBe(true);
    const tokenB = dataB.token;
    const storeB = dataB.storeId;

    const customerBName = `Isolated Customer B ${randomSuffix}`;
    const productBName = `Isolated Product B ${randomSuffix}`;

    await request.post('/api/customers', {
      headers: { Authorization: `Bearer ${tokenB}`, 'x-store-id': storeB },
      data: { name: customerBName, phone: '9200000002', email: 'customerb@test.com' },
    });

    await request.post('/api/inventory', {
      headers: { Authorization: `Bearer ${tokenB}`, 'x-store-id': storeB },
      data: { name: productBName, category: 'Stationery', sku: `SKU-B-${randomSuffix}`, purchasePrice: 30, sellingPrice: 60, stock: 15 },
    });

    // Verify at API layer: User B cannot see User A's data
    const getCustB = await request.get('/api/customers', {
      headers: { Authorization: `Bearer ${tokenB}`, 'x-store-id': storeB },
    });
    expect(getCustB.status()).toBe(200);
    const custBList = await getCustB.json();
    expect(Array.isArray(custBList)).toBe(true);
    expect(custBList.some((c: any) => c.name === customerBName)).toBe(true);
    expect(custBList.some((c: any) => c.name === customerAName)).toBe(false);

    const getInvB = await request.get('/api/inventory', {
      headers: { Authorization: `Bearer ${tokenB}`, 'x-store-id': storeB },
    });
    expect(getInvB.status()).toBe(200);
    const invBList = await getInvB.json();
    expect(Array.isArray(invBList)).toBe(true);
    expect(invBList.some((i: any) => i.name === productBName)).toBe(true);
    expect(invBList.some((i: any) => i.name === productAName)).toBe(false);

    // Verify in UI: Login as User B and verify UI isolation
    await loginQAUserViaUI(page, userB.email, userB.password);

    // Customers View: displays Customer B, does NOT display Customer A
    await page.click('#sidebar-tab-customers');
    await expect(page.locator('#customers-module-container')).toBeVisible();
    await expect(page.locator('#customers-module-container')).toContainText(customerBName);
    await expect(page.locator('#customers-module-container')).not.toContainText(customerAName);

    // Inventory View: displays Product B, does NOT display Product A
    await page.click('#sidebar-tab-inventory');
    await expect(page.locator('#inventory-module-container')).toBeVisible();
    await expect(page.locator('#inventory-module-container')).toContainText(productBName);
    await expect(page.locator('#inventory-module-container')).not.toContainText(productAName);
  });
});
