# API Test Authentication Issue - Root Cause Analysis

## Problem Statement

All Playwright API tests for Prime Contracts are failing with 404 errors, even though:
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

## Recommended Solution

**Use browser context with page.evaluate() instead of request fixture:**

```typescript
test('should create contract', async ({ page }) => {
  // page already has storageState with auth cookies

  const response = await page.evaluate(async ([url, data]) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return {
      status: res.status,
      data: await res.json(),
    };
  }, [url, contractData]);

  expect(response.status).toBe(201);
});
```

### Why This Works

1. The `page` fixture uses `storageState` automatically (configured in playwright.config.ts)
2. `fetch()` calls from within the browser context include cookies naturally
3. Next.js receives proper browser cookies, not HTTP headers
4. The `cookies()` function works as expected

## Alternative Solutions

### Option 1: Use Supabase Client Directly (Current Approach)
The tests currently create Supabase clients directly and test business logic, which works well. The API route tests may be redundant if the business logic is already covered.

### Option 2: Custom Playwright Fixture
Create a custom fixture that properly manages authenticated API contexts, but this is complex and may not work reliably with Next.js.

### Option 3: Mock the cookies() Function
Not recommended - would require significant test infrastructure changes.

## Conclusion

The Cookie HTTP header approach with Playwright's `request` fixture is not compatible with Next.js's server-side cookie handling. Tests should either:
1. Use `page.evaluate()` with fetch() for API testing (browser cookies)
2. Continue using Supabase clients directly for business logic testing (current approach)
3. Accept that these integration tests require a browser context

## Files Modified

- `/tests/helpers/api-auth.ts` - Created helper (Cookie header approach - doesn't work with Next.js)
- `/tests/e2e/prime-contracts/api-change-orders.spec.ts` - Updated to use withAuth
- `/tests/e2e/prime-contracts/api-crud.spec.ts` - Updated to use withAuth
- `/tests/e2e/prime-contracts/api-line-items.spec.ts` - Updated to use withAuth

All three test files need to be reverted or updated to use the page.evaluate() approach.

## Next Steps

1. Decide on testing strategy (API routes vs business logic)
2. If testing API routes, refactor to use `page.evaluate()` approach
3. If testing business logic only, keep existing Supabase client approach
4. Remove the `withAuth` helper if not needed
