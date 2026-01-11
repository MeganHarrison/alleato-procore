# Claude Code Project Instructions

## PROJECT CONTEXT

**Alleato-Procore** is a production-grade construction project management system.

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 15 (App Router), Tailwind, ShadCN UI, Supabase, OpenAI ChatKit |
| Backend | Supabase (Postgres, RLS, Auth, Storage) |
| AI System | OpenAI Agents SDK, Codex MCP |
| Testing | Playwright (browser-verified) |

This is a **real production system**. Accuracy, verification, and correctness are mandatory.

---

## 🚨 CRITICAL: Next.js Dynamic Route Naming (READ THIS FIRST)

**BEFORE creating or modifying ANY dynamic routes (`[param]` folders), you MUST:**

1. **Read:** `.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md` (MANDATORY)
2. **Check existing routes:** `find frontend/src/app -type d -name "[*]" | grep <resource>`
3. **Use consistent naming:** Same parameter name everywhere for each resource
4. **Verify immediately:** Start dev server after creating route

**❌ FATAL ERROR (Application-Breaking):**
```
[Error: You cannot use different slug names for the same dynamic path ('id' !== 'projectId').]
```

**This error has occurred THREE TIMES. It MUST NOT happen again.**

**Example Violations:**
- ❌ `api/projects/[id]` + `[projectId]/home` → **ERROR**
- ❌ `admin/tables/[table]/[id]` + `[table]/[recordId]` → **ERROR**

**Correct Pattern:**
- ✅ `api/projects/[projectId]` + `[projectId]/home` → **WORKS**

**Full documentation:** `.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md`

---

## 📁 CRITICAL: FILE LOCATION RULES (NO EXCEPTIONS)

**ALL project documentation MUST go in `documentation/`, NOT in `.claude/`.**

| File Type | Correct Location | BANNED Location |
|-----------|------------------|-----------------|
| Feature docs | `documentation/1-project-mgmt/in-progress/{feature}/` | `.claude/*.md` |
| Verification reports | `{feature-folder}/VERIFICATION-*.md` | `.claude/VERIFICATION-*.md` |
| Completion reports | `{feature-folder}/COMPLETION-REPORT.md` | `.claude/COMPLETION-*.md` |
| Session summaries | `{feature-folder}/SESSION-*.md` | `.claude/SESSION-*.md` |
| Test results | `{feature-folder}/TEST-RESULTS.md` | `.claude/TEST-*.md` |
| Status updates | `{feature-folder}/STATUS.md` | `.claude/*-STATUS.md` |
| Plans & specs | `documentation/docs/` or `{feature-folder}/` | `.claude/` root |

**The `.claude/` folder is ONLY for Claude Code tooling:**
- `commands/` - Slash commands
- `plugins/` - Claude Code plugins
- `settings.local.json` - Local settings
- `plans/` - Plan mode working files (temporary)

**Project management files go in `documentation/1-project-mgmt/`:**
- `shared/logs/task-log.md` - Session log
- `shared/research/` - Cross-feature research
- `shared/current-task.md` - Active task tracking
- `in-progress/{feature}/` - All feature-specific files (including workflow signals)

**VIOLATION:** Creating any project/documentation file in `.claude/`.

---

## 🔒 CORE PRINCIPLES

Claude is an **execution-verified engineer**, not a speculative assistant.

### 1. NO STOPPING UNTIL COMPLETE

**CRITICAL:** When given a task, Claude MUST continue working until the task is FULLY complete. Do not stop to:
- Document progress (do this alongside work, not instead of work)
- Report findings (fix them immediately instead)
- Ask for permission to continue (just continue)
- Write status reports (complete the work first)

**Exception:** Stop only if:
- Blocked by missing access/credentials
- Ambiguous requirements need clarification
- User explicitly says to stop

### 2. VERIFIED EXECUTION

| Principle | Meaning |
|-----------|---------|
| No evidence → no reasoning | Don't speculate. Get data first. |
| No verification → no completion | Tasks require proof, not claims. |
| No fresh context → no trust | Complex tasks need independent verification. |
| No documentation → no work | Fix issues instead of documenting them. |

---

## ✅ TASK COMPLETION DEFINITION (SINGLE SOURCE OF TRUTH)

A task is **COMPLETE** only when ALL apply:

- [ ] Code changes implemented
- [ ] `npm run quality --prefix frontend` passes (zero errors)
- [ ] Tests written (if applicable)
- [ ] Tests EXECUTED and PASSING (show output)
- [ ] Browser/runtime verification performed (if UI-related)
- [ ] Verification evidence logged to `.claude/task-log.md`
- [ ] For complex tasks: Independent verifier sub-agent confirms

**Claiming completion without this evidence = violation.**

---

## 🤖 SUB-AGENT STRATEGY

### When to Spawn Sub-Agents

| Condition | Action |
|-----------|--------|
| **ANY Playwright/browser testing** | **MANDATORY: Spawn test-automator** |
| Task has 3+ distinct steps | Spawn worker + verifier |
| Modifying 5+ files | Spawn worker + verifier |
| Context getting long/degraded | Checkpoint to files, spawn fresh agent |
| Different expertise needed | Spawn specialized sub-agent |

**📚 Complete Sub-Agent Catalog:** See `.agents/SUBAGENTS-INDEX.md` for a comprehensive table of all 68+ available sub-agents (user-level + project-specific) with descriptions, use cases, and notes.

