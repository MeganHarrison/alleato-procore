#!/usr/bin/env node
/**
 * ============================================================================
 * CORRUPTION RECOVERY SCRIPT V2 - ITERATIVE APPROACH
 * ============================================================================
 * Uses multiple passes with different strategies to progressively recover files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to recover
const FILES = [
  // HIGH PRIORITY - Direct Costs
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

  // MEDIUM PRIORITY - Change Events
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

  // COMMITMENTS
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

  // MEETINGS
  'frontend/src/app/[projectId]/meetings/[meetingId]/page.tsx',
  'frontend/src/app/[projectId]/meetings/[meetingId]/markdown-summary.tsx',
  'frontend/src/app/[projectId]/meetings/[meetingId]/parse-transcript-sections.ts',

  // LAYOUTS & UI
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

  // OTHER
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
];

/**
 * Recovery strategy - multiple passes with increasing aggression
 */
function recoverFileContent(content) {
  let result = content;

  // PASS 1: Fix critical separators
  // Add newline after multiline comment blocks
  result = result.replace(/(\*\/)\s+(?=['"]use |import|export|const)/g, '$1\n\n');

  // Add newline after 'use client' / 'use server'
  result = result.replace(/(['"]use (?:client|server)['"])\s+(?=import)/g, '$1\n\n');

  // PASS 2: Fix all import statements
  // Pattern: import ... from '...'  (followed by any code)
  result = result.replace(/(import\s+[^;]+from\s+['"][^'"]+['"])\s+(?=import|export|const|let|var|type|interface|function|class)/g, '$1\n');

  // PASS 3: Fix all export statements
  result = result.replace(/(export\s+(?:default\s+)?(?:const|let|var|type|interface|function|class|async)\s+[^\n]+)/g, '\n$1');

  // PASS 4: Fix statement-level separations
  // Add newline before major keywords
  result = result.replace(/\s+(export|import|const|let|var|type|interface|function|class|if|else|try|catch|finally|return|throw)\s+/g, '\n$1 ');

  // PASS 5: Fix closing braces
  result = result.replace(/\}\s+(catch|finally|else)\s*[({]/g, '} $1 ');
  result = result.replace(/\}\s+(?=export|import|const|let|var|type|interface|function|class|if|return)/g, '}\n');

  // PASS 6: Clean up excessive newlines
  result = result.replace(/\n{4,}/g, '\n\n\n');

  return result;
}

/**
 * Recover a single file with full process
 */
function recoverFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  console.log(`\n📄 ${filePath}`);

  try {
    if (!fs.existsSync(fullPath)) {
      console.log('   ✗ File not found');
      return { success: false, error: 'File not found' };
    }

    // Read content
    const original = fs.readFileSync(fullPath, 'utf8');
    console.log(`   Original: ${original.split('\n').length} lines`);

    // Apply recovery
    let recovered = recoverFileContent(original);
    console.log(`   After recovery: ${recovered.split('\n').length} lines`);

    // Write back
    fs.writeFileSync(fullPath, recovered);

    // Try Prettier (best effort)
    try {
      execSync(`npx prettier --write "${fullPath}"`, { stdio: 'pipe' });
      console.log('   ✓ Prettier applied');
    } catch (e) {
      console.log('   ⚠ Prettier skipped (syntax may still need fixes)');
    }

    return { success: true };

  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
function main() {
  console.log('============================================================================');
  console.log('TYPESCRIPT CORRUPTION RECOVERY V2 - ITERATIVE APPROACH');
  console.log('============================================================================');
  console.log(`Files to process: ${FILES.length}\n`);

  const results = {
    total: FILES.length,
    success: 0,
    failed: 0
  };

  FILES.forEach(file => {
    const result = recoverFile(file);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
  });

  console.log('\n============================================================================');
  console.log('SUMMARY');
  console.log('============================================================================');
  console.log(`Total: ${results.total}`);
  console.log(`✓ Success: ${results.success}`);
  console.log(`✗ Failed: ${results.failed}`);

  // Final typecheck
  console.log('\n============================================================================');
  console.log('RUNNING FINAL TYPECHECK');
  console.log('============================================================================\n');

  try {
    execSync('npm run typecheck --prefix frontend', { stdio: 'inherit' });
    console.log('\n✓ TypeScript compilation successful!');
  } catch (e) {
    console.log('\n⚠ Some TypeScript errors remain - may need manual review');
  }

  console.log('\n============================================================================');
  console.log('RECOVERY COMPLETE');
  console.log('============================================================================\n');

  // Write report
  const report = `# Corruption Recovery Report

**Date:** ${new Date().toISOString()}
**Strategy:** Iterative multi-pass recovery

## Results

- **Total Files:** ${results.total}
- **Successfully Recovered:** ${results.success}
- **Failed:** ${results.failed}

## Next Steps

1. Run: \`npm run quality --prefix frontend\`
2. Review any remaining TypeScript errors
3. Test recovered files manually
4. Commit if all looks good

---
Generated by recovery script v2
`;

  fs.writeFileSync('frontend/CORRUPTION-RECOVERY-REPORT.md', report);
  console.log('Report saved to: frontend/CORRUPTION-RECOVERY-REPORT.md\n');
}

if (require.main === module) {
  main();
}

module.exports = { recoverFileContent, recoverFile };
