# AGENTS.md

## Project Overview

**Alleato-Procore** is a production-grade construction project management system designed to replicate and improve upon Procore’s core functionality.

| Layer | Stack |
|------|------|
| Frontend | Next.js 15 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Supabase (Postgres, Auth, RLS, Storage) |
| Testing | Playwright (browser-verified) |
| Deployment | Vercel |

---

## Core Operating Principles

1. **Work until complete**  
   Do not stop at partial progress. Fix issues as they appear.

2. **Evidence over claims**  
   No feature is “done” without proof: test output, screenshots, reports.

3. **Explore before assuming**  
   Never guess file locations, patterns, or architecture.

4. **Test everything**  
   A feature without tests is unfinished.

---

## Critical Rules

### Next.js Dynamic Routes (NON-NEGOTIABLE)

**Before creating `[param]` folders:**

1. Check for existing params:
   ```bash
   find frontend/src/app -type d -name "[*]"

	2.	Use the same parameter name everywhere for a given resource.
	3.	Follow:

.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md

BAD:  api/projects/[id] + [projectId]/home
GOOD: api/projects/[projectId] + [projectId]/home

Inconsistent params will break routing and data loading.

⸻

File Locations

Purpose	Location
Feature work	documentation/*project-mgmt/in-progress/{feature}/
Test results	{feature-folder}/TEST-RESULTS.md
Plans / specs	documentation/docs/

Never place project files in .claude/
That directory is tooling-only.

⸻

Code Quality Rules

After every meaningful change, run:

npm run quality --prefix frontend

Must pass with zero errors before claiming completion.

Explicitly Banned
	•	@ts-ignore
	•	any
	•	console.log
	•	Silent failure handling

⸻

Completion Requirements

A task is COMPLETE only when all conditions are met:
	•	Feature implemented
	•	npm run quality --prefix frontend passes
	•	Tests written and executed
	•	HTML verification report generated

⸻

HTML Verification Report (MANDATORY)

To claim completion, you must generate real evidence:

npx tsx .agents/tools/generate-verification-report.ts <feature-name>

Output:

documentation/*project-mgmt/verification-reports/<feature>/index.html

The report includes:
	•	Actual test output
	•	Actual screenshots
	•	Pass/fail metrics
	•	Quality check results

You cannot claim completion without this report.

Required Completion Statement

COMPLETE: Verification report at documentation/*project-mgmt/verification-reports/<feature>/index.html
- Tests: X/Y passed (Z%)
- Quality: 0 errors
- Screenshots: N captured


⸻

Procore Screenshot Comparison

If reference screenshots exist in:

scripts/screenshot-capture/procore-[feature]-crawl/

You must:
	1.	Capture implementation screenshots during Playwright tests
	2.	Compare side-by-side with Procore references
	3.	Document differences in COMPARISON-REPORT.md
	4.	Fix blocking gaps before claiming completion

⸻

Required Workflow (No Sub-Agents)

1. Explore First

Before creating files or changing behavior:
	•	Search for similar features
	•	Verify routing, components, and patterns
	•	Confirm Supabase schemas and RLS policies

Never assume. Verify.

⸻

2. Implement
	•	Follow existing architectural patterns
	•	Keep changes minimal and scoped
	•	Do not refactor unrelated code

⸻

3. Test (MANDATORY)

Use Playwright for all user-visible behavior.

Rules:
	•	Always waitForLoadState('networkidle')
	•	Use role-based or stable selectors
	•	Include auth cookies for API requests

await page.goto('/dashboard');
await page.waitForLoadState('networkidle');

await page.locator('[role="tab"]').filter({ hasText: 'Budget' }).click();


⸻

4. Verify (MANDATORY)

Before claiming completion:
	1.	Run tests until PASS
	2.	Generate HTML verification report
	3.	Review screenshots, failures, metrics
	4.	Fix issues
	5.	Re-run verification if needed

If verification fails → the task is not complete

⸻

Supabase Rules

Types (MANDATORY)

Always regenerate types after schema changes:

npx supabase gen types typescript \
  --project-id "lgveqfnpkxvzbnnwuled" \
  --schema public \
  > frontend/src/types/database.types.ts

Security
	•	Every table must have RLS enabled
	•	UI checks ≠ authorization
	•	Enforce access at the database layer

⸻

Playwright Quick Reference

// Always wait for network idle
await page.waitForLoadState('networkidle');

// Prefer roles over brittle selectors
await page.getByRole('button', { name: 'Save' }).click();

// Authenticated API requests
const authCookies = /* from tests/.auth/user.json */;
await page.request.post(url, {
  headers: { Cookie: authCookies }
});

Full patterns:

.agents/docs/playwright/PLAYWRIGHT-PATTERNS.md


⸻

Banned Behaviors

❌ Don’t	✅ Do
“This should work”	Run it and show evidence
“Tests should pass”	Execute tests
Claim completion without proof	Provide verification report
Guess paths or patterns	Explore first
Create _backup or _fixed files	Edit in place


## When to Stop and Ask

Stop and ask if you encounter:
	•	Missing credentials or access
	•	Ambiguous requirements
	•	Schema mismatch between migrations and types
	•	Architectural decisions that affect multiple systems

Never guess. Ask.


## Key File Locations

Purpose	Location
Route naming rules	.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md
Playwright patterns	.agents/docs/playwright/PLAYWRIGHT-PATTERNS.md
Verification script	.agents/tools/generate-verification-report.ts
Feature workflow	.agents/workflows/feature-implementation.md
Implementation docs	documentation/implementation-workflow/


## Quick Commands

# Run quality checks
npm run quality --prefix frontend

# Generate verification report
npx tsx .agents/tools/generate-verification-report.ts <feature>

# Generate Supabase types
npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" --schema public \
  > frontend/src/types/database.types.ts

# Run Playwright tests
cd frontend
npx playwright test --reporter=html