**⚠️ TESTING IS SPECIAL:** Never run Playwright directly. Always use `test-automator` sub-agent. See "MANDATORY: Testing Sub-Agent" section below.

### Sub-Agent Patterns

**Worker Agent (Implementation):**
```bash
claude -p "WORKER TASK: [specific implementation]
- Output to files only
- Do NOT run tests (verifier handles this)
- Signal completion: create .claude/worker-done-[task-id].md"
```

**Verifier Agent (Independent Check):**
```bash
claude -p "VERIFIER TASK [task-id]:
- Read requirements from .claude/tasks/[task-id].md
- Do NOT trust worker claims
- Run: npm run quality --prefix frontend
- Run: [specific test command]
- Verify each requirement independently
- Write result to documentation/1-project-mgmt/in-progress/[feature-name]/VERIFICATION-[task-name].md
- Status: VERIFIED or FAILED with specific evidence"
```

### Task Tracking Files

```
.claude/
├── current-task.md          # Active task for this session
├── task-log.md              # Append-only completion log
├── tasks/[id].md            # Task definitions
├── sessions/[id].md         # Session tracking
├── worker-done-[id].md      # Worker completion signals
└── templates/               # Task, worker, verifier templates
    ├── task.md
    ├── worker-done.md
    └── verified.md

documentation/*project-mgmt/
└── in-progress/[feature-name]/
    └── VERIFICATION-[name].md   # Verification reports (documentation)
```

### 🚨 MANDATORY: Testing Sub-Agent (NO EXCEPTIONS)

**CRITICAL RULE:** The main Claude agent MUST NOT run any tests directly. ALL testing MUST be delegated to the `test-automator` sub-agent.

**Single Testing Agent:** `test-automator` (handles ALL test types)

**Why This Rule Exists:**
- Main agent context gets polluted with test debugging
- Main agent wastes 20x time fumbling with test issues
- Main agent asks "Should I..." instead of fixing problems
- Test-automator agent has fresh context and testing expertise

---

**Usage Patterns:**

**For Playwright/Browser Tests (Project-Specific):**
```typescript
Task({
  subagent_type: "test-automator",
  prompt: `Follow .agents/agents/playwright-tester.md for Alleato-Procore e2e tests.

CRITICAL INITIALIZATION:
1. Load Playwright docs via context-7 MCP
2. Read .agents/docs/playwright/PLAYWRIGHT-PATTERNS.md
3. Read frontend/tests/auth.setup.ts for Supabase auth
4. Use test credentials: test1@mail.com / test12026!!!

YOUR TASK:
[Your specific Playwright test request]

REQUIREMENTS:
- Use Supabase auth patterns (localStorage injection)
- Use role-based selectors
- Always waitForLoadState('networkidle')
- Include auth cookies in API requests
- Clean up test data
`
})
```

**For Unit/Integration Tests (Generic):**
```typescript
Task({
  subagent_type: "test-automator",
  prompt: `Create unit/integration tests for [feature].

[Your specific test request]
`
})
```

---

**Triggers (Use test-automator IMMEDIATELY):**
- ANY Playwright test execution
- ANY browser test debugging
- ANY "tests are failing" situation
- ANY test timeout issues
- ANY need to verify UI in browser

**BANNED BEHAVIOR:**
```
❌ Main agent runs: npx playwright test ...
❌ Main agent asks: "Should I debug why tests are failing?"
❌ Main agent says: "Browser tests are timing out, what should I do?"
❌ Main agent reports test failures without fixing them
```

**REQUIRED BEHAVIOR:**
```
✅ ALWAYS delegate to test-automator (ONE agent for all testing)
✅ Use the patterns above based on test type (Playwright vs generic)
✅ Test-automator agent will FIX issues, not report them
✅ Test-automator continues until PASS or genuine blocker
```

**Key Points:**
- **playwright-tester.md** = Prompt template (NOT a separate agent)
- **test-automator** = The actual sub-agent (handles all tests)
- For Playwright: Use test-automator WITH playwright-tester.md prompt
- For other tests: Use test-automator with generic prompt

**The test-automator agent MUST:**
1. Start dev server if not running
2. Run the specified tests
3. If tests fail → debug and fix (code or tests)
4. Re-run until passing
5. Only return when DONE or genuinely blocked

**The test-automator agent MUST NOT:**
- Ask "Should I..."
- Report failures without attempting fixes
- Give up on timeouts without debugging
- Return partial results

---

## 🔄 VERIFICATION WORKFLOW (Detailed)

### Overview

For complex tasks, use the **Worker → Verifier** pattern with the Task tool (not bash scripts).

```
Main Claude (orchestrator)
    ↓
Creates task file
    ↓
Task tool → Worker Agent (fresh context)
    ↓
Worker signals completion
    ↓
Main Claude reads completion
    ↓
Task tool → Verifier Agent (fresh context)
    ↓
Verifier writes verification report
    ↓
Main Claude logs result
```

### Step-by-Step Process

**Step 1: Main Agent Creates Task File**

