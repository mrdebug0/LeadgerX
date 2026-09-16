import { Page, expect } from '@playwright/test';

export interface QAUser {
  name: string;
  email: string;
  password: string;
  storeName: string;
}

export function generateQAUser(): QAUser {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return {
    name: `QA Tester ${randomSuffix}`,
    email: `qa_${timestamp}_${randomSuffix}@leadgerx-qa.internal`,
    password: `QAPass_${timestamp}!`,
    storeName: `QA Store ${randomSuffix}`,
  };
}

export async function registerQAUserViaUI(page: Page, user: QAUser) {
  await page.goto('/');
  
  // Clear any existing session in storage to prevent interference between sequential tests
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  }).catch(() => {});

  // If sidebar is currently visible, reload root to get landing page
  if (await page.locator('#leadgerx-sidebar').isVisible().catch(() => false)) {
    await page.goto('/');
  }

  // Click "Start Free" from landing page if landing page is shown
  const startBtn = page.locator('#btn-landing-nav-start');
  if (await startBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await startBtn.click();
  }

  // Ensure we are on the register form (by default AuthPage is in login mode)
  const toggleBtn = page.locator('#toggle-auth-mode');
  await expect(toggleBtn).toBeVisible({ timeout: 8000 });
  const toggleText = await toggleBtn.innerText();
  if (toggleText.includes('Create free store')) {
    await toggleBtn.click();
  }

  await expect(page.locator('#input-reg-name')).toBeVisible({ timeout: 5000 });
  await page.fill('#input-reg-name', user.name);
  await page.fill('#input-reg-store', user.storeName);
  await page.fill('#input-auth-email', user.email);
  await page.fill('#input-auth-password', user.password);

  await page.click('#btn-auth-submit');
  
  // Wait for sidebar navigation to confirm successful registration & login
  await expect(page.locator('#leadgerx-sidebar')).toBeVisible({ timeout: 15000 });
}

export async function loginQAUserViaUI(page: Page, email: string, pass: string) {
  await page.goto('/');

  // Clear any existing session in storage to prevent interference
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  }).catch(() => {});

  if (await page.locator('#leadgerx-sidebar').isVisible().catch(() => false)) {
    await page.goto('/');
  }

  // If on landing, click Log In
  const loginNavBtn = page.locator('#btn-landing-nav-login');
  if (await loginNavBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await loginNavBtn.click();
  }

  // Ensure login mode is active
  const toggleBtn = page.locator('#toggle-auth-mode');
  if (await toggleBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    const toggleText = await toggleBtn.innerText();
    if (toggleText.includes('Sign in here')) {
      await toggleBtn.click();
    }
  }

  await expect(page.locator('#input-auth-email')).toBeVisible({ timeout: 5000 });
  await page.fill('#input-auth-email', email);
  await page.fill('#input-auth-password', pass);
  await page.click('#btn-auth-submit');

  await expect(page.locator('#leadgerx-sidebar')).toBeVisible({ timeout: 15000 });
}

export async function logoutQAUserViaUI(page: Page) {
  await expect(page.locator('#btn-sidebar-logout')).toBeVisible({ timeout: 5000 });
  await page.click('#btn-sidebar-logout');
  await expect(page.locator('#btn-landing-nav-start')).toBeVisible({ timeout: 10000 });
}
