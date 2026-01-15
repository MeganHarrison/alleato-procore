# Husky Best Practices & Git Hooks Strategy

**Date:** 2026-01-10
**Purpose:** Define comprehensive git hook strategy to enforce quality gates

---

## 🎯 Philosophy

**Git hooks are HARD BLOCKERS** that prevent broken code from entering the repository.

### Principles

1. **Fast feedback:** Catch errors at commit time (seconds), not in CI (minutes)
2. **Progressive validation:** Lightweight checks at commit, comprehensive at push
3. **Clear messaging:** Tell developers exactly what's wrong and how to fix it
4. **Zero false positives:** Never block valid commits
5. **Bypass when necessary:** Allow `--no-verify` for emergencies (but CI will still catch issues)

---

## 📋 Current Hook Strategy

### Pre-Commit (Fast Checks - ~5-10 seconds)

**Goal:** Catch obvious errors before they enter git history

```
1. Route Conflict Check      (~1s)  ← CRITICAL: Prevents app-breaking route errors
2. Documentation Validation  (~1s)  ← Ensures docs follow standards
3. Lint-Staged              (~3-8s) ← TypeScript, ESLint, Prettier on changed files
```

**Why these checks:**
- **Route conflicts:** Breaks Next.js dev server (happened 3 times)
- **Docs validation:** Prevents documentation debt accumulation
- **Lint-staged:** Fast because it only checks changed files

**What we DON'T check pre-commit:**
- ❌ Full project typecheck (too slow - ~20s)
- ❌ Full lint (too slow - ~15s)
- ❌ Tests (too slow - variable)

### Pre-Push (Comprehensive Checks - ~30-60 seconds)

**Goal:** Ensure branch is production-ready before pushing to remote

```
1. Full TypeScript typecheck  (~20s)  ← Catch type errors across entire codebase
2. Full ESLint                (~15s)  ← Catch lint errors across entire codebase
```

**Why these checks:**
- Prevents pushing broken code to remote
- Acts as final gate before CI
- Acceptable delay because push is less frequent than commit

**What we DON'T check pre-push (yet):**
- ❌ Tests (should be in CI, but could add critical tests here)
- ❌ Build (too slow, better in CI)

---

## 🔧 Recommended Additional Hooks

### 1. Critical Test Check (Pre-Push)

**Add to `.husky/pre-push`:**

```bash
# Run critical tests (e.g., auth, database connection)
echo ""
echo "🧪 Running critical tests..."
npm run test:critical --prefix frontend
if [ $? -ne 0 ]; then
  echo "❌ Critical tests FAILED"
  echo "Fix failing tests before pushing"
  exit 1
fi
```

**Implementation in `frontend/package.json`:**

```json
{
  "scripts": {
    "test:critical": "playwright test tests/e2e/auth.setup.spec.ts tests/e2e/database-connection.spec.ts --reporter=line"
  }
}
```

**Why:** Catches broken auth/database before CI (saves 5-10 min wait)

---

### 2. Dangerous Pattern Detection (Pre-Commit)

**Create `.husky/pre-commit-dangerous-patterns`:**

```bash
#!/usr/bin/env sh

# Check for dangerous patterns in staged files
echo "🔍 Checking for dangerous patterns..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Check for console.log (should use console.warn/error)
if echo "$STAGED_FILES" | xargs grep -n "console\.log" 2>/dev/null; then
  echo ""
  echo "❌ Found console.log statements"
  echo "Use console.warn or console.error instead"
  echo ""
  exit 1
fi

# Check for @ts-ignore or @ts-expect-error
if echo "$STAGED_FILES" | xargs grep -n "@ts-ignore\|@ts-expect-error" 2>/dev/null; then
  echo ""
  echo "❌ Found @ts-ignore or @ts-expect-error"
  echo "Fix the type error instead of ignoring it"
  echo ""
  exit 1
fi

# Check for .only() in tests (would skip other tests)
if echo "$STAGED_FILES" | xargs grep -n "\.only(" 2>/dev/null; then
  echo ""
  echo "❌ Found .only() in test files"
  echo "Remove .only() before committing"
  echo ""
  exit 1
fi

# Check for debugger statements
if echo "$STAGED_FILES" | xargs grep -n "debugger" 2>/dev/null; then
  echo ""
  echo "❌ Found debugger statements"
  echo "Remove debugger statements before committing"
  echo ""
  exit 1
fi

echo "✅ No dangerous patterns found"
exit 0
```

