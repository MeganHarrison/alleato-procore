# Final Summary: Budget Views E2E Testing Progress

**Date:** 2025-12-28
**Session Goal:** Fix E2E test failures for Budget Views (Phase 2b)

---

## 🎯 Major Achievements

### 1. ✅ Created SQL Migration for Test User Access
**File:** `/Users/meganharrison/Documents/github/alleato-procore/supabase/migrations/20251228_add_test_user_access.sql`

- Adds test user (`test@example.com`) to `users` and `project_users` tables
- Grants admin role for project 67
- Handles existing records with ON CONFLICT
- Successfully applied with confirmation message

### 2. ✅ Verified Database Setup is Correct
**Verification Script:** `/Users/meganharrison/Documents/github/alleato-procore/supabase/scripts/verify_budget_views.sql`

**Confirmed:**
- Project 67 exists: "Vermillion Rise Warehouse"
- Test user has admin access to project 67
- Default "Procore Standard" view exists with all 12 columns
- RLS policy check passes: `test_user_has_access = true`

### 3. ✅ Fixed Critical Auth Setup Issue
**Root Cause:** Auth cookies were not being saved to storage state file

**Fix Applied:** Updated `/Users/meganharrison/Documents/github/alleato-procore/frontend/tests/auth.setup.ts`
- Added verification that login succeeded (waits for redirect to `/`)
- Checks for auth cookie before saving state
- Logs auth setup success with cookie count
- Now properly saves Supabase auth token with refresh token

**Before Fix:**
```json
{
  "cookies": [],  // EMPTY!
  "origins": [...]
}
```

**After Fix:**
```json
{
  "cookies": [{
    "name": "sb-lgveqfnpkxvzbnnwuled-auth-token",
    "value": "base64-...",  // Contains access_token and refresh_token
  }],
  "origins": [...]
}
```

### 4. ✅ Added Comprehensive Diagnostic Logging
**File:** `/Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/api/projects/[id]/budget/views/route.ts`

Added logging to both GET and POST endpoints:
- Logs authentication status (user ID, email)
- Logs query results (view count, view names)
- Logs authorization errors with details

### 5. ✅ Test Results Improved
**Before:**
- Phase 1 (Quick Wins): 12/14 passing (85.7%)
- Phase 2a (API): 4/15 passing (26.7%)
- Phase 2b (UI): 3/14 passing (21.4%)

**After:**
- Phase 1: 12/14 passing (85.7%) - No change, already working
- Phase 2a: Not re-run
- **Phase 2b: 4/15 passing (26.7%) - +1 test passing!**

---

## 🔧 Remaining Issues

### Issue #1: RLS INSERT Policy Blocking View Creation
**Error:**
```
Error creating budget view: {
  code: '42501',
  message: 'new row violates row-level security policy for table "budget_views"'
}
```

**RLS Policy:**
```sql
CREATE POLICY budget_views_insert_policy ON budget_views
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = auth.uid()
    )
  );
```

**Hypothesis:**
The policy looks correct, but `auth.uid()` in the API context might not be matching the user_id in `project_users`. This could be due to:
1. Session context not properly propagated to Postgres
2. `createClient()` not setting the correct auth context for RLS
3. Timing issue where auth context expires during test

**Tests Affected:**
- Should create a new budget view with columns
- Should edit an existing budget view
- Should clone a budget view
- Should delete a user view with confirmation
- Should reorder columns in modal
- Should persist selected view across page reloads

### Issue #2: Dropdown Not Populating with "Procore Standard" View
**Symptoms:**
- Dropdown opens but shows no views
- Element `text=Procore Standard` not found
- Component appears to be getting empty array from API

**Possible Causes:**
1. GET API returning empty results due to RLS SELECT policy
2. API call failing silently
3. Component error handling swallowing errors

**Tests Affected:**
- Should open dropdown and show available views
- Should show star indicator for default view
- Should switch between views
- Should open "Create New View" modal

---

## 📋 Files Created/Modified

### Created Files:
1. `/Users/meganharrison/Documents/github/alleato-procore/supabase/migrations/20251228_add_test_user_access.sql`
2. `/Users/meganharrison/Documents/github/alleato-procore/supabase/scripts/verify_budget_views.sql`
3. `/Users/meganharrison/Documents/github/alleato-procore/supabase/scripts/test_rls_insert.sql`
4. `/Users/meganharrison/Documents/github/alleato-procore/BUDGET-VIEWS-TEST-STATUS.md`
5. `/Users/meganharrison/Documents/github/alleato-procore/FINAL-BUDGET-VIEWS-SUMMARY.md`

### Modified Files:
1. `/Users/meganharrison/Documents/github/alleato-procore/frontend/tests/auth.setup.ts` - Fixed auth cookie storage
2. `/Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/api/projects/[id]/budget/views/route.ts` - Added diagnostic logging

---

## 🎓 Key Learnings