```bash
# Generate task ID
TASK_ID=$(bash scripts/claude-helpers.sh new-task)

# Create task file from template
cat > .claude/tasks/$TASK_ID.md << 'EOF'
# Task: Implement user authentication

## Created
2024-01-10T14:30:00Z

## Description
Add email/password authentication with login/register flows

## Requirements
- [ ] User model with email/password fields
- [ ] Login endpoint with JWT generation
- [ ] Register endpoint with password hashing
- [ ] Protected route middleware
- [ ] Frontend login/register forms

## Test Command
```bash
npm test -- --grep "auth"
```

## Verification Steps
1. Run quality check (no TypeScript/lint errors)
2. Run auth tests (all passing)
3. Verify login flow in browser
4. Verify protected routes work

## Success Criteria
- [ ] All requirements implemented
- [ ] Tests pass
- [ ] Quality check passes
- [ ] Browser verification complete

**Step 2: Main Agent Spawns Worker via Task Tool**

```typescript
// Main Claude uses Task tool (NOT bash script)
Task({
  subagent_type: "backend-architect",
  prompt: `WORKER AGENT MODE
  ```

Task File: .claude/tasks/${TASK_ID}.md

# Task: Implement user authentication

## Requirements
- [ ] User model with email/password fields
- [ ] Login endpoint with JWT generation
- [ ] Register endpoint with password hashing
- [ ] Protected route middleware
- [ ] Frontend login/register forms

YOUR JOB (Implementation Only):
1. Implement ONLY what's specified above
2. Do NOT run tests (verifier will do this)
3. Do NOT run quality checks (verifier will do this)
4. Do NOT claim completion

When done, create .claude/worker-done-${TASK_ID}.md with:
- Files modified: [list all files]
- Changes made: [brief summary]
- Ready for verification: YES
- Notes for verifier: [any important context]

BEGIN IMPLEMENTATION.`,
  description: "Implement user authentication"
})
```

**Step 3: Main Agent Monitors for Completion**

```bash
# Main Claude checks for worker completion signal
if [ -f .claude/worker-done-${TASK_ID}.md ]; then
  echo "Worker completed. Proceeding to verification..."
fi
```

**Step 4: Main Agent Spawns Verifier (CRITICAL - Fresh Context)**

```typescript
// Read worker completion
const workerReport = await readFile(`.claude/worker-done-${TASK_ID}.md`)

// Spawn INDEPENDENT verifier with Task tool
Task({
  subagent_type: "debugger",
  prompt: `VERIFIER AGENT MODE

⚠️ CRITICAL: You are an INDEPENDENT VERIFIER.
Do NOT trust the worker's claims. Verify everything.

SKEPTICAL VERIFIER MINDSET:
- Assume worker LIED about "it works"
- Assume tests were NOT run
- Assume requirements NOT fully met
Your job: PROVE these assumptions wrong or confirm them.

Task File: .claude/tasks/${TASK_ID}.md

## Original Requirements
- [ ] User model with email/password fields
- [ ] Login endpoint with JWT generation
- [ ] Register endpoint with password hashing
- [ ] Protected route middleware
- [ ] Frontend login/register forms

## Test Command
\`\`\`bash
npm test -- --grep "auth"
\`\`\`

Worker Claims:
${workerReport}

YOUR MISSION:
1. Read original requirements (above)
2. Run: npm run quality --prefix frontend
3. Run: npm test -- --grep "auth"
4. Verify EACH requirement independently
5. Test in browser (if applicable)
6. Create documentation/1-project-mgmt/in-progress/[feature-name]/VERIFICATION-[task-name].md using template

VERIFICATION CHECKLIST:
- [ ] Code exists and is syntactically correct
- [ ] Quality check passes (zero errors)
- [ ] Tests exist for all requirements
- [ ] Tests PASS when run (show actual output)
- [ ] Each requirement actually met (not just claimed)
- [ ] No obvious bugs or security issues
- [ ] Browser verification (if UI-related)

OUTPUT FORMAT (documentation/1-project-mgmt/in-progress/[feature-name]/VERIFICATION-[task-name].md):
\`\`\`markdown
# Verification Report: ${TASK_ID}

## Verifier Info
- Session: [your session ID]
- Timestamp: [current timestamp]

## Quality Check
\`\`\`
[Paste ACTUAL output from npm run quality]
\`\`\`
Status: PASS / FAIL

## Test Results
\`\`\`
[Paste ACTUAL output from npm test]
\`\`\`
Status: PASS / FAIL

## Requirements Check
- User model: MET ✓ / NOT MET ✗ [evidence: file X line Y]
- Login endpoint: MET ✓ / NOT MET ✗ [evidence: tested with curl]
- Register endpoint: MET ✓ / NOT MET ✗ [evidence: ...]
- Protected routes: MET ✓ / NOT MET ✗ [evidence: ...]
- Frontend forms: MET ✓ / NOT MET ✗ [evidence: Playwright test]

## Browser Verification (if applicable)
[Screenshots, Playwright output, or N/A]

## Final Status
VERIFIED ✓ / FAILED ✗

## Issues Found (if any)
[List specific issues or "None"]
\`\`\`

BE RUTHLESS. If ANY check fails, mark as FAILED.
If you cannot verify something, mark as FAILED.

BEGIN VERIFICATION.`,
  description: "Verify user authentication"
})
```

**Step 5: Main Agent Logs Result**

```bash
# Read verification report
VERIFICATION_FILE="documentation/1-project-mgmt/in-progress/[feature-name]/VERIFICATION-[task-name].md"
if grep -q "VERIFIED ✓" "$VERIFICATION_FILE"; then
  # Log success
  bash scripts/claude-helpers.sh log "$TASK_ID" "User authentication" "VERIFIED" "$VERIFICATION_FILE"
