# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the Alleato-Procore project.

## Workflow Inventory

### Core CI/CD Workflows

#### 1. `test.yml` - Comprehensive Testing Pipeline ⭐ PRIMARY
**Status:** Active | **Triggers:** Push/PR to main/develop | **Node:** 18

The main testing workflow that enforces code quality and runs all tests.

**Jobs:**
1. **Code Quality** (BLOCKING) - TypeScript + ESLint checks
2. **Frontend Unit Tests** - Jest with coverage
3. **Backend Unit Tests** - Pytest (conditional)
4. **Playwright E2E Tests** - Full browser testing with Postgres service
5. **Build Test** - Production build verification
6. **Test Summary** - Aggregated results
7. **Coverage Report** - PR comment with coverage (PR only)

**Artifacts:**
- `code-quality-failures-*` (7 days)
- `frontend-unit-coverage` (7 days)
- `backend-coverage` (7 days)
- `playwright-failures-*` (7 days)
- `build-failures-*` (7 days)

**Dependencies:** TestDino integration for test reporting

---

#### 2. `code-quality.yml` - Standalone Quality Gate
**Status:** Active | **Triggers:** Push/PR to main/develop | **Node:** 20

Lightweight quality-only workflow (duplicates part of test.yml).

**Jobs:**
- TypeScript type check
- ESLint check
- Quality gate summary

⚠️ **RECOMMENDATION:** Consolidate with `test.yml` to avoid duplication.

---

#### 3. `ci.yml` - CI Gatekeeper
**Status:** Active | **Triggers:** Push to main, all PRs | **Node:** 20

Basic CI workflow running lint, typecheck, and build.

**Jobs:**
- Install dependencies
- Lint
- Type check
- Build

⚠️ **RECOMMENDATION:** This workflow is redundant with `test.yml` and `code-quality.yml`. Should be deprecated.

---

### Playwright Testing Workflows

#### 4. `playwright-tests.yml` - Legacy Playwright Tests
**Status:** Legacy | **Triggers:** Push/PR to main/develop, manual | **Node:** 18

Older Playwright test workflow with manual test categories.

**Issues:**
- Starts dev server (`npm run dev`) instead of using test environment
- Uses `continue-on-error: true` (tests can fail silently)
- Has hardcoded test paths that may not exist
- Includes incomplete visual regression job
- Missing proper cache-dependency-path

⚠️ **RECOMMENDATION:** Deprecate in favor of `test.yml` Playwright job.

---

#### 5. `playwright-full.yml` - Full Nightly Suite
**Status:** Active | **Triggers:** Push to main, nightly at 3am UTC | **Node:** 20

Runs complete Playwright test suite on schedule.

**Jobs:**
- Full E2E test suite with all browsers

**Issues:**
- Missing working directory specification
- No Supabase secrets configured
- Incomplete artifact upload

✅ **RECOMMENDATION:** Keep for nightly runs but fix configuration issues.

---

#### 6. `playwright-smoke.yml` - Smoke Tests
**Status:** Unknown (file exists but not reviewed)

⚠️ Needs review to determine purpose and status.

---

### AI-Powered Automation Workflows

#### 7. `ci-failure-auto-fix.yml` - Claude Auto-Fix
**Status:** Active | **Triggers:** After CI workflow failure | **Uses:** Anthropic Claude

Automatically fixes CI failures using Claude Code.

**Features:**
- Downloads failure artifacts
- Uses Claude to analyze and fix errors
- Creates fix branch and commits
- Requires `ANTHROPIC_API_KEY` secret

**Branch naming:** `claude-auto-fix-ci-{branch}-{run-id}`

**Issues:**
- Incomplete implementation (truncated at line 131)
- Uses checkout@v5 (should be v4 for consistency)

---

#### 8. `codex-autofix.yml` - Codex Auto-Fix
**Status:** Active | **Triggers:** After Code Quality/CI failure | **Uses:** OpenAI Codex

Similar to Claude auto-fix but uses OpenAI Codex CLI.

**Branch naming:** `codex-autofix-{branch}-{run-id}`

