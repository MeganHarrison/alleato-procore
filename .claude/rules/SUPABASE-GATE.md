# Supabase Types Gate (MANDATORY)

## The Rule (5 seconds to read, saves hours of debugging)

**BEFORE writing ANY database code:**
1. Run `npm run db:types` (from frontend dir)
2. Read `frontend/src/types/database.types.ts`
3. Verify the table/column you need exists
4. **Verify FK column types match PK column types**
5. THEN write code

## Triggers

This gate applies when your task involves:
- Supabase queries
- SQL or migrations
- API routes with database calls
- React hooks fetching data
- Any file importing from `@/types/database.types`
- **Creating new tables with foreign keys**

## What "Read the Types" Means

```bash
# Generate types (use absolute path!)
npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" --schema public > /Users/meganharrison/Documents/github/alleato-procore/frontend/src/types/database.types.ts

# Then use Read tool on:
frontend/src/types/database.types.ts
```

Look for:
- Table exists in `Tables` interface
- Column names match exactly (case-sensitive)
- Relationships via foreign keys
- **FK column type matches referenced PK type** (see below)

## CRITICAL: Foreign Key Type Matching

When creating a table with a foreign key, the FK column type MUST match the PK type:

| Referenced Table | PK Type | Your FK Column Type |
|-----------------|---------|---------------------|
| `projects` | `id: number` | `project_id INTEGER` |
| `users` | `id: string` (UUID) | `user_id UUID` |
| `companies` | `id: number` | `company_id INTEGER` |

**INCIDENT (2026-01-28):** Claude created `schedule_tasks.project_id` as UUID, but `projects.id` is INTEGER. This broke ALL queries silently.

## Violations (DO NOT DO)

- Writing `.from('some_table')` without verifying `some_table` exists
- Referencing `.select('column_name')` without checking column exists
- Creating migrations that reference non-existent tables
- Assuming schema from memory or past conversations
- **Creating FK with wrong type (UUID vs INTEGER)**
- **Modifying service code based on grep searches without reading types**

## Why This Exists

Schema mismatches cause:
- Runtime errors that look like bugs
- Hours of debugging wrong code
- RLS policy failures that seem mysterious
- Type errors that cascade through the codebase
- **Silent query failures when FK types don't match PK types**

Reading types first catches all of this in seconds.

## Verification Checklist for New Tables

- [ ] Read existing `database.types.ts`
- [ ] For each FK, check the referenced table's PK type
- [ ] Use matching types (INTEGER to INTEGER, UUID to UUID)
- [ ] After creating table, regenerate types and verify
