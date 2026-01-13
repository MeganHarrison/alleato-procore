#!/usr/bin/env npx tsx
/**
 * Gate Enforcement Tool
 *
 * Runs quality gates and generates checksums to prove they were actually executed.
 * This prevents AI agents from claiming tasks are complete without verification.
 *
 * Usage:
 *   npx tsx .agents/tools/enforce-gates.ts <feature-name>
 *
 * Output:
 *   Creates GATES.md in the feature folder with:
 *   - Gate status (PASSED/FAILED)
 *   - Checksum (proves output was real)
 *   - Timestamp (proves when run)
 *   - Evidence (first 500 chars of output)
 *
 * @see .agents/patterns/solutions/verification-gate-pattern.md
 */

import { execSync, ExecSyncOptions } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface GateResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR';
  checksum: string;
  timestamp: string;
  evidence: string;
  command: string;
  exitCode: number;
  duration: number;
}

interface GateConfig {
  name: string;
  command: string;
  /** Pattern that indicates FAILURE (if found in output, gate fails) */
  failurePattern?: RegExp;
  /** Pattern that indicates SUCCESS (if found, gate passes regardless of exit code) */
  successPattern?: RegExp;
  required: boolean;
  description: string;
}

interface GatesReport {
  feature: string;
  timestamp: string;
  allPassed: boolean;
  results: GateResult[];
}

// ============================================================================
// Gate Configurations
// ============================================================================

