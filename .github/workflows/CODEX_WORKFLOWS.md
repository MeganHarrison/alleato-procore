# OpenAI Codex Workflows Documentation

This document describes the OpenAI Codex integration workflows for the Alleato-Procore project.

## Overview

We've integrated **OpenAI Codex** into our CI/CD pipeline to automate:
1. **Code Reviews** on pull requests
2. **Auto-fixing CI failures**
3. **Task automation** (test generation, documentation, refactoring, migrations)

## Prerequisites

### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```bash
OPENAI_API_KEY=sk-proj-...  # Your OpenAI API key
```

### Codex CLI Installation

The workflows automatically install the Codex CLI, but for local testing:

```bash
npm install -g @openai/codex
```

## Workflows

### 1. Codex PR Review (`codex-pr-review.yml`)

**Purpose:** Automatically reviews pull requests for code quality, security, and adherence to project standards.

**Triggers:**
- Pull request opened
- Pull request updated (synchronized)
- Pull request reopened

**What it checks:**
- ✅ TypeScript type errors
- ✅ ESLint violations
- ✅ Security vulnerabilities (SQL injection, XSS, auth issues)
- ✅ Schema and type safety
- ✅ Testing coverage
- ✅ Code conventions

**Output:**
- Posts a detailed review comment on the PR
- Fails the workflow if CRITICAL issues are found

**Example Review Output:**
```
🤖 Codex Code Review

🔴 CRITICAL - Code Quality
Location: src/app/api/route.ts:42
Issue: Using `any` type for database response
Recommendation: Replace `any` with proper type from database.types.ts

🟡 MEDIUM - Testing
Location: src/components/NewFeature.tsx
Issue: No Playwright tests found for new UI component
Recommendation: Add E2E tests in frontend/tests/e2e/

✅ Security: No issues found
✅ Schema Safety: All types validated
```

---

### 2. Codex Auto-Fix (`codex-autofix.yml`)

**Purpose:** Automatically fixes CI failures (TypeScript errors, ESLint violations, build errors).

**Triggers:**
- After "Code Quality Gate" workflow completes with failure
- After "CI Gatekeeper" workflow completes with failure

**What it does:**
1. Detects CI failure on a PR
2. Analyzes error logs
3. Generates fixes using Codex CLI
4. Validates fixes (runs typecheck, lint, build)
5. Creates a new PR with fixes
6. Comments on the original PR

**Branch naming:** `codex-autofix-{original-branch}-{run-id}`

**Output:**
- Creates a PR titled: `🤖 Auto-fix CI failures from #{original-pr-number}`
- Comments on original PR with link to fix PR
- If auto-fix fails, comments that manual intervention is needed

**Safety features:**
- Only runs on PR branches (not on main)
- Won't run on branches already created by Codex
- Full quality validation before creating PR
- All fixes are reviewed before merging

---

### 3. Codex Task Automation (`codex-task-automation.yml`)

**Purpose:** Automates common development tasks.

**Trigger:** Manual (workflow_dispatch)

**Available Tasks:**

#### a) Generate Supabase Types
```yaml
Task Type: generate-supabase-types
Description: Regenerates TypeScript types from Supabase schema
Output: frontend/src/types/database.types.ts
```

**Example:**
1. Go to Actions → Codex Task Automation → Run workflow
2. Select "generate-supabase-types"
3. Click "Run workflow"
4. A PR will be created with updated types

#### b) Generate Component Tests
```yaml
Task Type: generate-component-tests
Target Path: src/components/MyComponent.tsx
Description: Creates comprehensive Playwright E2E tests for the component
Output: frontend/tests/e2e/my-component.spec.ts
```

**Example:**
1. Run workflow with task type "generate-component-tests"
2. Set target path: `src/components/Budget/BudgetTable.tsx`
3. Add description: "Test budget table interactions and calculations"
4. A PR will be created with generated tests

#### c) Update Documentation
```yaml
Task Type: update-documentation
Target Path: PLANS_DOC.md
Description: Update documentation after implementing new feature
Output: Updated documentation files
```

#### d) Refactor Code
```yaml
Task Type: refactor-code
Target Path: src/services/budget.ts
Description: Extract shared logic into reusable utilities
Output: Refactored code following project patterns
```

#### e) Create Migration
```yaml
Task Type: create-migration
Description: add_directory_user_roles_table
Output: supabase/migrations/YYYYMMDD_add_directory_user_roles_table.sql
       + Updated database.types.ts
```