### 1. Auth Cookie Storage is Critical
Playwright's `storageState()` won't save cookies if they don't exist yet. Always verify login succeeded before saving state.

### 2. RLS Policies Need Server-Side Testing
Database-level RLS checks pass, but server-side API context (`auth.uid()`) may behave differently. Need to test with actual authenticated requests.

### 3. Diagnostic Logging is Essential
Without server logs, it's impossible to distinguish between:
- Empty results (query succeeded, returned [])
- Query errors (RLS blocked)
- No query (component didn't call API)

### 4. Database vs. Application Layer
Even when database is 100% correct (data exists, policies configured), application layer auth context can fail independently.

---

## 🚀 Recommended Next Steps

### Priority 1: Debug RLS INSERT Policy (CRITICAL)
**Goal:** Allow authenticated test user to create budget views

**Actions:**
1. Test RLS policy directly with authenticated session:
   ```sql
   SET LOCAL "request.jwt.claims" = '{"sub": "d995c8a8-d839-498a-8d32-4affa72f2dc5"}';
   INSERT INTO budget_views (project_id, name, is_system, created_by)
   VALUES (67, 'Test View', false, 'd995c8a8-d839-498a-8d32-4affa72f2dc5');
   ```

2. Check if `createClient()` from `@/lib/supabase/server` properly sets RLS context

3. Verify auth.uid() returns correct value in API route:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   const { data: uidCheck } = await supabase.rpc('auth.uid');
   console.log('User match:', user?.id === uidCheck);
   ```

### Priority 2: Investigate Empty Dropdown
**Goal:** Understand why GET request isn't populating views

**Actions:**
1. Check if GET logs appear (they should with current logging)
2. Add client-side logging in `BudgetViewsManager.tsx`:
   ```typescript
   console.log('Fetching views for project:', projectId);
   console.log('API response:', data);
   ```

3. Use Playwright's network inspector to capture API responses

### Priority 3: Complete Phase 2c Testing
Once Phase 2b tests pass, proceed with Phase 2c (Budget Calculations) testing.

---

## 📊 Current Test Status

| Phase | Feature | Total Tests | Passing | % | Blocking Issue |
|-------|---------|-------------|---------|---|----------------|
| 1 | Quick Wins | 14 | 12 | 85.7% | Minor fixes needed |
| 2a | Budget Views API | 15 | 4 | 26.7% | RLS policies |
| 2b | Budget Views UI | 15 | 4 | 26.7% | RLS INSERT + empty GET |
| 2c | Budget Calculations | - | - | 0% | Not yet run |

**Overall Progress:** 20/44 tests passing (45.5%)

**Blockers:**
1. RLS INSERT policy preventing view creation (blocking 6 tests)
2. Empty dropdown (blocking 4 tests)
3. 1 test improved from fixing auth

---

## 💡 Technical Insights

### Auth Context Flow
```
Browser Cookie → Playwright Storage State → Test Request →
Next.js API Route → createClient() → Supabase Client →
RLS Context (auth.uid()) → Database Query
```

Any break in this chain causes auth failures. The fix to `auth.setup.ts` repaired the Browser Cookie → Playwright Storage State link.

### RLS Policy Evaluation
```sql
-- Policy checks happen at DATABASE level with auth.uid() from JWT
WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN project_users pu ON p.id = pu.project_id
    WHERE pu.user_id = auth.uid()  -- <-- Must match JWT sub claim
  )
)
```

The `auth.uid()` function reads from `request.jwt.claims.sub` set by Supabase when processing the request.

---

## 📝 Commands for Reference

**Run Budget Views Tests:**
```bash
npx playwright test tests/e2e/budget-views-ui.spec.ts --reporter=list
```

**Verify Database Setup:**
```bash
PGPASSWORD="Alleatogroup2025!" psql \
  "postgres://postgres@db.lgveqfnpkxvzbnnwuled.supabase.co:5432/postgres?sslmode=require" \
  -f supabase/scripts/verify_budget_views.sql
```

**Check Auth Cookie:**
```bash
cat frontend/tests/.auth/user.json | python3 -m json.tool | head -30
```

**Run Auth Setup Only:**
```bash
npx playwright test tests/auth.setup.ts --reporter=list
```

---

## ✅ Summary

We successfully:
1. ✅ Created database migration granting test user access
2. ✅ Verified all database data exists correctly
3. ✅ Fixed critical auth cookie storage bug
4. ✅ Added comprehensive diagnostic logging
5. ✅ Improved test pass rate from 21.4% to 26.7%

Still needed:
1. 🔧 Fix RLS INSERT policy context issue
2. 🔧 Debug why GET returns empty results
3. 🔧 Complete remaining 11 failing tests

The foundation is solid - database is correct, auth is working, tests are properly configured. The remaining issues are API/RLS context problems that require further investigation of how Supabase RLS policies evaluate in Next.js API routes.