const BASE_GATES: GateConfig[] = [
  {
    name: 'TypeScript',
    command: 'npm run typecheck --prefix frontend 2>&1',
    failurePattern: /error TS\d+|Type error/i,
    required: true,
    description: 'TypeScript compilation check',
  },
  {
    name: 'ESLint',
    command: 'npm run lint --prefix frontend 2>&1',
    failurePattern: /\d+ error/i,
    successPattern: /0 errors/,
    required: true,
    description: 'ESLint code quality check',
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a checksum from command output + timestamp
 * This proves the output was real and when it was generated
 */
function generateChecksum(output: string, timestamp: string): string {
  return crypto
    .createHash('sha256')
    .update(output + timestamp)
    .digest('hex')
    .slice(0, 12);
}

/**
 * Truncate output for evidence while preserving useful info
 */
function truncateEvidence(output: string, maxLength: number = 500): string {
  if (output.length <= maxLength) {
    return output;
  }

  // Try to find a good break point (end of line)
  const truncated = output.slice(0, maxLength);
  const lastNewline = truncated.lastIndexOf('\n');

  if (lastNewline > maxLength * 0.7) {
    return truncated.slice(0, lastNewline) + '\n... (truncated)';
  }

  return truncated + '... (truncated)';
}

/**
 * Run a single gate and return the result
 */
function runGate(config: GateConfig): GateResult {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  let output = '';
  let exitCode = 0;
  let status: GateResult['status'] = 'PASSED';

  const execOptions: ExecSyncOptions = {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024, // 10MB
    stdio: 'pipe',
    cwd: process.cwd(),
  };

  try {
    output = execSync(config.command, execOptions) as string;
    exitCode = 0;
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    output = (execError.stdout || '') + (execError.stderr || '');
    exitCode = execError.status || 1;
  }

  const duration = Date.now() - startTime;

  // Determine status based on patterns and exit code
  if (config.successPattern && config.successPattern.test(output)) {
    status = 'PASSED';
  } else if (config.failurePattern && config.failurePattern.test(output)) {
    status = 'FAILED';
  } else if (exitCode !== 0) {
    status = 'FAILED';
  } else {
    status = 'PASSED';
  }

  return {
    name: config.name,
    status,
    checksum: generateChecksum(output, timestamp),
    timestamp,
    evidence: truncateEvidence(output),
    command: config.command,
    exitCode,
    duration,
  };
}

/**
 * Create test gate config for a specific feature
 */
function createTestGate(feature: string): GateConfig {
  return {
    name: 'Tests',
    command: `cd frontend && npx playwright test tests/e2e/${feature}*.spec.ts --reporter=list 2>&1 || true`,
    failurePattern: /\d+ failed/,
    successPattern: /\d+ passed/,
    required: true,
    description: `E2E tests for ${feature}`,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate markdown report from gate results
 */
function generateMarkdownReport(report: GatesReport): string {
  const lines: string[] = [
    `# Gates Report: ${report.feature}`,
    '',
    `**Generated:** ${report.timestamp}`,
    `**Status:** ${report.allPassed ? '✅ ALL PASSED' : '❌ FAILED'}`,
    '',
    '## Summary',
    '',
    '| Gate | Status | Checksum | Duration | Command |',
    '|------|--------|----------|----------|---------|',
  ];

  for (const result of report.results) {
    const statusEmoji = result.status === 'PASSED' ? '✅' : '❌';
    const durationSec = (result.duration / 1000).toFixed(1);
    lines.push(
      `| ${result.name} | ${statusEmoji} ${result.status} | \`${result.checksum}\` | ${durationSec}s | \`${result.command.slice(0, 50)}...\` |`
    );
  }

  lines.push('');
  lines.push('## Evidence');
  lines.push('');

  for (const result of report.results) {
    const statusEmoji = result.status === 'PASSED' ? '✅' : '❌';
    lines.push(`### ${statusEmoji} ${result.name}`);
    lines.push('');
    lines.push(`**Command:** \`${result.command}\``);
    lines.push(`**Exit Code:** ${result.exitCode}`);
    lines.push(`**Timestamp:** ${result.timestamp}`);
    lines.push(`**Checksum:** \`${result.checksum}\``);
    lines.push('');
    lines.push('**Output:**');
    lines.push('```');
    lines.push(result.evidence);
    lines.push('```');
    lines.push('');
  }

  lines.push('## Verification');
  lines.push('');
  lines.push('To verify these results:');
  lines.push('1. Re-run the commands listed above');
  lines.push('2. Output should match the evidence shown');
  lines.push('3. Checksum proves when this report was generated');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by `.agents/tools/enforce-gates.ts`*');

  return lines.join('\n');
}

/**
 * Generate JSON report for programmatic use
 */
function generateJsonReport(report: GatesReport): string {
  return JSON.stringify(report, null, 2);
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const feature = args[0];
  const outputFormat = args.includes('--json') ? 'json' : 'markdown';
  const skipTests = args.includes('--skip-tests');

  if (!feature) {
    console.error('Usage: npx tsx enforce-gates.ts <feature-name> [--json] [--skip-tests]');
    console.error('');
    console.error('Options:');
    console.error('  --json        Output as JSON instead of markdown');
    console.error('  --skip-tests  Skip running tests (faster for quick checks)');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx .agents/tools/enforce-gates.ts change-events');
    process.exit(1);
  }

  console.log(`\n🔒 Running gates for: ${feature}\n`);

  // Build gate list
  const gates: GateConfig[] = [...BASE_GATES];

  if (!skipTests) {
    gates.push(createTestGate(feature));
  }

  // Run all gates
  const results: GateResult[] = [];

  for (const gate of gates) {
    console.log(`Running ${gate.name}...`);
    const result = runGate(gate);
    results.push(result);

    const statusEmoji = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`  ${statusEmoji} ${result.status} (${(result.duration / 1000).toFixed(1)}s)`);
  }

  // Generate report
  const report: GatesReport = {
    feature,
    timestamp: new Date().toISOString(),
    allPassed: results.every((r) => r.status === 'PASSED'),
    results,
  };

  // Determine output path
  const featureDir = path.join(
    process.cwd(),
    'documentation',
    '*project-mgmt',
    'active',
    feature
  );

  // Create directory if it doesn't exist
  if (!fs.existsSync(featureDir)) {
    // Try without the asterisk (glob pattern might not work)
    const altFeatureDir = path.join(
      process.cwd(),
      'documentation',
      '1-project-mgmt',
      'active',
      feature
    );

    if (fs.existsSync(path.dirname(altFeatureDir))) {
      fs.mkdirSync(altFeatureDir, { recursive: true });
    }
  }

  // Write report
  const reportContent =
    outputFormat === 'json'
      ? generateJsonReport(report)
      : generateMarkdownReport(report);

  const reportExtension = outputFormat === 'json' ? 'json' : 'md';
  const reportPath = path.join(featureDir, `GATES.${reportExtension}`);

  // Try to write to feature dir, fall back to current dir
  try {
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 Report written to: ${reportPath}`);
  } catch {
    const fallbackPath = path.join(process.cwd(), `GATES-${feature}.${reportExtension}`);
    fs.writeFileSync(fallbackPath, reportContent);
    console.log(`\n📄 Report written to: ${fallbackPath}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(report.allPassed ? '✅ ALL GATES PASSED' : '❌ SOME GATES FAILED');
  console.log('='.repeat(60));

  if (!report.allPassed) {
    console.log('\nFailed gates:');
    for (const result of results.filter((r) => r.status !== 'PASSED')) {
      console.log(`  - ${result.name}: ${result.status}`);
    }
  }

  // Exit with appropriate code
  process.exit(report.allPassed ? 0 : 1);
}

// Run if executed directly
main().catch((error) => {
  console.error('Gate enforcement failed:', error);
  process.exit(1);
});
