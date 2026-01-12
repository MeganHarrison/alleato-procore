# Research: Schedule Feature

## Existing Codebase Findings
- Schedule page route exists at `frontend/src/app/[projectId]/schedule/page.tsx` and currently shows a placeholder card with "Coming soon" text.
- Supabase query helper `getProjectSchedule` exists at `frontend/src/lib/supabase/queries.ts` and reads from `schedule_tasks` ordered by `start_date`.
- Database type `schedule_tasks` includes fields such as `name`, `description`, `start_date`, `finish_date`, `duration_days`, `percent_complete`, `task_type`, and `sequence`.
- Generic table pattern for list pages uses `GenericDataTable` with `GenericTableConfig` (example: `frontend/src/app/[projectId]/tasks/page.tsx`).

## Tests
- No existing schedule e2e tests found in `frontend/tests/e2e/`.

## Procore Reference
- No crawl artifacts found in repo under `documentation/*project-mgmt/active/schedule/crawl-schedule`.
