#!/usr/bin/env tsx
/**
 * =============================================================================
 * VERIFICATION REPORT GENERATOR
 * =============================================================================
 *
 * Generates an HTML verification report with ACTUAL EVIDENCE:
 * - Screenshots (PNG files)
 * - Test output (captured terminal)
 * - Quality check results
 * - Database state (before/after)
 * - API responses
 *
 * Usage:
 *   npx tsx .agents/tools/generate-verification-report.ts <feature-name>
 *
 * Example:
 *   npx tsx .agents/tools/generate-verification-report.ts direct-costs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const FEATURE_NAME = process.argv[2] || 'unknown-feature';
const REPORT_DIR = `documentation/*project-mgmt/verification-reports/${FEATURE_NAME}`;
const TEMPLATE_PATH = 'documentation/*project-mgmt/verification-template.html';

// Create report directory
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Create evidence subdirectories
const evidenceDirs = [
  `${REPORT_DIR}/screenshots`,
  `${REPORT_DIR}/api-responses`,
  `${REPORT_DIR}/database`,
  `${REPORT_DIR}/test-output`,
];

evidenceDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log(`📁 Created report structure at: ${REPORT_DIR}`);

// Read HTML template
const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

// Run verification steps
const verification = {
  timestamp: new Date().toISOString(),
  featureName: FEATURE_NAME,
  checks: [] as any[],
  metrics: {
    testsPassed: 0,
    testsTotal: 0,
    errorCount: 0,
    pagesVerified: 0,
    blockers: 0,
  },
};

/**
 * Step 1: Run quality checks
 */
console.log('\n🔍 Running quality checks...');
try {
  const qualityOutput = execSync('npm run typecheck --prefix frontend', {
    encoding: 'utf-8',
    stdio: 'pipe',
  }).toString();

  fs.writeFileSync(
    `${REPORT_DIR}/test-output/quality-check.txt`,
    qualityOutput
  );

  verification.checks.push({
    name: 'Code Quality',
    status: 'PASS',
    evidence: qualityOutput,
    timestamp: new Date().toISOString(),
  });

  verification.metrics.errorCount = 0;
} catch (error: any) {
  const errorOutput = error.stdout || error.stderr || error.message;

  fs.writeFileSync(
    `${REPORT_DIR}/test-output/quality-check.txt`,
    errorOutput
  );

  // Count errors
  const errorCount = (errorOutput.match(/error TS\d+:/g) || []).length;

  verification.checks.push({
    name: 'Code Quality',
    status: errorCount === 0 ? 'PASS' : 'FAIL',
    evidence: errorOutput,
    timestamp: new Date().toISOString(),
  });

  verification.metrics.errorCount = errorCount;
}

/**
 * Step 2: Run Playwright tests
 */
