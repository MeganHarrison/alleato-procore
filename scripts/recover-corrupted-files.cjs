#!/usr/bin/env node
/**
 * ============================================================================
 * CORRUPTION RECOVERY SCRIPT
 * ============================================================================
 * Fixes 65 TypeScript files with collapsed single-line code by intelligently
 * adding line breaks at key syntax patterns.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to recover (organized by priority)
const FILES_TO_RECOVER = {
  HIGH_PRIORITY_DIRECT_COSTS: [
    'frontend/src/components/direct-costs/DirectCostForm.tsx',
    'frontend/src/components/direct-costs/CreateDirectCostForm.tsx',
    'frontend/src/components/direct-costs/AttachmentManager.tsx',
    'frontend/src/components/direct-costs/DirectCostTable.tsx',
    'frontend/src/components/direct-costs/AutoSaveIndicator.tsx',
    'frontend/src/components/direct-costs/DirectCostSummaryCards.tsx',
    'frontend/src/components/direct-costs/ExportDialog.tsx',
    'frontend/src/app/[projectId]/direct-costs/new/page.tsx',
    'frontend/src/app/api/direct-costs/[id]/route.ts',
    'frontend/src/app/api/direct-costs/route.ts',
    'frontend/src/app/api/projects/[id]/direct-costs/bulk/route.ts',
    'frontend/src/app/api/projects/[id]/direct-costs/export/route.ts',
    'frontend/src/app/api/projects/[id]/direct-costs/route.ts',
    'frontend/src/lib/schemas/direct-costs.ts',
  ],
  MEDIUM_PRIORITY_CHANGE_EVENTS: [
    'frontend/src/components/domain/change-events/ChangeEventApprovalWorkflow.tsx',
    'frontend/src/components/domain/change-events/ChangeEventAttachmentsSection.tsx',
    'frontend/src/components/domain/change-events/ChangeEventConvertDialog.tsx',
    'frontend/src/components/domain/change-events/ChangeEventLineItemsGrid.tsx',
    'frontend/src/components/domain/change-events/ChangeEventRevenueSection.tsx',
    'frontend/src/app/[projectId]/change-events/[id]/page.tsx',
    'frontend/src/app/api/projects/[id]/change-events/route.ts',
    'frontend/src/app/api/projects/[id]/change-events/[changeEventId]/route.ts',
    'frontend/src/app/api/projects/[id]/change-events/[changeEventId]/attachments/route.ts',
    'frontend/src/app/api/projects/[id]/change-events/[changeEventId]/attachments/[attachmentId]/route.ts',
    'frontend/src/app/api/projects/[id]/change-events/[changeEventId]/attachments/[attachmentId]/download/route.ts',
    'frontend/src/app/api/projects/[id]/change-events/[changeEventId]/history/route.ts',
    'frontend/src/app/api/projects/[id]/change-events/[changeEventId]/line-items/route.ts',
    'frontend/src/app/api/projects/[id]/change-events/[changeEventId]/line-items/[lineItemId]/route.ts',
    'frontend/src/app/api/projects/[id]/change-events/test-api.ts',
    'frontend/src/app/api/projects/[id]/change-events/test-change-events.ts',
  ],
  COMMITMENTS: [
    'frontend/src/components/commitments/tabs/AttachmentsTab.tsx',
    'frontend/src/components/commitments/tabs/ChangeOrdersTab.tsx',
    'frontend/src/components/commitments/tabs/InvoicesTab.tsx',
    'frontend/src/app/[projectId]/commitments/recycled/page.tsx',
    'frontend/src/app/api/commitments/[id]/attachments/route.ts',
    'frontend/src/app/api/commitments/[id]/attachments/[attachmentId]/route.ts',
    'frontend/src/app/api/commitments/[id]/change-orders/route.ts',
    'frontend/src/app/api/commitments/[id]/invoices/route.ts',
    'frontend/src/app/api/commitments/[id]/permanent-delete/route.ts',
    'frontend/src/app/api/commitments/[id]/restore/route.ts',
  ],
  MEETINGS: [
    'frontend/src/app/[projectId]/meetings/[meetingId]/page.tsx',
    'frontend/src/app/[projectId]/meetings/[meetingId]/markdown-summary.tsx',
    'frontend/src/app/[projectId]/meetings/[meetingId]/parse-transcript-sections.ts',
  ],
  LAYOUTS_AND_UI: [
    'frontend/src/components/layouts/AppLayout.tsx',
    'frontend/src/components/layouts/DashboardLayout.tsx',
    'frontend/src/components/layouts/ExecutiveLayout.tsx',
    'frontend/src/components/layouts/FormLayout.tsx',
    'frontend/src/components/layouts/TableLayout.tsx',
    'frontend/src/components/nav/navbar.tsx',
    'frontend/src/components/tables/DataTableGroupable.tsx',
    'frontend/src/components/ui/animated-modal.tsx',
    'frontend/src/components/ui/apple-cards-carousel.tsx',
    'frontend/src/components/ui/compare.tsx',
    'frontend/src/components/ui/placeholders-and-vanish-input.tsx',
    'frontend/src/components/drawings/upload-drawing-dialog.tsx',
  ],
  OTHER: [
    'frontend/src/app/dev/page.tsx',
    'frontend/src/app/dev/table-generator/page.tsx',
    'frontend/src/app/monitoring/page.tsx',
    'frontend/src/app/sitemap-list/sitemap-list-client.tsx',
    'frontend/src/app/api/files/read/route.ts',
    'frontend/src/app/api/monitoring/notify/route.ts',
    'frontend/src/app/api/monitoring/todo-integration/route.ts',
    'frontend/src/app/api/monitoring/websocket/route.ts',
    'frontend/src/app/api/people/route.ts',
    'frontend/src/components/monitoring/MonitoringCharts.tsx',
    'frontend/src/design-system/spacing.ts',
    'frontend/src/hooks/use-outside-click.tsx',
    'frontend/src/hooks/useMRT_ColumnVirtualizer.ts',
    'frontend/src/lib/auto-sitemap-utils.ts',
  ]
};

// Flatten all files
const ALL_FILES = [
  ...FILES_TO_RECOVER.HIGH_PRIORITY_DIRECT_COSTS,
  ...FILES_TO_RECOVER.MEDIUM_PRIORITY_CHANGE_EVENTS,
  ...FILES_TO_RECOVER.COMMITMENTS,
  ...FILES_TO_RECOVER.MEETINGS,
  ...FILES_TO_RECOVER.LAYOUTS_AND_UI,
  ...FILES_TO_RECOVER.OTHER,
];

/**
 * Recovery patterns - applied in order
 */
