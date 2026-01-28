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

const MODULE_DIR = path.join(CRAWL_ROOT_DIR, PROCORE_MODULE);
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

async function runETL() {
  console.log(`🚀 ETL for ${PROCORE_MODULE}`);

  const files = await getAllMetadataFiles(PAGES_DIR);
  console.log(`📄 Found ${files.length} metadata files`);

  for (const file of files) {
    const metadata = await fs.readJson(file);

    if (!Array.isArray(metadata.systemActions)) continue;

    for (const action of metadata.systemActions) {
      const label = action.label?.trim();

      // 🚿 Filter noise
      if (!label || label.length < 3) continue;
      if (["More", "Learn More", "Feedback"].includes(label)) continue;

      const { error } = await supabase
        .from("app_system_actions")
        .insert({
          label,
          trigger_type: action.type,
          affects_resource: PROCORE_MODULE,
          source: "interaction"
        });

      if (error) {
        console.error("❌ Action insert failed:", label, error.message);
      } else {
        console.log("✅ Inserted action:", label);
      }
    }
  }

  console.log("🎉 ETL complete");
}

runETL().catch(console.error);
