import { test as base, request as playwrightRequest } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function getAuthToken(): string | null {
  const authFile = path.join(__dirname, '../.auth/user.json');

  if (fs.existsSync(authFile)) {
    try {
      const authState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
      const localStorage = authState.origins?.[0]?.localStorage || [];
      const authItem = localStorage.find((item: any) => item.name.includes('auth-token'));

      if (authItem) {
        const authData = JSON.parse(authItem.value);
        return authData.access_token;
      }
    } catch (error) {
      console.error('Error reading auth token:', error);
    }
  }
  return null;
}

/**
 * Extend Playwright test to add Bearer token to all API requests
 */
export const test = base.extend({
  request: async ({}, use, testInfo) => {
    const token = getAuthToken();

    // Create new request context with auth header
    const context = await playwrightRequest.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      extraHTTPHeaders: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
    });

    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