**Issues:**
- Uses deprecated `@openai/codex` package (may not exist)
- Duplicate functionality with `ci-failure-auto-fix.yml`
- Creates PR back to original branch (can cause merge conflicts)

⚠️ **RECOMMENDATION:** Choose ONE auto-fix solution (Claude or Codex).

---

#### 9. `codex-pr-review.yml` - Codex PR Review
**Status:** Active | **Triggers:** PR opened/reopened/synchronized

Automated PR code reviews using OpenAI Codex.

**Issues:**
- References `openai/codex-action@v1` which may not be a real action
- Reads prompt from `.github/prompts/pr-review.txt` (may not exist)
- Environment variable `CODEX_OUTPUT` not set by action
- Will fail on every run due to invalid action

⚠️ **RECOMMENDATION:** Fix or deprecate. Action reference appears to be invalid.

---

#### 10. `codex-task-automation.yml` - Task Automation
**Status:** Unknown (file exists but not reviewed)

Manual workflow for generating tests, docs, migrations, etc.

---

### Additional Workflows

#### 11. `claude.yml` - Claude Integration
**Status:** Unknown (file exists but not reviewed)

---

#### 12. `issue-deduplication.yml` - Issue Management
**Status:** Unknown (file exists but not reviewed)

---

#### 13. `pr-review-filtered-authors.yml` - Filtered PR Review
**Status:** Unknown (file exists but not reviewed)

---

#### 14. `pr-review-filtered-paths.yml` - Path-Based PR Review
**Status:** Unknown (file exists but not reviewed)

---

#### 15. `issue-triage.yml` - Issue Triage
**Status:** Unknown (file exists but not reviewed)

---

#### 16. `accessibility-tests.yml` - Accessibility Testing
**Status:** Unknown (file exists but not reviewed)

---

#### 17. `performance-monitoring.yml` - Performance Monitoring
**Status:** Unknown (file exists but not reviewed)

---

#### 18. `preview-deploy.yml` - Preview Deployments
**Status:** Unknown (file exists but not reviewed)

---

#### 19. `test-failure-analysis.yml` - Test Failure Analysis
**Status:** Unknown (file exists but not reviewed)

---

#### 20. `auto-commit-docs.yml` - Documentation Auto-Commit
**Status:** Unknown (file exists but not reviewed)

---

#### 21. `backend-deploy.yml` - Backend Deployment
**Status:** Unknown (file exists but not reviewed)

---

#### 22. `progressive-test-levels.yml` - Progressive Testing
**Status:** Unknown (file exists but not reviewed)

---

#### 23. `pr-review-comprehensive.yml` - Comprehensive PR Review
**Status:** Unknown (file exists but not reviewed)

---

## Configuration

### Required GitHub Secrets

| Secret Name | Purpose | Required By |
|-------------|---------|-------------|
| `SUPABASE_URL` | Supabase project URL | E2E tests, builds |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | E2E tests, builds |
| `ANTHROPIC_API_KEY` | Claude API key | Claude auto-fix |
| `OPENAI_API_KEY` | OpenAI API key | Codex workflows |
| `GITHUB_TOKEN` | GitHub Actions token | Auto-provided |

**How to configure:**
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value

