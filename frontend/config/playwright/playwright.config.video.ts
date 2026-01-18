import { defineConfig, devices } from '@playwright/test';

// Dedicated config that always saves videos
export default defineConfig({
  testDir: '../../tests',
  testMatch: '**/*.spec.{ts,js}',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: '../../tests/playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3002',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: '../../tests/test-results',
});

