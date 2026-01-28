# /scaffold - Generate Feature from Templates

Generate a complete CRUD feature using validated scaffolds.

## Usage

```
/scaffold <entity-name> [options]
```

## Examples

```
/scaffold ScheduleTask
/scaffold Submittal --table submittals
/scaffold RFI --skip-migration
```

## What This Does

1. **Reads scaffold templates** from `.claude/scaffolds/crud-resource/`
2. **Replaces placeholders** with your entity names
3. **Creates files** in the correct locations
4. **Runs verification** to ensure types are correct

## Placeholder Mapping

Given entity name "ScheduleTask":

| Placeholder | Value |
|------------|-------|
| `__ENTITY__` | `ScheduleTask` |
| `__entity__` | `scheduleTask` |
| `__entities__` | `scheduleTasks` |
| `__ENTITY_TABLE__` | `schedule_tasks` |
| `__ENTITY_ID__` | `taskId` |

## Files Generated

```
supabase/migrations/YYYYMMDD_create_<table>.sql
frontend/src/services/<entity>Service.ts
frontend/src/hooks/use-<entities>.ts
frontend/src/app/api/projects/[projectId]/<entities>/route.ts
frontend/src/app/api/projects/[projectId]/<entities>/[<entityId>]/route.ts
frontend/src/components/domain/<entities>/<Entity>FormDialog.tsx
frontend/src/app/(main)/[projectId]/<entities>/page.tsx
```

## Process

### Step 1: Read Templates
Read all files in `.claude/scaffolds/crud-resource/`

### Step 2: Compute Names
```
Entity: ScheduleTask
entity: scheduleTask
entities: scheduleTasks
ENTITY_TABLE: schedule_tasks
ENTITY_ID: taskId
```

### Step 3: Replace Placeholders
For each template file, replace:
- `__ENTITY__` → `ScheduleTask`
- `__entity__` → `scheduleTask`
- `__entities__` → `scheduleTasks`
- `__ENTITY_TABLE__` → `schedule_tasks`
- `__ENTITY_ID__` → `taskId`

### Step 4: Write Files
Write to the correct locations per file type.

### Step 5: Run Migration
If migration was created:
```bash
# Apply migration via MCP or CLI
```

### Step 6: Regenerate Types
```bash
npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" --schema public > /Users/meganharrison/Documents/github/alleato-procore/frontend/src/types/database.types.ts
```

### Step 7: Verify
- Read `database.types.ts`
- Confirm table exists
- Confirm types match

## Post-Scaffold Checklist

After scaffolding, verify:

- [ ] Migration ran successfully
- [ ] Types regenerated
- [ ] Table appears in `database.types.ts`
- [ ] FK types match (INTEGER for project_id)
- [ ] Service imports resolve
- [ ] Hook compiles without errors
- [ ] Page route doesn't conflict with existing routes
- [ ] Dev server starts: `npm run dev --prefix frontend`

## Customization

After scaffolding, you'll typically need to:

1. **Add domain-specific fields** to:
   - Migration (add columns)
   - Service DTOs (add fields)
   - Hook types (extend interface)
   - Form schema (add validation)

2. **Customize relationships** if the entity has FKs beyond project_id

3. **Add business logic** to service methods

## Troubleshooting

### "Table doesn't exist"
Run migration first, then regenerate types.

### "Type mismatch"
Check FK column type matches PK type. `projects.id` is INTEGER, not UUID.

### "Route conflict"
Ensure using `[projectId]` not `[id]` in routes.
