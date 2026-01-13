# API Test Authentication Issue - Root Cause Analysis

## Problem Statement

All Playwright API tests for Prime Contracts were failing with 404 errors, even though:
- Authentication setup works correctly (storageState is generated with valid cookies)
- The API routes exist and work via curl with cookies
- The dev server is running properly

## Root Cause

**Playwright's `request` fixture does not properly send cookies to Next.js API routes when using the Cookie HTTP header approach.**

### Technical Details

1. **What We Tried**: Adding cookies as HTTP headers to Playwright's `request` context:
   ```typescript
   request.get(url, {
     headers: {
       'Cookie': 'sb-lgveqfnpkxvzbnnwuled-auth-token=...'
     }
   })
   ```

2. **Why It Fails**: Next.js's `cookies()` function from `next/headers` doesn't reliably read cookies from HTTP headers sent by Playwright's API request context. The `cookies()` function expects cookies to be in the request's cookie jar, not as HTTP headers.

3. **Evidence**:
   - curl with Cookie header works: `curl -H 'Cookie: ...' http://localhost:3000/api/...` returns JSON
   - Playwright request with Cookie header fails: Returns 404 "Contract not found"
   - This indicates the API route is hit, but the Supabase client created from `cookies()` doesn't have authentication

## Verified Facts

- The `storageState` file contains valid auth cookies
- The API routes work correctly (tested with curl)
- The routes properly use `createClient()` from `@/lib/supabase/server`
- The Supabase server client uses `cookies()` from `next/headers`
- The Cookie header is being constructed correctly (2552 characters, proper format)

## Recommended Solution (Implemented)

**Use an authenticated API request context built from `storageState` instead of Cookie headers.**

Prime-contract API specs now rely on `createAuthenticatedRequestContext` to create an `APIRequestContext` seeded with the saved auth state, so Next.js receives real cookies without manual headers.

### Why This Works

1. The context loads the same storageState used by UI tests (auth cookies included)
2. Requests are issued from that context, so `cookies()` resolves correctly
3. No brittle Cookie header construction is required

## Alternative Solutions

### Option 1: Use Supabase Client Directly
Good for schema validation, but does not cover API route wiring/auth.

### Option 2: Custom Playwright Fixture (Implemented)
Use storageState-backed API contexts via `createAuthenticatedRequestContext` (preferred for API route coverage).

### Option 3: Mock the cookies() Function
Not recommended - would require significant test infrastructure changes.

## Conclusion

The Cookie HTTP header approach with Playwright's `request` fixture is not compatible with Next.js's server-side cookie handling. Tests should either:
1. Use `page.evaluate()` with fetch() for API testing (browser cookies)
2. Continue using Supabase clients directly for business logic testing (current approach)
3. Accept that these integration tests require a browser context

## Files Modified

- `/tests/helpers/api-auth.ts` - Adds `createAuthenticatedRequestContext`
- `/tests/e2e/prime-contracts/api-change-orders.spec.ts` - Uses authenticated request context
- `/tests/e2e/prime-contracts/api-crud.spec.ts` - Uses authenticated request context
- `/tests/e2e/prime-contracts/api-line-items.spec.ts` - Uses authenticated request context

## Next Steps

1. Keep API specs on the authenticated request context
2. Remove any remaining Cookie-header helpers in other specs
3. Add page-level UI flows once routes stabilize