**All tasks:**
- ✅ Run quality checks (typecheck, lint, build)
- ✅ Create a PR for review
- ✅ Include verification status in commit message
- ✅ Fail gracefully with issue creation if problems occur

---

## Prompt Files

All workflows use prompt files in [.github/prompts/](.github/prompts/):

### [`pr-review.txt`](../prompts/pr-review.txt)
- Defines code review criteria
- Includes project context (tech stack, conventions)
- Specifies review format and severity levels

### [`autofix.txt`](../prompts/autofix.txt)
- Instructions for fixing CI failures
- Validation requirements
- Forbidden actions (e.g., using `any`, `@ts-ignore`)

### [`task-automation.txt`](../prompts/task-automation.txt)
- General task automation guidelines
- Project-specific patterns
- Quality requirements for generated code

---

## Workflow Integration with Existing CI/CD

### Existing Workflows
1. **CI Gatekeeper** (`ci.yml`) - Runs lint, typecheck, build
2. **Code Quality Gate** (`code-quality.yml`) - Frontend quality checks
3. **Claude Auto-Fix** (`ci-failure-auto-fix.yml`) - Claude-based auto-fix

### Codex Integration
- **Codex PR Review** runs in parallel with CI (independent)
- **Codex Auto-Fix** runs AFTER CI failures (sequential)
- Both Claude and Codex auto-fix can run, providing redundancy

```
PR Created
    ├─> CI Gatekeeper (runs immediately)
    ├─> Code Quality Gate (runs immediately)
    └─> Codex PR Review (runs immediately)
         └─> Posts review comment

CI/Quality Fails
    ├─> Claude Auto-Fix (runs after failure)
    └─> Codex Auto-Fix (runs after failure)
         └─> Creates fix PR
```

---

## Usage Examples

### Example 1: Developer Creates a PR

```bash
# Developer creates PR
gh pr create --title "Add budget export feature"

# Automatically triggers:
# 1. CI Gatekeeper
# 2. Code Quality Gate
# 3. Codex PR Review ← Posts review within minutes
```

**Codex Review Result:**
```
🤖 Codex Code Review

🟡 MEDIUM - Testing
Location: src/app/[projectId]/budget/export/page.tsx
Issue: No E2E tests found for export functionality
Recommendation: Add tests in frontend/tests/e2e/budget-export.spec.ts

✅ Code Quality: All checks passed
✅ Security: No vulnerabilities detected
```

### Example 2: CI Fails, Codex Auto-Fixes

```bash
# CI fails due to type error
# Codex Auto-Fix automatically:
# 1. Analyzes error logs
# 2. Fixes type errors
# 3. Validates fixes
# 4. Creates PR: "🤖 Auto-fix CI failures from #123"
# 5. Comments on original PR

# Developer reviews and merges fix PR
gh pr merge 124
```

### Example 3: Generate Tests for New Component

```bash
# Developer builds new component but needs tests
# Go to: Actions → Codex Task Automation

# Fill in:
# - Task Type: generate-component-tests
# - Target Path: src/components/contracts/ContractForm.tsx
# - Description: "Test form validation, submission, and error handling"

# Result:
# - PR created with complete E2E tests
# - Tests follow project patterns
# - All quality checks pass
```

### Example 4: Database Migration

```bash
# Need to add a new table
# Go to: Actions → Codex Task Automation

# Fill in:
# - Task Type: create-migration
# - Description: "add_user_preferences_table"

# Result:
# - Migration file created in supabase/migrations/
# - database.types.ts regenerated
# - PR created for review
```

---

## Best Practices

### 1. Review All Auto-Generated Code
- Never merge auto-generated PRs without review
- Check for correctness and adherence to requirements
- Verify tests actually test the right behavior

### 2. Iterate on Prompts
- If Codex generates suboptimal code, improve the prompt files
- Add more context about your codebase patterns
- Include examples of good vs. bad code

### 3. Monitor Costs
- Codex CLI uses OpenAI API credits
- Set usage limits in your OpenAI dashboard
- Monitor workflow execution frequency

### 4. Use for Repetitive Tasks
- Codex excels at:
  - Generating boilerplate code
  - Writing tests
  - Fixing lint/type errors
  - Creating migrations
- Less effective for:
  - Complex business logic
  - Novel architectural decisions

