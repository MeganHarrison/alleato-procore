# Procore Drawings Feature Crawl

Comprehensive documentation and UI capture for the Procore Drawings feature, used to guide Alleato-Procore implementation.

## Overview

This crawl captures the Procore Drawings documentation from the v2 support site, including:
- Tutorial pages
- Feature documentation
- UI screenshots
- Content structure analysis
- Network API discovery

## Enhanced Crawler Features (v2)

This crawler includes three major improvements:

### 1. Network Request Capture
- Intercepts XHR/fetch requests during page navigation
- Captures API endpoints, methods, and response schemas
- Generates `inferred-api-map.json` and `inferred-api-map.md`

### 2. Resume/Idempotency
- Saves state to `visitedUrls.json` and `crawl-manifest.json`
- Can resume interrupted crawls without re-capturing pages
- Skips already-captured URLs automatically

### 3. Page Role Classification
- Classifies each page as: `list`, `detail`, `create`, `edit`, `settings`, `tutorial`, `overview`, etc.
- Adds confidence level (`high`, `medium`, `low`) to classifications
- Enables better schema inference for downstream agents

## Running the Crawler

```bash
cd scripts/screenshot-capture

# Run with visible browser (default)
node scripts/crawl-drawings-tutorials-v2.js

# Run headless
HEADLESS=true node scripts/crawl-drawings-tutorials-v2.js

# Resume an interrupted crawl (automatic - just re-run)
node scripts/crawl-drawings-tutorials-v2.js
```

## Output Structure

```
crawl-drawings/
├── README.md                  # This file
├── crawl-manifest.json        # Crawl state for resume capability
├── visitedUrls.json           # Visited URLs for deduplication
├── pages/
│   └── {page-name}/
│       ├── screenshot.png     # Full-page screenshot
│       ├── dom.html           # Complete DOM snapshot
│       └── metadata.json      # Page analysis with role classification
└── reports/
    ├── sitemap-table.md       # Visual sitemap with page roles
    ├── detailed-report.json   # Complete metadata for all pages
    ├── link-graph.json        # Page relationships
    ├── summary.json           # Statistics and top pages
    ├── network-requests.json  # Captured API calls (raw)
    ├── inferred-api-map.json  # Deduplicated API endpoints
    └── inferred-api-map.md    # Markdown API reference
```

## Page Metadata Schema

Each captured page includes:

```json
{
  "url": "https://...",
  "pageName": "add-a-drawing",
  "category": "tutorial",
  "pageRole": "tutorial",          // NEW: Role classification
  "roleConfidence": "high",         // NEW: Confidence level
  "analysis": {
    "components": { ... },
    "articleContent": { ... },
    "tables": [ ... ]
  },
  "links": 15,
  "linkDetails": [ ... ],
  "clickables": 8,
  "expandables": 2
}
```

## Using the Output

### For Database Design
- Review table structures in `detailed-report.json`
- Check `inferred-api-map.json` for API response schemas

### For Frontend Development
- Use screenshots in `pages/` as visual reference
- Component inventory in metadata files guides component creation

### For API Planning
- `inferred-api-map.md` lists discovered endpoints
- `network-requests.json` shows request/response patterns

### For Testing
- Page flows documented in `link-graph.json`
- User workflows mapped from navigation patterns

## Configuration

Edit `crawl-drawings-tutorials-v2.js` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `START_URL` | v2.support.procore.com/... | Starting documentation URL |
| `MAX_PAGES` | 100 | Maximum pages to crawl |
| `WAIT_TIME` | 2000 | Milliseconds to wait per page |
| `HEADLESS` | false | Run browser visibly or headless |

## Troubleshooting

**Crawl interrupted?**
Just re-run the script. It will automatically resume from where it stopped.

**Too many/few pages?**
Adjust `MAX_PAGES` in the script.

**Missing content?**
Increase `WAIT_TIME` for slower-loading pages.

**Network requests not captured?**
Ensure the pages make API calls (static documentation may not).