else
  # Log failure
  bash scripts/claude-helpers.sh log "$TASK_ID" "User authentication" "FAILED" "$VERIFICATION_FILE"
fi
```

### Skeptical Verifier Pattern (Default)

ALL verifier agents MUST use this mindset:

```
SKEPTICAL VERIFIER MODE

Assume the worker LIED about:
- "Tests pass" → Run them yourself
- "No errors" → Check yourself
- "Implemented correctly" → Verify yourself
- "Everything works" → Prove it yourself

Your job: PROVE these assumptions wrong or confirm them.

No trust. Only evidence.
If you cannot independently verify something → Mark as FAILED
```

### Anti-Gaming Measures

These are NOT acceptable as verification evidence:

| ❌ BANNED | ✅ REQUIRED |
|----------|------------|
| "Tests should pass" | Actual test output |
| "I verified the code" | Specific evidence (file:line) |
| "Implementation is complete" | Test results + quality check output |
| Screenshots of code | Actual execution results |
| "Everything looks good" | Checklist with evidence for each item |

### MANDATORY: Verification Failure Response

**CRITICAL RULE:** When verification finds ANY failures, the main agent MUST:

1. **Immediately Fix All Issues** - Do not report findings, fix them
2. **Re-run Verification** - Spawn verifier again after fixes
3. **Repeat Until Clean** - Continue fix → verify loop until PASS
4. **Only Then Complete** - Completion requires verification PASS status

**BANNED BEHAVIOR:**
- ❌ "Verification found 3 issues" → STOP and report
- ❌ "Known issue - low priority" → Leave unfixed
- ❌ "85% passing is acceptable" → If tests fail, fix them

**REQUIRED BEHAVIOR:**
- ✅ "Verification found 3 issues" → Fix all 3 → Re-verify → PASS
- ✅ "Test failing" → Debug → Fix → Confirm passing
- ✅ "TypeScript error" → Fix → Run quality check → Zero errors

**Exception:** Only stop to ask user if:
- Blocked by missing access/credentials
- Fundamental architectural decision required
- Unclear which fix approach to take

Otherwise: **FIX FIRST, REPORT AFTER.**

---

## 🚨 MANDATORY SUB-AGENT REQUIREMENTS

**CRITICAL:** These requirements are NOT optional. Skipping them = incomplete work.

The following sub-agents MUST be used for specific triggers. Failure to use them violates project standards.

---

### Requirement 1: supabase-architect (Database Work)

**MANDATORY for:**
- Creating/modifying RLS policies
- Creating database migrations
- Schema changes affecting 3+ tables
- Complex queries joining multiple tables
- ANY Supabase realtime setup
- ANY database feature implementation

**Pattern:**
```typescript
// Step 1: Generate fresh types (ALWAYS)
npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" \
  --schema public > frontend/src/types/database.types.ts

// Step 2: For complex work, spawn supabase-architect
Task({
  subagent_type: "supabase-architect",
  prompt: "Read frontend/src/types/database.types.ts. [Your database task]"
})
```

**Simple queries OK without sub-agent:** Single-table reads AFTER types generated and verified.

**Why:** Prevents schema guessing, ensures type safety, catches RLS issues early.

---

### Requirement 2: code-reviewer (After Implementation)

**MANDATORY after:**
- Implementing ANY feature
- Fixing ANY bug (non-trivial)
- Modifying 3+ files
- Adding/changing security-sensitive code
- Before claiming "complete"

**Pattern:**
```typescript
// After your implementation is done:
Task({
  subagent_type: "code-reviewer",
  prompt: "Review [files changed] for:
  - Code quality and SOLID principles
  - Security vulnerabilities (OWASP)
  - Consistency with existing patterns
  - Performance issues
  - Maintainability

  Files: [list all modified files]
  "
})

// THEN address ALL findings before claiming complete
```

**Exceptions:** Trivial changes (typos, single-line fixes, documentation-only).

**Why:** Catches security issues, pattern violations, maintainability problems BEFORE commit.

---

### Requirement 3: Explore (Before Assumptions)

**MANDATORY before:**
- Stating "I'll create a new component at [path]..."
- Saying "The authentication is handled by..."
- Claiming "This uses [library/pattern]..."
- ANY statement about codebase structure without evidence
- Starting implementation without verifying existing patterns

**Pattern:**
```typescript
// BEFORE making assumptions:
Task({
  subagent_type: "Explore",
  prompt: "Find [component/pattern/implementation]. Thoroughness: medium"
})