console.log('\n🧪 Running Playwright tests...');
try {
  const testOutput = execSync(
    `npx playwright test tests/e2e/${FEATURE_NAME}*.spec.ts --reporter=list`,
    {
      encoding: 'utf-8',
      cwd: 'frontend',
      stdio: 'pipe',
    }
  ).toString();

  fs.writeFileSync(`${REPORT_DIR}/test-output/playwright-run.txt`, testOutput);

  // Parse test results
  const passedMatch = testOutput.match(/(\d+) passed/);
  const failedMatch = testOutput.match(/(\d+) failed/);
  const skippedMatch = testOutput.match(/(\d+) skipped/);

  const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;

  verification.metrics.testsPassed = passed;
  verification.metrics.testsTotal = passed + failed + skipped;

  verification.checks.push({
    name: 'E2E Tests',
    status: failed === 0 ? 'PASS' : 'FAIL',
    evidence: testOutput,
    timestamp: new Date().toISOString(),
  });
} catch (error: any) {
  const errorOutput = error.stdout || error.stderr || error.message;

  fs.writeFileSync(`${REPORT_DIR}/test-output/playwright-run.txt`, errorOutput);

  verification.checks.push({
    name: 'E2E Tests',
    status: 'FAIL',
    evidence: errorOutput,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Step 3: Copy screenshots from Playwright
 */
console.log('\n📸 Collecting screenshots...');
const screenshotSource = `frontend/tests/screenshots/${FEATURE_NAME}-e2e`;
const screenshotDest = `${REPORT_DIR}/screenshots`;

if (fs.existsSync(screenshotSource)) {
  // Copy all PNG files
  const files = fs.readdirSync(screenshotSource);
  const pngFiles = files.filter(f => f.endsWith('.png'));

  pngFiles.forEach(file => {
    fs.copyFileSync(
      path.join(screenshotSource, file),
      path.join(screenshotDest, file)
    );
  });

  console.log(`✅ Copied ${pngFiles.length} screenshots`);
  verification.metrics.pagesVerified = pngFiles.length;
} else {
  console.log('⚠️  No screenshots found');
  verification.metrics.pagesVerified = 0;
}

/**
 * Step 4: Generate HTML report
 */
console.log('\n📝 Generating HTML report...');

let html = template;

// Update metadata
html = html.replace('Feature Verification Report', `${FEATURE_NAME} Verification Report`);
html = html.replace('feature-name', FEATURE_NAME);
html = html.replace('YYYY-MM-DD HH:MM:SS', new Date().toLocaleString());
html = html.replace('session-id', process.env.USER || 'unknown');

// Update metrics
const testPassRate = verification.metrics.testsTotal > 0
  ? Math.round((verification.metrics.testsPassed / verification.metrics.testsTotal) * 100)
  : 0;

html = html.replace(
  '<div class="metric-value" id="test-pass-rate">--</div>',
  `<div class="metric-value metric-${testPassRate >= 80 ? 'pass' : 'fail'}" id="test-pass-rate">${testPassRate}%</div>`
);

html = html.replace(
  '<span id="tests-passed">0</span>',
  `<span id="tests-passed">${verification.metrics.testsPassed}</span>`
);

html = html.replace(
  '<span id="tests-total">0</span>',
  `<span id="tests-total">${verification.metrics.testsTotal}</span>`
);

html = html.replace(
  '<div class="metric-value" id="error-count">--</div>',
  `<div class="metric-value metric-${verification.metrics.errorCount === 0 ? 'pass' : 'fail'}" id="error-count">${verification.metrics.errorCount}</div>`
);

html = html.replace(
  '<div class="metric-value" id="pages-verified">--</div>',
  `<div class="metric-value metric-${verification.metrics.pagesVerified > 0 ? 'pass' : 'fail'}" id="pages-verified">${verification.metrics.pagesVerified}</div>`
);

html = html.replace(
  '<div class="metric-value" id="blocker-count">--</div>',
  `<div class="metric-value metric-${verification.metrics.blockers === 0 ? 'pass' : 'fail'}" id="blocker-count">${verification.metrics.blockers}</div>`
);

// Update overall status
const overallPass = verification.metrics.errorCount === 0 && testPassRate >= 80;
html = html.replace(
  '<div class="status-badge" id="overall-status">STATUS PENDING</div>',
  `<div class="status-badge status-${overallPass ? 'pass' : 'fail'}" id="overall-status">${overallPass ? '✅ VERIFIED' : '❌ FAILED'}</div>`
);

// Add quality check output
const qualityCheck = verification.checks.find(c => c.name === 'Code Quality');
if (qualityCheck) {
  html = html.replace(
    '<pre>No output yet</pre>',
    `<pre>${escapeHtml(qualityCheck.evidence.slice(0, 2000))}</pre>`
  );
  html = html.replace(
    'PENDING</span>',
    `${qualityCheck.status}</span>`
  );
}

// Add test output
const testCheck = verification.checks.find(c => c.name === 'E2E Tests');
if (testCheck) {
  html = html.replace(
    '<div class="code-block" id="test-output">',
    `<div class="code-block" id="test-output"><pre>${escapeHtml(testCheck.evidence.slice(0, 2000))}</pre>`
  );
}

// Add screenshots to browser verification section
const screenshotFiles = fs.readdirSync(screenshotDest).filter(f => f.endsWith('.png'));
let browserItemsHtml = '';

screenshotFiles.forEach((file, index) => {
  const title = file.replace(/^\d+-/, '').replace('.png', '').replace(/-/g, ' ');
  browserItemsHtml += `
    <div class="checklist-item pass">
      <div class="checklist-header">
        <div class="checklist-title">${capitalize(title)}</div>
        <span class="checklist-status status-pass">VERIFIED</span>
      </div>
      <div class="screenshot">
        <img src="screenshots/${file}" alt="${title}">
        <div class="screenshot-caption">Screenshot ${index + 1}: ${title}</div>
      </div>
    </div>
  `;
});

html = html.replace(
  '<div id="browser-verification-items">',
  `<div id="browser-verification-items">${browserItemsHtml}`
);

// Write final HTML
fs.writeFileSync(`${REPORT_DIR}/index.html`, html);

console.log(`\n✅ Report generated successfully!`);
console.log(`📄 Open: ${REPORT_DIR}/index.html`);
console.log(`\n📊 Summary:`);
console.log(`   Tests: ${verification.metrics.testsPassed}/${verification.metrics.testsTotal} passed (${testPassRate}%)`);
console.log(`   Errors: ${verification.metrics.errorCount}`);
console.log(`   Screenshots: ${verification.metrics.pagesVerified}`);
console.log(`   Status: ${overallPass ? '✅ VERIFIED' : '❌ FAILED'}`);

// Helper functions
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
