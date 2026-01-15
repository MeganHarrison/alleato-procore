#!/usr/bin/env npx tsx
/**
 * Sync Feature Tracker to Linear
 *
 * This script creates/updates Linear issues for each Procore feature and page.
 * It uses Claude's Linear MCP integration for the actual API calls.
 *
 * The output is a set of Linear API commands that can be executed via MCP.
 *
 * Usage:
 *   npx tsx sync-to-linear.ts --preview   # Show what would be created
 *   npx tsx sync-to-linear.ts --export    # Export JSON for manual Linear import
 */

import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'tracker.db');
const db = new Database(DB_PATH, { readonly: true });

interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string;
  priority: string;
  status: string;
}

interface Page {
  id: string;
  feature_id: string;
  name: string;
  slug: string;
  page_type: string;
  procore_url: string | null;
  screenshot_path: string | null;
  status: string;
}

interface LinearIssue {
  title: string;
  description: string;
  priority: number; // 0=none, 1=urgent, 2=high, 3=medium, 4=low
  labels: string[];
  parentId?: string;
}

function mapPriority(priority: string): number {
  switch (priority) {
    case 'critical': return 1;
    case 'high': return 2;
    case 'medium': return 3;
    case 'low': return 4;
    default: return 0;
  }
}

function generateFeatureIssue(feature: Feature, pageCount: number, tables: string[]): LinearIssue {
  const tableList = tables.length > 0
    ? `\n\n**Related Tables:**\n${tables.map(t => `- \`${t}\``).join('\n')}`
    : '';

  return {
    title: `[Feature] ${feature.name}`,
    description: `## ${feature.name}

${feature.description || 'No description'}

**Priority:** ${feature.priority}
**Status:** ${feature.status}
**Pages to Implement:** ${pageCount}
${tableList}

---

### Implementation Checklist

- [ ] Review Procore screenshots
- [ ] Design database schema
- [ ] Implement list view
- [ ] Implement create/edit forms
- [ ] Implement detail view
- [ ] Add calculated fields
- [ ] Write E2E tests
- [ ] Verify against Procore

---

*Auto-generated from feature-tracker*`,
    priority: mapPriority(feature.priority),
    labels: ['procore-feature', feature.priority],
  };
}

function generatePageIssue(page: Page, featureName: string): LinearIssue {
  const urlLine = page.procore_url
    ? `**Procore URL:** ${page.procore_url}`
    : '*No Procore URL captured*';

  const screenshotLine = page.screenshot_path
    ? `**Screenshot:** Available in crawl folder`
    : '*No screenshot available*';

  return {
    title: `[Page] ${featureName} - ${page.name}`,
    description: `## ${page.name}

**Feature:** ${featureName}
**Page Type:** ${page.page_type}
**Status:** ${page.status}

${urlLine}
${screenshotLine}

---

### Implementation Notes

_Add implementation notes here_

---

*Auto-generated from feature-tracker*`,
    priority: 4, // Pages inherit from parent feature
    labels: ['procore-page', page.page_type || 'other'],
  };
}

function preview() {
  const features = db.prepare(`
    SELECT * FROM procore_features ORDER BY priority, name
  `).all() as Feature[];

  console.log('\n📋 LINEAR SYNC PREVIEW\n');
  console.log('This would create the following structure in Linear:\n');

  let totalIssues = 0;

  for (const feature of features) {
    const pages = db.prepare(`
      SELECT * FROM procore_pages WHERE feature_id = ? ORDER BY name
    `).all(feature.id) as Page[];

    const tables = db.prepare(`
      SELECT t.id FROM supabase_tables t
      JOIN feature_table_mapping m ON m.table_id = t.id
      WHERE m.feature_id = ?
    `).all(feature.id) as { id: string }[];

    const issue = generateFeatureIssue(feature, pages.length, tables.map(t => t.id));

    console.log(`📦 ${issue.title}`);
    console.log(`   Priority: ${['none', 'urgent', 'high', 'medium', 'low'][issue.priority]}`);
    console.log(`   Labels: ${issue.labels.join(', ')}`);
    console.log(`   Sub-issues: ${pages.length} pages`);
    totalIssues++;

    // Show first few pages
    for (const page of pages.slice(0, 3)) {
      const pageIssue = generatePageIssue(page, feature.name);
      console.log(`   └─ ${pageIssue.title}`);
      totalIssues++;
    }
    if (pages.length > 3) {
      console.log(`   └─ ... and ${pages.length - 3} more`);
      totalIssues += pages.length - 3;
    }
    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`Total issues to create: ${totalIssues}`);
  console.log('='.repeat(50));
  console.log('\nRun with --export to generate importable JSON');
}

function exportToJson() {
  const features = db.prepare(`
    SELECT * FROM procore_features ORDER BY priority, name
  `).all() as Feature[];

  const output: {
    features: Array<{
      issue: LinearIssue;
      pages: LinearIssue[];
      tables: string[];
    }>;
    metadata: {
      exportedAt: string;
      totalFeatures: number;
      totalPages: number;
    };
  } = {
    features: [],
    metadata: {
      exportedAt: new Date().toISOString(),
      totalFeatures: features.length,
      totalPages: 0,
    }
  };

  for (const feature of features) {
    const pages = db.prepare(`
      SELECT * FROM procore_pages WHERE feature_id = ? ORDER BY name
    `).all(feature.id) as Page[];

    const tables = db.prepare(`
      SELECT t.id FROM supabase_tables t
      JOIN feature_table_mapping m ON m.table_id = t.id
      WHERE m.feature_id = ?
    `).all(feature.id) as { id: string }[];

    const featureIssue = generateFeatureIssue(feature, pages.length, tables.map(t => t.id));
    const pageIssues = pages.map(p => generatePageIssue(p, feature.name));

    output.features.push({
      issue: featureIssue,
      pages: pageIssues,
      tables: tables.map(t => t.id),
    });

    output.metadata.totalPages += pages.length;
  }

  const outPath = join(__dirname, 'linear-export.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n✓ Exported to ${outPath}`);
  console.log(`  Features: ${output.metadata.totalFeatures}`);
  console.log(`  Pages: ${output.metadata.totalPages}`);
  console.log(`\nYou can use this JSON to create issues in Linear via the API or import tool.`);
}

function showHelp() {
  console.log(`
Sync Feature Tracker to Linear

Usage:
  npx tsx sync-to-linear.ts --preview   Preview what would be created
  npx tsx sync-to-linear.ts --export    Export JSON for Linear import

This script generates Linear issues from the feature tracker database.
Each Procore feature becomes a parent issue, with child issues for each page.
`);
}

// Main
const args = process.argv.slice(2);

if (args.includes('--preview')) {
  preview();
} else if (args.includes('--export')) {
  exportToJson();
} else {
  showHelp();
}

db.close();
