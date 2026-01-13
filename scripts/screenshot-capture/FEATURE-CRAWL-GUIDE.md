# Feature Crawl Workflow - Quick Start Guide

Streamlined workflow for capturing and analyzing Procore features using the `/feature-crawl` slash command.

## 🚀 Quick Start

### Option 1: Use Slash Command (Recommended)

Simply type:

```bash
/feature-crawl <feature-name> <procore-url>
```

**Examples:**

```bash
/feature-crawl submittals https://us02.procore.com/562949954728542/project/submittals
/feature-crawl rfis https://us02.procore.com/562949954728542/project/rfis
/feature-crawl punch-list https://us02.procore.com/562949954728542/project/punch_list
```

The slash command will:
1. ✅ Generate a custom crawl script
2. ✅ Create output directory structure
3. ✅ Execute the crawl
4. ✅ Generate comprehensive reports
5. ✅ Provide implementation guidance

### Option 2: Manual Script Generation

If you prefer manual control:

```bash
cd scripts/screenshot-capture
node scripts/generate-crawler.js <feature-name> <start-url> [project-id]
```

**Example:**

```bash
node scripts/generate-crawler.js submittals https://us02.procore.com/562949954728542/project/submittals
```

This generates:
- `scripts/crawl-submittals-comprehensive.js` - The crawler script
- `documentation/*project-mgmt/active/submittals/crawl-submittals/README.md` - Documentation

Then run the crawler:

```bash
node scripts/crawl-submittals-comprehensive.js
```

## 📂 Output Structure

Every crawl generates this standardized structure:

```
documentation/*project-mgmt/in-progress/<feature-name>/
├── crawl-<feature-name>/
│   ├── README.md                          # Crawler documentation
│   ├── <FEATURE>-CRAWL-STATUS.md         # Detailed analysis report
│   ├── pages/                             # Captured pages
│   │   ├── <feature>_main/
│   │   │   ├── screenshot.png            # Full-page screenshot (~1MB)
│   │   │   ├── dom.html                  # Complete DOM snapshot (~500KB)
│   │   │   └── metadata.json             # Extracted data (~40KB)
│   │   ├── <feature>_main_dropdown_0/    # Dropdown states
│   │   ├── <item-id>/                    # Individual items
│   │   └── ... (40-50 more pages)
│   └── reports/
│       ├── sitemap-table.md              # Visual sitemap with links
│       ├── detailed-report.json          # Complete metadata
│       └── link-graph.json               # Navigation relationships
```

## 📊 What Gets Captured

For each page, the crawler captures:

### Screenshots
- Full-page PNG screenshots
- Dropdown and menu states
- Modal dialogs (when detected)
- Sort variations
- Filter panels

### DOM Snapshots
- Complete HTML structure
- Inline styles and scripts
- Data attributes
- Form structures

### Metadata Analysis
- **Links**: All navigation links with text and URLs
- **Clickables**: Buttons, actions, and interactive elements
- **Dropdowns**: Menu items and options
- **Tables**: Headers, row counts, structure
- **Forms**: Input fields, validation, labels
- **Components**: Inventory of UI elements (buttons, modals, tabs, etc.)

### Reports
- **Sitemap Table**: Quick reference with links to all screenshots
- **Detailed Report**: Complete JSON with all extracted data
- **Link Graph**: Navigation relationships and flow

## 🎯 Use Cases

### 1. Planning New Feature Implementation

```bash
/feature-crawl submittals https://us02.procore.com/562949954728542/project/submittals
```

**Deliverables:**
- UI screenshots for design reference
- Database schema recommendations
- API endpoint requirements
- Frontend component inventory

### 2. Analyzing Existing Feature

```bash
/feature-crawl change-orders https://us02.procore.com/562949954728542/project/change_events
```

**Deliverables:**
- Complete feature documentation
- Workflow diagrams
- Data model insights
- Integration points

### 3. Competitive Analysis

```bash
/feature-crawl daily-log https://us02.procore.com/562949954728542/project/daily_log
```

**Deliverables:**
- Feature comparison data
- UX patterns and flows
- Component patterns
- Best practices

## 🛠️ Available Scripts

### Main Scripts

| Script | Purpose | Example |
|--------|---------|---------|
| `generate-crawler.js` | Generate custom crawler | `node scripts/generate-crawler.js submittals <url>` |
| `crawl-*-comprehensive.js` | Feature-specific crawler | `node scripts/crawl-submittals-comprehensive.js` |

### Existing Crawlers

Pre-built crawlers for reference:
- `crawl-budget-comprehensive.js`
- `crawl-prime-contracts-comprehensive.js`
- `crawl-commitments-comprehensive.js`
- `crawl-change-orders-comprehensive.js`
- `crawl-direct-costs-comprehensive.js`

## 🔧 Configuration

### Default Settings

```javascript
const WAIT_TIME = 2000;        // Wait 2 seconds between actions
const maxPages = 50;           // Maximum pages to crawl
const PROJECT_ID = "562949954728542";  // Default project
```

### Customization

Edit the generated script to:
- Change viewport size: `viewport: { width: 1920, height: 1080 }`
- Adjust timeouts: `timeout: 60000` (60 seconds)
- Modify page limits: `maxPages = 100`
- Add custom selectors for specific elements

