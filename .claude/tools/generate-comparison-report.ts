#!/usr/bin/env npx tsx
/**
 * Generate a Comparison Report Template for a Procore Feature
 *
 * Usage:
 *   npx tsx .agents/tools/generate-comparison-report.ts <feature-name>
 *
 * This script:
 * 1. Reads the crawled screenshots and metadata for a feature
 * 2. Analyzes what UI elements Procore has
 * 3. Generates a comparison report template
 *
 * You still need to manually:
 * - Fill in the "Our Implementation" column
 * - Calculate the match score
 * - Document critical issues
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const PLANS_DIR = join(process.cwd(), 'apps/docs/pages/PLANS');

interface PageMetadata {
  url?: string;
  title?: string;
  buttons?: Array<{ text: string; type?: string }>;
  forms?: Array<{ fields: Array<{ name: string; type: string; required?: boolean }> }>;
  tables?: Array<{ columns: string[]; rowCount?: number }>;
  links?: Array<{ text: string; href: string }>;
  dropdowns?: Array<{ label: string; options: string[] }>;
}

async function findCrawlFolder(featurePath: string): Promise<string | null> {
  const entries = await readdir(featurePath);
  const crawlFolder = entries.find(
    (e) => e.includes('crawl') && !e.endsWith('.md')
  );
  if (crawlFolder) {
    const fullPath = join(featurePath, crawlFolder);
    const stats = await stat(fullPath);
    if (stats.isDirectory()) {
      return fullPath;
    }
  }
  return null;
}

async function loadMetadata(crawlPath: string): Promise<Map<string, PageMetadata>> {
  const pagesPath = join(crawlPath, 'pages');
  const metadata = new Map<string, PageMetadata>();

  if (!existsSync(pagesPath)) {
    return metadata;
  }

  const pages = await readdir(pagesPath);

  for (const page of pages) {
    const metadataPath = join(pagesPath, page, 'metadata.json');
    if (existsSync(metadataPath)) {
      try {
        const content = await readFile(metadataPath, 'utf-8');
        const data = JSON.parse(content) as PageMetadata;
        metadata.set(page, data);
      } catch {
        // Skip invalid JSON
      }
    }
  }

  return metadata;
}

function extractUIElements(metadata: Map<string, PageMetadata>) {
  const buttons = new Set<string>();
  const formFields = new Map<string, { type: string; required: boolean }>();
  const tableColumns = new Set<string>();
  const dropdowns = new Map<string, string[]>();

  for (const [, pageData] of metadata) {
    // Extract buttons
    if (pageData.buttons) {
      for (const btn of pageData.buttons) {
        if (btn.text && btn.text.trim()) {
          buttons.add(btn.text.trim());
        }
      }
    }

    // Extract form fields
    if (pageData.forms) {
      for (const form of pageData.forms) {
        if (form.fields) {
          for (const field of form.fields) {
            if (field.name) {
              formFields.set(field.name, {
                type: field.type || 'text',
                required: field.required || false,
              });
            }
          }
        }
      }
    }

    // Extract table columns
    if (pageData.tables) {
      for (const table of pageData.tables) {
        if (table.columns) {
          for (const col of table.columns) {
            if (col && col.trim()) {
              tableColumns.add(col.trim());
            }
          }
        }
      }
    }

    // Extract dropdowns
    if (pageData.dropdowns) {
      for (const dd of pageData.dropdowns) {
        if (dd.label && dd.options) {
          dropdowns.set(dd.label, dd.options);
        }
      }
    }
  }

  return { buttons, formFields, tableColumns, dropdowns };
}

function generateReport(
  featureName: string,
  screenshotCount: number,
  elements: ReturnType<typeof extractUIElements>
): string {
  const { buttons, formFields, tableColumns, dropdowns } = elements;

  const now = new Date().toISOString().split('T')[0];

  let report = `# ${featureName.charAt(0).toUpperCase() + featureName.slice(1).replace(/-/g, ' ')} - Comparison Report

**Generated:** ${now}
**Match Score:** _TBD_ (fill in after audit)
**Grade:** _TBD_

---

## Overview

**Procore Screenshots Analyzed:** ${screenshotCount}
**Buttons Found:** ${buttons.size}
**Form Fields Found:** ${formFields.size}
**Table Columns Found:** ${tableColumns.size}
**Dropdowns Found:** ${dropdowns.size}

---

## Table Columns Comparison

| Procore Column | Our Implementation | Status | Notes |
|----------------|-------------------|--------|-------|
`;

  for (const col of Array.from(tableColumns).sort()) {
    report += `| ${col} | _CHECK_ | ⏳ | |\n`;
  }

  report += `
---

## Form Fields Comparison

| Procore Field | Type | Required | Our Implementation | Status |
|---------------|------|----------|-------------------|--------|
`;

  for (const [name, info] of Array.from(formFields.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    report += `| ${name} | ${info.type} | ${info.required ? 'Yes' : 'No'} | _CHECK_ | ⏳ |\n`;
  }

  report += `
---

## Buttons/Actions Comparison

| Procore Action | Our Implementation | Status |
|----------------|-------------------|--------|
`;

  for (const btn of Array.from(buttons).sort()) {
    report += `| ${btn} | _CHECK_ | ⏳ |\n`;
  }

  if (dropdowns.size > 0) {
    report += `
---

## Dropdowns/Filters Comparison

| Procore Dropdown | Options | Our Implementation | Status |
|------------------|---------|-------------------|--------|
`;

    for (const [label, options] of Array.from(dropdowns.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      const optionList = options.slice(0, 5).join(', ') + (options.length > 5 ? '...' : '');
      report += `| ${label} | ${optionList} | _CHECK_ | ⏳ |\n`;
    }
  }

  report += `
---

## Critical Issues

_Document any blocking issues here_

1.
2.
3.

---

## Score Breakdown

| Category | Weight | Score | Grade |
|----------|--------|-------|-------|
| Table Columns | 35% | __%  | _    |
| Form Fields   | 25% | __%  | _    |
| Actions/Buttons | 15% | __% | _    |
| Calculations  | 15% | __%  | _    |
| Workflow      | 10% | __%  | _    |
| **OVERALL**   | **100%** | **__%** | **_** |

---

## Effort Estimate

| Phase | Tasks | Priority |
|-------|-------|----------|
| Critical Fixes | | 🔴 REQUIRED |
| Missing Fields | | 🟡 IMPORTANT |
| Polish | | 🟢 NICE-TO-HAVE |

---

## Screenshots Reference

Location: \`apps/docs/pages/PLANS/${featureName}/procore-*-crawl/pages/\`

Key pages to review:
- [ ] List view
- [ ] Create form
- [ ] Detail view
- [ ] Edit form
- [ ] Dropdown states

---

## Status Key

- ✅ Implemented correctly
- ⚠️ Partial/different implementation
- ❌ Missing entirely
- ⏳ Not yet audited

---

_Fill in the tables above by comparing screenshots to implementation._
_Update the match score when complete._
`;

  return report;
}

async function main() {
  const featureName = process.argv[2];

  if (!featureName) {
    console.error('Usage: npx tsx generate-comparison-report.ts <feature-name>');
    console.error('\nAvailable features:');

    const features = await readdir(PLANS_DIR);
    for (const f of features.sort()) {
      const fPath = join(PLANS_DIR, f);
      const fStat = await stat(fPath);
      if (fStat.isDirectory()) {
        console.error(`  - ${f}`);
      }
    }

    process.exit(1);
  }

  const featurePath = join(PLANS_DIR, featureName);

  if (!existsSync(featurePath)) {
    console.error(`Feature folder not found: ${featurePath}`);
    process.exit(1);
  }

  console.log(`Analyzing ${featureName}...`);

  // Find crawl folder
  const crawlPath = await findCrawlFolder(featurePath);

  if (!crawlPath) {
    console.error(`No crawl folder found in ${featurePath}`);
    console.log('Creating minimal template...');
  }

  // Load metadata
  const metadata = crawlPath ? await loadMetadata(crawlPath) : new Map();
  console.log(`Found ${metadata.size} pages with metadata`);

  // Extract UI elements
  const elements = extractUIElements(metadata);
  console.log(`Extracted: ${elements.buttons.size} buttons, ${elements.formFields.size} form fields, ${elements.tableColumns.size} table columns`);

  // Count screenshots
  let screenshotCount = 0;
  if (crawlPath) {
    const pagesPath = join(crawlPath, 'pages');
    if (existsSync(pagesPath)) {
      const pages = await readdir(pagesPath);
      for (const page of pages) {
        if (existsSync(join(pagesPath, page, 'screenshot.png'))) {
          screenshotCount++;
        }
      }
    }
  }
  console.log(`Found ${screenshotCount} screenshots`);

  // Generate report
  const report = generateReport(featureName, screenshotCount, elements);

  // Write report
  const outputPath = join(featurePath, 'COMPARISON-REPORT-TEMPLATE.md');
  await writeFile(outputPath, report, 'utf-8');

  console.log(`\n✅ Generated: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Open the template');
  console.log('2. Compare each item against our implementation');
  console.log('3. Fill in Status column (✅/⚠️/❌)');
  console.log('4. Calculate match score');
  console.log('5. Rename to COMPARISON-REPORT.md when complete');
}

main().catch(console.error);