// THEN use findings to inform implementation
```

**BANNED Behavior:**
```
❌ "I'll create the auth component at src/components/auth/..."
❌ "Looking at the codebase, it seems to use..."
❌ "The pattern here is probably..."
```

**REQUIRED Behavior:**
```
✅ Run Explore agent → Find actual location → Use it
✅ Run Grep to verify pattern exists → Use exact pattern
✅ Read existing files → Follow established conventions
```

**Why:** Prevents wasted time fixing wrong assumptions, ensures consistency.

---

### Requirement 4: design-system-auditor (UI Changes)

**MANDATORY before committing:**
- ANY UI component changes
- ANY new UI components
- ANY styling changes (Tailwind, CSS)
- ANY layout modifications
- Before git commit with UI changes

**Pattern:**
```typescript
// Before committing UI changes:
Task({
  subagent_type: "code-reviewer",
  prompt: "Audit [UI files] using .agents/agents/design-system-auditor.md rules.

  Check for:
  - Inline styles (style={{...}})
  - Arbitrary Tailwind values
  - Non-semantic color usage
  - Missing design system components
  - Component consistency violations

  Files: [list UI files]
  BLOCK commit if violations found."
})

// Fix ALL violations before proceeding
```

**Why:** Enforces design consistency, prevents design debt accumulation.

---

### Requirement 5: test-automator (Feature Implementation)

**MANDATORY after:**
- Implementing ANY new feature
- Adding ANY new API endpoint
- Modifying existing business logic
- Adding UI components with user interaction
- Before claiming feature "complete"

**🚨 CRITICAL: Reference Screenshot Comparison**

For features with Procore reference screenshots in `scripts/screenshot-capture/procore-[feature]-crawl/`:
- **MUST** compare implementation against reference
- **MUST** create `COMPARISON-REPORT.md` with verdict
- **MUST** resolve or document blocking issues
- See `.agents/agents/playwright-tester.md` for full pattern

**Pattern:**
```typescript
// After feature implementation:
Task({
  subagent_type: "test-automator",
  prompt: "Create tests for [feature].

  For Playwright/UI tests:
  Follow .agents/agents/playwright-tester.md

  🚨 CRITICAL: Reference screenshots exist at:
  scripts/screenshot-capture/procore-[feature]-crawl/pages/

  MANDATORY STEPS:
  1. Implement e2e tests
  2. Take implementation screenshots
  3. Compare with reference screenshots
  4. Create COMPARISON-REPORT.md with:
     - Layout comparison checklist
     - Functional elements comparison
     - Design system differences (expected)
     - Blocking issues (must fix)
     - Final verdict (PASS/FAIL)

  Test coverage required:
  - Happy path
  - Error cases
  - Edge cases
  - User interactions
  - Reference screenshot comparison

  Show PASSING test output + comparison report."
})

// ONLY claim complete after:
// 1. Tests PASS
// 2. COMPARISON-REPORT.md created (if reference exists)
// 3. Blocking issues resolved
```

**Exceptions:** Trivial UI tweaks, documentation changes, features without reference screenshots.

**Why:** No untested features in production. Tests document behavior. Reference comparison ensures feature completeness.

---

## 📊 Mandatory Requirements Summary

| Trigger | Required Agent | When to Skip |
|---------|----------------|--------------|
| Database work (3+ tables, RLS, migrations) | `supabase-architect` | Single-table reads only |
| Code implementation (features, non-trivial fixes) | `code-reviewer` | Typos, docs, single-line fixes |
| Statements about codebase without evidence | `Explore` | Never - ALWAYS verify |
| UI changes | `design-system-auditor` (via code-reviewer) | Never - ALWAYS audit |
| Feature implementation | `test-automator` | Trivial UI tweaks, docs |

---

## ⚠️ Enforcement

**BEFORE (Common Anti-Pattern):**
1. Claude writes code
2. Claude claims "complete"
3. Bugs found later
4. User frustrated

**AFTER (Required Pattern):**
1. Claude explores codebase (Explore agent)
2. Claude implements code
3. Claude spawns code-reviewer
4. Claude fixes ALL findings
5. Claude creates tests (test-automator)
6. Claude verifies tests PASS
7. THEN claims complete

**Verification Questions Before Claiming Complete:**
- [ ] Did I use Explore to verify my assumptions?
- [ ] Did I spawn supabase-architect for DB work?
- [ ] Did I spawn code-reviewer after implementation?
- [ ] Did I audit UI changes with design-system-auditor?
- [ ] Did I create and run tests with test-automator?
- [ ] Did I compare reference screenshots (if they exist)?
- [ ] Did I create COMPARISON-REPORT.md with verdict?
- [ ] Did I resolve blocking issues from comparison?
- [ ] Do I have evidence (test output, review results, comparison report)?

**If any answer is "No" → Work is NOT complete.**

---

## 🚨 EXECUTION GATES (HARD BLOCKERS)

Execution gates are **mandatory prerequisites**. Claude MUST NOT reason, explain, or propose fixes until the gate is satisfied.

### Gate: BROWSER / UI / VISIBILITY

**Triggers:** UI visibility, rendering issues, "is X showing?", frontend behavior, transcripts

**Required:** Run Playwright first. See `.agents/PLAYWRIGHT_GATE.md`

```bash
# Example: Verify UI element exists
npx playwright test tests/e2e/[relevant-test].spec.ts
```

### Gate: DATABASE / SUPABASE (MANDATORY - NO EXCEPTIONS)

**Triggers:**
- Session starts
- ANY database work (queries, tables, columns, RLS, migrations)
- More than 1 hour since last type generation
- Before spawning ANY worker agent touching database
- Before ANY browser/API testing of database features

**🚨 MANDATORY SUB-AGENT:** For complex database work, you MUST spawn `supabase-architect`:

**When supabase-architect is MANDATORY:**
- Creating/modifying RLS policies
- Creating database migrations
- Schema changes affecting 3+ tables
- Complex queries joining multiple tables
- ANY Supabase realtime setup

**Simple queries (single table reads) can proceed with type generation alone.**

**supabase-architect capabilities:**
- Deep Alleato-Procore schema knowledge
- RLS policy expertise
- Migration best practices
- Type generation automation
- Full documentation: `.agents/agents/supabase-architect.md`

**REQUIRED STEPS (ALL MANDATORY):**

```bash
# Step 1: ALWAYS generate fresh types FIRST
npx supabase gen types typescript \
  --project-id "lgveqfnpkxvzbnnwuled" \
  --schema public > frontend/src/types/database.types.ts

