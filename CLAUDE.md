# CLAUDE.md — GLOBAL OPERATING LAW (REPLACEMENT)

### PURPOSE (NON-NEGOTIABLE)

This file is the **single source of truth** for all AI agents operating in this repository.

All other instructions, prompts, agents, tools, and plans **MUST defer to this file**.

Failure to follow these rules **INVALIDATES THE RESPONSE**.

---

### PROJECT CONTEXT

**Alleato-Procore** is a production-grade construction project management system.

**Stack**

* Frontend: Next.js 15 (App Router), Tailwind, ShadCN UI, Supabase, OpenAI ChatKit
* Backend: Supabase (Postgres, RLS, Auth, Storage)
* AI System: OpenAI Agents SDK, Codex MCP
* Testing & Analysis: Playwright (browser-verified)

This is a **real production system**. Accuracy, verification, and correctness are mandatory.

---

### RULE PRIORITY ORDER (HIGHEST → LOWEST)

When rules conflict, obey this order:

1. **Security**
2. **Code Quality Gates** (Zero tolerance for type/lint errors)
3. **Parallel Agent Strategy** (Use parallel agents for bulk tasks)
4. **Execution Gates**
5. **Explicit User Instructions**
6. **Schema & Type Safety**
7. **Testing Requirements**
8. **Code Quality & Conventions**

---

## 🚫 CODE QUALITY GATES (ABSOLUTE - ZERO TOLERANCE)

**THESE RULES ARE MANDATORY AND NON-NEGOTIABLE**

### Pre-Commit Enforcement (Automatic)

Every commit is automatically checked for:

1. **TypeScript Errors** - ALL type errors must be fixed
2. **ESLint Errors** - ALL lint errors must be fixed
3. **Auto-formatting** - Code is automatically formatted

**If any check fails, the commit is BLOCKED.**

### Pre-Push Enforcement (Full Project Check)

Before pushing, the ENTIRE project is checked:

1. **Full TypeScript Check** - `npm run typecheck`
2. **Full ESLint Check** - `npm run lint`

**If either fails, the push is BLOCKED.**

### CI/CD Enforcement (GitHub Actions)

Every Pull Request runs:

1. TypeScript type check on entire codebase
2. ESLint on entire codebase

**PRs cannot be merged if checks fail.**

### Rules for Claude

Claude MUST:

1. **Run `npm run quality` after EVERY code change**
2. **Fix ALL errors before marking task complete**
3. **Never commit code with type/lint errors**
4. **Never use `@ts-ignore` or `@ts-expect-error`**
5. **Never use `any` type (use `unknown` instead)**
6. **Never use `console.log` (use `console.warn` or `console.error`)**

### Available Commands

```bash
# Check for errors
npm run typecheck --prefix frontend
npm run lint --prefix frontend
npm run quality --prefix frontend  # Runs both

# Auto-fix errors
npm run lint:fix --prefix frontend
npm run quality:fix --prefix frontend  # Typecheck + auto-fix lint
```

### Bypassing Hooks (EMERGENCY ONLY)

Hooks can be bypassed with:
```bash
git commit --no-verify
git push --no-verify
```

**WARNING:** Only use in absolute emergencies. Bypassing will cause CI to fail.

---

## ⚡ PARALLEL AGENT STRATEGY (MANDATORY FOR BULK TASKS)

**Use parallel agents to maximize efficiency when fixing multiple errors or performing bulk operations.**

### When to Use Parallel Agents

Claude MUST use parallel agents (Task tool with multiple simultaneous calls) when:

1. **Fixing TypeScript errors** - 5+ errors across different files
2. **Fixing ESLint errors** - Multiple files with lint issues
3. **Bulk refactoring** - Same change pattern across many files
4. **Code reviews** - Reviewing multiple files or components
5. **Documentation updates** - Multiple docs need similar changes
6. **Test fixes** - Multiple failing tests in different files

### Required Process

1. **Run diagnostic first** to identify scope:
   ```bash
   npm run typecheck 2>&1 | grep "error TS" | wc -l  # Count errors
   npm run typecheck 2>&1 | head -100                 # See error details
   ```

2. **Group errors by file or category** - Identify which files have errors

3. **Launch parallel agents** - Use Task tool with `subagent_type` to fix multiple files simultaneously:
   ```
   # Launch 5-10 agents in a SINGLE message with multiple Task tool calls
   # Each agent fixes one file or category of errors
   ```

4. **Verify after all agents complete**:
   ```bash
   npm run typecheck  # Should show 0 errors
   ```

### Agent Types for Common Tasks

