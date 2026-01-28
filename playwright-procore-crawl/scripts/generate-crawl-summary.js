import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

/**
 * Generate Crawl Summary
 *
 * Creates a structured JSON summary of crawl data optimized for PRP consumption.
 * This bridges the gap between raw crawl output and the PRP creation workflow.
 *
 * Usage:
 *   PROCORE_MODULE=scheduling node scripts/generate-crawl-summary.js
 */

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  PROCORE_MODULE,
  CRAWL_ROOT_DIR = "./procore-crawls"
} = process.env;

if (!PROCORE_MODULE) {
  throw new Error("Missing PROCORE_MODULE env var (e.g. scheduling)");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const MODULE_DIR = path.join(CRAWL_ROOT_DIR, PROCORE_MODULE);
const PAGES_DIR = path.join(MODULE_DIR, "pages");
const REPORTS_DIR = path.join(MODULE_DIR, "reports");
const SPEC_DIR = path.join(MODULE_DIR, "spec");

/**
 * Load domain commands from Supabase
 */
async function loadCommands() {
  const { data, error } = await supabase
    .from("app_commands")
    .select("*")
    .eq("module", PROCORE_MODULE)
    .order("command_key");

  if (error) {
    console.warn("⚠️  Could not load commands from Supabase:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Load system actions from Supabase
 */
async function loadSystemActions() {
  const { data, error } = await supabase
    .from("app_system_actions")
    .select("*")
    .eq("module", PROCORE_MODULE);

  if (error) {
    console.warn("⚠️  Could not load system actions:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Scan pages directory for captured page data
 */
async function scanPages() {
  const pages = [];

  if (!await fs.pathExists(PAGES_DIR)) {
    console.warn(`⚠️  Pages directory not found: ${PAGES_DIR}`);
    return pages;
  }

  const dirs = await fs.readdir(PAGES_DIR);

  for (const dir of dirs) {
    const pageDir = path.join(PAGES_DIR, dir);
    const stat = await fs.stat(pageDir);

    if (!stat.isDirectory()) continue;

    const metadataPath = path.join(pageDir, "metadata.json");
    const screenshotPath = path.join(pageDir, "screenshot.png");
    const domPath = path.join(pageDir, "dom.html");

    const page = {
      name: dir,
      path: pageDir,
      hasMetadata: await fs.pathExists(metadataPath),
      hasScreenshot: await fs.pathExists(screenshotPath),
      hasDom: await fs.pathExists(domPath),
      metadata: null,
      screenshotRelativePath: null
    };

    if (page.hasMetadata) {
      try {
        page.metadata = await fs.readJson(metadataPath);
      } catch (e) {
        console.warn(`⚠️  Could not read metadata for ${dir}:`, e.message);
      }
    }

    if (page.hasScreenshot) {
      page.screenshotRelativePath = `pages/${dir}/screenshot.png`;
    }

    pages.push(page);
  }

  return pages;
}

/**
 * Extract UI components from page metadata
 */
function extractUIComponents(pages) {
  const components = {
    tables: [],
    forms: [],
    dropdowns: [],
    buttons: [],
    modals: []
  };

  for (const page of pages) {
    if (!page.metadata) continue;

    const meta = page.metadata;

    // Extract system actions by type
    if (meta.systemActions) {
      for (const action of meta.systemActions) {
        if (action.type === "context_menu") {
          components.dropdowns.push({
            label: action.label,
            page: page.name,
            type: "context_menu"
          });
        } else if (action.type === "modal_action") {
          components.modals.push({
            label: action.label,
            page: page.name
          });
        } else if (action.type === "button") {
          components.buttons.push({
            label: action.label,
            page: page.name
          });
        }
      }
    }

    // Extract tables if present
    if (meta.tables) {
      components.tables.push(...meta.tables.map(t => ({
        ...t,
        page: page.name
      })));
    }

    // Extract forms if present
    if (meta.forms) {
      components.forms.push(...meta.forms.map(f => ({
        ...f,
        page: page.name
      })));
    }
  }

  return components;
}

/**
 * Build screenshots index
 */
function buildScreenshotsIndex(pages) {
  const screenshots = {};

  for (const page of pages) {
    if (page.hasScreenshot) {
      screenshots[page.name] = page.screenshotRelativePath;
    }
  }

  return screenshots;
}

/**
 * Load existing reports
 */
async function loadReports() {
  const reports = {};

  if (!await fs.pathExists(REPORTS_DIR)) {
    return reports;
  }

  const files = await fs.readdir(REPORTS_DIR);

  for (const file of files) {
    if (file.endsWith(".json")) {
      const filePath = path.join(REPORTS_DIR, file);
      try {
        reports[file.replace(".json", "")] = await fs.readJson(filePath);
      } catch (e) {
        console.warn(`⚠️  Could not read report ${file}:`, e.message);
      }
    }
  }

  return reports;
}

/**
 * Check for spec artifacts
 */
async function checkSpecArtifacts() {
  const artifacts = {
    commands: await fs.pathExists(path.join(SPEC_DIR, "COMMANDS.md")),
    forms: await fs.pathExists(path.join(SPEC_DIR, "FORMS.md")),
    mutations: await fs.pathExists(path.join(SPEC_DIR, "MUTATIONS.md")),
    schema: await fs.pathExists(path.join(SPEC_DIR, "schema.sql"))
  };

  return artifacts;
}

/**
 * Main
 */
(async function run() {
  console.log(`📊 Generating crawl summary for module: ${PROCORE_MODULE}`);

  // Gather all data
  const [commands, systemActions, pages, reports, specArtifacts] = await Promise.all([
    loadCommands(),
    loadSystemActions(),
    scanPages(),
    loadReports(),
    checkSpecArtifacts()
  ]);

  const uiComponents = extractUIComponents(pages);
  const screenshots = buildScreenshotsIndex(pages);

  // Build summary
  const summary = {
    module: PROCORE_MODULE,
    generatedAt: new Date().toISOString(),

    stats: {
      pagesCaptured: pages.length,
      pagesWithMetadata: pages.filter(p => p.hasMetadata).length,
      pagesWithScreenshots: pages.filter(p => p.hasScreenshot).length,
      systemActionsFound: systemActions.length,
      domainCommandsPromoted: commands.length
    },

    specArtifacts,

    commands: commands.map(c => ({
      key: c.command_key,
      label: c.label,
      description: c.description || ""
    })),

    systemActions: systemActions.slice(0, 50).map(a => ({
      label: a.label,
      type: a.trigger_type,
      page: a.page_name
    })),

    uiComponents: {
      tables: uiComponents.tables.slice(0, 20),
      forms: uiComponents.forms.slice(0, 20),
      dropdowns: uiComponents.dropdowns.slice(0, 30),
      buttons: uiComponents.buttons.slice(0, 30),
      modals: uiComponents.modals.slice(0, 20)
    },

    screenshots,

    pages: pages.map(p => ({
      name: p.name,
      url: p.metadata?.url || null,
      category: p.metadata?.category || null,
      capturedAt: p.metadata?.capturedAt || null,
      hasScreenshot: p.hasScreenshot,
      hasDom: p.hasDom,
      systemActionsCount: p.metadata?.systemActions?.length || 0
    })),

    paths: {
      moduleDir: MODULE_DIR,
      pagesDir: PAGES_DIR,
      reportsDir: REPORTS_DIR,
      specDir: SPEC_DIR
    }
  };

  // Write summary
  const outputPath = path.join(MODULE_DIR, "crawl-summary.json");
  await fs.writeJson(outputPath, summary, { spaces: 2 });

  console.log(`\n✅ Crawl summary generated: ${outputPath}`);
  console.log(`\n📈 Summary Stats:`);
  console.log(`   - Pages captured: ${summary.stats.pagesCaptured}`);
  console.log(`   - System actions: ${summary.stats.systemActionsFound}`);
  console.log(`   - Domain commands: ${summary.stats.domainCommandsPromoted}`);
  console.log(`   - Screenshots: ${Object.keys(screenshots).length}`);
  console.log(`\n📁 Spec artifacts available:`);
  console.log(`   - COMMANDS.md: ${specArtifacts.commands ? "✓" : "✗"}`);
  console.log(`   - FORMS.md: ${specArtifacts.forms ? "✓" : "✗"}`);
  console.log(`   - MUTATIONS.md: ${specArtifacts.mutations ? "✓" : "✗"}`);
  console.log(`   - schema.sql: ${specArtifacts.schema ? "✓" : "✗"}`);
})();
