# Test Results - Drawings

## npm run quality --prefix frontend
- Status: Completed
- Output:
```
npm run quality --prefix frontend
> npm run typecheck && npm run lint
> tsc --noEmit
> eslint .
Warnings: multiple existing files (chat, plugins, directory) still emit lint warnings; no errors.
Exit code: 0
```

## Playwright: drawings
- Status: Failed (environment)
- Command: `npx playwright test frontend/tests/e2e/drawings.spec.ts`
- Output:
```
Initial run (with elevated permissions): tests started; beforeEach timed out waiting for /dev-login redirect.
Subsequent reruns fail to start dev server: listen EPERM: operation not permitted 0.0.0.0:3100 (and 3200) when Playwright webServer spins up Next.js.
Unable to bind local port in current sandbox; tests aborted before execution.
```