**Finding Supabase values:**
1. Visit [supabase.com](https://supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy values:
   - Project URL → `SUPABASE_URL`
   - Project API keys → `anon public` → `SUPABASE_ANON_KEY`

### Node.js Versions

**Inconsistency Alert:** Different workflows use different Node versions:
- Node 18: `test.yml`, `playwright-tests.yml`
- Node 20: `code-quality.yml`, `ci.yml`, `playwright-full.yml`, `codex-autofix.yml`

✅ **RECOMMENDATION:** Standardize on Node 20 across all workflows.

---

## Local Testing

Before pushing, run the same quality checks locally:

```bash
# Run all quality checks (matches CI)
cd frontend
npm run quality

# Individual checks
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm run lint:fix   # Auto-fix ESLint errors

# Run tests
npm run test:unit:ci      # Unit tests
npx playwright test        # E2E tests
npm run build              # Build test
```

---

## Workflow Triggers Summary

| Workflow | Push (main) | Push (develop) | PR | Manual | Schedule | Other |
|----------|-------------|----------------|-----|--------|----------|-------|
| test.yml | ✅ | ✅ | ✅ | ❌ | ❌ | - |
| code-quality.yml | ✅ | ✅ | ✅ | ❌ | ❌ | - |
| ci.yml | ✅ | ❌ | ✅ | ❌ | ❌ | - |
| playwright-tests.yml | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| playwright-full.yml | ✅ | ❌ | ❌ | ❌ | ✅ nightly | - |
| ci-failure-auto-fix.yml | ❌ | ❌ | ❌ | ❌ | ❌ | workflow_run |
| codex-autofix.yml | ❌ | ❌ | ❌ | ❌ | ❌ | workflow_run |
| codex-pr-review.yml | ❌ | ❌ | ✅ | ❌ | ❌ | - |

---

## Artifacts

### Retention Policies

| Artifact Type | Retention | Workflows |
|--------------|-----------|-----------|
| Code Quality Failures | 7 days | test.yml |
| Frontend Coverage | 7 days | test.yml |
| Backend Coverage | 7 days | test.yml |
| Playwright Failures | 7 days | test.yml, playwright-tests.yml |
| Build Failures | 7 days | test.yml |
| Screenshots | 30 days | playwright-tests.yml |

---

## Debugging Failed Workflows

### 1. Check the Test Summary

Every workflow run creates a summary showing which jobs passed/failed:
- Go to Actions → Select the workflow run
- See the summary at the top of the run page

### 2. View Job Logs

Click on any failed job to see detailed logs:
- Red jobs indicate failures
- Expand steps to see command output
- Error messages are highlighted

### 3. Download Artifacts

For E2E test failures:
1. Scroll to bottom of workflow run
2. Download failure artifacts (e.g., `playwright-failures-*`)
3. Unzip and open `index.html` in a browser
4. View screenshots, traces, and video recordings

### 4. Reproduce Locally

```bash
# Run the same commands CI runs
cd frontend
npm ci
npm run quality
npx playwright test

# For specific tests
npx playwright test --debug  # Opens browser debugger
```

---

## Best Practices

1. **Always check CI before merging**
   - Wait for all checks to pass
   - Review any new warnings
   - Check test coverage changes

2. **Fix quality issues immediately**
   - TypeScript errors block commits (pre-commit hook)
   - ESLint errors block commits (pre-commit hook)
   - Never use `@ts-ignore` or `any` types
   - Never use `console.log` (use `console.warn` or `console.error`)

3. **Keep tests fast**
   - Use test parallelization
   - Mock external services
   - Clean up test data

4. **Monitor artifact usage**
   - Artifacts count toward storage quota
   - Old artifacts auto-delete after retention period
   - Download important reports before they expire

---

## Troubleshooting

### Tests pass locally but fail in CI

**Common causes:**
- Different Node.js versions (check `NODE_VERSION` in workflow)
- Missing environment variables (check secrets)
- Timing issues in E2E tests (increase timeouts)
- Database state differences (use test fixtures)
- Cache issues (try clearing workflow cache)

**Solutions:**
```bash
# Match CI environment locally
nvm use 20  # Use same Node version as CI
CI=true npm test  # Run with CI environment variable
npm ci  # Use clean install like CI
```

### Secrets not working

**Verify secrets are set:**
1. Go to repository Settings → Secrets and variables → Actions
2. Check that required secrets exist
3. Update secrets if they've changed
4. Re-run failed workflows

**Note:** Secret values are never displayed in logs for security.

### Build fails but works locally

**Check for:**
- Uncommitted files required for build
- Environment-specific code
- Missing dependencies in `package.json`
- Different build configurations
- Cache contamination

```bash
# Test production build locally
npm run build

# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

### Workflow not triggering

**Check:**
- Branch name matches trigger patterns
- File paths match path filters (if any)
- Workflow is enabled in Actions tab
- No syntax errors in YAML
- Required secrets are configured

---

## Workflow Maintenance

### Updating Node.js Version

To standardize on Node 20:

1. Edit each workflow file
2. Change `node-version:` to `'20'`
3. Update `NODE_VERSION` environment variable if present
4. Test locally with Node 20 first

### Adding New Test Jobs

1. Add job to `test.yml`
2. Add dependency in `test-summary` needs array
3. Update summary script to check new job result
4. Update this README with job description

### Modifying E2E Tests

When E2E tests change:
- Update timeout if tests take longer
- Adjust Postgres configuration if needed
- Increase retention if screenshots are important
- Update TestDino configuration if using different reporters

---

## Critical Issues & Recommendations

### 🔴 Critical Issues

1. **Workflow Duplication**
   - `test.yml`, `code-quality.yml`, and `ci.yml` all run similar checks
   - Wastes CI minutes and complicates maintenance
   - **Fix:** Consolidate into single primary workflow

2. **Invalid Codex Action**
   - `codex-pr-review.yml` references non-existent action
   - Will fail on every execution
   - **Fix:** Remove or replace with valid implementation

3. **Node Version Inconsistency**
   - Mix of Node 18 and Node 20 across workflows
   - Can cause inconsistent behavior
   - **Fix:** Standardize on Node 20

### 🟡 Medium Priority Issues

4. **Duplicate Auto-Fix Solutions**
   - Both Claude and Codex auto-fix workflows exist
   - Different approaches, similar goals
   - **Fix:** Choose one, document the other as backup

5. **Playwright Test Quality Issues**
   - `playwright-tests.yml` uses `continue-on-error: true`
   - Tests failures don't fail the workflow
   - **Fix:** Use proper error handling or deprecate

6. **Missing Documentation**
   - Many workflows lack clear purpose documentation
   - 11 workflows have "Unknown" status
   - **Fix:** Document or remove unused workflows

### ⚪ Low Priority Issues

7. **Artifact Naming**
   - Some artifacts use `${{ github.run_id }}` suffix (good)
   - Others use fixed names (can conflict)
   - **Improvement:** Standardize artifact naming

8. **Working Directory Inconsistency**
   - Some workflows specify `working-directory: ./frontend`
   - Others use `run: cd frontend && ...`
   - **Improvement:** Standardize approach

---

## Recommended Workflow Architecture

### Proposed Structure

```
Core Workflows (Required):
├── test.yml (PRIMARY)
│   ├── Code Quality (typecheck + lint) - BLOCKING
│   ├── Unit Tests (frontend + backend)
│   ├── E2E Tests (Playwright)
│   ├── Build Test
│   └── Test Summary
│
├── playwright-nightly.yml (rename from playwright-full.yml)
│   └── Full E2E suite on schedule
│
├── auto-fix.yml (choose Claude OR Codex, not both)
│   └── Automatic CI failure fixes
│
└── deploy.yml (if deployment is automated)
    ├── Preview deployments (PRs)
    └── Production deployments (main)

Optional Workflows:
├── pr-review.yml (if keeping AI reviews)
├── accessibility.yml (if a11y testing is implemented)
├── performance.yml (if perf monitoring is active)
└── issue-management.yml (if using issue automation)

To Remove/Consolidate:
├── ci.yml (redundant with test.yml)
├── code-quality.yml (redundant with test.yml)
├── playwright-tests.yml (legacy, redundant)
└── codex-*.yml (if choosing Claude for automation)
```

---

## AI-Powered Automation

For detailed information about OpenAI Codex integration workflows, see:
**[CODEX_WORKFLOWS.md](./CODEX_WORKFLOWS.md)**

Includes:
- Codex PR Review
- Codex Auto-Fix
- Task Automation
- Cost estimates
- Usage examples

---

## Support

For issues with:
- **Workflow configuration:** Check this README
- **Test failures:** Download artifacts and review logs
- **CLAUDE.md compliance:** Run `npm run quality` locally
- **Secrets:** Verify in repository settings
- **AI workflows:** See CODEX_WORKFLOWS.md

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Code quality requirements and execution gates
- [CODEX_WORKFLOWS.md](./CODEX_WORKFLOWS.md) - AI-powered automation workflows
- [Playwright Config](../../frontend/playwright.config.ts) - E2E test configuration
- [Package Scripts](../../frontend/package.json) - Available npm commands

---

**Last Updated:** 2026-01-05
**Reviewed By:** Claude Code
**Status:** 23 workflows inventoried, recommendations provided
