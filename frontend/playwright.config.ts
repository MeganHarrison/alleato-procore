import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in frontend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Environment-based video retention
const isDebug = process.env.PWDEBUG === '1';
const keepAllVideos = process.env.PW_VIDEO === 'on';

// Allow override of host/port for sandboxed runs
const PLAYWRIGHT_HOST = process.env.PLAYWRIGHT_HOST || '127.0.0.1';
const PLAYWRIGHT_PORT = parseInt(process.env.PLAYWRIGHT_PORT || '3100', 10);

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000, // Increased for form interactions
  expect: {
    timeout: 10000 // Increased for slower elements
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/report.json' }],
    ['list'],
  ],
  use: {
    baseURL: `http://${PLAYWRIGHT_HOST}:${PLAYWRIGHT_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'on', // Always capture screenshots for verification
    video: keepAllVideos ? 'on' : isDebug ? 'on' : 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'debug',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://${PLAYWRIGHT_HOST}:${PLAYWRIGHT_PORT}`,
      },
    },
    {
      name: 'no-auth',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: /sidebar-collapse-verification\.spec\.ts/,
    },
  ],

  webServer: {
    command: `HOST=${PLAYWRIGHT_HOST} HOSTNAME=${PLAYWRIGHT_HOST} PORT=${PLAYWRIGHT_PORT} npm run dev`,
    port: PLAYWRIGHT_PORT,
    reuseExistingServer: !process.env.CI,
  },
});
