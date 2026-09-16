import { test, expect } from '@playwright/test';
import { generateQAUser, registerQAUserViaUI, logoutQAUserViaUI, loginQAUserViaUI } from './helpers.js';

test.describe('Authentication and Session Persistence', () => {
  test('registration, login, and logout flow with unique credentials', async ({ page }) => {
    const user = generateQAUser();

    // 1. Register new user
    await registerQAUserViaUI(page, user);

    // Verify authenticated user's store name appears in sidebar
    const sidebar = page.locator('#leadgerx-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(user.storeName);

    // Verify token is stored in localStorage
    await page.waitForLoadState('domcontentloaded');
    const token = await page.evaluate(() => localStorage.getItem('leadgerx_token'));
    expect(token).toBeTruthy();

    // 2. Logout
    await logoutQAUserViaUI(page);

    // Verify token is removed from localStorage
    await page.waitForLoadState('domcontentloaded');
    const clearedToken = await page.evaluate(() => localStorage.getItem('leadgerx_token'));
    expect(clearedToken).toBeNull();

    // 3. Login again with newly created credentials
    await loginQAUserViaUI(page, user.email, user.password);
    await expect(page.locator('#leadgerx-sidebar')).toContainText(user.storeName);
  });

  test('logout/login persistence across page reloads', async ({ page }) => {
    const user = generateQAUser();

    // 1. Register & authenticate
    await registerQAUserViaUI(page, user);
    await expect(page.locator('#leadgerx-sidebar')).toBeVisible();

    // 2. Reload while logged in -> should persist session automatically
    await page.reload();
    await expect(page.locator('#leadgerx-sidebar')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#leadgerx-sidebar')).toContainText(user.storeName);

    // 3. Log out
    await logoutQAUserViaUI(page);

    // 4. Reload while logged out -> should remain on landing page
    await page.reload();
    await expect(page.locator('#btn-landing-nav-start')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#leadgerx-sidebar')).not.toBeVisible();
  });
});
