import { test, expect } from '@playwright/test'

const projectId = '1'

test.use({ storageState: 'tests/.auth/user.json' })

test.describe('Project Drawings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${projectId}/drawings`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Drawings' })).toBeVisible()
  })

  test('renders drawing log and filters by discipline', async ({ page }) => {
    const rows = page.locator('[data-testid="drawing-table"] tbody tr')
    await expect(rows).toHaveCount(2)

    await page.getByRole('button', { name: /Amenity Deck/ }).click()
    await expect(rows).toHaveCount(2)

    await page.getByRole('combobox', { name: 'Discipline filter' }).click()
    await page.getByRole('option', { name: 'Structural' }).click()
    await expect(rows).toHaveCount(1)
    await expect(page.getByText('S201')).toBeVisible()
  })

  test('opens drawing viewer and QR modal', async ({ page }) => {
    await page.getByRole('button', { name: /Viewer/ }).first().click()

    const viewer = page.getByTestId('drawing-viewer')
    await expect(viewer).toBeVisible()
    await expect(viewer.getByAltText('Drawing viewer preview')).toBeVisible()

    await viewer.getByRole('button', { name: 'QR Code' }).click()
    const qrModal = page.getByTestId('qr-modal')
    await expect(qrModal).toBeVisible()
    await expect(qrModal.getByText('Level 1 Floor Plan')).toBeVisible()
  })

  test('adds sketches and forwards drawings', async ({ page }) => {
    await page.getByText('A101').first().click()
    await page.getByRole('tab', { name: 'Sketches' }).click()
    await page.getByRole('button', { name: 'Add sketch' }).click()

    const sketchDialog = page.getByTestId('sketch-dialog')
    await sketchDialog.getByLabel('Sketch Number').fill('SK-99')
    await sketchDialog.getByLabel('Name').fill('Test Sketch')
    await sketchDialog.getByLabel('Date').fill('2025-12-12')
    await sketchDialog.getByLabel('Description').fill('Coordination note for testing')
    await sketchDialog.getByLabel('File name').fill('test-sketch.pdf')
    await sketchDialog.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('SK-99 — Test Sketch')).toBeVisible()

    await page.getByRole('tab', { name: 'Emails' }).click()
    await page.getByRole('button', { name: 'Forward drawing' }).click()

    const emailDialog = page.getByTestId('email-dialog')
    await emailDialog.getByLabel('To').fill('team@example.com')
    await emailDialog.getByLabel('Subject').fill('New drawing coordination')
    await emailDialog.getByLabel('Message').fill('Please review the latest sketch and confirm scope.')
    await emailDialog.getByRole('button', { name: 'Send' }).click()

    await expect(page.getByText('New drawing coordination')).toBeVisible()
    await expect(page.getByText('team@example.com')).toBeVisible()
  })
})
