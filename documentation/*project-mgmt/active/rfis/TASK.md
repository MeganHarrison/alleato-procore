# TASKS: RFIs

## Project Info
- Feature: rfis
- Started: 2026-01-13
- Status: In Progress

## Deliverables
- [x] RFI list page wired to Supabase data
- [x] Project-level RFI list page wired to Supabase data
- [x] RFI create form implemented
- [x] Summary metrics aligned to statuses and due dates
- [ ] Tests updated/added
- [ ] Quality + test evidence captured
- [ ] Verification completed

## Phase Tasks
### Phase 1: Research & Planning
- [x] Review RFI database schema docs
- [x] Review Procore workflow diagram
- [x] Create PLANS.md
- [x] Create TASK.md

### Phase 2: List Views
- [x] Replace `/rfis` mock data with Supabase-backed table
- [x] Replace `/[projectId]/rfis` placeholder with data-backed table
- [x] Add summary cards for Open/Overdue/Answered/Closed

### Phase 3: Create Form
- [x] Implement `/form-rfi` with required fields
- [x] Add project selector + status selection
- [x] Validate numeric RFI number conversion

### Phase 4: Testing
- [ ] Add or update Playwright coverage for RFIs
- [ ] Run `npm run quality --prefix frontend`
- [ ] Run `npx playwright test frontend/tests/e2e/rfis*.spec.ts`
- [ ] Document test outputs in TEST-RESULTS.md

### Phase 5: Verification
- [ ] Create verification report with evidence