### 5. Combine with Human Expertise
- Use Codex as a productivity multiplier
- Always apply human judgment to auto-generated code
- Treat Codex as a junior developer that needs oversight

---

## Troubleshooting

### Workflow Not Triggering

**Issue:** Codex PR Review doesn't run on my PR

**Solutions:**
- Check that PR modifies files matching the path filters (`.ts`, `.tsx`, `.js`, `.jsx`, `.sql`)
- Verify `OPENAI_API_KEY` secret is set
- Check workflow permissions in repo settings

### Auto-Fix Creates Broken Code

**Issue:** Codex Auto-Fix PR fails quality checks

**Solutions:**
- This shouldn't happen (validation runs before creating PR)
- If it does, the workflow will create an issue instead of a PR
- Check error logs and improve the autofix prompt

### Task Automation Fails

**Issue:** Manual task workflow completes but creates issue instead of PR

**Solutions:**
- Check Codex CLI output in workflow logs
- Verify prompt is clear and specific
- Ensure target path exists and is correct
- Run task locally with Codex CLI first

### API Rate Limits

**Issue:** "Rate limit exceeded" errors

**Solutions:**
- Check OpenAI usage dashboard
- Reduce workflow frequency (e.g., only run on certain paths)
- Upgrade OpenAI plan if needed

---

## Local Testing

### Test Codex CLI Locally

```bash
# Install Codex CLI
npm install -g @openai/codex

# Set API key
export OPENAI_API_KEY=sk-proj-...

# Run a task
cd frontend
codex exec \
  --prompt-file ../.github/prompts/task-automation.txt \
  --workspace ./ \
  --full-auto

# Or interactive mode
codex chat
```

### Validate Prompt Files

```bash
# Check prompt syntax
cat .github/prompts/pr-review.txt

# Test with a sample diff
git diff main...my-feature-branch > /tmp/test_diff.txt
# Manually send to Codex with the prompt
```

---

## Security Considerations

### API Key Protection
- ✅ Store `OPENAI_API_KEY` as GitHub secret (encrypted)
- ❌ Never commit API keys to repository
- ✅ Limit secret access to specific workflows

### Code Execution Safety
- Codex runs in isolated GitHub Actions runner
- Limited permissions (defined in workflow YAML)
- Cannot access secrets directly (only via environment variables)

### Review Generated Code
- Always review auto-generated PRs before merging
- Check for:
  - Accidental exposure of sensitive data
  - Injection vulnerabilities
  - Logic errors

---

## Maintenance

### Updating Prompts

When you change project conventions or standards:

1. Update relevant prompt file in `.github/prompts/`
2. Test locally if possible
3. Commit changes
4. Next workflow run will use updated prompt

### Updating Workflows

1. Modify workflow YAML in `.github/workflows/`
2. Test on a branch first
3. Merge to main after verification

### Monitoring

Check workflow runs regularly:
- Go to Actions tab
- Review failed runs
- Adjust prompts or workflows as needed

---

## Cost Estimation

**Approximate API costs** (as of 2024, OpenAI pricing):

| Workflow | Avg Tokens | Cost per Run | Frequency |
|----------|-----------|--------------|-----------|
| PR Review | 5,000 | $0.01 - $0.05 | Per PR |
| Auto-Fix | 10,000 | $0.02 - $0.10 | Per CI failure |
| Task Automation | 8,000 | $0.02 - $0.08 | Manual |

**Monthly estimate** (for a team of 5 creating 50 PRs/month):
- PR Reviews: ~$2.50/month
- Auto-Fixes: ~$1.00/month (assuming 20% PR failure rate)
- Tasks: ~$0.50/month (assuming 10 manual tasks)
- **Total: ~$4/month**

---

## Future Enhancements

Potential additions:

1. **Performance Analysis** - Codex analyzes bundle size and performance
2. **Security Scanning** - Deep security audit on every PR
3. **Documentation Generation** - Auto-generate API docs from code
4. **Dependency Updates** - Auto-upgrade dependencies with safety checks
5. **Code Metrics** - Track complexity, coverage, and technical debt

---

## Support

For issues or questions:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Test prompts locally
4. Create an issue in the repository
5. Contact the team for help

---

## References

- [OpenAI Codex Documentation](https://github.com/openai/codex-action)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Alleato-Procore CLAUDE.md](../../CLAUDE.md)
- [Project Plans](../../documentation/plans/)

---

**Last Updated:** 2026-01-04
**Version:** 1.0.0
