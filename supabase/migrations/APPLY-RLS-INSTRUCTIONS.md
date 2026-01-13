# Quick Reference: Apply Change Events RLS

**⚠️ CRITICAL SECURITY ISSUE:** Change Events tables have NO ROW LEVEL SECURITY
**Time Required:** 5 minutes
**File to Apply:** `20260110142750_add_change_events_rls.sql` (this directory)

---

## Quick Steps

1. **Open Supabase SQL Editor**
   - https://supabase.com/dashboard/project/lgveqfnpkxvzbnnwuled/sql

2. **Copy Migration SQL**
   ```bash
   # From this directory:
   cat 20260110142750_add_change_events_rls.sql
   ```
   Copy ALL contents (10,260 bytes)

3. **Paste & Run**
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion (~10 seconds)

4. **Verify**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename LIKE 'change_event%';
   ```
   All should show `rowsecurity = true`

5. **Mark Applied**
   ```bash
   npx supabase migration repair --status applied 20260110142750
   ```

---

## What This Does

- Enables RLS on 5 change_events tables
- Creates 24 security policies
- Adds 3 performance indexes
- Protects against unauthorized access

**Before:** Anyone can read/write/delete ALL change events
**After:** Users only see change events for their authorized projects

---

## If You Get Errors

**Error:** "policy already exists"
- ✅ Safe to ignore - some policies may already exist
- Continue with next statements

**Error:** "table does not exist"
- ❌ STOP - tables not created yet
- Apply `0001_create_change_events.sql` first

**Error:** "column does not exist"
- ❌ STOP - schema mismatch
- Contact team lead

---

## After Application

Update evidence document with verification results:
- `documentation/*project-mgmt/in-progress/change-events/DATABASE-WORK-EVIDENCE.md`

Mark section "Step 4: Manual Application" as complete.

---

**Need Help?** See full documentation:
- `documentation/*project-mgmt/in-progress/change-events/DATABASE-WORK-EVIDENCE.md`
- `documentation/*project-mgmt/in-progress/change-events/RLS-APPLICATION-SUMMARY.md`
