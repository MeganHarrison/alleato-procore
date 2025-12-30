---
name: "Codex Refactor/Hardening"
about: "Structured refactor/perf/hardening task for Codex"
title: ""
labels: ["refactor", "codex"]
assignees: ""
---

## Objective
What code quality/performance/security improvement is needed (observable outcome).

## Scope & Starting Points
- Target files/modules (full paths) and functions:
- Related docs or standards (CLAUDE.md, CODEX-QUICKSTART, PLANS.md, style guides):
- Data/seed considerations if behavior changes:

## Acceptance Criteria (observable)
- [ ] Behavior remains correct (how to verify)
- [ ] Tests updated/added (Playwright if UI, unit for logic)
- [ ] No lint/type errors (`npm run quality --prefix frontend`)

## Required Commands
- Quality: `npm run quality --prefix frontend`
- Targeted tests/suites:
- Benchmarks/metrics if applicable:

## Evidence to Attach
- Test output snippets
- Playwright screenshots (if UI touched)
- Notes on migrations/cleanup, and any gate violations logged to `RULE-VIOLATION-LOG.md`
