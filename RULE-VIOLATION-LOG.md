# Rule Violation Log

- Date: 2025-09-22
  Violation: Performed reasoning and code changes before reading `CLAUDE.md` and `docs/PLANS_DOC.md`.
  Context: Responded and edited budget details route prior to loading required operating law and planning doc.

- Date: 2025-09-22
  Violation: Executed UI-related diagnosis and fix without satisfying Playwright execution gate.
  Context: Discussed and modified Budget Details behavior before Playwright evidence.

- Date: 2025-09-22
  Violation: Performed Supabase-related work without satisfying Supabase execution gate (types generation/validation).
  Context: Edited API route that queries Supabase without validating schema or reading generated types.

- Date: 2025-09-22
  Violation: Did not run `npm run quality --prefix frontend` after code change.
  Context: Modified `frontend/src/app/api/projects/[id]/budget/details/route.ts` without running required quality checks.
