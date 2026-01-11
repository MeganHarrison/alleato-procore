/**
 * Comprehensive Form Testing Suite
 *
 * Executed by /test-forms plugin.
 * Tests all forms with automatic database cleanup.
 *
 * Usage:
 *   npm run test:forms              # Test all forms
 *   npm run test:forms:ui           # Test with UI mode
 *   npm run test:forms:headed       # Test with headed browser
 */

import { test, expect } from '@playwright/test';
import {
  testFormLoad,
  testFieldValidations,
  testFormSubmission,
  testFormAccessibility,
  type FormTestConfig
} from '../helpers/form-testing';
import {
  testModalClose,
  testModalResponsive,
  testModalStatePersistence
} from '../helpers/modal-testing';
import { cleanupTestData, type TestDataRecord } from '../helpers/test-data-cleanup';
import { formConfigs, getFormsByScope } from '../config/form-test-configs';

/**
 * Test data registry for cleanup
 * Tracks all records created during testing
 */
const testDataRegistry: TestDataRecord[] = [];

/**
 * Get forms to test based on environment variable or default to all
 */
const testScope = process.env.FORM_TEST_SCOPE || 'all';
const formsToTest = getFormsByScope(testScope);

console.log(`\n🧪 Form Testing Suite`);
console.log(`   Scope: ${testScope}`);
console.log(`   Forms to test: ${formsToTest.length}`);
console.log(`   Auth: Using .auth/user.json\n`);

/**
 * Test suite for each form
 */
for (const config of formsToTest) {
  test.describe(`${config.name} - Comprehensive Tests`, () => {

    // Use authenticated state for forms that require auth
    if (config.authRequired) {
      test.use({ storageState: 'tests/.auth/user.json' });
    }

    /**
     * Test 1: Load and Initial State
     */
    test('should load form and display initial state', async ({ page }) => {
      const result = await testFormLoad(page, config);

      expect(result.success, `Form load failed: ${result.errors.join(', ')}`).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.screenshots.length).toBeGreaterThan(0);
    });

    /**
     * Test 2: Field Validations
     */
    test('should validate all required fields', async ({ page }) => {
      const result = await testFieldValidations(page, config);

      expect(result.success, `Validation test failed: ${result.errors.join(', ')}`).toBe(true);
      expect(result.screenshots.length).toBeGreaterThan(0);
    });

    /**
     * Test 3: Form Submission with Cleanup Tracking
     */
    test('should submit form successfully and track for cleanup', async ({ page }) => {
      const result = await testFormSubmission(page, config);

      // Track created data for cleanup
      if (result.createdId) {
        testDataRegistry.push({
          type: config.name,
          id: result.createdId
        });
        console.log(`  ✓ Created ${config.name} record: ${result.createdId} (tracked for cleanup)`);
      }

      expect(result.success, `Form submission failed: ${result.errors.join(', ')}`).toBe(true);
      expect(result.screenshots.length).toBeGreaterThan(0);
    });

    /**
     * Test 4: Accessibility
     */
    test('should be keyboard accessible with proper ARIA labels', async ({ page }) => {
      const result = await testFormAccessibility(page, config);

      expect(result.success, `Accessibility test failed: ${result.errors.join(', ')}`).toBe(true);
      expect(result.screenshots.length).toBeGreaterThan(0);
    });

    /**
     * Test 5: Modal Behaviors (if applicable)
     */
    if (config.isModal && config.modalTrigger) {
      test('should handle all modal close methods', async ({ page }) => {
        await page.goto(config.route);
        await page.waitForLoadState('networkidle');

        const modalConfig = {
          name: config.name,
          triggerSelector: config.modalTrigger || '',
          modalSelector: '[role="dialog"]'
        };

        const result = await testModalClose(page, modalConfig);

        expect(result.success, `Modal close test failed: ${result.errors.join(', ')}`).toBe(true);
      });

      test('should be responsive across different viewport sizes', async ({ page }) => {
        await page.goto(config.route);
        await page.waitForLoadState('networkidle');

        const modalConfig = {
          name: config.name,
          triggerSelector: config.modalTrigger || '',
          modalSelector: '[role="dialog"]'
        };

        const result = await testModalResponsive(page, modalConfig);

        expect(result.success, `Modal responsive test failed: ${result.errors.join(', ')}`).toBe(true);
      });

      test('should clear form state when modal closes', async ({ page }) => {
        await page.goto(config.route);
        await page.waitForLoadState('networkidle');

        const modalConfig = {
          name: config.name,
          triggerSelector: config.modalTrigger || '',
          modalSelector: '[role="dialog"]'
        };

        const result = await testModalStatePersistence(page, modalConfig);

        expect(result.success, `Modal state persistence test failed: ${result.errors.join(', ')}`).toBe(true);
      });
    }

    /**
     * Cleanup after all tests in this suite complete
     */
    test.afterAll(async () => {
      if (testDataRegistry.length > 0) {
        console.log(`\n🧹 Cleaning up ${testDataRegistry.length} test records...`);

        const cleanupResult = await cleanupTestData(testDataRegistry);

        if (cleanupResult.success) {
          console.log(`✓ Successfully cleaned up ${cleanupResult.cleaned} records`);
        } else {
          console.error(`✗ Cleanup failed: ${cleanupResult.failed} records not deleted`);
          console.error(`  Errors: ${cleanupResult.errors.join(', ')}`);
        }

        // Clear registry
        testDataRegistry.length = 0;
      }
    });
  });
}

/**
 * Global cleanup after all form tests complete
 */
test.afterAll(async () => {
  console.log(`\n✅ All form tests complete`);
  console.log(`   Forms tested: ${formsToTest.length}`);
  console.log(`   Test data cleanup: ${testDataRegistry.length === 0 ? '✓ Complete' : '⚠ Pending'}\n`);
});
