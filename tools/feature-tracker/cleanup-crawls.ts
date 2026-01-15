#!/usr/bin/env npx tsx
/**
 * Cleanup Crawled Pages
 *
 * Removes noise folders from crawled data:
 * - Dropdown captures (*_dropdown_*)
 * - Numbered ID folders (562949953443325)
 * - Empty or minimal captures
 *
 * Usage:
 *   npx tsx cleanup-crawls.ts --dry-run    # Preview what would be deleted
 *   npx tsx cleanup-crawls.ts --execute    # Actually delete
 */

import { readdir, stat, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '../..');
const PLANS_DIR = join(PROJECT_ROOT, 'apps/docs/pages/PLANS');

// Patterns to delete
const DELETE_PATTERNS = [
  /^\d{15,}$/,           // Numbered IDs like 562949953443325
  /_dropdown_\d+$/,      // Dropdown captures
];

// Always skip these feature folders
const SKIP_FEATURES = ['procore-support-docs'];

interface CleanupStats {
  scanned: number;
  toDelete: number;
  bytesToFree: number;
  folders: string[];
}

async function getDirSize(dirPath: string): Promise<number> {
  let size = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += await getDirSize(fullPath);
      } else {
        const fileStat = await stat(fullPath);
        size += fileStat.size;
      }
    }
  } catch {
    // Ignore errors
  }
  return size;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function shouldDelete(pageName: string): boolean {
  return DELETE_PATTERNS.some(pattern => pattern.test(pageName));
}

async function findFoldersToDelete(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    scanned: 0,
    toDelete: 0,
    bytesToFree: 0,
    folders: [],
  };

  const features = await readdir(PLANS_DIR);

  for (const feature of features) {
    if (SKIP_FEATURES.includes(feature)) continue;

    const featurePath = join(PLANS_DIR, feature);
    const featureStat = await stat(featurePath);
    if (!featureStat.isDirectory()) continue;

    // Find crawl folders
    const featureEntries = await readdir(featurePath);
    for (const entry of featureEntries) {
      if (!entry.includes('crawl') || entry.endsWith('.md')) continue;

      const crawlPath = join(featurePath, entry);
      if (!existsSync(crawlPath)) continue;

      try {
        const crawlStat = await stat(crawlPath);
        if (!crawlStat.isDirectory()) continue;
      } catch {
        continue;
      }

      const pagesPath = join(crawlPath, 'pages');
      if (!existsSync(pagesPath)) continue;

      const pages = await readdir(pagesPath);

      for (const page of pages) {
        stats.scanned++;

        if (shouldDelete(page)) {
          const pagePath = join(pagesPath, page);
          const size = await getDirSize(pagePath);

          stats.toDelete++;
          stats.bytesToFree += size;
          stats.folders.push(pagePath);
        }
      }
    }
  }

  return stats;
}

async function executeCleanup(folders: string[]): Promise<void> {
  let deleted = 0;
  let errors = 0;

  for (const folder of folders) {
    try {
      await rm(folder, { recursive: true });
      deleted++;
      process.stdout.write(`\r  Deleted ${deleted}/${folders.length}`);
    } catch (err) {
      errors++;
      console.error(`\n  Error deleting ${folder}: ${err}`);
    }
  }

  console.log(`\n  ✓ Deleted ${deleted} folders (${errors} errors)`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const execute = args.includes('--execute');

  if (!dryRun && !execute) {
    console.log(`
Cleanup Crawled Pages

Usage:
  npx tsx cleanup-crawls.ts --dry-run    Preview what would be deleted
  npx tsx cleanup-crawls.ts --execute    Actually delete the folders

This removes:
  - Dropdown captures (*_dropdown_*)
  - Numbered ID folders (like 562949953443325)
`);
    return;
  }

  console.log('\nScanning crawled pages...\n');

  const stats = await findFoldersToDelete();

  console.log('='.repeat(50));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(50));
  console.log(`Pages scanned:    ${stats.scanned}`);
  console.log(`Pages to delete:  ${stats.toDelete}`);
  console.log(`Space to free:    ${formatBytes(stats.bytesToFree)}`);
  console.log('='.repeat(50));

  if (stats.toDelete === 0) {
    console.log('\nNo folders to clean up!');
    return;
  }

  // Show sample of folders
  console.log('\nSample folders to delete:');
  for (const folder of stats.folders.slice(0, 10)) {
    // Show relative path
    const rel = folder.replace(PLANS_DIR + '/', '');
    console.log(`  - ${rel}`);
  }
  if (stats.folders.length > 10) {
    console.log(`  ... and ${stats.folders.length - 10} more`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] No files were deleted.');
    console.log('Run with --execute to actually delete.');
  } else if (execute) {
    console.log('\nDeleting folders...');
    await executeCleanup(stats.folders);
    console.log('\n✓ Cleanup complete!');
    console.log('\nRun `npm run rebuild` to update the tracker database.');
  }
}

main().catch(console.error);
