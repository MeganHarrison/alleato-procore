#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";

/* =========================================================
   CONFIG
========================================================= */

const CRAWL_ROOT_DIR = path.resolve("./procore-crawls");

/* =========================================================
   ARG PARSING
========================================================= */

const [, , moduleNameRaw] = process.argv;

if (!moduleNameRaw) {
  console.error("❌ Missing module name.");
  console.error("Usage: node scripts/init-procore-module.js <module-name>");
  process.exit(1);
}

// Normalize module name (kebab-case, lowercase)
const moduleName = moduleNameRaw
  .toLowerCase()
  .replace(/[^a-z0-9\-]/g, "-")
  .replace(/--+/g, "-")
  .replace(/^-|-$/g, "");

const MODULE_DIR = path.join(CRAWL_ROOT_DIR, moduleName);
const PAGES_DIR = path.join(MODULE_DIR, "pages");
const REPORTS_DIR = path.join(MODULE_DIR, "reports");
const README_PATH = path.join(MODULE_DIR, "README.md");

/* =========================================================
   SAFETY CHECKS
========================================================= */

if (fs.existsSync(MODULE_DIR)) {
  console.error(`❌ Module already exists: ${moduleName}`);
  console.error("Aborting to avoid accidental overwrite.");
  process.exit(1);
}

/* =========================================================
   INIT
========================================================= */

async function initModule() {
  console.log(`🚀 Initializing Procore module: ${moduleName}`);

  await fs.ensureDir(PAGES_DIR);
  await fs.ensureDir(REPORTS_DIR);

  const readmeContent = `# Procore Module: ${moduleName}

## Purpose

This directory contains **crawler output and reports** for the Procore **${moduleName}** tool.

This module is part of a larger system designed to:
- Observe Procore functionality
- Extract UI and behavioral intelligence
- Ingest structured data into Supabase
- Enable accurate rebuilding and parity analysis

---

## Directory Structure

\`\`\`
${moduleName}/
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
\`\`\`

---

## How This Module Is Used

1. A Playwright crawler targets the Procore **${moduleName}** tool
2. Pages are captured into \`pages/\`
3. Reports are generated into \`reports/\`
4. The ETL script ingests this data into Supabase using:
   \`\`\`bash
   PROCORE_MODULE=${moduleName} node etl/etl_ingest_procore_crawl.js
   \`\`\`

---

## Notes

- This folder represents **explicit intent** to crawl and model this Procore tool
- Structure should not be modified by ETL scripts
- Add tool-specific notes here as discoveries are made
`;

  await fs.writeFile(README_PATH, readmeContent, "utf8");

  console.log("✅ Module initialized successfully");
  console.log(`📁 Location: ${MODULE_DIR}`);
}

/* =========================================================
   EXECUTE
========================================================= */

initModule().catch(err => {
  console.error("🔥 Module initialization failed:", err);
  process.exit(1);
});