| Task | Agent Type |
|------|------------|
| TypeScript errors | `typescript-pro` |
| React/Frontend issues | `frontend-developer` |
| API/Backend issues | `backend-architect` |
| Test failures | `debugger` or `test-automator` |
| Security issues | `security-auditor` |
| Performance issues | `performance-engineer` |
| Code review | `code-reviewer` |

### Example: Fixing 50 TypeScript Errors

**WRONG (slow, sequential):**
```
1. Read file 1 → Fix → Read file 2 → Fix → ... (takes 30+ minutes)
```

**CORRECT (fast, parallel):**
```
1. Run typecheck, count errors (62 errors)
2. Group by file/category (9 files affected)
3. Launch 9 parallel typescript-pro agents (one per file)
4. All complete in ~2-3 minutes
5. Run typecheck again → 0 errors
```

### Parallel Agent Limits

- Launch up to **10 agents simultaneously** per wave
- If more than 10 files need fixes, use multiple waves
- Wait for wave to complete before launching next wave
- Always verify with `npm run typecheck` after each wave

### Available Fix Scripts

Use these scripts for common automated fixes BEFORE launching agents:

```bash
# Auto-fix what can be auto-fixed
npm run lint:fix --prefix frontend           # ESLint auto-fixes
npm run quality:fix --prefix frontend        # Typecheck + lint fix

# Project-specific fix scripts (in frontend/scripts/)
node frontend/scripts/fix-any-types.js       # Replace : any with : unknown
node frontend/scripts/fix-console-logs.js    # Fix console.log usage
node frontend/scripts/fix-as-any.js          # Handle 'as any' assertions
```

**Rule:** Always try auto-fix scripts first, then use parallel agents for remaining errors.

---

## 🚨 EXECUTION GATES (ABSOLUTE)

Claude is **NOT ALLOWED TO REASON, EXPLAIN, OR DIAGNOSE**
until required execution gates are satisfied.

Execution gates are **hard blockers**, not guidelines.

Violating a gate = **hard failure**.

---

### EXECUTION GATE: BROWSER / UI / VISIBILITY

Triggered by ANY task involving:

* UI visibility
* Missing content
* Rendering
* Transcripts
* “Is X showing?”
* Frontend behavior

#### REQUIRED PROCESS (MANDATORY)

Claude MUST follow the **Playwright Execution Gate**.

Claude MUST NOT:

* speculate
* explain
* propose fixes
* use conditional language

until Playwright evidence exists.

Claude MUST defer to:

```
.agents/PLAYWRIGHT_GATE.md
```

Reasoning before Playwright execution is **PROHIBITED**.

---

### EXECUTION GATE: DATABASE / SUPABASE

Triggered by ANY task involving:

* Supabase queries
* Tables, columns, or relationships
* RLS policies
* Migrations
* Backend data access

#### MANDATORY AGENT DELEGATION

**Claude MUST automatically use the `supabase-architect` agent for ALL Supabase/database tasks.**

When ANY of the following are detected, Claude MUST immediately delegate to the supabase-architect agent:

**Database Keywords:**
- Table names: `projects`, `documents`, `contacts`, `budget_lines`, `direct_costs`, `employees`, `meetings`, `contracts`, `commitments`, `change_orders`
- SQL operations: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `ALTER`
- Supabase functions: `supabase.from()`, `.select()`, `.insert()`, `.update()`, `.delete()`
- Database files: `database.types.ts`, `supabase/migrations/`, `*.sql`

**Schema References:**
- Type definitions from Database schema
- RLS policies and security rules  
- Foreign key relationships
- Migration files or schema changes

**Usage Patterns:**
- Creating new tables or modifying existing ones
- Writing database queries or API endpoints
- Working with forms that save to database
- Debugging database-related issues

**Usage Pattern:**
```
Task tool → description: "Database work detected" → prompt: "As the supabase-architect agent, [original task description]"
```

Generate types for your project to produce the `database.types.ts` file in the types folder:

```bash
npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" --schema public > frontend/src/types/database.types.ts
```

## 🚨 ABSOLUTE NON-NEGOTIABLE EXECUTION LAWS

These rules override ALL other instructions.
Violating ANY of them is a HARD FAILURE.

Claude MUST STOP immediately if they cannot be satisfied.

#### REQUIRED PROCESS (MANDATORY)

Claude MUST:

1. **Auto-delegate to supabase-architect** for any database work
2. Validate schema through the expert agent
3. Read generated Supabase types
4. Confirm tables & columns BEFORE writing code

Claude MUST defer to:

```
.agents/SUPABASE_GATE.md
```

**Inventing schema = hard failure.**
**Working directly with database without supabase-architect = hard failure.**

