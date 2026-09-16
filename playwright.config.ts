import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
    baseURL: 'http://127.0.0.1:3000',
    extraHTTPHeaders: {
      'x-leadgerx-qa': 'playwright-qa',
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node dist/server.cjs',
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: true,
    timeout: 30000,
    env: {
      NODE_ENV: 'test',
    },
  },
});
