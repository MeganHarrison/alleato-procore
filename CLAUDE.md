# Claude Code Instructions for Alleato-Procore

## Project Overview

**Alleato-Procore** is a production-grade construction project management system cloning Procore's functionality.

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 15 (App Router), Tailwind, ShadCN UI |
| Backend | Supabase (Postgres, RLS, Auth, Storage) |
| Testing | Playwright (browser-verified) |

---

## Core Principles

1. **Work until complete** - Don't stop to report progress. Fix issues, don't document them.
2. **Evidence over claims** - Every completion claim requires proof (test output, screenshots).
3. **Explore before assuming** - Never guess codebase structure. Use Explore agent first.
4. **Test everything** - No feature is complete without passing tests.

---

## Critical Rules

### Next.js Dynamic Routes

**BEFORE creating `[param]` folders:**
1. Check existing: `find frontend/src/app -type d -name "[*]"`
2. Use SAME parameter name everywhere for each resource
3. See: `.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md`

```
BAD:  api/projects/[id] + [projectId]/home     -> BREAKS APP
GOOD: api/projects/[projectId] + [projectId]/home
```

### File Locations

| Type | Location |
|------|----------|
| Feature work | `documentation/*project-mgmt/in-progress/{feature}/` |
| Test results | `{feature-folder}/TEST-RESULTS.md` |
| Plans/specs | `documentation/docs/` |

**Never put project files in `.claude/`** - that's only for Claude Code tooling.

### Code Quality

```bash
# Run after EVERY change
npm run quality --prefix frontend

# Must pass with zero errors before any completion claim
```

**Banned:** `@ts-ignore`, `any` type, `console.log`

---

## Completion Requirements

A task is **COMPLETE** only when:

- [ ] Code implemented
- [ ] `npm run quality --prefix frontend` passes (zero errors)
- [ ] Tests written and executed
- [ ] **HTML verification report generated** (see below)

### HTML Verification Report (MANDATORY)

**To claim completion, you MUST:**

```bash
# Generate verification report with actual evidence
npx tsx .agents/tools/generate-verification-report.ts <feature-name>

# This produces: documentation/*project-mgmt/verification-reports/<feature>/index.html
```

The report contains:
- Actual test output (not claims)
- Actual screenshots (not descriptions)
- Pass/fail metrics
- Quality check results

**You cannot fake this report** - it requires running the actual tests.

**Report your completion as:**
```
COMPLETE: Verification report at documentation/*project-mgmt/verification-reports/<feature>/index.html
- Tests: X/Y passed (Z%)
- Quality: 0 errors
- Screenshots: N captured
```

### Procore Screenshot Comparison

For features with reference screenshots in `scripts/screenshot-capture/procore-[feature]-crawl/`:

1. Take implementation screenshots during tests
2. Compare side-by-side with Procore reference
3. Document differences in `COMPARISON-REPORT.md`
4. Fix blocking issues before claiming complete

---

## Sub-Agent Usage

### When to Use Sub-Agents

| Situation | Agent | Why |
|-----------|-------|-----|
| ANY testing | `test-automator` | Fresh context, testing expertise |
| Database work (RLS, migrations, 3+ tables) | `supabase-architect` | Schema expertise |
| Before making codebase assumptions | `Explore` | Verify before assuming |
| After implementing features | `code-reviewer` | Catch issues before commit |
| UI changes | `code-reviewer` with design-system-auditor prompt | Design consistency |
| Before claiming completion | `verifier-agent` | Evidence-based verification |

### Verification (MANDATORY - Use verifier-agent)

**NEVER claim "complete" without evidence. ALWAYS verify:**

```typescript
Task({
  subagent_type: "general-purpose",
  prompt: `Follow .agents/agents/verifier-agent.md protocol.

TASK: Verify {feature-name} implementation

STEPS:
1. Run: npx tsx .agents/tools/generate-verification-report.ts {feature}
2. Open generated index.html
3. Review ALL sections (screenshots, tests, API, database)
4. Only mark VERIFIED if ALL checks pass

REQUIRED OUTPUT:
- Link to HTML verification report
- Overall status (PASS/FAIL)
- Metrics (test rate, errors, screenshots)
- List of blockers if any`
})
```

### Testing (MANDATORY - Use test-automator)

**NEVER run Playwright directly. ALWAYS delegate:**

```typescript
Task({
  subagent_type: "test-automator",
  prompt: `Follow .agents/agents/playwright-tester.md for Alleato-Procore e2e tests.

CRITICAL:
- Read .agents/docs/playwright/PLAYWRIGHT-PATTERNS.md
- Test credentials: test1@mail.com / test12026!!!
- Always waitForLoadState('networkidle')
- Include auth cookies in API requests

TASK: [Your specific test request]

REQUIRED OUTPUT:
- Run tests until PASS or genuine blocker
- Generate HTML report
- Do NOT return with failures - fix them first`
})
```

### Database Work

```bash
# ALWAYS generate fresh types first
npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" \
  --schema public > frontend/src/types/database.types.ts
```

For complex work (RLS, migrations, multi-table):
```typescript
Task({
  subagent_type: "supabase-architect",
  prompt: "Read frontend/src/types/database.types.ts. [Your database task]"
})
```

### Exploring Codebase

**BEFORE saying "I'll create X at path/...":**

```typescript
Task({
  subagent_type: "Explore",
  prompt: "Find [component/pattern]. Thoroughness: medium",
  description: "Verify codebase patterns"
})
```

---

## Playwright Quick Reference

```typescript
// 1. ALWAYS wait for network
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');

// 2. Use role-based selectors
await page.locator('[role="tab"]').filter({ hasText: 'Budget' }).click();

// 3. API requests need auth
const authCookies = /* from tests/.auth/user.json */;
await page.request.post(url, {
  headers: { Cookie: authCookies }
});
```

**Full patterns:** `.agents/docs/playwright/PLAYWRIGHT-PATTERNS.md`

---

## Banned Behaviors

| Don't | Do Instead |
|-------|------------|
| "Tests should pass" | Run them, show output |
| "This should work" | Verify it, show evidence |
| "I've completed the task" | Provide HTML verification report path |
| Guess file locations | Use Explore agent first |
| Run Playwright directly | Use test-automator sub-agent |
| Create `_fixed`, `_backup` files | Edit in place |

---

## When to Stop and Ask

- Missing access/credentials
- Ambiguous requirements
- Schema mismatch between types and migrations
- Fundamental architectural decision needed

**Never guess. Ask.**

---

## Key File Locations

| Purpose | Location |
|---------|----------|
| Sub-agent catalog | `.agents/SUBAGENTS-INDEX.md` |
| Playwright patterns | `.agents/docs/playwright/PLAYWRIGHT-PATTERNS.md` |
| Route naming rules | `.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md` |
| Verification script | `.agents/tools/generate-verification-report.ts` |
| Verifier agent protocol | `.agents/agents/verifier-agent.md` |
| Feature implementation workflow | `.agents/workflows/feature-implementation.md` |
| Project-specific agents | `.agents/agents/` |
| Workflow process docs | `documentation/implementation-workflow/` |

---

## Quick Commands

```bash
# Quality check (run after every change)
npm run quality --prefix frontend

# Generate verification report
npx tsx .agents/tools/generate-verification-report.ts <feature>

# Generate Supabase types
npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" --schema public > frontend/src/types/database.types.ts

# Run specific Playwright test
cd frontend && npx playwright test tests/e2e/<test>.spec.ts --reporter=html
```