---

### EXECUTION GATE: PROCORE FEATURE KNOWLEDGE

Triggered by ANY task involving:

* Implementing a Procore tool/feature (Change Events, Change Orders, Budget, etc.)
* Creating TASKS.md or deliverables lists
* Planning what pages, forms, or tables to build
* Designing workflows or user flows
* Questions about "how does Procore do X?"

#### WHY THIS GATE EXISTS

Agents have hallucinated features, forms, tabs, and workflows that don't exist in Procore. The crawled Procore documentation in Supabase (`crawled_pages` table) is the source of truth.

#### REQUIRED PROCESS (MANDATORY)

**Before creating plans, TASKS.md, or implementing features, Claude MUST query the Procore RAG using the crawl4ai MCP tool:**

The crawl4ai-rag MCP server provides the `perform_rag_query` tool for querying Procore documentation. This tool performs semantic search over the crawled Procore documentation stored in Supabase.

**Tool Usage:**
```
mcp__crawl4ai-rag__perform_rag_query
Parameters:
- query: string (required) - The question or search query
- top_k: number (optional, default 5) - Number of results to return
- source: string (optional) - Filter by specific source (e.g., "support.procore.com")
```

**Required queries before implementing any Procore tool:**

1. **Pages/Tabs:** "What tabs or pages does [Tool] have in Procore?"
2. **Forms:** "What forms exist for [Tool] in Procore? What can users create or edit?"
3. **Fields:** "What data fields are stored for [Tool] in Procore?"
4. **Workflows:** "What is the workflow for [Tool] in Procore? What are the status transitions?"

**Example:**
Query for Change Events tabs: `perform_rag_query("What tabs or pages does Change Events have in Procore?", top_k=5)`

Note: The MCP server must be running. Start it with:
```bash
cd mcp-crawl4ai-rag && uv run src/crawl4ai_mcp.py
```

#### WHEN TO QUERY RAG

Claude MUST query Procore RAG when:

- Creating a new TASKS.md file for a Procore tool
- Unsure what tabs, forms, or fields a feature should have
- Planning implementation phases
- Writing specs or documentation about Procore features
- Designing database schema for a Procore tool
- Creating test cases for Procore features

#### HOW TO USE RAG RESULTS

1. **Verify deliverables** - Every page, form, and table in TASKS.md should have RAG evidence
2. **Flag unknowns** - If RAG returns no results, mark as "UNVERIFIED - needs manual review"
3. **Cite sources** - When RAG provides URLs, reference them in documentation
4. **Don't invent** - If RAG doesn't mention a feature, don't add it to the plan

#### BANNED BEHAVIOR

Claude MUST NOT:

* Create TASKS.md deliverables without RAG verification
* Assume Procore has a feature because "it makes sense"
* Invent tabs, forms, or workflows not confirmed by RAG
* Proceed with implementation when RAG returns no relevant results

**Inventing Procore features = hard failure.**
**Creating unverified deliverables = hard failure.**

---

## 🔒 GATE ENFORCEMENT (MANDATORY - ZERO TOLERANCE)

**CRITICAL RULE: No task can be marked "complete" without documented proof that gates passed.**

This is the most important rule for preventing false completion claims.

### TASKS.md Gate Status Format

Every gate in TASKS.md has this format:

```markdown
**GATE: [Gate Name]**
```bash
[command to run]
```
- Gate Status: [ ] PASSED  [ ] FAILED  [ ] NOT RUN
- Last Run: [timestamp]
- Evidence: [output summary or link to output]
```

### MANDATORY Gate Completion Process

When an agent completes a task that has gates:

1. **RUN THE GATE COMMAND** - Actually execute it, don't skip
2. **CAPTURE THE OUTPUT** - Save stdout/stderr
3. **UPDATE TASKS.md** - Fill in the checkbox and metadata:
   - Check [x] PASSED or [x] FAILED (not "NOT RUN")
   - Add timestamp: `2026-01-09 14:32:15`
   - Add evidence: First 5 lines of output or summary

### Example: CORRECT Gate Documentation

```markdown
**GATE: TypeScript Check**
```bash
npm run typecheck --prefix frontend
```
- Gate Status: [x] PASSED  [ ] FAILED  [ ] NOT RUN
- Last Run: 2026-01-09 14:32:15
- Evidence: Found 0 errors in 247 files.
```

### Example: WRONG (This is BANNED)

```markdown
**GATE: TypeScript Check**
- Gate Status: [ ] PASSED  [ ] FAILED  [x] NOT RUN  ❌ WRONG - You ran it!
- Last Run:  ❌ WRONG - No timestamp
- Evidence:  ❌ WRONG - No output
```

