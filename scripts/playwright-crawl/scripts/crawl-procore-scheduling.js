import { chromium } from "playwright";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   ENV
========================================================= */

const {
  PROCORE_EMAIL,
  PROCORE_PASSWORD,
  CRAWL_ROOT_DIR
} = process.env;

if (!PROCORE_EMAIL || !PROCORE_PASSWORD) {
  throw new Error("Missing PROCORE_EMAIL or PROCORE_PASSWORD in .env");
}
if (!CRAWL_ROOT_DIR) {
  throw new Error("Missing CRAWL_ROOT_DIR");
}

const MODULE = "scheduling";
const START_URL =
  "https://us02.procore.com/webclients/host/companies/562949953443325/projects/562949955214786/tools/schedulemgmt";

const MODULE_DIR = path.join(CRAWL_ROOT_DIR, MODULE);
const PAGES_DIR = path.join(MODULE_DIR, "pages", "scheduling");

fs.ensureDirSync(PAGES_DIR);

/* =========================================================
   HELPERS
========================================================= */

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function saveJSON(file, data) {
  await fs.writeJson(file, data, { spaces: 2 });
}

/* =========================================================
   MAIN
========================================================= */

async function run() {
  console.log("🗓️  Crawling Procore Scheduling (interactive)");

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  /* ================= LOGIN ================= */

  console.log("🔐 Logging in…");
  await page.goto("https://login.procore.com/");
  await page.fill('input[type="email"]', PROCORE_EMAIL);
  await page.click('button[type="submit"]');
  await sleep(1500);

  await page.fill('input[type="password"]', PROCORE_PASSWORD);
  await page.click('button[type="submit"]');
  await sleep(6000);

  console.log("✅ Logged in");

  /* ================= NAVIGATE ================= */

  console.log("➡️  Opening Scheduling");
  await page.goto(START_URL, { waitUntil: "networkidle" });
  await sleep(5000);

  /* ================= BASE CAPTURE ================= */

  await page.screenshot({
    path: path.join(PAGES_DIR, "screenshot.png"),
    fullPage: true
  });

  const dom = await page.content();
  await fs.writeFile(path.join(PAGES_DIR, "dom.html"), dom);

  /* ================= FIND TASK ROW ================= */

  console.log("🔍 Locating task rows");

  const taskRow = await page.$(
    '[role="row"]:has([role="gridcell"])'
  );

  if (!taskRow) {
    console.warn("⚠️ No task row found — schedule may be empty");
  }

  const actions = [];

  /* ================= RIGHT CLICK MENU ================= */

  if (taskRow) {
    console.log("🖱️  Opening task context menu");

    await taskRow.click({ button: "right" });
    await sleep(1200);

    const menuItems = await page.evaluate(() => {
      const items = [];
      document
        .querySelectorAll('[role="menuitem"]')
        .forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width && rect.height) {
            items.push({
              label: el.textContent.trim(),
              type: "context_menu"
            });
          }
        });
      return items;
    });

    actions.push(...menuItems);
    await page.keyboard.press("Escape");
    await sleep(500);
  }

  /* ================= DOUBLE CLICK (EDIT TASK) ================= */

  if (taskRow) {
    console.log("✏️  Opening Edit Task modal");

    await taskRow.dblclick();
    await sleep(2000);

    const modalActions = await page.evaluate(() => {
      const buttons = [];
      document
        .querySelectorAll('button')
        .forEach(btn => {
          const rect = btn.getBoundingClientRect();
          if (rect.width && rect.height) {
            buttons.push({
              label: btn.textContent.trim(),
              type: "modal_action"
            });
          }
        });
      return buttons;
    });

    actions.push(...modalActions);

    await page.keyboard.press("Escape");
    await sleep(800);
  }

  /* ================= METADATA ================= */

  const metadata = {
    pageName: "Scheduling",
    category: "scheduling",
    url: START_URL,
    pageId: "scheduling",
    capturedAt: new Date().toISOString(),
    interactionDriven: true,
    systemActions: actions
  };

  await saveJSON(
    path.join(PAGES_DIR, "metadata.json"),
    metadata
  );

  console.log(
    `✅ Captured ${actions.length} real Scheduling actions`
  );

  await browser.close();
}

run().catch(err => {
  console.error("🔥 Scheduling crawl failed:", err);
  process.exit(1);
});
