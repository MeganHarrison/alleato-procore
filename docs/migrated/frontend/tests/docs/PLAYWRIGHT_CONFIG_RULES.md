# Playwright Configuration Rules

**Last Updated:** 2026-01-08

## Critical Configuration Rule: Test Project Assignment

**IMPORTANT:** Test files MUST be added to the correct Playwright project based on their authentication requirements.

## Project Structure

The Playwright config defines **3 projects**:

1. **setup** - Runs auth.setup.ts to create authenticated session
2. **chromium** - Tests requiring authentication (depends on setup)
3. **no-auth** - Tests that run WITHOUT authentication

## Rule: Where to Add New Test Files

### Tests Requiring Authentication → chromium project (DEFAULT)

**Most tests require auth.** By default, tests run in the `chromium` project which has auth.

**Examples:**
- Form submission tests
- User account tests
- Project-specific tests
- Any test using `test.use({ storageState: '.auth/user.json' })`

**Action:** Do NOT add to any testMatch regex. Let it run in chromium by default.

### Tests Without Authentication → no-auth project (EXPLICIT)

**Only add to no-auth if the test explicitly does NOT need auth.**

**Examples:**
- Public page checks
- Styling/visual regression on public pages
- Login page tests
- Landing page tests

**Action:** Add filename to the `no-auth` project's `testMatch` regex on line 46.

## Common Mistake (DO NOT DO THIS)

❌ **WRONG:** Adding auth-required test to no-auth project

```typescript
// NO-AUTH PROJECT (line 46)
testMatch: /...|comprehensive-form-testing\.spec\.ts|.../
// ❌ This is WRONG - form tests need auth!
```

✅ **CORRECT:** Remove from no-auth testMatch (let it run in chromium)

```typescript
// NO-AUTH PROJECT (line 46)
testMatch: /comprehensive-page-check\.spec\.ts|check-styling\.spec\.ts|.../
// ✅ comprehensive-form-testing.spec.ts NOT listed = runs in chromium with auth
```

## Verification Checklist

When adding a new test file:

- [ ] Does this test require authentication?
  - **YES** → Do nothing (runs in chromium by default)
  - **NO** → Add to no-auth testMatch regex

- [ ] Does the test use `test.use({ storageState: '.auth/user.json' })`?
  - **YES** → NEVER add to no-auth testMatch
  - **NO** → Can add to no-auth testMatch

- [ ] Does the test navigate to protected routes?
  - **YES** → Do not add to no-auth testMatch
  - **NO** → Can add to no-auth testMatch

## File Location

Config file: [frontend/config/playwright/playwright.config.ts](../config/playwright/playwright.config.ts)

## History

### 2026-01-08: comprehensive-form-testing.spec.ts Fix

**Issue:** `comprehensive-form-testing.spec.ts` was incorrectly added to the no-auth project testMatch regex.

**Impact:** All 137 form tests ran without authentication, causing all tests to fail.

**Fix:** Removed `comprehensive-form-testing\.spec\.ts` from line 46 testMatch regex.

**Lesson:** Form tests ALWAYS require authentication. Never add form test files to no-auth project.

## Related Documentation

- [Form Testing Plugin](.claude/plugins/form-testing/README.md)
- [Form Inventory](../documentation/forms/FORM_INVENTORY.md)
- [Auth Setup](./auth.setup.ts)
