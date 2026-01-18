import { test, expect } from '@playwright/test'

test.describe('Dashboard layout screenshots', () => {
  test('project setup page screenshot', async ({ page }) => {
    await page.goto('/171/setup')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/setup-dashboard.png', fullPage: true })
  })

  test('change events new page screenshot', async ({ page }) => {
    await page.goto('/171/change-events/new')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/change-events-new-dashboard.png', fullPage: true })
  })
})