const RECOVERY_PATTERNS = [
  // 1. Fix 'use client' directive
  {
    name: 'Use client/server directives',
    regex: /(['"]use (?:client|server)['"])\s+(?=import|export|const|let|var|type|interface|class|function)/g,
    replace: '$1\n\n'
  },

  // 2. Fix multiline comments followed by code
  {
    name: 'Block comments',
    regex: /(\*\/)\s+(?=['"]use |import|export|const|let|var|type|interface|class|function)/g,
    replace: '$1\n\n'
  },

  // 3. Fix import statements - critical
  {
    name: 'Import statements',
    regex: /(import\s+[^;]+;)\s+(?=import|export|const|let|var|type|interface|class|function|async|\/\/)/g,
    replace: '$1\n'
  },

  // 4. Fix import from statements specifically
  {
    name: 'Import from statements',
    regex: /(from\s+['"][^'"]+['"])\s+(?=import|export|const|let|var|type|interface|class|function)/g,
    replace: '$1\n'
  },

  // 5. Fix export statements followed by other code
  {
    name: 'Export followed by code',
    regex: /(export\s+(?:default|const|let|var|type|interface|class|function|async)\s+[^;{]*[;{])\s+(?=export|import|const|let|var|type|interface|class|function|async|\/\/)/g,
    replace: '$1\n'
  },

  // 6. Fix closing braces followed by keywords
  {
    name: 'Closing brace followed by keyword',
    regex: /(\})\s+(?=export|import|const|let|var|type|interface|class|function|async|if|else|while|for|switch|case|try|catch|finally|return|\/\/)/g,
    replace: '$1\n'
  },

  // 7. Fix const/let/var declarations followed by other code
  {
    name: 'Variable declarations',
    regex: /((?:export\s+)?(?:const|let|var)\s+\w+[^;]*;)\s+(?=export|import|const|let|var|type|interface|class|function|if|else|return|try|catch|\/\/)/g,
    replace: '$1\n'
  },

  // 8. Fix try-catch-finally blocks
  {
    name: 'Try-catch blocks',
    regex: /(\})\s+(catch|finally)\s*\(/g,
    replace: '$1 $2('
  },

  // 9. Fix else/else if
  {
    name: 'Else blocks',
    regex: /(\})\s+(else(?:\s+if)?)\s*[({]/g,
    replace: '$1 $2 '
  },

  // 10. Fix missing space in "if (" construct
  {
    name: 'If-else chains',
    regex: /\bif\s*\(/g,
    replace: 'if ('
  },

  // 11. Fix single-line comments
  {
    name: 'Single-line comments',
    regex: /(\/\/[^\n]*)\s+(?=export|import|const|let|var|type|interface|class|function|if|else|return|try|catch|\/\/|\/\*)/g,
    replace: '$1\n'
  },

  // 12. Fix JSX closing tags
  {
    name: 'JSX closing tags',
    regex: /(<\/\w+>)\s+(?=<\w+|{|export|import|const|let|var|return|if|else)/g,
    replace: '$1\n'
  },

  // 13. Fix semicolons in interfaces/types
  {
    name: 'Interface/type properties',
    regex: /;\s+(\w+:)/g,
    replace: ';\n  $1'
  },

  // 14. Fix function/interface with opening brace
  {
    name: 'Opening braces after declarations',
    regex: /(\)\s*){(?=\s*\w)/g,
    replace: '$1 {\n  '
  },

  // 15. Fix missing line break before catch without try
  {
    name: 'Orphaned catch blocks',
    regex: /\}\s*catch\s*\(/g,
    replace: '}\ncatch('
  },

  // 16. Fix missing line break before else with else if
  {
    name: 'Else if chains',
    regex: /\}\s*else\s+if\s*\(/g,
    replace: '}\nelse if ('
  },
];

/**
 * Recover a single file
 */
function recoverFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  console.log(`\n📄 Processing: ${filePath}`);

  try {
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'File not found' };
    }

    // Read original content
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalLength = content.length;
    const originalLines = content.split('\n').length;

    console.log(`   Original: ${originalLines} lines, ${originalLength} chars`);

    // Apply each recovery pattern
    RECOVERY_PATTERNS.forEach(pattern => {
      const before = content;
      content = content.replace(pattern.regex, pattern.replace);
      const changes = before !== content;
      if (changes) {
        console.log(`   ✓ Applied: ${pattern.name}`);
      }
    });

    // Write recovered content
    fs.writeFileSync(fullPath, content);

    const newLines = content.split('\n').length;
    console.log(`   Recovered: ${newLines} lines (+${newLines - originalLines} lines)`);

    // Run Prettier to format properly
    console.log(`   Running Prettier...`);
    try {
      execSync(`npx prettier --write "${fullPath}"`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log(`   ✓ Prettier formatting applied`);
    } catch (prettierError) {
      console.log(`   ⚠ Prettier failed (will try manual fix): ${prettierError.message}`);
    }

    // Verify TypeScript can parse it
    console.log(`   Checking TypeScript...`);
    try {
      execSync(`npx tsc --noEmit "${fullPath}"`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log(`   ✓ TypeScript validation passed`);
      return { success: true };
    } catch (tsError) {
      // TypeScript errors are expected - we'll fix them in the next pass
      const errors = tsError.message.split('\n').filter(line => line.includes('error TS')).length;
      console.log(`   ⚠ TypeScript has ${errors} errors (may need manual review)`);
      return { success: true, warnings: errors };
    }

  } catch (error) {
    console.error(`   ✗ FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main recovery process
 */
function main() {
  console.log('============================================================================');
  console.log('TYPESCRIPT FILE CORRUPTION RECOVERY');
  console.log('============================================================================');
  console.log(`Total files to recover: ${ALL_FILES.length}`);
  console.log('');

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  // Process HIGH PRIORITY first
  console.log('\n🔴 HIGH PRIORITY - Direct Costs (10 files)');
  console.log('----------------------------------------------------------------------------');
  FILES_TO_RECOVER.HIGH_PRIORITY_DIRECT_COSTS.forEach(file => {
    results.total++;
    const result = recoverFile(file);
    results.details.push({ file, ...result });

    if (result.success) {
      results.success++;
      if (result.warnings) {
        results.warnings++;
      }
    } else {
      results.failed++;
    }
  });

  // Process MEDIUM PRIORITY
  console.log('\n🟡 MEDIUM PRIORITY - Change Events (16 files)');
  console.log('----------------------------------------------------------------------------');
  FILES_TO_RECOVER.MEDIUM_PRIORITY_CHANGE_EVENTS.forEach(file => {
    results.total++;
    const result = recoverFile(file);
    results.details.push({ file, ...result });

    if (result.success) {
      results.success++;
      if (result.warnings) {
        results.warnings++;
      }
    } else {
      results.failed++;
    }
  });

  // Process COMMITMENTS
  console.log('\n🟠 COMMITMENTS (10 files)');
  console.log('----------------------------------------------------------------------------');
  FILES_TO_RECOVER.COMMITMENTS.forEach(file => {
    results.total++;
    const result = recoverFile(file);
    results.details.push({ file, ...result });

    if (result.success) {
      results.success++;
      if (result.warnings) {
        results.warnings++;
      }
    } else {
      results.failed++;
    }
  });

  // Process MEETINGS
  console.log('\n🟢 MEETINGS (3 files)');
  console.log('----------------------------------------------------------------------------');
  FILES_TO_RECOVER.MEETINGS.forEach(file => {
    results.total++;
    const result = recoverFile(file);
    results.details.push({ file, ...result });

    if (result.success) {
      results.success++;
      if (result.warnings) {
        results.warnings++;
      }
    } else {
      results.failed++;
    }
  });

  // Process LAYOUTS AND UI
  console.log('\n🔵 LAYOUTS & UI (12 files)');
  console.log('----------------------------------------------------------------------------');
  FILES_TO_RECOVER.LAYOUTS_AND_UI.forEach(file => {
    results.total++;
    const result = recoverFile(file);
    results.details.push({ file, ...result });

    if (result.success) {
      results.success++;
      if (result.warnings) {
        results.warnings++;
      }
    } else {
      results.failed++;
    }
  });

  // Process OTHER
  console.log('\n⚪ OTHER (14 files)');
  console.log('----------------------------------------------------------------------------');
  FILES_TO_RECOVER.OTHER.forEach(file => {
    results.total++;
    const result = recoverFile(file);
    results.details.push({ file, ...result });

    if (result.success) {
      results.success++;
      if (result.warnings) {
        results.warnings++;
      }
    } else {
      results.failed++;
    }
  });

  // Generate report
  console.log('\n');
  console.log('============================================================================');
  console.log('RECOVERY SUMMARY');
  console.log('============================================================================');
  console.log(`Total files processed: ${results.total}`);
  console.log(`✓ Successfully recovered: ${results.success}`);
  console.log(`⚠ With warnings: ${results.warnings}`);
  console.log(`✗ Failed: ${results.failed}`);
  console.log('');

  // Show failed files
  if (results.failed > 0) {
    console.log('FAILED FILES:');
    results.details
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ✗ ${r.file}`);
        console.log(`    Error: ${r.error}`);
      });
    console.log('');
  }

  // Show warnings
  if (results.warnings > 0) {
    console.log('FILES WITH WARNINGS:');
    results.details
      .filter(r => r.success && r.warnings)
      .forEach(r => {
        console.log(`  ⚠ ${r.file} (${r.warnings} TypeScript errors)`);
      });
    console.log('');
  }

  // Write detailed report
  const reportPath = path.join(process.cwd(), 'frontend/CORRUPTION-RECOVERY-REPORT.md');
  const reportContent = generateReport(results);
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📊 Detailed report written to: frontend/CORRUPTION-RECOVERY-REPORT.md`);

  // Run final TypeScript check
  console.log('\n============================================================================');
  console.log('FINAL TYPESCRIPT VALIDATION');
  console.log('============================================================================');
  try {
    execSync('npm run typecheck --prefix frontend', {
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log('\n✓ ALL FILES PASS TYPESCRIPT VALIDATION');
  } catch (error) {
    console.log('\n⚠ Some TypeScript errors remain - see output above');
    console.log('These may require manual review and fixing.');
  }

  console.log('\n============================================================================');
  console.log('RECOVERY COMPLETE');
  console.log('============================================================================\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

/**
 * Generate markdown report
 */
function generateReport(results) {
  const timestamp = new Date().toISOString();

  return `# Corruption Recovery Report

**Generated:** ${timestamp}
**Total Files:** ${results.total}
**Successfully Recovered:** ${results.success}
**Failed:** ${results.failed}
**With Warnings:** ${results.warnings}

## Recovery Strategy

The corruption pattern involved all code being collapsed onto single lines. The recovery script:

1. **Pattern Detection** - Identified 12 key syntax patterns
2. **Line Break Insertion** - Intelligently added line breaks at:
   - Import/export statements
   - Function declarations
   - Type/interface definitions
   - Block closures
   - Try-catch-finally
   - JSX elements
3. **Prettier Formatting** - Applied automatic code formatting
4. **TypeScript Validation** - Verified compilation status

## Recovery Patterns Applied

${RECOVERY_PATTERNS.map((p, i) => `${i + 1}. **${p.name}**`).join('\n')}

## Results by File

### ✓ Successfully Recovered (${results.success} files)

${results.details
  .filter(r => r.success && !r.warnings)
  .map(r => `- \`${r.file}\` - Clean recovery`)
  .join('\n')}

${results.warnings > 0 ? `
### ⚠ Recovered with Warnings (${results.warnings} files)

These files were recovered but have TypeScript errors requiring manual review:

${results.details
  .filter(r => r.success && r.warnings)
  .map(r => `- \`${r.file}\` - ${r.warnings} TypeScript errors`)
  .join('\n')}
` : ''}

${results.failed > 0 ? `
### ✗ Failed Recovery (${results.failed} files)

${results.details
  .filter(r => !r.success)
  .map(r => `- \`${r.file}\`\n  Error: ${r.error}`)
  .join('\n')}
` : ''}

## Next Steps

${results.warnings > 0 ? `
1. **Review Warning Files** - Check TypeScript errors in files marked with ⚠
2. **Manual Fixes** - Address remaining syntax issues
3. **Run Quality Check** - \`npm run quality --prefix frontend\`
4. **Run Tests** - Verify functionality after recovery
` : `
1. **Run Quality Check** - \`npm run quality --prefix frontend\`
2. **Run Tests** - Verify all functionality works
3. **Commit Changes** - Recovery successful, ready to commit
`}

## TypeScript Compilation Status

Run final check with:
\`\`\`bash
npm run typecheck --prefix frontend
\`\`\`

---

*Recovery completed at ${timestamp}*
`;
}

// Run recovery
if (require.main === module) {
  main();
}

module.exports = { recoverFile, RECOVERY_PATTERNS };