# Step 2: Read the types for your table
# Use Read tool on frontend/src/types/database.types.ts

# Step 3: For complex work, spawn supabase-architect
Task({
  subagent_type: "supabase-architect",
  prompt: "Read frontend/src/types/database.types.ts. [Your database task]",
  description: "Database work with architect"
})

# Step 4: Document ACTUAL schema in .claude/current-schema.md
# Write down columns, types, constraints FROM THE TYPES FILE

# Step 5: Compare to migration files
# If mismatch found, STOP and ask user

# Step 6: Only then proceed
```

**Evidence Required:**
Create `.claude/supabase-gate-passed.md` with:
- Timestamp types were generated
- Table columns found in types
- Migration comparison result
- For complex work: supabase-architect spawn evidence
- PASSED ✅ or BLOCKED ❌

**If Types Don't Match Migration:**
- STOP IMMEDIATELY
- Document the mismatch
- Ask user which is correct
- Do NOT proceed until clarified

**See:** `.claude/MANDATORY-GATES.md` and `MANDATORY SUB-AGENT REQUIREMENTS` for full protocol

### Gate: CODEBASE ASSUMPTIONS (Explore Required)

**Triggers:** Making ANY statement about codebase structure without evidence

**BANNED without Explore:**
- ❌ "I'll create the auth component at src/components/auth/..."
- ❌ "Looking at the codebase, it seems to use..."
- ❌ "The project follows [pattern]..."
- ❌ "Based on common conventions..."
- ❌ "I'll add this to the existing [file that you haven't read]..."

**REQUIRED pattern:**
```typescript
// Before: "I'll create X at path/to/file.ts"
// MANDATORY: Verify assumptions

Task({
  subagent_type: "Explore",
  prompt: "Find existing [component type/pattern] in the codebase. Search for similar implementations. Report file locations and patterns used.",
  description: "Verify codebase patterns"
})

// After Explore results: "Based on Explore findings at [specific files], I'll follow [verified pattern]"
```

**Evidence Required:**
- Specific file paths from Explore agent
- Actual code examples (not assumptions)
- Verification that pattern doesn't already exist

**When to Skip:**
- User explicitly provided file path
- Following explicit instructions from CLAUDE.md
- Modifying file you just read with Read tool

**See:** `MANDATORY SUB-AGENT REQUIREMENTS` section for full protocol

### Gate: DOCUMENTATION

**Triggers:** Creating or moving documentation files

**Required:**
1. Run `/doc-check` slash command first
2. Read `documentation/DOCUMENTATION-STANDARDS.md`
3. Never place files in `/documentation` root (except meta-docs)
4. Validate: `node scripts/docs/validate-doc-structure.cjs`

| Doc Type | Location |
|----------|----------|
| Database schema | `documentation/docs/database/` |
| Completion reports | `documentation/docs/development/completion-reports/` |
| API docs | `documentation/docs/api/` or `documentation/docs/procore/[feature]/` |
| Plans | `documentation/docs/plans/[category]/` |

### Gate: TESTING (MANDATORY - ADDED 2026-01-10)

**Triggers:**
- Claiming a feature is "complete"
- Updating STATUS.md to say "complete" or "ready"
- Moving work to `complete/` directory
- Running verifier agent
- Creating completion reports

**HARD REQUIREMENT:** All features MUST have passing tests with evidence BEFORE claiming completion.

**REQUIRED STEPS (ALL MANDATORY):**

```bash
# Step 1: Write tests (if none exist)
# Location: frontend/tests/e2e/<feature>-*.spec.ts

# Step 2: Run tests with HTML reporter
cd frontend
npx playwright test tests/e2e/<feature>*.spec.ts --reporter=html

# Step 3: Verify results
# Expected: All critical tests passing (100% or documented exceptions)

# Step 4: Document evidence
# Create: documentation/1-project-mgmt/in-progress/<feature>/TEST-RESULTS.md
# Include: Pass/fail counts, HTML report path, screenshots

# Step 5: Update STATUS.md with test results
```

**Evidence Required:**
Create `TEST-RESULTS.md` with:
- Test execution date
- Pass/fail counts
- HTML report location
- Screenshot or terminal output
- Link from STATUS.md

**Banned Without Testing:**
- ❌ "Feature complete"
- ❌ "All working"
- ❌ "Ready for production"
- ❌ Moving verification reports to archive/
- ❌ Claiming 100% without running tests

**Before vs After:**
```
BEFORE (WRONG):
1. Write code
2. TypeScript compiles
3. "Complete!" ← VIOLATION
4. User finds it broken

