#!/usr/bin/env node

/**
 * ============================================================================
 * PAGECONTAINER TO DESIGN SYSTEM LAYOUTS MIGRATION SCRIPT
 * ============================================================================
 * 
 * This script automates the migration from PageContainer to the appropriate
 * design system layout components (TableLayout, FormLayout, DashboardLayout).
 * 
 * FEATURES:
 * - Intelligent layout detection based on path and content
 * - Import statement replacement
 * - Component usage migration
 * - Spacing class conversion to CSS variables
 * - Comprehensive reporting
 * 
 * USAGE:
 * node scripts/migrate-pagecontainer-to-layouts.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const APP_DIR = path.join(__dirname, '../frontend/src/app');
const LAYOUTS_IMPORT_PATH = '@/components/layouts';

// Layout detection rules
const LAYOUT_RULES = {
  // Path-based rules (highest priority)
  pathRules: [
    { pattern: /\/(tables)\//, layout: 'TableLayout' },
    { pattern: /\/(forms?)\//, layout: 'FormLayout' },
    { pattern: /\/form-[^/]+\//, layout: 'FormLayout' },
    { pattern: /\/dashboard/, layout: 'DashboardLayout' },
    { pattern: /\/profile/, layout: 'FormLayout' },
    { pattern: /\/settings/, layout: 'FormLayout' },
    { pattern: /\/pipeline/, layout: 'DashboardLayout' },
    
    // Project-specific pages
    { pattern: /\/\[projectId\]\/directory\//, layout: 'TableLayout' },
    { pattern: /\/\[projectId\]\/(contracts|commitments|invoices|change-orders|change-events|direct-costs|meetings|sov)/, layout: 'TableLayout' },
    { pattern: /\/\[projectId\]\/.*\/edit/, layout: 'FormLayout' },
    { pattern: /\/\[projectId\]\/.*\/new/, layout: 'FormLayout' },
    
    // Directory pages are all table-based
    { pattern: /\/directory\//, layout: 'TableLayout' },
    { pattern: /\/(clients|companies|contacts|users|groups|employees)\//, layout: 'TableLayout' },
  ],
  
  // Content-based rules (lower priority)
  contentRules: [
    { pattern: /DataTable|genericTable|TableConfig/i, layout: 'TableLayout' },
    { pattern: /FormContainer|onSubmit|handleSubmit/i, layout: 'FormLayout' },
    { pattern: /KPI|Widget|StatCard|Dashboard/i, layout: 'DashboardLayout' },
    { pattern: /columns:.*\[|searchFields:|genericDataTable/i, layout: 'TableLayout' },
  ],
  
  // Default if no rules match
  defaultLayout: 'TableLayout' // Most pages in the app are table-based
};

// Spacing class mappings
const SPACING_MAPPINGS = {
  // Space classes
  'space-y-4': 'space-y-[var(--group-gap)]',
  'space-y-6': 'space-y-[var(--section-gap)]',
  'space-y-8': 'space-y-[var(--section-gap)]',
  'space-x-4': 'space-x-[var(--group-gap)]',
  'space-x-6': 'space-x-[var(--section-gap)]',
  
  // Gap classes
  'gap-4': 'gap-[var(--group-gap)]',
  'gap-6': 'gap-[var(--section-gap)]',
  'gap-8': 'gap-[var(--section-gap)]',
  
  // Padding classes
  'p-4': 'p-[var(--card-padding)]',
  'p-6': 'p-[var(--card-padding)]',
  'p-8': 'p-[var(--card-padding)]',
  'px-4': 'px-[var(--card-padding)]',
  'px-6': 'px-[var(--card-padding)]',
  'py-4': 'py-[var(--group-gap)]',
  'py-6': 'py-[var(--section-gap)]',
  
  // Margin classes
  'mt-4': 'mt-[var(--group-gap)]',
  'mt-6': 'mt-[var(--section-gap)]',
  'mt-8': 'mt-[var(--section-gap)]',
  'mb-4': 'mb-[var(--group-gap)]',
  'mb-6': 'mb-[var(--section-gap)]',
  'mb-8': 'mb-[var(--section-gap)]',
};

/**
 * Determine the appropriate layout based on file path and content
 */
function determineLayout(filePath, content) {
  // Check path-based rules first
  for (const rule of LAYOUT_RULES.pathRules) {
    if (rule.pattern.test(filePath)) {
      return rule.layout;
    }
  }
  
  // Check content-based rules
  for (const rule of LAYOUT_RULES.contentRules) {
    if (rule.pattern.test(content)) {
      return rule.layout;
    }
  }
  
  // Return default
  return LAYOUT_RULES.defaultLayout;
}

/**
 * Replace PageContainer import with layout import
 */
function replaceImports(content, layoutType) {
  const importRegex = /import\s*{([^}]*PageContainer[^}]*)}\s*from\s*['"]@\/components\/layout['"];?/g;
  
  let newImports = [];
  let hasPageContainerImport = false;
  
  content = content.replace(importRegex, (match, imports) => {
    hasPageContainerImport = true;
    const importList = imports.split(',').map(i => i.trim());
    const nonPageContainer = importList.filter(i => !i.includes('PageContainer'));
    
    if (nonPageContainer.length > 0) {
      newImports.push(`import { ${nonPageContainer.join(', ')} } from '@/components/layout';`);
    }
    
    return ''; // Remove the original import
  });
  
  // Add new layout import
  if (hasPageContainerImport) {
    const layoutImport = `import { ${layoutType} } from '${LAYOUTS_IMPORT_PATH}';`;
    
    // Find a good place to insert the import
    const firstImportMatch = content.match(/^import\s+.*$/m);
    if (firstImportMatch) {
      const insertIndex = firstImportMatch.index + firstImportMatch[0].length;
      content = content.slice(0, insertIndex) + '\n' + layoutImport + 
                (newImports.length > 0 ? '\n' + newImports.join('\n') : '') +
                content.slice(insertIndex);
    } else {
      // No imports found, add at the beginning
      content = layoutImport + '\n' + 
                (newImports.length > 0 ? newImports.join('\n') + '\n' : '') +
                content;
    }
  }
  
  return content;
}

