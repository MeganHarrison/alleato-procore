# RFIs Feature - Implementation Plan

**Feature:** Procore RFIs (Requests for Information)
**Status:** In Progress
**Created:** 2026-01-13
**References:**
- `documentation/docs/database/tables/rfis.md`
- `documentation/docs/database/tables/rfi_assignees.md`
- `documentation/docs/procore-workflow-images/diagram_rfis_tool-overview.png`

---

## Executive Summary

This plan outlines the work required to bring the RFIs tool to Procore feature parity. The initial focus is on replacing placeholder UI with a working list view and creation form backed by Supabase data, then expanding into detail views, assignment workflows, and lifecycle actions.

### Current State
- `/rfis` uses mock data and basic table UI.
- `/[projectId]/rfis` is a placeholder.
- `/form-rfi` is a placeholder.
- Database tables exist: `rfis`, `rfi_assignees`.

### Target State
- RFI list views powered by Supabase data.
- RFI creation form with required fields and Procore-aligned structure.
- Status tracking, ball-in-court, due date, and assignment details available in UI.
- Detail page + response workflow (future phase).

---

## Phase 1: Data-Backed List Views

### Objectives
- Replace placeholder/mock RFIs with live Supabase data.
- Match Procore columns and summary metrics where possible.

### Implementation Notes
- Use `rfis` table fields: `number`, `subject`, `status`, `ball_in_court`, `due_date`, `received_from`, `created_at`.
- Include optional project column when rendering non-project scoped view.
- Add summary cards for Open, Overdue, Answered, Closed.

### Files
- `frontend/src/app/(tables)/rfis/page.tsx`
- `frontend/src/app/[projectId]/rfis/page.tsx`
- `frontend/src/components/rfis/rfis-table.tsx`

---

## Phase 2: Create RFI Form

### Objectives
- Replace placeholder form with a full create flow.
- Support required fields and core Procore metadata.

### Required Fields (DB)
- `project_id`
- `number`
- `subject`
- `question`

### Form Sections
- General Information (project, number, subject)
- Request Details (question, due date)
- Assignment & Visibility (ball in court, received from, privacy)

### Files
- `frontend/src/app/(forms)/form-rfi/page.tsx`

---

## Phase 3: Detail View & Lifecycle (Future)

### Objectives
- Create `/[projectId]/rfis/[rfiId]` detail page.
- Add answer/close workflows.
- Surface distribution list + assignees.

---

## Testing Plan

- Add/extend Playwright coverage for:
  - `/rfis` list view
  - `/[projectId]/rfis` list view
  - `/form-rfi` creation form
- Run `npm run quality --prefix frontend`.
- Capture results in TEST-RESULTS.md (per mandatory testing protocol).

---

## Success Criteria

- [ ] RFI list pages render Supabase data with key columns.
- [ ] RFI creation form submits and persists data.
- [ ] Summary metrics display accurate counts.
- [ ] Tests updated and executed with passing output.