AFTER (CORRECT):
1. Write code
2. Write/run tests
3. Fix failures
4. Document evidence
5. THEN claim complete
```

**See Full Protocol:** `documentation/1-project-mgmt/MANDATORY-TESTING-PROTOCOL.md`

**Historical Violation:** 2026-01-10 - Change Events claimed "complete" with 44% test failure rate. This gate prevents recurrence.

---

## 🚫 CODE QUALITY GATES (ZERO TOLERANCE)

### Mandatory Commands

```bash
# After EVERY code change:
npm run quality --prefix frontend

# Auto-fix when possible:
npm run quality:fix --prefix frontend
```

### Enforcement Chain

| Stage | Check | Consequence |
|-------|-------|-------------|
| Pre-commit | TypeScript + ESLint errors | Commit BLOCKED |
| Pre-push | Full project typecheck + lint | Push BLOCKED |
| CI/CD | Full checks on PR | Merge BLOCKED |

### Absolute Rules

| ❌ NEVER | ✅ INSTEAD |
|----------|-----------|
| `@ts-ignore` / `@ts-expect-error` | Fix the type error |
| `any` type | Use `unknown` or proper type |
| `console.log` | Use `console.warn` or `console.error` |
| Implicit null/undefined | Handle explicitly (see patterns below) |

### Null/Undefined Patterns

```typescript
// Convert null to undefined
const obj: Foo = { value: data.value || undefined }

// Filter nulls with type guard
const items: string[] = data
  .map(x => x.name)
  .filter((name): name is string => name !== null)

// Optional chaining + nullish coalescing
const value = data?.property ?? defaultValue
```

### Bypass (EMERGENCY ONLY)

```bash
git commit --no-verify  # CI will still fail
git push --no-verify    # CI will still fail
```

---

## ❌ BANNED BEHAVIORS

### Speculative Language (Before Gates Satisfied)

These words indicate speculation and are **violations**:
- "if", "might", "likely", "assuming", "it seems", "probably"

### Anti-Patterns

| ❌ Don't Say | ✅ Do Instead |
|-------------|---------------|
| "Tests should pass" | Run them, show output |
| "This should work" | Verify it, show evidence |
| "I've completed the task" | Provide verification report |
| "The implementation looks correct" | Run quality checks, show results |

### File/Folder Violations

- NEVER create: `_fixed`, `_final`, `_backup`, `_copy` variants
- Edit files **in place**
- If duplicates exist: identify canonical, consolidate, remove obsolete

---

## 🧪 TESTING REQUIREMENTS

### Test Locations

| Type | Location |
|------|----------|
| E2E tests | `frontend/tests/e2e/` |
| Visual regression | `frontend/tests/visual-regression/` |
| Screenshots/videos | `frontend/tests/screenshots/` |

### Testing Rules

- ALL features MUST be tested
- UI changes REQUIRE Playwright verification
- APIs REQUIRE real request testing
- Buttons must be clicked, forms submitted, flows exercised
- Backend tests MUST NOT use Playwright

---

## 🎭 PLAYWRIGHT QUICK REFERENCE (MANDATORY)

**CRITICAL:** For ANY Playwright work, read `.agents/docs/playwright/PLAYWRIGHT-PATTERNS.md` FIRST.

### Authentication (Standard Pattern)

```typescript
// Tests automatically use saved auth from tests/.auth/user.json
// Auth setup runs once via tests/auth.setup.ts (Supabase-based)

// Test credentials (from ENV):
// TEST_USER_1 = test1@mail.com
// TEST_PASSWORD_1 = test12026!!!
```

### Must-Use Patterns

```typescript
// 1. ALWAYS wait for network idle after navigation
await page.goto('/dashboard');
await page.waitForLoadState('networkidle'); // MANDATORY

// 2. Use role-based selectors (PREFERRED)
await page.locator('[role="tab"]').filter({ hasText: 'Budget' }).click();

// 3. Handle duplicates with .first() or .last()
const button = page.locator('button')
  .filter({ hasText: 'Submit' })
  .last(); // Gets specific instance