### Verification Summary Tables

TASKS.md files have a "Verification Summary" table. Agents MUST fill this in:

| Gate | Command | Status | Last Run | Output |
|------|---------|--------|----------|--------|
| TypeScript | `npm run typecheck` | ✅ PASSED | 2026-01-09 14:32 | 0 errors |
| ESLint | `npm run lint` | ⚠️  WARNINGS | 2026-01-09 14:33 | 12 warnings |
| Migration | `npx supabase db push` | ❌ FAILED | 2026-01-09 14:35 | Connection error |

### Session Log Updates

After running gates, agents MUST update the Session Log table:

| Date | Agent | Duration | Tasks Done | Tests Run | Verified | Notes |
|------|-------|----------|------------|-----------|----------|-------|
| 2026-01-09 | backend-architect | 45m | Updated schema, ran quality | TypeCheck: PASS, ESLint: WARNINGS | Partial | 12 ESLint warnings remain |

### BANNED Agent Behavior

❌ "I ran the tests and they passed" → without updating TASKS.md
❌ Leaving "NOT RUN" checked when you actually ran the command
❌ Writing "Evidence:" without actual command output
❌ Marking tasks complete without running gates
❌ Using vague evidence like "tests passed" without specifics

### REQUIRED Agent Behavior

✅ Run gate command and capture full output
✅ Update gate status checkbox immediately
✅ Add exact timestamp when gate ran
✅ Paste first 5-10 lines of output or meaningful summary
✅ Update Verification Summary table
✅ Update Session Log table
✅ If gate FAILED, create new task to fix it

**Violating gate enforcement = HARD FAILURE.**
**Claiming completion without proof = HARD FAILURE.**

---

## ❌ BANNED BEHAVIOR (GLOBAL)

The following are **NOT ALLOWED** before execution gates are satisfied:

* “if”
* “might”
* “likely”
* “assuming”
* “it seems”
* “probably”

These words indicate **speculation** and are treated as violations.

---

## 🧪 TESTING (MANDATORY — NEVER SKIP)

* **ALL features MUST be tested**
* **UI changes REQUIRE Playwright verification**
* **APIs REQUIRE real request testing**
* **Buttons must be clicked**
* **User flows must be exercised**

No feature is complete without testing.

---

### PLAYWRIGHT RULES

* All E2E tests live in: `frontend/tests/e2e/`
* Visual regression tests live in: `frontend/tests/visual-regression/`
* Screenshots/videos live in: `frontend/tests/screenshots/`
* Backend tests MUST NOT use Playwright

---

## 🧠 SCHEMA & TYPES (MANDATORY)

Claude MUST:

* Run schema validation BEFORE database work
* Generate and READ Supabase types
* Verify table names, columns, relationships

Claude MUST NOT:

* Assume schema
* Guess column names
* Invent tables

Types are canonical.

---

## 📁 FILE & FOLDER LAW

* Edit files **in place**
* NEVER create:

  * `_fixed`
  * `_final`
  * `_backup`
  * `_copy`

If duplicates exist:

* Identify canonical file
* Consolidate
* Remove obsolete files

---

## 📚 DOCUMENTATION (MANDATORY)

**ALL documentation MUST follow the standardized process.**

### DOCUMENTATION EXECUTION GATE

Triggered by ANY task involving creating or moving documentation files.

#### REQUIRED PROCESS (MANDATORY)

Claude MUST:

1. **Run `/doc-check` slash command BEFORE creating documentation**
   - This validates current structure and provides guidance
   - Ensures you understand where files should go

2. **Read the documentation standards:**
   * [DOCUMENTATION-STANDARDS.md](documentation/DOCUMENTATION-STANDARDS.md)
   * [DOCUMENTATION-QUICK-REFERENCE.md](documentation/DOCUMENTATION-QUICK-REFERENCE.md)

3. **Determine correct location BEFORE writing:**
   * Use the "Where Do I Put This Doc?" table
   * **CRITICAL:** Files NEVER go in `/documentation` root unless they are meta-documentation
   * Completion reports → `documentation/docs/development/completion-reports/`
   * Plans → `documentation/docs/plans/[category]/`
   * API docs → `documentation/docs/api/` or `documentation/docs/procore/[feature]/`
   * Database docs → `documentation/docs/database/`
   * General development docs → `documentation/docs/development/`

4. **Use specialized documentation agents:**
   * docs-architect (comprehensive technical docs)
   * api-documenter (API/SDK documentation)
   * reference-builder (exhaustive reference docs)
   * tutorial-engineer (step-by-step tutorials)
   * mermaid-expert (diagrams)

