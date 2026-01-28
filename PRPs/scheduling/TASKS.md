# Scheduling Module Implementation Tasks

**Status**: ⚪ Not Started | **Last Updated**: 2026-01-27

## Progress Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 13 |
| Completed | 0 (0%) |
| In Progress | 0 |
| Remaining | 13 |

---

## Tasks

### Phase 1: Data Layer

- [ ] **Task 1**: CREATE `lib/types/scheduling.types.ts`
  - IMPLEMENT: TypeScript interfaces for ScheduleTask, ScheduleDependency, ScheduleDeadline
  - FOLLOW pattern: `lib/types/budget.types.ts`
  - NAMING: PascalCase interfaces, camelCase properties
  - PLACEMENT: `frontend/src/lib/types/`

- [ ] **Task 2**: CREATE Supabase migration for scheduling tables
  - GENERTE: Supabase types and review current schema.

    ```
    npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" --schema public > frontend/src/types/database.types.ts
    ```

  - IMPLEMENT: Tables from schema.sql with proper indexes
  - FOLLOW pattern: existing migrations
  - INCLUDE: RLS policies for project-scoped access
  - PLACEMENT: `supabase/migrations/`

### Phase 2: API Layer

- [ ] **Task 3**: CREATE `lib/services/scheduling-service.ts`
  - IMPLEMENT: CRUD operations for tasks, dependencies, deadlines
  - FOLLOW pattern: `lib/services/direct-cost-service.ts`
  - INCLUDE: Dependency recalculation logic
  - DEPENDENCIES: Task 1 types

- [ ] **Task 4**: CREATE `app/api/projects/[projectId]/scheduling/tasks/route.ts`
  - IMPLEMENT: GET (list tasks), POST (create task)
  - FOLLOW pattern: existing API routes
  - INCLUDE: Project authorization check
  - DEPENDENCIES: Task 3 service

- [ ] **Task 5**: CREATE `app/api/projects/[projectId]/scheduling/tasks/[taskId]/route.ts`
  - IMPLEMENT: GET, PUT, DELETE for single task
  - FOLLOW pattern: existing API routes
  - DEPENDENCIES: Task 3 service

### Phase 3: UI Layer

- [ ] **Task 6**: CREATE `components/scheduling/task-table.tsx`
  - IMPLEMENT: Table view of tasks with columns
  - FOLLOW pattern: `components/ui/data-table.tsx`
  - INCLUDE: Selection, sorting, inline editing
  - DEPENDENCIES: Task 1 types

- [ ] **Task 7**: CREATE `components/scheduling/gantt-chart.tsx`
  - IMPLEMENT: Gantt chart visualization
  - CONSIDER: Use existing library (e.g., @ant-design/plots or custom SVG)
  - INCLUDE: Task bars, dependencies lines, today marker
  - DEPENDENCIES: Task 1 types

- [ ] **Task 8**: CREATE `components/scheduling/task-edit-modal.tsx`
  - IMPLEMENT: Modal form for editing task details
  - FOLLOW pattern: existing modal components
  - INCLUDE: All editable fields from MUTATIONS.md
  - DEPENDENCIES: Task 1 types

- [ ] **Task 9**: CREATE `components/scheduling/task-context-menu.tsx`
  - IMPLEMENT: Right-click context menu with all commands
  - FOLLOW pattern: existing dropdown menus
  - INCLUDE: All commands from COMMANDS.md
  - DEPENDENCIES: Task 1 types

### Phase 4: Integration

- [ ] **Task 10**: CREATE `app/[projectId]/scheduling/page.tsx`
  - IMPLEMENT: Main scheduling page
  - FOLLOW pattern: `app/[projectId]/budget/page.tsx`
  - INCLUDE: Toolbar, table/Gantt toggle, task list
  - DEPENDENCIES: Tasks 6, 7, 8, 9

- [ ] **Task 11**: CREATE bulk edit functionality
  - IMPLEMENT: Bulk edit panel for multiple task selection
  - INCLUDE: Common fields that can be bulk edited
  - DEPENDENCIES: Task 3 service, Task 10 page

- [ ] **Task 12**: CREATE import/export functionality
  - IMPLEMENT: Import from CSV/MS Project, Export to CSV
  - INCLUDE: File upload, parsing, validation
  - DEPENDENCIES: Task 3 service

### Phase 5: Testing & Validation

- [ ] **Task 13**: ADD tests for scheduling module
  - IMPLEMENT: Unit tests for service layer
  - IMPLEMENT: Component tests for UI
  - FOLLOW pattern: existing test files
  - DEPENDENCIES: All previous tasks

- [ ] Run type check: `npx tsc --noEmit`
- [ ] Run linting: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Manual verification
- [ ] Production build: `npm run build`

---

## Session Log

<!--
AI agents: Append your progress updates here in reverse chronological order.
Format: ### YYYY-MM-DD HH:MM
        - Completed: {task description}
        - Next: {what you're working on next}
        - Notes: {any blockers or observations}
-->

### 2026-01-27 23:49
- Started: Implementation planning
- PRP: `PRPs/scheduling/prp-scheduling.md`
- Next: Begin Phase 1 tasks (Data Layer)

---

## Quick Reference

**PRP Document**: `PRPs/scheduling/prp-scheduling.md`
**Crawl Data**: `playwright-procore-crawl/procore-crawls/scheduling/`
**Spec Artifacts**: `playwright-procore-crawl/procore-crawls/scheduling/spec/`

### Key Commands

```bash
# Validate types
npx tsc --noEmit

# Run linting
npm run lint

# Run tests
npm test

# Build production
npm run build

# Start dev server
npm run dev
```

---

## How to Update This File

When completing a task:
1. Change `- [ ]` to `- [x]`
2. Update the Progress Summary counts
3. Add an entry to Session Log
4. Update the Status badge if changing phases

**Status Badges**:
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked
