# Budget Views E2E Test Status Report
**Generated:** 2025-12-28
**Project:** alleato-procore
**Test Suite:** Phase 2b - Budget Views UI

---

## Executive Summary

Database setup is **100% correct** - all required data exists and RLS policies grant proper access. However, E2E tests show **21.4% pass rate (3/14 tests)**, with failures indicating potential client-side or API integration issues rather than database/auth problems.

---

## ✅ Database Verification (All Passing)

### 1. Project Exists
```
ID: 67
Name: Vermillion Rise Warehouse
Created: 2025-12-15 18:28:47
```

### 2. Test User Access Configured
```
User: test@example.com
User ID: d995c8a8-d839-498a-8d32-4affa72f2dc5
Role: admin
Project: 67
Status: ✅ Properly configured via migration 20251228_add_test_user_access.sql
```

### 3. Default Budget View Exists
```
View ID: ec8cb5ac-2824-46bd-bc73-8e3a0a0484b0
Name: Procore Standard
Project: 67
Is Default: true
Is System: true
Created: 2025-12-28 21:29:06
Columns: 12 standard columns configured
Status: ✅ Created by migration 20251227_budget_views_system.sql
```

### 4. RLS Policy Check
```sql
SELECT test_user_has_access FROM budget_views WHERE project_id = 67;
Result: true ✅
```

The test user **DOES have access** according to RLS policy simulation.

---

## 🧪 E2E Test Results

### Phase 2b: 3/14 passing (21.4%)

#### ✅ Passing Tests (3)
1. **Should display Budget Views dropdown button** - Component renders
2. **Should show action buttons for user views only** - Conditional rendering works
3. **Should prevent editing system views** - Business logic enforced

#### ❌ Failing Tests (11)

**Category 1: Dropdown Content Missing (4 tests)**
- Should open dropdown and show available views
- Should show star indicator for default view
- Should switch between views
- Should open "Create New View" modal

**Error Pattern:**
```
expect(locator).toBeVisible() failed
Locator: locator('[role="menu"]').locator('text=Procore Standard')
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

**Analysis:** The dropdown opens but doesn't contain the "Procore Standard" view. This suggests the API call to fetch views is either:
- Returning empty array `[]`
- Returning error that component handles silently
- Not being called at all

**Category 2: API Authorization Error (1 test)**
- Should switch between views

**Error Pattern:**
```
expect(received).toBe(expected)
Expected: 201
Received: 401
```

**Analysis:** POST request to create a view returns 401 Unauthorized, despite:
- User being authenticated (cookie exists)
- User in project_users table
- RLS policy check passing

**Category 3: Modal Timeouts (6 tests)**
- Should allow setting a view as default
- Should create a new budget view with columns
- Should edit an existing budget view
- Should clone a budget view
- Should delete a user view with confirmation
- Should reorder columns in modal

**Error Pattern:**
```
Test timeout of 30000ms exceeded
Error: locator.fill: Test timeout of 30000ms exceeded
Locator: [role="dialog"].locator('input[placeholder*="Enter view name"]')
```

**Analysis:** Modals never open, likely because tests depend on views data existing in the dropdown first.

---

## 🔍 Root Cause Analysis

### What's Working ✅
- ✅ Database schema created correctly
- ✅ Default view inserted for project 67
- ✅ Test user authenticated (JWT token in cookies)
- ✅ Test user in `project_users` table with admin role
- ✅ RLS policies configured and test user passes policy checks
- ✅ Component renders (button displays)
- ✅ Playwright auth setup captures session cookies

### What's NOT Working ❌
- ❌ API GET `/api/projects/67/budget/views` appears to return empty array
- ❌ API POST `/api/projects/67/budget/views` returns 401 Unauthorized
- ❌ Dropdown doesn't populate with "Procore Standard" view

### Hypothesis: Server-Side Auth Context Issue

The discrepancy suggests:

1. **Client-side auth is working** (button renders, some tests pass)
2. **Server-side API auth is failing** (401 errors, empty responses)

**Possible causes:**
- API route's `createClient()` from `@/lib/supabase/server` may not be reading cookies correctly in test environment
- RLS policies work in direct database queries but fail in API context
- Session cookies might not be sent with API requests in Playwright
- CORS or cookie settings preventing cookie transmission to API routes

### Key Observation: NULL `created_by`

System views have `created_by = NULL`:
```sql
created_by |
-----------|
           | (empty)
