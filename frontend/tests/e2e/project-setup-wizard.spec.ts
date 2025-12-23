import { test, expect } from '@playwright/test'

test.describe('Project Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dev login
    await page.goto('http://localhost:3000/dev-login?email=test@example.com&password=testpassword123')
    // Wait for page to load - landing on portfolio is expected
    await page.waitForLoadState('networkidle')
  })

  test('displays all required setup steps', async ({ page }) => {
    // Create a new project first
    await page.goto('http://localhost:3000/form-project')

    // Fill in the create project form
    await page.fill('input[name="name"]', 'Test Project Setup Wizard')
    await page.fill('input[name="address"]', '123 Test Street')
    await page.fill('input[name="city"]', 'Test City')
    await page.fill('input[name="state"]', 'CA')
    await page.fill('input[name="zip_code"]', '90210')

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for redirect to setup page
    await page.waitForURL('**/setup', { timeout: 10000 })

    // Verify we're on the setup page
    await expect(page.locator('h1')).toContainText('Project Setup')

    // Verify all 5 steps are visible in the navigation
    await expect(page.locator('text=Cost Code Configuration')).toBeVisible()
    await expect(page.locator('text=Project Directory')).toBeVisible()
    await expect(page.locator('text=Drawings')).toBeVisible()
    await expect(page.locator('text=Specifications')).toBeVisible()
    await expect(page.locator('text=Schedule')).toBeVisible()

    // Verify the steps have the correct descriptions
    await expect(page.locator('text=Set up your project\'s cost code structure for budget tracking')).toBeVisible()
    await expect(page.locator('text=Add team members and assign roles to your project')).toBeVisible()
    await expect(page.locator('text=Upload project drawings and plans')).toBeVisible()
    await expect(page.locator('text=Upload project specifications and technical documents')).toBeVisible()
    await expect(page.locator('text=Upload project schedules and timeline documents')).toBeVisible()
  })

  test('can skip through all steps and redirect to home page', async ({ page }) => {
    // Go directly to a known project's setup page
    await page.goto('http://localhost:3000/67/setup')

    // Wait for the setup page to load
    await expect(page.locator('h1')).toContainText('Project Setup')

    // Step 1: Cost Code Configuration - this is required, so we need to continue
    await expect(page.locator('h2')).toContainText('Cost Code Configuration')
    await page.click('button:has-text("Continue")')

    // Step 2: Project Directory - skip
    await expect(page.locator('h2')).toContainText('Project Directory')
    await page.click('button:has-text("Skip for now")')

    // Step 3: Drawings - skip
    await expect(page.locator('h2')).toContainText('Drawings')
    await page.click('button:has-text("Skip for now")')

    // Step 4: Specifications - skip
    await expect(page.locator('h2')).toContainText('Specifications')
    await page.click('button:has-text("Skip for now")')

    // Step 5: Schedule - skip and complete
    await expect(page.locator('h2')).toContainText('Schedule')
    await page.click('button:has-text("Skip for now")')

    // Should redirect to project home page
    await page.waitForURL('**/67/home', { timeout: 10000 })
    await expect(page.url()).toContain('/67/home')
  })

  test('progress bar updates as steps are completed', async ({ page }) => {
    await page.goto('http://localhost:3000/67/setup')

    // Wait for the setup page to load
    await expect(page.locator('h1')).toContainText('Project Setup')

    // Check initial progress (Step 1 of 5)
    await expect(page.locator('text=Step 1 of 5')).toBeVisible()

    // Complete step 1
    await page.click('button:has-text("Continue")')
    await expect(page.locator('text=Step 2 of 5')).toBeVisible()

    // Skip step 2
    await page.click('button:has-text("Skip for now")')
    await expect(page.locator('text=Step 3 of 5')).toBeVisible()

    // Skip step 3
    await page.click('button:has-text("Skip for now")')
    await expect(page.locator('text=Step 4 of 5')).toBeVisible()

    // Skip step 4
    await page.click('button:has-text("Skip for now")')
    await expect(page.locator('text=Step 5 of 5')).toBeVisible()
  })

  test('old steps (Budget and Contract) are not present', async ({ page }) => {
    await page.goto('http://localhost:3000/67/setup')

    // Wait for the setup page to load
    await expect(page.locator('h1')).toContainText('Project Setup')

    // Verify old steps are NOT present
    await expect(page.locator('text=Budget Setup')).not.toBeVisible()
    await expect(page.locator('text=Prime Contract')).not.toBeVisible()
    await expect(page.locator('text=Configure your initial project budget')).not.toBeVisible()
    await expect(page.locator('text=Set up your initial prime contract')).not.toBeVisible()
  })

  test('can navigate back to completed steps', async ({ page }) => {
    await page.goto('http://localhost:3000/67/setup')

    // Complete first step
    await page.click('button:has-text("Continue")')

    // Complete second step
    await page.click('button:has-text("Skip for now")')

    // Now on step 3, click back to step 1
    await page.locator('text=Cost Code Configuration').first().click()

    // Verify we're back on step 1
    await expect(page.locator('h2')).toContainText('Cost Code Configuration')
    await expect(page.locator('text=Step 1 of 5')).toBeVisible()
  })
})