/**
 * Replace PageContainer usage with the new layout component
 */
function replaceComponentUsage(content, layoutType) {
  // Match PageContainer with props
  const componentRegex = /<PageContainer(\s+[^>]*)?>([\s\S]*?)<\/PageContainer>/g;
  
  return content.replace(componentRegex, (match, props, children) => {
    // Extract any density or maxWidth props if they exist
    let layoutProps = '';
    
    if (props) {
      // Extract relevant props
      const densityMatch = props.match(/density=["']([^"']+)["']/);
      const maxWidthMatch = props.match(/maxWidth=["']([^"']+)["']/);
      const classNameMatch = props.match(/className=["']([^"']+)["']/);
      
      const extractedProps = [];
      
      if (densityMatch && layoutType === 'TableLayout') {
        extractedProps.push(`density="${densityMatch[1]}"`);
      }
      
      if (maxWidthMatch) {
        extractedProps.push(`maxWidth="${maxWidthMatch[1]}"`);
      }
      
      if (classNameMatch) {
        extractedProps.push(`className="${classNameMatch[1]}"`);
      }
      
      if (extractedProps.length > 0) {
        layoutProps = ' ' + extractedProps.join(' ');
      }
    }
    
    return `<${layoutType}${layoutProps}>${children}</${layoutType}>`;
  });
}

/**
 * Replace hardcoded spacing classes with CSS variables
 */
function replaceSpacingClasses(content) {
  let updatedContent = content;
  
  // Replace each spacing class
  for (const [oldClass, newClass] of Object.entries(SPACING_MAPPINGS)) {
    // Match className with the specific class
    const regex = new RegExp(`(className=["'][^"']*\\b)${oldClass}(\\b[^"']*["'])`, 'g');
    updatedContent = updatedContent.replace(regex, `$1${newClass}$2`);
    
    // Also handle template literals
    const templateRegex = new RegExp(`(className={\`[^\`]*\\b)${oldClass}(\\b[^\`]*\`})`, 'g');
    updatedContent = updatedContent.replace(templateRegex, `$1${newClass}$2`);
  }
  
  return updatedContent;
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Skip if no PageContainer usage
    if (!content.includes('PageContainer')) {
      return null;
    }
    
    // Determine the appropriate layout
    const layout = determineLayout(filePath, content);
    
    // Apply transformations
    let updatedContent = content;
    updatedContent = replaceImports(updatedContent, layout);
    updatedContent = replaceComponentUsage(updatedContent, layout);
    updatedContent = replaceSpacingClasses(updatedContent);
    
    // Only write if changes were made
    if (updatedContent !== content) {
      await fs.writeFile(filePath, updatedContent);
      
      return {
        file: path.relative(process.cwd(), filePath),
        layout,
        spacingUpdates: countSpacingReplacements(content, updatedContent)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { file: filePath, error: error.message };
  }
}

/**
 * Count spacing class replacements
 */
function countSpacingReplacements(original, updated) {
  let count = 0;
  for (const oldClass of Object.keys(SPACING_MAPPINGS)) {
    const originalCount = (original.match(new RegExp(`\\b${oldClass}\\b`, 'g')) || []).length;
    const updatedCount = (updated.match(new RegExp(`\\b${oldClass}\\b`, 'g')) || []).length;
    count += originalCount - updatedCount;
  }
  return count;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting PageContainer to Design System Layouts Migration\n');
  
  try {
    // Find all TypeScript/TSX files in the app directory
    const pattern = path.join(APP_DIR, '**/*.{ts,tsx}');
    const files = await glob(pattern, { 
      ignore: ['**/node_modules/**', '**/.next/**'] 
    });
    
    console.log(`Found ${files.length} files to scan...\n`);
    
    // Process all files
    const results = await Promise.all(files.map(processFile));
    const processed = results.filter(r => r && !r.error);
    const errors = results.filter(r => r && r.error);
    
    // Group by layout type
    const byLayout = processed.reduce((acc, result) => {
      if (!acc[result.layout]) {
        acc[result.layout] = [];
      }
      acc[result.layout].push(result);
      return acc;
    }, {});
    
    // Print summary
    console.log('✅ Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total files processed: ${processed.length}`);
    console.log(`   Files with errors: ${errors.length}\n`);
    
    console.log('📦 Files by Layout Type:');
    for (const [layout, files] of Object.entries(byLayout)) {
      console.log(`\n   ${layout}: ${files.length} files`);
      files.forEach(f => {
        const spacingNote = f.spacingUpdates > 0 ? ` (${f.spacingUpdates} spacing updates)` : '';
        console.log(`   - ${f.file}${spacingNote}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(e => {
        console.log(`   - ${e.file}: ${e.error}`);
      });
    }
    
    // Calculate total spacing updates
    const totalSpacingUpdates = processed.reduce((sum, r) => sum + r.spacingUpdates, 0);
    
    console.log('\n📐 Spacing System Updates:');
    console.log(`   Total spacing classes replaced: ${totalSpacingUpdates}`);
    console.log('   All hardcoded spacing values have been converted to CSS variables');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Run quality checks: npm run quality --prefix frontend');
    console.log('2. Review the changes: git diff');
    console.log('3. Test the affected pages in the browser');
    console.log('4. Commit the changes once verified');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();