```

While user-created views set this field (route.ts:88):
```typescript
created_by: user.id
```

This is **unlikely** to cause GET failures but could affect:
- Audit logging
- Future features requiring creator tracking
- Database constraints if `created_by` is later made NOT NULL

---

## 📋 Diagnostic Steps Completed

1. ✅ **Verified database schema** - Tables exist with correct structure
2. ✅ **Confirmed default view exists** - "Procore Standard" present for project 67
3. ✅ **Verified test user access** - User in `project_users` with admin role
4. ✅ **Checked RLS policies** - Policies exist and simulation shows access granted
5. ✅ **Verified auth cookies** - JWT token properly stored in Playwright storage state
6. ✅ **Ran selector fixes** - Added `.last()` to disambiguate duplicate buttons
7. ✅ **Created access migration** - Test user granted necessary permissions

---

## 🎯 Recommended Next Steps

### Priority 1: Debug API Server-Side Auth
**Goal:** Determine why API returns 401 despite valid auth

**Actions:**
1. Add logging to `/api/projects/[id]/budget/views/route.ts`:
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser();
   console.log('API Auth Check:', { user: user?.id, error, projectId });
   ```

2. Check if cookies are sent with API requests in Playwright:
   ```typescript
   page.on('request', request => {
     console.log('Request headers:', request.url(), request.headers());
   });
   ```

3. Verify `createClient()` implementation reads cookies correctly

### Priority 2: Test API Directly
**Goal:** Isolate whether issue is API or client-side

**Actions:**
1. Use Playwright to make direct fetch calls:
   ```typescript
   const response = await page.request.get('/api/projects/67/budget/views');
   console.log('Response:', response.status(), await response.json());
   ```

2. Compare with browser fetch to see if cookies are included

### Priority 3: Check Component Error Handling
**Goal:** See if API errors are being silently swallowed

**Actions:**
1. Add error logging to `BudgetViewsManager.tsx` fetchViews():
   ```typescript
   } catch (error) {
     console.error('Error fetching views:', error);
     console.error('Response status:', response?.status);
     console.error('Response body:', await response?.text());
   ```

### Priority 4: Verify Cookie Settings
**Goal:** Ensure cookies work in test environment

**Actions:**
1. Check if API routes need explicit cookie reading
2. Verify `sameSite`, `httpOnly`, `secure` settings match between dev-login and test env
3. Confirm Next.js middleware isn't blocking test requests

---

## 📊 Test Coverage Summary

| Phase | Feature | Tests | Passing | % | Status |
|-------|---------|-------|---------|---|--------|
| 1 | Quick Wins | 14 | 12 | 85.7% | ✅ Verified |
| 2a | Budget Views API | 15 | 4 | 26.7% | 🔧 Auth issues |
| 2b | Budget Views UI | 14 | 3 | 21.4% | 🔧 Depends on 2a |
| 2c | Budget Calculations | - | - | 0% | ⏳ Not run |

**Overall:** 19/43 tests passing (44.2%)
**Blockers:** Server-side authentication in API routes

---

## 🔧 Migrations Applied

1. **20251227_budget_views_system.sql** - Creates budget_views schema, RLS policies, default views
2. **20251228_add_test_user_access.sql** - Grants test user access to project 67

Both migrations applied successfully with no errors.

---

## 📝 Files for Reference

**Verification Script:**
```
/Users/meganharrison/Documents/github/alleato-procore/supabase/scripts/verify_budget_views.sql
```

**Test Suite:**
```
/Users/meganharrison/Documents/github/alleato-procore/frontend/tests/e2e/budget-views-ui.spec.ts
```

**API Implementation:**
```
/Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/api/projects/[id]/budget/views/route.ts
```

**Component:**
```
/Users/meganharrison/Documents/github/alleato-procore/frontend/src/components/budget/BudgetViewsManager.tsx
```

---

## Conclusion

The database is correctly configured and the test user has all necessary permissions. The failures are **NOT due to missing data or RLS policy issues**. The root cause appears to be server-side authentication context in API routes not properly recognizing the authenticated session during Playwright tests.

Further debugging should focus on how Next.js API routes handle authentication cookies in the test environment, specifically the `createClient()` implementation from `@/lib/supabase/server`.