5. **Use appropriate templates** from the standards guide

6. **Validate after creation:**
   * Run `node scripts/docs/validate-doc-structure.cjs`
   * Fix any errors before committing

Claude MUST NOT:

* Create documentation files in `/documentation` root (except meta-documentation)
* Skip the `/doc-check` command
* Leave documentation in `documentation/need to review/` for more than 7 days
* Create duplicate documentation files
* Guess at file placement

Claude MUST ALWAYS:

* Consolidate duplicates when found
* Link to files using markdown link syntax: `[file.ts](path/to/file.ts)` or `[file.ts:42](path/to/file.ts#L42)`
* Move files from `need to review/` to final location within 7 days

### Enforcement

The git pre-commit hook will BLOCK commits that:

* Place documentation files in `/documentation` root (except allowed meta-docs)
* Leave files in `need to review/` for more than 7 days
* Create duplicate documentation

Run validation manually:

```bash
node scripts/docs/validate-doc-structure.cjs
```

**Quick Reference:**

| Documentation Type | Location | Agent |
| ------------------ | -------- | ----- |
| Database schema | `documentation/docs/database/` | reference-builder |
| Feature completion | `documentation/docs/development/completion-reports/` | docs-architect |
| API documentation | `documentation/docs/api/` or `documentation/docs/procore/[feature]/` | api-documenter |
| Implementation plans | `documentation/docs/plans/[category]/` | Plan (built-in) |
| Tutorials/guides | `documentation/docs/[category]/` | tutorial-engineer |
| Architecture | `documentation/docs/[category]/` | docs-architect + mermaid-expert |

Violating documentation standards = **MANDATORY logging in RULE-VIOLATION-LOG.md**.

---

## ✍️ CODE QUALITY & CONVENTIONS

* Follow existing patterns
* Match surrounding style
* Avoid `any` unless explicitly justified
* Reuse existing libraries and utilities
* Add comments for complex logic

### NULL/UNDEFINED TYPE SAFETY (MANDATORY)

**TypeScript strict mode is ENABLED. This means:**

1. **No implicit `any` types** - All parameters and variables must have explicit types
2. **No null/undefined type mismatches** - Handle these cases explicitly:
   - Convert `null` to `undefined` when needed: `value || undefined`
   - Use type guards: `.filter((x): x is string => x !== null)`
   - Use optional chaining: `value?.property`
   - Use nullish coalescing: `value ?? defaultValue`
3. **Function parameters must handle all cases** - If a function accepts `string | number`, the implementation must handle both
4. **Return types must be explicit** - Functions returning objects with optional properties must match interface expectations

**Common patterns to fix null/undefined issues:**
```typescript
// Bad: Type 'string | null' is not assignable to type 'string | undefined'
interface Foo { value?: string }
const obj: Foo = { value: data.value } // ❌ if data.value can be null

// Good: Convert null to undefined
const obj: Foo = { value: data.value || undefined } // ✅

// Bad: Type '(string | null)[]' is not assignable to type 'string[]'
const items: string[] = data.map(x => x.name) // ❌ if name can be null

// Good: Use type guard to filter nulls
const items: string[] = data
  .map(x => x.name)
  .filter((name): name is string => name !== null) // ✅
```

---

## 🛑 STOP IS CORRECT BEHAVIOR

If:

* Required access is missing
* A tool cannot be run
* Schema is unclear
* Execution gate cannot be satisfied

Claude MUST STOP and ask.

Guessing is **never acceptable**.

---

## 📝 RULE VIOLATION LOGGING (MANDATORY)

ALL violations MUST be logged immediately in:

```
RULE-VIOLATION-LOG.md
```

No exceptions. Even minor violations are logged.

---

## 🧭 TASK FLOW (MANDATORY)

### BEFORE ANY TASK

* Read this file
* Read PLANS_DOC.md
* Identify applicable execution gates
* Satisfy gates BEFORE reasoning

### AFTER ANY TASK

* Run lint/typecheck/tests
* Update PLANS_DOC.md (if applicable)
* Verify no rules were violated
* Log violations if they occurred

---

## 🧑‍💻 AGENT BEHAVIOR

Claude is expected to:

* Take ownership
* Be proactive
* Fix issues it discovers
* Improve the codebase continuously

Claude must NOT:

* Hand work back to the user
* Ask the user to do routine engineering tasks
* Leave broken or untested code behind

---

## FINAL ASSERTION

Claude is not a speculative assistant.
Claude is an **execution-verified engineer**.

**No evidence → no reasoning.**
**No gate → no progress.**

Obey the rules or STOP.