# TASKS: [PROJECT NAME]

**Project ID:** INI-YYYY-MM-DD-###
**Status:** In Progress
**Last Verified:** Never
**Owner Agent:** [agent-type]

---

## Deliverables - High Level

### Pages
- [ ] [Resource] Table
    - Detail Tab
    - Summary Tab
    - [Other Tabs]
- [ ] [Resource] Detail
- [ ] Create [Resource] Form
- [ ] Edit [Resource]

### Forms
- [ ] [Resource] Creation
- [ ] [Resource] Edit
- [ ] [Resource] Line Item

### Database Tables
- [resource]
- [resource]_line_items
- [resource]_attachments

---

## Phase 1: Database & Schema

### 1.1 Migration
- [ ] Create migration file
- [ ] Define tables
- [ ] Add foreign keys
- [ ] Apply migration

**GATE:** `npx supabase db push`

### 1.2 RLS Policies
- [ ] Read policy
- [ ] Insert policy
- [ ] Update policy
- [ ] Delete policy

### 1.3 TypeScript Types
- [ ] Generate types
- [ ] Verify accuracy

**GATE:** `npm run typecheck --prefix frontend`

---

## Phase 2: API Endpoints

- [ ] GET /api/projects/[id]/[resource] (list)
- [ ] POST /api/projects/[id]/[resource] (create)
- [ ] GET /api/projects/[id]/[resource]/[id] (detail)
- [ ] PUT /api/projects/[id]/[resource]/[id] (update)
- [ ] DELETE /api/projects/[id]/[resource]/[id] (delete)

**GATE:** Manual curl test or Postman

---

## Phase 3: Frontend - List View

- [ ] Create page component
- [ ] Add to navigation
- [ ] Data table with columns
- [ ] Sorting
- [ ] Filtering
- [ ] Pagination

**GATE:** Page loads in browser without errors

---

## Phase 4: Frontend - Forms

### Create Form
- [ ] Form component
- [ ] All required fields
- [ ] Validation
- [ ] Submit creates record

### Edit Form
- [ ] Pre-populate data
- [ ] Submit updates record

### Delete
- [ ] Confirmation dialog
- [ ] Soft delete

**GATE:** Create, edit, delete cycle works in browser

---

## Phase 5: Testing

- [ ] E2E test suite
- [ ] API tests
- [ ] Form validation tests

**GATE:** `npx playwright test --grep "[resource]"`

---

## Phase 6: Integration & Polish

- [ ] Link to related modules
- [ ] Visual match to Procore
- [ ] No console errors

**GATE:** `./scripts/verify-project.sh [resource]`

---

## Verification Summary

| Gate | Status | Last Run |
|------|--------|----------|
| TypeScript | | |
| ESLint | | |
| Migration | | |
| E2E Tests | | |

---

## Session Log

| Date | Agent | Tasks Done | Notes |
|------|-------|------------|-------|
| | | | |

---

## Handoff Notes

### Current State
-

### Next Steps
1.
2.

### Blockers
-
