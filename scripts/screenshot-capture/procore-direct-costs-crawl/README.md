# Procore Direct Costs Crawler

This crawler captures comprehensive screenshots and data from Procore's Direct Costs functionality.

## Purpose

To document and analyze the Direct Costs feature in Procore, including:
- UI layout and components
- Data structures and table formats
- Available actions and workflows
- Export and reporting capabilities
- Integration points with budget and vendors

## Prerequisites

- Node.js installed
- Playwright browser automation library
- Valid Procore credentials (already configured in the script)

## Running the Crawler

From the `scripts/screenshot-capture` directory:

```bash
cd /Users/meganharrison/Documents/github/alleato-procore/scripts/screenshot-capture
node scripts/crawl-direct-costs-comprehensive.js
```

## What It Does

1. **Logs into Procore** using configured credentials
2. **Navigates to the starting URL**: https://us02.procore.com/562949954728542/project/direct_costs
3. **Captures each page**:
   - Full-page screenshot (PNG)
   - Complete DOM structure (HTML)
   - Metadata (JSON) including:
     - Links found
     - Clickable elements
     - Dropdown menus
     - Table structures
     - UI components
4. **Explores dropdowns and menus**:
   - Clicks on "More" menus, export buttons, etc.
   - Captures the opened state
   - Records menu items
5. **Follows links** to related pages (up to 50 pages total)
6. **Generates reports**:
   - Sitemap table (Markdown)
   - Detailed report (JSON)
   - Link graph (JSON)

## Output Structure

```
procore-direct-costs-crawl/
├── pages/
│   ├── direct_costs/
│   │   ├── screenshot.png
│   │   ├── dom.html
│   │   └── metadata.json
│   ├── direct_costs_dropdown_0/
│   │   ├── screenshot.png
│   │   └── metadata.json
│   └── [more pages...]
└── reports/
    ├── sitemap-table.md
    ├── detailed-report.json
    └── link-graph.json
```

## Configuration

Key settings in the script:

- `OUTPUT_DIR`: `./procore-direct-costs-crawl`
- `START_URL`: https://us02.procore.com/562949954728542/project/direct_costs
- `WAIT_TIME`: 2000ms (2 seconds between actions)
- `maxPages`: 50 (safety limit to prevent infinite crawling)

## Safety Features

- Maximum page limit (50 pages)
- Visited URL tracking (no duplicate crawling)
- Error recovery (continues on failures)
- Timeout protection (60-second maximum per page)

## Credentials

The script uses hardcoded Procore credentials:
- Email: bclymer@alleatogroup.com
- Password: [configured in script]

**Note:** These credentials are for the development/testing Procore environment.

## After Crawling

1. Review the generated screenshots in `pages/`
2. Check the reports in `reports/`
3. Update `DIRECT-COSTS-CRAWL-STATUS.md` with findings
4. Use the captured data to inform feature implementation

## Using the Data

### For UI Development
- Reference screenshots for layout and styling
- Identify components needed (tables, modals, dropdowns)
- Understand user workflows and interactions

### For Data Modeling
- Review table structures in metadata JSON files
- Identify required database fields
- Understand relationships between entities

### For Feature Planning
- Analyze available actions and workflows
- Document export and reporting capabilities
- Map integration points with other systems

## Troubleshooting

### Browser doesn't open
- Check that Playwright browsers are installed: `npx playwright install`

### Login fails
- Verify credentials are correct
- Check if 2FA is required
- Ensure network access to Procore

### Pages timeout
- Increase `WAIT_TIME` or page timeout values
- Check internet connection
- Verify Procore service is available

### Too many/few pages captured
- Adjust `maxPages` limit
- Review URL filtering logic in `extractLinks()`
- Check if authentication was successful

## Related Crawlers

- Change Orders: `crawl-change-orders-comprehensive.js`
- Commitments: `crawl-commitments-comprehensive.js`
- Budget: `crawl-budget-comprehensive.js`
- Prime Contracts: `crawl-prime-contracts-comprehensive.js`

## Next Steps

After running the crawler:

1. Analyze the captured pages
2. Document the Direct Costs feature structure
3. Create database schema based on findings
4. Design API endpoints
5. Build frontend components
6. Implement integrations with budget system
