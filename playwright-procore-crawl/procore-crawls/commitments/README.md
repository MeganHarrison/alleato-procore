# Procore Module: commitments

## Purpose

This directory contains **crawler output and reports** for the Procore **commitments** tool.

This module is part of a larger system designed to:
- Observe Procore functionality
- Extract UI and behavioral intelligence
- Ingest structured data into Supabase
- Enable accurate rebuilding and parity analysis

---

## Directory Structure

```
commitments/
├── pages/
│   └── <page_id>/
│       ├── screenshot.png
│       ├── dom.html
│       └── metadata.json
│
├── reports/
│   ├── sitemap-table.md
│   ├── detailed-report.json
│   └── link-graph.json
│
├── README.md
```

---

## How This Module Is Used

1. A Playwright crawler targets the Procore **commitments** tool
2. Pages are captured into `pages/`
3. Reports are generated into `reports/`
4. The ETL script ingests this data into Supabase using:
   ```bash
   PROCORE_MODULE=commitments node etl/etl_ingest_procore_crawl.js
   ```

---

## Notes

- This folder represents **explicit intent** to crawl and model this Procore tool
- Structure should not be modified by ETL scripts
- Add tool-specific notes here as discoveries are made
