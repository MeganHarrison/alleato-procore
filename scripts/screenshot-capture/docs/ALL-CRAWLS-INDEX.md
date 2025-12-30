# Procore Screenshot Crawls - Master Index

**Last Updated:** 2025-12-30

## Available Crawls

### 1. Budget Crawl
**Directory:** `procore-budget-crawl/`
**Starting URL:** https://us02.procore.com/webclients/host/companies/562949953443325/projects/562949955214786/tools/budgets
**Status:** Complete
**Documentation:** [BUDGET-VERIFICATION-FINAL-REPORT.md](../../BUDGET-VERIFICATION-FINAL-REPORT.md)

Key features captured:
- Budget list views
- Budget configuration
- Budget templates
- Cost code types
- Forecasting views
- Export and reporting options

### 2. Change Orders Crawl ⭐ NEW
**Directory:** `procore-change-orders-crawl/`
**Starting URL:** https://us02.procore.com/562949954728542/project/change_orders/list
**Status:** Complete
**Documentation:** [CHANGE-ORDERS-CRAWL-STATUS.md](procore-change-orders-crawl/CHANGE-ORDERS-CRAWL-STATUS.md)

Key features captured:
- Change orders list (Prime Contract & Commitments tabs)
- Change order packages (5 packages with details)
- Configuration settings
- Export options (PDF, CSV)
- Reporting views
- Related prime contract views

**Statistics:**
- Total pages: 46
- Screenshots: 93
- Total size: ~1.5MB

### 3. Commitments Crawl
**Directory:** `procore-commitments-crawl/`
**Status:** Complete
**Documentation:** [COMMITMENTS-CRAWL-STATUS.md](COMMITMENTS-CRAWL-STATUS.md)

Key features captured:
- Commitments list views
- Commitment contracts
- Purchase orders
- Subcontracts

### 4. Commitments Support Crawl
**Directory:** `procore-commitments-support-crawl/`
**Status:** Complete

Support documentation for commitments feature.

### 5. Prime Contracts Crawl
**Directory:** `procore-prime-contracts-crawl/`
**Status:** Complete
**Documentation:** [EXECUTION-PLAN-PRIME-CONTRACTS.md](procore-prime-contracts-crawl/EXECUTION-PLAN-PRIME-CONTRACTS.md)

Key features captured:
- Prime contract details
- Contract line items
- Schedule of values
- Change orders integration

### 6. Support Documentation Crawl
**Directory:** `procore-support-crawl/`
**Status:** Complete

General Procore support documentation including:
- Forecasting pages
- Resource tracking guides
- Project financials setup

## Crawl Scripts

### Main Crawl Scripts
Location: `scripts/`

1. **crawl-budget-comprehensive.js** - Budget feature crawler
2. **crawl-change-orders-comprehensive.js** - Change orders crawler ⭐ NEW
3. **crawl-commitments-comprehensive.js** - Commitments crawler
4. **crawl-commitments-tutorials.js** - Commitments support docs
5. **crawl-specific-pages.js** - Custom page crawler

### How to Run a Crawl

```bash
cd /Users/meganharrison/Documents/github/alleato-procore/scripts/screenshot-capture

# Run budget crawl
node scripts/crawl-budget-comprehensive.js

# Run change orders crawl
node scripts/crawl-change-orders-comprehensive.js

# Run commitments crawl
node scripts/crawl-commitments-comprehensive.js
```

### Crawl Configuration

Each crawler uses:
- **Credentials:** From .env or hardcoded
- **Browser:** Playwright Chromium (non-headless)
- **Wait time:** 2000ms between actions
- **Max pages:** 50 (safety limit)
- **Output:** Screenshots, DOM HTML, JSON metadata

## Output Structure

Each crawl directory contains:

```
procore-{feature}-crawl/
├── pages/
│   ├── {page_name}/
│   │   ├── screenshot.png    # Full-page screenshot
│   │   ├── dom.html          # Complete HTML DOM
│   │   └── metadata.json     # Page analysis & links
│   └── {page_name}_dropdown_{n}/  # Dropdown states
│       ├── screenshot.png
│       └── metadata.json
└── reports/
    ├── sitemap-table.md       # Human-readable sitemap
    ├── detailed-report.json   # Complete crawl data
    └── link-graph.json        # Page relationship graph
```

## Metadata Structure

Each `metadata.json` includes:
- **url** - Page URL
- **pageName** - Sanitized page identifier
- **category** - Feature category
- **timestamp** - Capture time
- **analysis** - UI component counts
  - buttons, forms, inputs, tables, modals, etc.
- **tables** - Table structure details
  - headers, row counts, classes
- **links** - All anchor links found
- **clickables** - All interactive elements
- **dropdowns** - Dropdown menus found

## Feature Comparison Matrix

| Feature | List View | Detail View | Tabs | Export | Reports | Config | Workflows |
|---------|-----------|-------------|------|--------|---------|--------|-----------|
| Budget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Change Orders | ✅ | ✅ | ✅ (2) | ✅ | ✅ | ✅ | ✅ |
| Commitments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Prime Contracts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Common Patterns Identified

### Navigation Structure
All features follow similar patterns:
1. Main list/grid view
2. Detail modal/page
3. Configuration settings
4. Export dropdown
5. Reports dropdown
6. Tab-based sub-views

### Table Structures
Common table components:
- Sortable headers
- Row actions (view, edit, delete)
- Bulk selection checkboxes
- Inline editing capabilities
- Status indicators

### Export Options
Standard across features:
- PDF export
- CSV export
- Excel export (some features)
- Email/share options

### Filter Systems
Common filter patterns:
- Saved views
- Quick filters
- Advanced filter builder
- Date range pickers
- Status filters

## Implementation Priority

Based on crawl findings, recommended implementation order:

1. **Budget** (Most foundational)
   - Core financial tracking
   - Cost code structure
   - Budget vs actual

2. **Prime Contracts** (Second)
   - Owner contract management
   - Change order source
   - Revenue tracking

3. **Change Orders** (Third) ⭐ Just crawled
   - Prime contract changes
   - Commitment changes
   - Approval workflows

4. **Commitments** (Fourth)
   - Subcontractor management
   - Purchase orders
   - Cost tracking

## Next Steps

### For Change Orders Implementation

1. **Review captured pages:**
   ```bash
   cd procore-change-orders-crawl/pages
   open list/screenshot.png
   ```

2. **Analyze metadata:**
   ```bash
   cat list/metadata.json | jq .
   ```

3. **Review table structures:**
   Focus on headers in metadata to design database schema

4. **Check workflows:**
   Review package detail pages for approval flow

5. **Plan integrations:**
   Note connections to budget and contracts

## Utilities

### Generate New Crawl
To create a new crawl for a different Procore feature:

1. Copy existing crawler script
2. Update `OUTPUT_DIR` to new feature name
3. Update `START_URL` to feature URL
4. Update `category` in capturePage function
5. Run the script

### Analyze Crawl Results
```bash
# Count pages
find procore-{feature}-crawl/pages -name "screenshot.png" | wc -l

# Find specific page
find procore-{feature}-crawl/pages -name "*budget*"

# Extract all table headers
find procore-{feature}-crawl/pages -name "metadata.json" -exec jq '.analysis.tables[].headers' {} \;
```

## Maintenance

- Crawls should be re-run when Procore updates UI
- Current crawls based on Procore version as of Dec 2024
- Authentication tokens may expire - update credentials as needed
- Max pages limit prevents infinite crawling

## Contact

For questions about crawls or to request new feature crawls, see project documentation.