**Add to `.husky/pre-commit`:**

```bash
# 3. Check for dangerous patterns
echo ""
.husky/pre-commit-dangerous-patterns
if [ $? -ne 0 ]; then
  echo "❌ Dangerous pattern check FAILED"
  exit 1
fi
```

**Why:** Prevents common mistakes from entering codebase

---

### 3. Branch Name Validation (Pre-Push)

**Create `.husky/pre-push-branch-name`:**

```bash
#!/usr/bin/env sh

# Enforce branch naming convention
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Allow main/master
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  exit 0
fi

# Enforce pattern: type/description or type/ticket-description
# Examples: feat/user-auth, fix/login-bug, feat/JIRA-123-add-feature
if ! echo "$BRANCH" | grep -qE '^(feat|fix|chore|refactor|docs|test|perf)/[a-z0-9-]+$'; then
  echo ""
  echo "❌ Invalid branch name: $BRANCH"
  echo ""
  echo "Branch names must follow pattern: type/description"
  echo ""
  echo "Valid types: feat, fix, chore, refactor, docs, test, perf"
  echo "Examples:"
  echo "  - feat/user-authentication"
  echo "  - fix/login-error"
  echo "  - chore/update-deps"
  echo ""
  exit 1
fi

exit 0
```

**Optional:** Add to `.husky/pre-push` if you want enforcement

**Why:** Enforces consistent branch naming for better git history

---

### 4. Commit Message Validation (Commit-Msg Hook)

**Create `.husky/commit-msg`:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Read commit message
COMMIT_MSG=$(cat "$1")