// 4. API requests need auth cookies
const authFile = path.join(__dirname, '../.auth/user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
const authCookies = authData.cookies
  .map(c => `${c.name}=${c.value}`)
  .join('; ');

await page.request.post(url, {
  headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
  data: { ... }
});
```

### Common Mistakes (BANNED)

| ❌ Don't | ✅ Do |
|---------|------|
| `page.locator('button').click()` | `page.locator('button').filter({ hasText: 'Submit' }).click()` |
| Navigate without waiting | `await page.waitForLoadState('networkidle')` |
| Ignore auth in API tests | Include `Cookie: authCookies` header |
| `await page.waitForTimeout(5000)` | `await page.waitForSelector('[role="menu"]')` |

### Running Tests

```bash
# Run all e2e tests
npx playwright test --config=frontend/config/playwright/playwright.config.ts

# Run specific test
npx playwright test tests/e2e/budget-comprehensive.spec.ts

# Debug mode
npx playwright test --debug

# View report
npx playwright show-report frontend/playwright-report
```

### For Complex Playwright Work

Use `test-automator` with the `playwright-tester.md` prompt template:

```typescript
Task({
  subagent_type: "test-automator",
  prompt: "Follow .agents/agents/playwright-tester.md. Implement e2e tests for [feature]."
})
```

**Full Patterns:** `.agents/docs/playwright/PLAYWRIGHT-PATTERNS.md`
**Gate Documentation:** `.agents/rules/PLAYWRIGHT-GATE.md`

---

### 🚨 MANDATORY: Use test-automator Sub-Agent

**NEVER run Playwright tests directly from the main agent.**

```
❌ WRONG: Main agent runs `npx playwright test`
❌ WRONG: Main agent debugs test timeouts
❌ WRONG: Main agent asks "Should I fix the tests?"

✅ RIGHT: Task({ subagent_type: "test-automator", ... })
```

The test-automator agent:
- Has fresh context (no pollution from implementation work)
- Has Playwright expertise
- Is required to FIX issues, not report them
- Must continue until tests PASS or hit genuine blocker

See "🚨 MANDATORY: Testing Sub-Agent" in SUB-AGENT STRATEGY section for full details.

---

## 🎯 PROJECT-SPECIFIC SUB-AGENTS & TEMPLATES

**Alleato-Procore has 7 specialized sub-agents** with deep project knowledge:

| Sub-Agent | Critical For | Documentation |
|-----------|--------------|---------------|
| **design-system-auditor** | UI compliance before commits | `.agents/agents/design-system-auditor.md` |
| **component-system-consistency-subagent** | Eliminating inline styles, standardizing components | `.agents/agents/component-system-consistency-subagent.md` |
| **page-title-compliance-subagent** | Browser tab titles with `useProjectTitle` hook | `.agents/agents/page-title-compliance-subagent.md` |
| **breadcrumb-experience-subagent** | Consistent breadcrumb navigation | `.agents/agents/breadcrumb-experience-subagent.md` |
| **project-context-resilience-subagent** | ProjectId context (URL/query param) | `.agents/agents/project-context-resilience-subagent.md` |
| **feature-crawler** | Procore feature research with screenshots | `.agents/agents/feature-crawler.md` |
| **PROJECT-MANAGER-AGENT** | Converting brain dumps to structured plans | `.agents/agents/PROJECT-MANAGER-AGENT.md` |

**Specialized Prompt Templates:**

| Template | Used With | Purpose | Documentation |
|----------|-----------|---------|---------------|
| **playwright-tester.md** | `test-automator` | E2E testing with Supabase auth, context-7 MCP | `.agents/agents/playwright-tester.md` |

**Key Usage Patterns:**

```typescript
// Playwright testing (with context-7 MCP + Supabase patterns)
Task({
  subagent_type: "test-automator",
  prompt: "Follow .agents/agents/playwright-tester.md. Implement e2e tests for [feature]."
})

// Design system audit before commit
Task({
  subagent_type: "code-reviewer",
  prompt: "Review UI changes in [files] using design-system-auditor rules from .agents/agents/design-system-auditor.md"
})

// Component consistency refactor
Task({
  subagent_type: "frontend-developer",
  prompt: "Refactor [page] to use shared components. Follow component-system-consistency-subagent patterns."
})
```

**See Complete Catalog:** `.agents/SUBAGENTS-INDEX.md` (all 68+ sub-agents with descriptions and use cases)

---

## 📋 TASK FLOW (MANDATORY)

### Before Any Task

1. Read this file
2. Create `.claude/current-task.md` with task description
3. Identify applicable execution gates
4. Satisfy gates BEFORE reasoning or coding

### During Task

1. For complex tasks: spawn worker sub-agent
2. Run `npm run quality --prefix frontend` after each change
3. Fix ALL errors before proceeding

### After Task

1. Run final quality check
2. Run relevant tests, capture output
3. **MANDATORY:** Spawn `code-reviewer` sub-agent for:
   - ANY feature implementation
   - ANY non-trivial bug fix
   - Changes affecting 3+ files
   - Before claiming "complete"
4. For complex tasks: spawn verifier sub-agent
5. Log to `.claude/task-log.md`:

```markdown
## [Task Description]
- Timestamp: [ISO timestamp]
- Quality Check: PASS (output: ...)
- Tests Run: [list with results]
- Code Review: COMPLETED (by code-reviewer sub-agent)
- Verification: VERIFIED | FAILED
- Evidence: [specific output/logs]
```

**Exception:** Skip code-reviewer only for:
- Documentation-only changes
- Single-line typo fixes
- Comment updates

---

## 🛑 WHEN TO STOP

Claude MUST STOP and ask if:

- Required access is missing
- A tool cannot be run
- Schema is unclear
- Execution gate cannot be satisfied
- Ambiguity that could lead to wrong implementation

**Guessing is never acceptable.**

---

## 📝 RULE VIOLATION LOGGING

ALL violations MUST be logged immediately in `RULE-VIOLATION-LOG.md`. No exceptions.

---

## 🧑‍💻 AGENT BEHAVIOR SUMMARY

### Claude MUST:

- Take ownership of tasks end-to-end
- Be proactive in fixing discovered issues
- Verify work through independent sub-agents (complex tasks)
- Improve the codebase continuously
- Show evidence for all claims

### Claude MUST NOT:

- Hand routine engineering work back to user
- Leave broken or untested code
- Claim completion without verification evidence
- Speculate before satisfying execution gates
- Use banned patterns or language

## Need to add these rules

- All documentation needs to be saved to the documentation folder and added to the index-docs.md.
- Don't stop working until all tasks are completed.