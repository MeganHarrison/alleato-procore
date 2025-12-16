# Generic Table Pages Screenshots

This directory contains automated screenshots from Playwright E2E tests for all generic table pages.

## Screenshot Files

When you run the tests, the following screenshots will be generated:

### Main Page Views
- `risks-page.png` - Full page view of Risks table
- `opportunities-page.png` - Full page view of Opportunities table
- `decisions-page.png` - Full page view of Decisions table
- `daily-logs-page.png` - Full page view of Daily Logs table
- `daily-recaps-page.png` - Full page view of Daily Recaps table
- `issues-page.png` - Full page view of Issues table
- `meeting-segments-page.png` - Full page view of Meeting Segments table
- `notes-page.png` - Full page view of Notes table
- `ai-insights-page.png` - Full page view of AI Insights table

### Column Toggle Views
- `risks-columns.png` - Column toggle dropdown open
- `opportunities-columns.png` - Column toggle dropdown open
- `decisions-columns.png` - Column toggle dropdown open
- `daily-logs-columns.png` - Column toggle dropdown open
- `daily-recaps-columns.png` - Column toggle dropdown open
- `issues-columns.png` - Column toggle dropdown open
- `meeting-segments-columns.png` - Column toggle dropdown open
- `notes-columns.png` - Column toggle dropdown open
- `ai-insights-columns.png` - Column toggle dropdown open

## Running Tests to Generate Screenshots

```bash
# From frontend directory
BASE_URL=http://localhost:3002 npx playwright test tests/e2e/generic-table-pages.spec.ts

# Run specific page tests
BASE_URL=http://localhost:3002 npx playwright test tests/e2e/generic-table-pages.spec.ts -g "Risks"

# Run with UI mode to see live results
BASE_URL=http://localhost:3002 npx playwright test tests/e2e/generic-table-pages.spec.ts --ui
```

## Screenshot Details

All screenshots are:
- Full page captures (`fullPage: true`)
- Taken after page load completes (`networkidle`)
- High resolution
- Consistent across all pages

## Using Screenshots

These screenshots are useful for:
- Visual regression testing
- Documentation
- Design reviews
- Bug reports
- Feature demonstrations

## Notes

- Screenshots are not committed to git (excluded via `.gitignore`)
- Run tests locally to generate fresh screenshots
- CI/CD will generate and store screenshots as artifacts
- Screenshots help verify consistent UI across all table pages

---

Last Updated: 2025-12-16