## 🔐 Authentication

Crawlers use Procore credentials from:
1. `scripts/screenshot-capture/auth.json` (if exists)
2. Hardcoded credentials in script

**To update auth:**

```bash
cd scripts/screenshot-capture
npm run auth
```

This opens a browser where you log in to Procore. Credentials are saved for future crawls.

## 📈 Best Practices

### Before Crawling

1. ✅ Ensure you're logged into Procore in a browser
2. ✅ Verify the start URL is accessible
3. ✅ Check project ID matches your target project
4. ✅ Clear any existing output directory if re-crawling

### During Crawling

1. 🚫 Don't interrupt the browser process
2. 🚫 Don't navigate the browser manually
3. ✅ Monitor console output for errors
4. ✅ Watch for authentication failures

### After Crawling

1. ✅ Review screenshots for completeness
2. ✅ Check metadata files for data quality
3. ✅ Generate status report from findings
4. ✅ Document any missing features or edge cases
5. ✅ Create implementation tasks based on analysis

## 🐛 Troubleshooting

### Common Issues

#### Browser doesn't open
```bash
npx playwright install
```

#### Login fails
- Check credentials in script
- Verify 2FA is not required
- Ensure network access to Procore

#### Pages timeout
- Increase `WAIT_TIME` in script
- Check internet connection
- Verify Procore is available

#### Too few pages captured
- Check URL filtering logic
- Verify authentication succeeded
- Review console output for errors

#### Missing dropdowns
- Some dropdowns require specific data
- Capture these manually
- Add custom logic to script

### Debug Mode

To run crawler with more logging:

```javascript
// Add to main() function
const browser = await chromium.launch({
  headless: false,  // See browser actions
  slowMo: 500       // Slow down for debugging
});
```

## 📖 Examples

### Example 1: Submittals Feature

```bash
/feature-crawl submittals https://us02.procore.com/562949954728542/project/submittals
```

**Expected Output:**
- ~45 pages captured
- Submittal list view
- Individual submittal details (10-15 items)
- Create/edit forms
- Filter and export options
- Configuration settings

### Example 2: RFIs Feature

```bash
/feature-crawl rfis https://us02.procore.com/562949954728542/project/rfis
```

**Expected Output:**
- ~40 pages captured
- RFI list view
- Individual RFI details (10-15 items)
- Response workflows
- Attachment handling
- Status tracking

### Example 3: Meetings Feature

```bash
/feature-crawl meetings https://us02.procore.com/562949954728542/project/meetings
```

**Expected Output:**
- ~35 pages captured
- Meeting list
- Meeting details
- Agenda management
- Attendee tracking
- Minutes and notes

## 🎓 Learning from Examples

Study existing crawl outputs:

```bash
# Direct Costs example
open documentation/*project-mgmt/in-progress/direct-costs/crawl-direct-costs/

# Budget example (from screenshot-capture/procore-budget-crawl)
open scripts/screenshot-capture/procore-budget-crawl/

# Prime Contracts example
open scripts/screenshot-capture/procore-prime-contracts-crawl/
```

## 🚀 Advanced Usage

### Multi-Project Crawling

Crawl the same feature across multiple projects:

```bash
/feature-crawl submittals https://us02.procore.com/PROJECT_ID_1/project/submittals
/feature-crawl submittals https://us02.procore.com/PROJECT_ID_2/project/submittals
```

### Custom Analysis

Add custom analysis to generated scripts:

```javascript
// In analyzePageStructure()
const customAnalysis = {
  specificElements: document.querySelectorAll('.custom-class').length,
  dataAttributes: Array.from(document.querySelectorAll('[data-*]'))
    .map(el => Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('data-'))
    )
};
```

### Integration with CI/CD

Run crawlers automatically:

```bash
# package.json
{
  "scripts": {
    "crawl:submittals": "node scripts/crawl-submittals-comprehensive.js",
    "crawl:all": "npm run crawl:submittals && npm run crawl:rfis"
  }
}
```

## 📋 Checklist

Use this checklist for each feature crawl:

- [ ] Feature name identified and sanitized
- [ ] Start URL confirmed and accessible
- [ ] Crawl script generated
- [ ] Output directory created
- [ ] Crawler executed successfully
- [ ] Screenshots reviewed for quality
- [ ] Metadata validated
- [ ] Reports generated
- [ ] Status report created
- [ ] README updated
- [ ] Implementation insights documented
- [ ] Next steps identified

## 🤝 Contributing

To improve the crawler system:

1. **Add new extraction logic** to template
2. **Enhance metadata analysis** for specific elements
3. **Create specialized crawlers** for complex features
4. **Document patterns** found across features
5. **Share findings** with team

## 📚 Related Documentation

- [Screenshot Capture README](./README.md)
- [Index of Crawls](./INDEX.md)
- [Direct Costs Example](../../documentation/*project-mgmt/in-progress/direct-costs/crawl-direct-costs/README.md)

---

**Last Updated:** 2026-01-10
**Version:** 1.0.0
**Maintained by:** Alleato Development Team
