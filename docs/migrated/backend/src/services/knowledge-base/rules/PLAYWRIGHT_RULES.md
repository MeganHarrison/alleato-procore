# Playwright Rules for Codex

## Core Rules
1. Always use Playwright Test (`@playwright/test`)
2. Never use sleep or setTimeout — always wait for state
3. Prefer role-based selectors (`getByRole`, `getByLabel`)
4. One assertion per test unless explicitly instructed
5. Each test must:
   - Navigate explicitly
   - Assert a visible outcome
   - Fail loudly

## Structure
- Tests live in `/tests`
- One feature per file
- File naming: `<feature>.spec.ts`

## Forbidden
- page.waitForTimeout
- CSS selectors unless no semantic option exists
- Reusing state across tests

## Utilities
- Shared Playwright helpers must live in `/tests/utils`
- Auth helpers go in `/tests/utils/auth.ts`
- Tests must import helpers, never reimplement login flows
