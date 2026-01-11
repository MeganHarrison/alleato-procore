#!/usr/bin/env node
/**
 * Completion Checker Hook
 * Automatically triggered when TodoWrite marks items as completed
 * Spawns verification agents to validate completion claims
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const PROJECT_MONITORING_PATH = path.join(process.cwd(), 'PROJECT_MONITORING.md');
const CLAUDE_COMMAND = 'claude'; // Adjust based on your Claude CLI setup

/**
 * Parse TodoWrite data from various sources
 */
function parseTodoData(input) {
  try {
    // If input is a JSON string
    if (typeof input === 'string' && input.startsWith('{')) {
      return JSON.parse(input);
    }
    
    // If input is command line arguments
    if (Array.isArray(input)) {
      return {
        content: input[0] || 'Unknown task',
        priority: input[1] || 'medium',
        id: input[2] || 'unknown'
      };
    }
    
    // Default structure
    return {
      content: input?.content || 'Unknown task',
      priority: input?.priority || 'medium', 
      id: input?.id || 'unknown'
    };
  } catch (error) {
    console.error('Error parsing todo data:', error.message);
    return {
      content: 'Unknown task',
      priority: 'medium',
      id: 'unknown'
    };
  }
}

/**
 * Determine verification agent type based on task content
 */
function getVerificationAgentType(taskContent) {
  const content = taskContent.toLowerCase();
  
  if (content.includes('test') || content.includes('spec') || content.includes('playwright')) {
    return 'test-validator-expert';
  }
  
  if (content.includes('ui') || content.includes('component') || content.includes('page') || content.includes('form')) {
    return 'qa-tester-comprehensive';
  }
  
  if (content.includes('doc') || content.includes('readme') || content.includes('guide')) {
    return 'docs-auditor-thorough';
  }
  
  if (content.includes('api') || content.includes('endpoint') || content.includes('route')) {
    return 'api-validator-strict';
  }
  
  // Default verification agent
  return 'verification-specialist';
}

/**
 * Generate verification prompt based on task
 */
function generateVerificationPrompt(todo, agentType) {
  const basePrompt = `
You are a VERIFICATION AGENT (${agentType}). Another agent has claimed completion of:

TASK: "${todo.content}"
PRIORITY: ${todo.priority}
TODO ID: ${todo.id}

🚨 CRITICAL: Do not trust the original agent's completion claim. Verify everything independently.

YOUR VERIFICATION CHECKLIST:
`;

  const typeSpecificChecks = {
    'test-validator-expert': `
1. Run all relevant tests (npm run test, npm run test:e2e)
2. Check test coverage is adequate
3. Verify tests actually validate the claimed functionality
4. Confirm no test failures or warnings
5. Check that test data is realistic and comprehensive`,

    'qa-tester-comprehensive': `
1. Open browser and test the actual UI/feature
2. Verify feature works as expected for end users  
3. Check responsive design on different screen sizes
4. Test user flows and edge cases
5. Confirm no console errors or accessibility issues`,

    'docs-auditor-thorough': `
1. Read documentation for accuracy and completeness
2. Test any code examples or instructions
3. Verify links work and content is up-to-date
4. Check grammar, spelling, and formatting
5. Confirm documentation matches actual implementation`,

    'api-validator-strict': `
1. Test API endpoints with actual requests
2. Verify request/response formats match documentation
3. Check error handling and validation
4. Test authentication and authorization
5. Confirm database changes are correct`
  };

  const checks = typeSpecificChecks[agentType] || `
1. Review code changes for quality and completeness
2. Run all relevant tests and checks
3. Verify feature works as described
4. Check for any breaking changes or regressions
5. Confirm requirements were actually met`;

  return basePrompt + checks + `

VERIFICATION RESULT REQUIRED:
- Update PROJECT_MONITORING.md with verification status
- If verification FAILS: Mark todo back to "in_progress" and document what needs fixing
- If verification PASSES: Confirm completion in monitoring log

Execute your verification now.`;
}

/**
 * Spawn verification agent
 */
async function spawnVerificationAgent(todo) {
  const agentType = getVerificationAgentType(todo.content);
  const prompt = generateVerificationPrompt(todo, agentType);
  
  console.log(`🔍 Spawning verification agent: ${agentType}`);
  console.log(`📋 Verifying: ${todo.content}`);
  
  try {
    // Update monitoring log to show verification started
    updateMonitoringLog('verification-started', todo, agentType);
    
    // Spawn Claude agent for verification
    const claudeProcess = spawn(CLAUDE_COMMAND, [
      '--auto-approve',
      '--agent-type', agentType,
      prompt
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        CLAUDE_AGENT_TYPE: agentType,
        VERIFICATION_TODO_ID: todo.id,
        VERIFICATION_TARGET: todo.content
      }
    });
    
    claudeProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Verification agent completed successfully`);
        updateMonitoringLog('verification-completed', todo, agentType);
      } else {
        console.error(`❌ Verification agent failed with code ${code}`);
        updateMonitoringLog('verification-failed', todo, agentType);
      }
    });
    
    claudeProcess.on('error', (error) => {
      console.error(`💥 Error spawning verification agent:`, error.message);
      updateMonitoringLog('verification-error', todo, agentType);
    });
    
  } catch (error) {
    console.error('Error in verification process:', error.message);
    updateMonitoringLog('verification-error', todo, agentType);
  }
}

/**
 * Update monitoring log with verification events
 */
function updateMonitoringLog(event, todo, agentType) {
  try {
    if (!fs.existsSync(PROJECT_MONITORING_PATH)) {
      console.log('PROJECT_MONITORING.md not found, skipping log update');
      return;
    }
    
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const eventMessages = {
      'verification-started': `🔍 Verification started for "${todo.content}" (${agentType})`,
      'verification-completed': `✅ Verification completed for "${todo.content}"`,
      'verification-failed': `❌ Verification failed for "${todo.content}"`,
      'verification-error': `💥 Verification error for "${todo.content}"`
    };
    
    const message = eventMessages[event] || `Verification event: ${event}`;
    
    // Use the update-progress script to log this
    spawn('node', [
      path.join(__dirname, 'update-progress.cjs'),
      'activity',
      message,
      `Priority: ${todo.priority}, ID: ${todo.id}`
    ], { stdio: 'inherit' });
    
  } catch (error) {
    console.error('Error updating monitoring log:', error.message);
  }
}

/**
 * Check if task needs verification
 */
function needsVerification(todo) {
  const content = todo.content.toLowerCase();
  
  // Skip verification for certain low-risk tasks
  const skipPatterns = [
    'update documentation',
    'add comment',
    'format code',
    'fix typo',
    'update readme'
  ];
  
  return !skipPatterns.some(pattern => content.includes(pattern));
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  // Handle different input formats
  let todoData;
  if (args.length > 0) {
    todoData = parseTodoData(args);
  } else {
    console.error('No todo data provided');
    process.exit(1);
  }
  
  console.log(`📝 Todo completion detected: ${todoData.content}`);
  
  if (needsVerification(todoData)) {
    spawnVerificationAgent(todoData);
  } else {
    console.log(`⏭️  Skipping verification for low-risk task`);
    updateMonitoringLog('verification-skipped', todoData, 'none');
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  spawnVerificationAgent,
  needsVerification,
  parseTodoData
};