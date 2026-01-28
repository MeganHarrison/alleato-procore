# DRAWINGS Spec

This folder contains all generated specification artifacts for the
**drawings** Procore module.

## Files

- `COMMANDS.md` — Domain command reference (25 actions, 0 promoted)
- `FORMS.md` — UI form requirements
- `MUTATIONS.md` — Write operation catalog
- `schema.sql` — Database schema template (8 columns derived from UI)

All files are auto-generated from `app_system_actions` data and safe to regenerate.

## Stats

- **UI Actions discovered:** 25
- **Table columns identified:** 8
- **Navigation tabs:** 1
- **Promoted commands:** 0

## Next Steps

1. Review COMMANDS.md — promote actions to canonical domain commands
2. Review schema.sql — adjust types, add constraints, add missing columns
3. Fill in FORMS.md — define field requirements for each form
4. Use MUTATIONS.md — plan API routes from write operations

For the comprehensive implementation plan, run `/prp-create drawings`
which generates a full PRP with HTML output at `PRPs/drawings/`.
