# Git Hooks Quick Reference

**For:** Alleato-Procore Developers
**Purpose:** Understand what checks run when you commit/push

---

## 🚦 What Runs When

### On `git commit`

```
1. Route Conflict Check      (~1s)  ← Prevents breaking Next.js
2. Dangerous Pattern Check   (~1s)  ← Prevents console.log, @ts-ignore, etc.
3. Documentation Validation  (~1s)  ← Ensures docs in correct folders
4. Lint-Staged              (~5s)  ← TypeScript, ESLint, Prettier on changed files

Total: ~8 seconds
```

### On `git push`

```
1. Full TypeScript Typecheck (~20s)  ← Checks entire project for type errors
2. Full ESLint              (~15s)  ← Checks entire project for lint errors

Total: ~35 seconds
```

---

## ❌ Common Errors & How to Fix

### Error: "Route conflict detected"

**What it means:** You have conflicting dynamic route names

```
Example:
frontend/src/app/api/projects/[id]/
frontend/src/app/[projectId]/
                     ^^^         ^^
                   Different names for same resource = ERROR
```

**How to fix:**
1. Use consistent naming everywhere
2. See: `.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md`
3. Use standard names: `[projectId]`, `[companyId]`, `[contractId]`

---

### Error: "Found console.log statements"

**What it means:** You have `console.log()` in your code

**How to fix:**
```typescript
// ❌ Bad
console.log('Debug message')

// ✅ Good (for warnings/errors)
console.warn('Warning message')
console.error('Error message')

// ✅ Best (for debugging - then remove before commit)
// Remove all console statements before committing
```

---

### Error: "Found @ts-ignore or @ts-expect-error"

**What it means:** You're suppressing TypeScript errors

**How to fix:**
```typescript
// ❌ Bad
// @ts-ignore
const x: number = 'string'

// ✅ Good - Fix the actual type error
const x: string = 'string'

// ⚠️ If absolutely necessary (rare)
// @ts-expect-error - TODO: Fix when library updates
const x = externalLibrary.brokenMethod()
```

---

### Error: "Found .only() in test files"

**What it means:** You have `test.only()` or `describe.only()`

**Why it's blocked:** `.only()` makes other tests skip, breaking CI

**How to fix:**
```typescript
// ❌ Bad - Only this test runs
test.only('my test', () => { ... })

// ✅ Good - All tests run
test('my test', () => { ... })
```

---

### Error: "Documentation structure validation FAILED"

**What it means:** Documentation files in wrong location

**How to fix:**
1. Run `/doc-check` command before creating docs
2. See: `documentation/DOCUMENTATION-STANDARDS.md`
3. Never put project docs in `/documentation` root
4. Use: `documentation/docs/[category]/` instead

---

### Error: "Type errors in frontend"

**What it means:** TypeScript found type errors

**How to fix:**
```bash
# See all errors
npm run typecheck --prefix frontend

# Common fixes:
# 1. Add proper types
# 2. Use type guards
# 3. Handle null/undefined explicitly
```

---

## 🔧 How to Bypass (Use Sparingly!)

### Skip Pre-Commit Checks

```bash
git commit --no-verify -m "Emergency fix"
```

**⚠️ WARNING:** Pre-push and CI will still catch issues

### Skip Pre-Push Checks

```bash
git push --no-verify
```

**⚠️ WARNING:** CI will still catch issues and block merge

---

## 📋 Checklist Before Commit

- [ ] No `console.log()` statements
- [ ] No `@ts-ignore` or `@ts-expect-error`
- [ ] No `.only()` in tests
- [ ] No `debugger` statements
- [ ] Documentation in correct location
- [ ] Dynamic routes use consistent names

---

## 🆘 Getting Help

### If Hook Has False Positive

1. Report in Slack/Issue
2. Bypass with `--no-verify` (temporary)
3. Team will fix hook ASAP

### If Unclear How to Fix Error

1. Read the error message (has fix instructions)
2. Check relevant documentation file mentioned
3. Ask team member
4. Check this file for common errors

---

## 🎯 Why We Have These Checks

| Check | Prevents |
|-------|----------|
| Route conflicts | App breaking (dev server won't start) |
| Dangerous patterns | Debug code in production, type safety bypasses |
| Documentation validation | Docs in wrong location, documentation debt |
| TypeScript typecheck | Runtime type errors |
| ESLint | Code quality issues, bugs |

**Goal:** Catch errors in 10 seconds (commit) instead of 10 minutes (CI)

---

## 📚 Full Documentation

- **Best Practices:** `.husky/HUSKY-BEST-PRACTICES.md`
- **Route Rules:** `.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md`
- **Doc Standards:** `documentation/DOCUMENTATION-STANDARDS.md`

---

## 🔄 Performance

**Pre-Commit Average:** 8 seconds
- Fast enough to not disrupt flow
- Catches most issues immediately

**Pre-Push Average:** 35 seconds
- Acceptable for final check before push
- Saves CI time (5-10 minutes)

---

**Last Updated:** 2026-01-10
**Questions?** Ask in #engineering Slack channel
