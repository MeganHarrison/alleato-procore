#!/usr/bin/env node
/**
 * Progress Update Hook
 * Automatically triggered when agents use tools or make progress
 * Updates PROJECT_MONITORING.md with real-time agent activity
 */

const fs = require('fs');
const path = require('path');
const { notifyDashboard } = require('./dashboard-notifier.cjs');

// Configuration
const PROJECT_MONITORING_PATH = path.join(process.cwd(), 'documentation/1-project-mgmt/PROJECT_MONITORING.md');
const VERIFICATION_PROTOCOL_PATH = path.join(process.cwd(), 'documentation/1-project-mgmt/VERIFICATION_PROTOCOL.md');

/**
 * Get current timestamp in EST
 */
function getCurrentTimestamp() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Extract agent type from environment or context
 */
function getAgentType() {
  // Try to determine agent type from environment variables or context
  return process.env.CLAUDE_AGENT_TYPE || 
         process.env.AGENT_TYPE || 
         'general-assistant';
}

/**
 * Generate session ID for tracking
 */
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update activity log in PROJECT_MONITORING.md
 */
function updateActivityLog(activity, details = '') {
  try {
    if (!fs.existsSync(PROJECT_MONITORING_PATH)) {
      console.log('PROJECT_MONITORING.md not found, creating...');
      return;
    }
    
    // Notify dashboard
    notifyDashboard('activity_log', { activity, details });

    let content = fs.readFileSync(PROJECT_MONITORING_PATH, 'utf8');
    const timestamp = getCurrentTimestamp();
    const agentType = getAgentType();
    
    // Find the Recent Activity Log section
    const activityRegex = /(## 🔄 RECENT ACTIVITY LOG\n\n)([\s\S]*?)(\n\n---|\n\n##|$)/;
    const match = content.match(activityRegex);
    
    if (match) {
      const todayDate = new Date().toISOString().split('T')[0];
      const newEntry = `- **${timestamp}** - [${agentType}] ${activity}${details ? ': ' + details : ''}`;
      
      let existingLog = match[2];
      
      // Check if today's date header exists
      const dateHeader = `### ${todayDate}`;
      if (!existingLog.includes(dateHeader)) {
        existingLog = `${dateHeader}\n${newEntry}\n\n${existingLog}`;
      } else {
        // Add to today's entries
        const dateHeaderIndex = existingLog.indexOf(dateHeader);
        const nextHeaderIndex = existingLog.indexOf('\n### ', dateHeaderIndex + 1);
        const insertIndex = nextHeaderIndex === -1 ? existingLog.length : nextHeaderIndex;
        
        existingLog = existingLog.slice(0, insertIndex).trimEnd() + 
                     `\n${newEntry}` + 
                     existingLog.slice(insertIndex);
      }
      
      const newContent = content.replace(activityRegex, `$1${existingLog}$3`);
      fs.writeFileSync(PROJECT_MONITORING_PATH, newContent);
      
      console.log(`✓ Updated activity log: ${activity}`);
    }
  } catch (error) {
    console.error('Error updating activity log:', error.message);
  }
}

/**
 * Update agent session tracking
 */
function updateAgentSession(action, taskDescription = '') {
  try {
    if (!fs.existsSync(PROJECT_MONITORING_PATH)) {
      return;
    }

    let content = fs.readFileSync(PROJECT_MONITORING_PATH, 'utf8');
    const timestamp = getCurrentTimestamp();
    const agentType = getAgentType();
    const sessionId = process.env.CLAUDE_SESSION_ID || generateSessionId();
    
    // Find the Current Agent Sessions section
    const sessionRegex = /(### Current Agent Sessions\n\| Agent Type \| Session ID \| Current Task \| Started \| Last Update \|\n\|------------|------------|--------------|---------|-------------\|\n)([\s\S]*?)(\n\n\*|$)/;
    const match = content.match(sessionRegex);
    
    if (match) {
      let sessionTable = match[2];
      
      if (action === 'start') {
        // Add new session
        const newSession = `| ${agentType} | ${sessionId} | ${taskDescription} | ${timestamp} | ${timestamp} |\n`;
        sessionTable = newSession + sessionTable;
      } else if (action === 'update') {
        // Update existing session
        const sessionPattern = new RegExp(`\\| ${agentType} \\| ${sessionId} \\|([^|]*)\\|([^|]*)\\|([^|]*)\\|`);
        if (sessionPattern.test(sessionTable)) {
          sessionTable = sessionTable.replace(sessionPattern, 
            `| ${agentType} | ${sessionId} | ${taskDescription} |$2| ${timestamp} |`);
        } else {
          // Session not found, add new one
          const newSession = `| ${agentType} | ${sessionId} | ${taskDescription} | ${timestamp} | ${timestamp} |\n`;
          sessionTable = newSession + sessionTable;
        }
      } else if (action === 'end') {
        // Remove completed session
        const sessionPattern = new RegExp(`\\| ${agentType} \\| ${sessionId} \\|[^\\n]*\\n`, 'g');
        sessionTable = sessionTable.replace(sessionPattern, '');
      }
      
      // Handle empty table
      if (sessionTable.trim() === '') {
        sessionTable = '| | | | | |\n\n*No active agent sessions*';
      }
      
      const newContent = content.replace(sessionRegex, `$1${sessionTable}$3`);
      fs.writeFileSync(PROJECT_MONITORING_PATH, newContent);
      
      console.log(`✓ Updated agent session: ${action}`);
    }
  } catch (error) {
    console.error('Error updating agent session:', error.message);
  }
}

/**
 * Update system statistics
 */
function updateSystemStats() {
  try {
    if (!fs.existsSync(PROJECT_MONITORING_PATH)) {
      return;
    }

    let content = fs.readFileSync(PROJECT_MONITORING_PATH, 'utf8');
    
    // Count active initiatives (simple count of table rows)
    const initiativeMatches = content.match(/\| INI-\d{4}-\d{2}-\d{2}-\d{3}/g);
    const activeInitiatives = initiativeMatches ? initiativeMatches.length : 0;
    
    // Count pending verifications
    const pendingVerifications = (content.match(/⚪ \*\*PENDING\*\*/g) || []).length;
    
    // Count failed verifications  
    const failedVerifications = (content.match(/🔴 \*\*FAILED\*\*/g) || []).length;
    
    // Update quick stats
    content = content.replace(
      /(- \*\*Active Initiatives:\*\*) \d+/,
      `$1 ${activeInitiatives}`
    );
    content = content.replace(
      /(- \*\*Pending Verification:\*\*) \d+/,
      `$1 ${pendingVerifications}`
    );
    content = content.replace(
      /(- \*\*Failed Verifications:\*\*) \d+/,
      `$1 ${failedVerifications}`
    );
    
    fs.writeFileSync(PROJECT_MONITORING_PATH, content);
    console.log('✓ Updated system statistics');
  } catch (error) {
    console.error('Error updating system stats:', error.message);
  }
}

/**
 * Main execution based on command line arguments
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'activity':
      updateActivityLog(args[1] || 'Tool used', args[2] || '');
      break;
      
    case 'session-start':
      updateAgentSession('start', args[1] || 'Working on task');
      updateActivityLog('Agent session started', args[1]);
      break;
      
    case 'session-update':
      updateAgentSession('update', args[1] || 'In progress');
      break;
      
    case 'session-end':
      updateAgentSession('end');
      updateActivityLog('Agent session completed');
      break;
      
    case 'stats':
      updateSystemStats();
      break;
      
    default:
      // Default behavior for general tool use
      updateActivityLog('Tool used', args.join(' '));
      updateSystemStats();
      break;
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  updateActivityLog,
  updateAgentSession,
  updateSystemStats
};