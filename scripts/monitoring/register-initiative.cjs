#!/usr/bin/env node
/**
 * Register Initiative Script
 * Helps agents register new initiatives in PROJECT_MONITORING.md
 * 
 * Usage:
 *   node scripts/monitoring/register-initiative.cjs "Initiative Name" "agent-type" "High/Medium/Low"
 */

const fs = require('fs');
const path = require('path');

// Configuration - Updated path
const PROJECT_MONITORING_PATH = path.join(process.cwd(), 'documentation/1-project-mgmt/PROJECT_MONITORING.md');

/**
 * Generate initiative ID
 */
function generateInitiativeId() {
  const date = new Date().toISOString().split('T')[0];
  const random = Math.floor(Math.random() * 900) + 100;
  return `INI-${date}-${random}`;
}

/**
 * Register new initiative
 */
function registerInitiative(name, agent, priority = 'medium') {
  try {
    if (!fs.existsSync(PROJECT_MONITORING_PATH)) {
      console.error('❌ PROJECT_MONITORING.md not found at:', PROJECT_MONITORING_PATH);
      return;
    }

    let content = fs.readFileSync(PROJECT_MONITORING_PATH, 'utf8');
    const initiativeId = generateInitiativeId();
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Update active initiatives count
    content = content.replace(
      /(- \*\*Active Initiatives:\*\*) (\d+)/,
      (match, p1, p2) => `${p1} ${parseInt(p2) + 1}`
    );

    // Add to initiatives table
    const tableRow = `| [${initiativeId}](#initiative-${name.toLowerCase().replace(/\s+/g, '-')}) | ${name} | ${agent} | In-Progress | ${timestamp} | ⚪ PENDING |`;
    
    const tableRegex = /(\| ID \| Initiative Name \| Owner Agent \| Status \| Last Update \| Verification \|\n\|.*?\|\n)([\s\S]*?)(\n\n---)/;
    content = content.replace(tableRegex, (match, p1, p2, p3) => {
      return `${p1}${p2}${tableRow}\n${p3}`;
    });

    // Add to activity log
    const todayDate = new Date().toISOString().split('T')[0];
    const logEntry = `- **${new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    })}** - [${agent}] Initiative registered: ${name}`;

    const activitySection = content.indexOf('## 🔄 RECENT ACTIVITY LOG');
    if (activitySection !== -1) {
      const dateHeader = `### ${todayDate}`;
      if (!content.includes(dateHeader)) {
        const insertPoint = content.indexOf('\n\n', activitySection) + 2;
        content = content.slice(0, insertPoint) + 
                 `${dateHeader}\n${logEntry}\n\n` + 
                 content.slice(insertPoint);
      } else {
        const dateIndex = content.indexOf(dateHeader);
        const nextDateIndex = content.indexOf('\n### ', dateIndex + 1);
        const insertPoint = nextDateIndex === -1 ? 
          content.indexOf('\n\n---', dateIndex) : nextDateIndex;
        
        const beforeInsert = content.slice(0, insertPoint).trimEnd();
        const afterInsert = content.slice(insertPoint);
        content = beforeInsert + `\n${logEntry}` + afterInsert;
      }
    }

    // Add initiative details section
    const initiativeSection = `
## INITIATIVE: ${name}
**ID:** ${initiativeId} | **Status:** In-Progress
**Owner:** ${agent} | **Created:** ${todayDate}
**Priority:** ${priority} | **Deadline:** TBD

### Objective
[To be defined by implementing agent]

### Success Criteria
- [ ] Criteria to be defined
- [ ] Implementation complete
- [ ] Testing complete
- [ ] Documentation updated

### Todo List Reference
TodoWrite integration pending

### Verification Status
- [ ] Level 1: Code Quality
- [ ] Level 2: Functional
- [ ] Level 3: Feature
- [ ] Level 4: Independent

### Progress Log
- **${timestamp}** - Initiative registered in monitoring system

### Current Tasks
To be updated by implementing agent

### Blockers
None currently identified

### Questions for User
To be added if needed

---`;

    // Insert before agent coordination section
    const coordinationIndex = content.indexOf('## 🤖 AGENT COORDINATION SYSTEM');
    if (coordinationIndex !== -1) {
      content = content.slice(0, coordinationIndex) + 
                initiativeSection + '\n' + 
                content.slice(coordinationIndex);
    }

    // Write updated content
    fs.writeFileSync(PROJECT_MONITORING_PATH, content);
    
    console.log(`✅ Initiative registered successfully!`);
    console.log(`   ID: ${initiativeId}`);
    console.log(`   Name: ${name}`);
    console.log(`   Owner: ${agent}`);
    console.log(`   Priority: ${priority}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Update the Objective section`);
    console.log(`   2. Define Success Criteria`);
    console.log(`   3. Create detailed tasks in TodoWrite`);
    console.log(`   4. Update Progress Log regularly`);
    
  } catch (error) {
    console.error('❌ Error registering initiative:', error.message);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node register-initiative.cjs "Initiative Name" "agent-type" [priority]');
    console.log('\nExample:');
    console.log('  node register-initiative.cjs "Implement User Authentication" "backend-architect" "high"');
    console.log('\nPriority options: high, medium, low (default: medium)');
    process.exit(1);
  }
  
  const [name, agent, priority = 'medium'] = args;
  registerInitiative(name, agent, priority.toLowerCase());
}

if (require.main === module) {
  main();
}

module.exports = { registerInitiative, generateInitiativeId };