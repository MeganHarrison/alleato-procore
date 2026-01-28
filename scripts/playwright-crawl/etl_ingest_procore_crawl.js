import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  CRAWL_ROOT_DIR,
  PROCORE_MODULE
} = process.env;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// CRAWL_DIR: absolute path override (new PRPs folder structure)
// Falls back to CRAWL_ROOT_DIR + PROCORE_MODULE for backwards compatibility
const MODULE_DIR = process.env.CRAWL_DIR || path.join(CRAWL_ROOT_DIR, PROCORE_MODULE);
const PAGES_DIR = path.join(MODULE_DIR, "pages");

async function getAllMetadataFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllMetadataFiles(fullPath));
    } else if (entry.name === "metadata.json") {
      files.push(fullPath);
    }
  }
  return files;
}

const NOISE_LABELS = ["More", "Learn More", "Feedback", "SearchCmdK"];

function isNoise(label) {
  if (!label || label.trim().length < 3) return true;
  if (NOISE_LABELS.includes(label.trim())) return true;
  return false;
}

async function insertAction(label, triggerType, source) {
  const trimmed = label?.trim();
  if (isNoise(trimmed)) return;

  const { error } = await supabase
    .from("app_system_actions")
    .insert({
      label: trimmed,
      trigger_type: triggerType,
      affects_resource: PROCORE_MODULE,
      source
    });

  if (error) {
    console.error("❌ Action insert failed:", trimmed, error.message);
  } else {
    console.log("✅ Inserted action:", trimmed, `(${triggerType})`);
  }
}

// V1: metadata.systemActions[] — used by scheduling and earlier crawls
function extractV1(metadata) {
  if (!Array.isArray(metadata.systemActions)) return [];
  return metadata.systemActions.map(a => ({
    label: a.label,
    triggerType: a.type,
    source: "interaction"
  }));
}

// V2: clickableDetails[], dropdownDetails[], menuItems[], tabDetails[], tabName
function extractV2(metadata) {
  const actions = [];

  // Buttons from clickableDetails
  if (Array.isArray(metadata.clickableDetails)) {
    for (const btn of metadata.clickableDetails) {
      if (btn.text) {
        actions.push({ label: btn.text, triggerType: btn.type || "button", source: "clickable" });
      }
    }
  }

  // Menu items from dropdown pages (menuItems at top level)
  if (Array.isArray(metadata.menuItems)) {
    for (const item of metadata.menuItems) {
      if (item.text) {
        actions.push({ label: item.text, triggerType: item.type || "menu-item", source: "dropdown" });
      }
    }
  }

  // Tab name from tab pages (tabName at top level)
  if (metadata.tabName) {
    actions.push({ label: metadata.tabName, triggerType: "tab", source: "tab" });
  }

  // Tabs from tabDetails on main pages
  if (Array.isArray(metadata.tabDetails)) {
    for (const tab of metadata.tabDetails) {
      if (tab.text) {
        actions.push({ label: tab.text, triggerType: "tab", source: "tab-detail" });
      }
    }
  }

  return actions;
}

async function runETL() {
  console.log(`🚀 ETL for ${PROCORE_MODULE}`);

  const files = await getAllMetadataFiles(PAGES_DIR);
  console.log(`📄 Found ${files.length} metadata files`);

  let inserted = 0;
  let skipped = 0;

  for (const file of files) {
    const metadata = await fs.readJson(file);

    // Try V1 first, then V2
    let actions = extractV1(metadata);
    if (actions.length === 0) {
      actions = extractV2(metadata);
    }

    if (actions.length === 0) {
      skipped++;
      continue;
    }

    for (const { label, triggerType, source } of actions) {
      await insertAction(label, triggerType, source);
      if (!isNoise(label?.trim())) inserted++;
    }
  }

  console.log(`\n📊 Summary: ${inserted} actions inserted, ${skipped} files had no actions`);
  console.log("🎉 ETL complete");
}

runETL().catch(console.error);