# Check for minimum length
if [ ${#COMMIT_MSG} -lt 10 ]; then
  echo ""
  echo "❌ Commit message too short (minimum 10 characters)"
  echo ""
  echo "Write a descriptive commit message explaining what and why"
  echo ""
  exit 1
fi

# Check for WIP commits to main/master
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  if echo "$COMMIT_MSG" | grep -iqE '^(wip|tmp|temp|test):?'; then
    echo ""
    echo "❌ WIP/TMP/TEMP commits not allowed on $BRANCH"
    echo ""
    echo "Commit to a feature branch instead"
    echo ""
    exit 1
  fi
fi

exit 0
```

**Why:** Prevents meaningless commit messages and WIP commits on main

---

### 5. Large File Prevention (Pre-Commit)

**Create `.husky/pre-commit-large-files`:**

```bash
#!/usr/bin/env sh

# Prevent committing large files (>5MB)
MAX_SIZE=5242880  # 5MB in bytes

echo "📦 Checking for large files..."

LARGE_FILES=$(git diff --cached --name-only --diff-filter=ACM | while read file; do
  if [ -f "$file" ]; then
    SIZE=$(wc -c < "$file")
    if [ "$SIZE" -gt "$MAX_SIZE" ]; then
      echo "$file ($(numfmt --to=iec-i --suffix=B $SIZE))"
    fi
  fi
done)

if [ -n "$LARGE_FILES" ]; then
  echo ""
  echo "❌ Large files detected (>5MB):"
  echo ""
  echo "$LARGE_FILES"
  echo ""
  echo "Large files should not be committed to git."
  echo "Use Git LFS or store in cloud storage instead."
  echo ""
  exit 1
fi

echo "✅ No large files found"
exit 0
```

**Why:** Prevents bloating git repository with large binaries

---

## 📊 Recommended Hook Execution Order

### Pre-Commit (Ordered by Speed & Criticality)

1. ⚡ Large file check (~0.1s)
2. ⚡ Route conflict check (~1s) **← CRITICAL**
3. ⚡ Dangerous patterns (~1s)
4. ⚡ Documentation validation (~1s)
5. 🐢 Lint-staged (3-8s)

**Total: ~5-10 seconds**

### Pre-Push (Ordered by Speed)

1. ⚡ Branch name validation (~0.1s)
2. 🐢 Full typecheck (~20s)
3. 🐢 Full lint (~15s)
4. 🐢 Critical tests (~10s) ← Optional but recommended

**Total: ~35-45 seconds**

---

## 🚀 Implementation Strategy

### Phase 1: IMMEDIATE (Already Done)
- ✅ Route conflict check in pre-commit
- ✅ Documentation validation in pre-commit
- ✅ Lint-staged in pre-commit
- ✅ Full typecheck/lint in pre-push

### Phase 2: RECOMMENDED (Add These Next)
- [ ] Dangerous pattern detection (pre-commit)
- [ ] Commit message validation (commit-msg)
- [ ] Large file prevention (pre-commit)

### Phase 3: OPTIONAL (Team Preference)
- [ ] Branch name validation (pre-push)
- [ ] Critical test subset (pre-push)

---

## 🛠️ Testing Your Hooks

### Test Pre-Commit Hook

```bash
# 1. Stage a file with an issue
echo "console.log('test')" >> frontend/src/test.ts
git add frontend/src/test.ts

# 2. Try to commit
git commit -m "test"

# Expected: Hook should block commit
```

### Test Pre-Push Hook

```bash
# 1. Make a commit with TypeScript error
echo "const x: number = 'string'" >> frontend/src/test.ts
git add frontend/src/test.ts
git commit -m "test" --no-verify  # Bypass pre-commit

# 2. Try to push
git push

# Expected: Hook should block push
```

### Test Route Conflict Check

```bash
# 1. Create conflicting routes
mkdir -p frontend/src/app/test/[id]
mkdir -p frontend/src/app/test/[recordId]
touch frontend/src/app/test/[id]/page.tsx
touch frontend/src/app/test/[recordId]/page.tsx

# 2. Stage and commit
git add frontend/src/app/test
git commit -m "test route conflict"

# Expected: Pre-commit hook should block with route conflict error
```

---

## 🔓 Bypass Mechanisms

### Emergency Bypass (Use Sparingly)

```bash
# Skip pre-commit hooks
git commit --no-verify -m "Emergency fix"

# Skip pre-push hooks
git push --no-verify
```

**⚠️ WARNING:** CI will still run these checks. Bypassing hooks only delays error detection.

**When to use:**
- Emergency hotfix needed immediately
- Hook has false positive (report bug afterwards)
- Working on experimental branch

**When NOT to use:**
- "I don't want to fix the errors" ← NOT VALID
- "Tests are failing but it's fine" ← NOT VALID
- Routine development ← NOT VALID

---

## 📈 Metrics to Track

### Hook Performance

```bash
# Add timing to hooks
START_TIME=$(date +%s)
# ... hook logic ...
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "⏱️  Completed in ${DURATION}s"
```

### Hook Bypass Rate

Track how often `--no-verify` is used:

```bash
# In post-commit hook
if git log -1 --pretty=%B | grep -q "skip-hooks"; then
  echo "⚠️  Hook bypassed" >> .git/hook-bypass.log
fi
```

**Goal:** <5% bypass rate. If higher, hooks may be too strict or slow.

---

## 🎓 Best Practices Summary

### DO

✅ Keep pre-commit hooks FAST (<10s total)
✅ Put slow checks in pre-push
✅ Provide clear error messages with fix instructions
✅ Test hooks before deploying to team
✅ Document all hooks in this file
✅ Allow bypass for emergencies

### DON'T

❌ Run full test suite in pre-commit (too slow)
❌ Make hooks so strict they encourage bypassing
❌ Check things that will fail in CI anyway (redundant)
❌ Use hooks for subjective code style (use automated formatters)
❌ Block commits with warnings (only hard errors)

---

## 📚 Resources

- **Husky Docs:** https://typicode.github.io/husky/
- **lint-staged Docs:** https://github.com/lint-staged/lint-staged
- **Git Hooks Docs:** https://git-scm.com/docs/githooks
- **Project Hook Files:**
  - `.husky/pre-commit` - Pre-commit validation
  - `.husky/pre-push` - Pre-push validation
  - `.husky/pre-commit-docs` - Documentation validation
  - `.lintstagedrc.js` - Lint-staged configuration

---

## 🔄 Maintenance

### When to Update Hooks

- **New critical error pattern emerges** → Add to dangerous patterns
- **Hook becomes too slow** → Move to pre-push or optimize
- **False positives reported** → Refine check logic
- **Team feedback** → Adjust strictness

### Review Schedule

- **Monthly:** Check hook performance metrics
- **Quarterly:** Review bypass rate and adjust strictness
- **After incidents:** Add checks to prevent recurrence (like route conflicts)

**Last Updated:** 2026-01-10
**Next Review:** 2026-02-10
