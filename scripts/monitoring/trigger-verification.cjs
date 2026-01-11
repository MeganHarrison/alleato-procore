#!/usr/bin/env node
/**
 * Verification Trigger Hook
 * Automatically triggered on bash commands, commits, and other events
 * Determines if verification agents should be spawned based on context
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const PROJECT_MONITORING_PATH = path.join(process.cwd(), 'PROJECT_MONITORING.md');

/**
 * Analyze bash command to determine if verification is needed
 */
function analyzeBashCommand(command, output = '') {
  const cmd = command.toLowerCase();
  
  // Test commands that indicate completion
  if (cmd.includes('npm run test') || 
      cmd.includes('npm test') ||
      cmd.includes('playwright test') ||
      cmd.includes('npm run build') ||
      cmd.includes('npm run lint') ||
      cmd.includes('npm run typecheck')) {
    
    // Check if tests passed
    const passed = !output.includes('failed') && 
                  !output.includes('error') && 
                  !output.includes('FAIL');
    
    return {
      needsVerification: passed,
      type: 'test-completion',
      description: `Tests executed: ${command}`,
      success: passed
    };
  }
  
  // Git commands that indicate work completion
  if (cmd.includes('git commit') || cmd.includes('git push')) {
    return {
      needsVerification: true,
      type: 'code-commit',
      description: `Git operation: ${command}`,
      success: true
    };
  }
  
  // File operations that might indicate completion
  if (cmd.includes('touch') || cmd.includes('mkdir') || cmd.includes('cp') || cmd.includes('mv')) {
    return {
      needsVerification: false, // File operations alone don't need verification
      type: 'file-operation',
      description: `File operation: ${command}`,
      success: true
    };
  }
  
  return null;
}

/**
 * Analyze git commit for completion indicators
 */
function analyzeGitCommit() {
  try {
    // Get the latest commit message
    const { execSync } = require('child_process');
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const changedFiles = execSync('git diff --name-only HEAD^ HEAD', { encoding: 'utf8' }).trim().split('\n');
    
    // Check for completion keywords
    const completionKeywords = [
      'feat:', 'fix:', 'complete:', 'finish:', 'done:', 'implement:', 'add:', 'create:'
    ];
    
    const hasCompletionKeyword = completionKeywords.some(keyword => 
      commitMessage.toLowerCase().includes(keyword)
    );
    
    if (hasCompletionKeyword) {
      return {
        needsVerification: true,
        type: 'git-commit',
        description: commitMessage,
        files: changedFiles,
        success: true
      };
    }
    
    return null;
  } catch (error) {
    console.log('Not in git repository or error reading git info');
    return null;
  }
}

/**
 * Generate verification prompt based on trigger type
 */
function generateTriggerVerificationPrompt(triggerInfo) {
  const basePrompt = `
You are a VERIFICATION AGENT triggered by: ${triggerInfo.type}

EVENT DETAILS:
- Description: ${triggerInfo.description}
- Success Status: ${triggerInfo.success}
${triggerInfo.files ? `- Files Changed: ${triggerInfo.files.join(', ')}` : ''}

🚨 VERIFICATION REQUIRED: Independently verify that recent work is actually complete.

VERIFICATION TASKS:
`;

  const typeSpecificTasks = {
    'test-completion': `
1. Review test results to confirm they are meaningful
2. Run additional tests if coverage seems incomplete  
3. Check for any test failures that were ignored
4. Verify the feature being tested actually works in browser
5. Confirm test data and mocks are realistic`,

    'code-commit': `
1. Review commit changes for quality and completeness
2. Run all relevant tests for changed files
3. Check for any breaking changes or regressions
4. Verify commit message accurately describes the changes
5. Test functionality in browser if UI-related`,

    'file-operation': `
1. Verify created files are properly structured
2. Check that file operations support the intended feature
3. Confirm no important files were accidentally modified
4. Test that the overall system still works correctly`
  };

  const tasks = typeSpecificTasks[triggerInfo.type] || `
1. Analyze what work was claimed to be completed
2. Run comprehensive tests to verify functionality
3. Check for any issues or incomplete implementations
4. Verify quality standards are met
5. Test end-user experience`;

  return basePrompt + tasks + `

REQUIRED ACTIONS:
1. Update PROJECT_MONITORING.md with verification findings
2. If issues found: Document what needs to be fixed
3. If verification passes: Confirm completion in activity log

Begin verification now.`;
}

/**
 * Spawn verification agent for trigger event
 */
async function spawnTriggerVerificationAgent(triggerInfo) {
  const agentType = 'verification-specialist';
  const prompt = generateTriggerVerificationPrompt(triggerInfo);
  
  console.log(`🔍 Triggering verification for: ${triggerInfo.type}`);
  console.log(`📝 Description: ${triggerInfo.description}`);
  
  try {
    // Update monitoring log
    updateMonitoringLog('trigger-verification-started', triggerInfo);
    
    // Spawn Claude agent
    const claudeProcess = spawn('claude', [
      '--auto-approve',
      '--agent-type', agentType,
      prompt
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        CLAUDE_AGENT_TYPE: agentType,
        TRIGGER_TYPE: triggerInfo.type,
        TRIGGER_DESCRIPTION: triggerInfo.description
      }
    });
    
    claudeProcess.on('close', (code) => {
      const status = code === 0 ? 'completed' : 'failed';
      updateMonitoringLog(`trigger-verification-${status}`, triggerInfo);
    });
    
    claudeProcess.on('error', (error) => {
      console.error(`Error spawning verification agent:`, error.message);
      updateMonitoringLog('trigger-verification-error', triggerInfo);
    });
    
  } catch (error) {
    console.error('Error in trigger verification:', error.message);
    updateMonitoringLog('trigger-verification-error', triggerInfo);
  }
}

/**
 * Update monitoring log
 */
function updateMonitoringLog(event, triggerInfo) {
  try {
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const eventMessages = {
      'trigger-verification-started': `🎯 Triggered verification: ${triggerInfo.type}`,
      'trigger-verification-completed': `✅ Trigger verification completed: ${triggerInfo.type}`,
      'trigger-verification-failed': `❌ Trigger verification failed: ${triggerInfo.type}`,
      'trigger-verification-error': `💥 Trigger verification error: ${triggerInfo.type}`
    };
    
    const message = eventMessages[event] || `Trigger event: ${event}`;
    
    // Use update-progress script
    spawn('node', [
      path.join(__dirname, 'update-progress.cjs'),
      'activity',
      message,
      triggerInfo.description
    ], { stdio: 'inherit' });
    
  } catch (error) {
    console.error('Error updating monitoring log:', error.message);
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'auto-detect';
  
  let triggerInfo = null;
  
  if (command === 'bash') {
    // Triggered by bash command
    const bashCommand = args[1] || '';
    const bashOutput = args[2] || '';
    triggerInfo = analyzeBashCommand(bashCommand, bashOutput);
    
  } else if (command === 'git-commit' || command === 'auto-detect') {
    // Triggered by git operations or auto-detection
    triggerInfo = analyzeGitCommit();
    
  } else if (command === 'test-completion') {
    // Manually triggered for test completion
    triggerInfo = {
      needsVerification: true,
      type: 'test-completion',
      description: args[1] || 'Manual test completion trigger',
      success: true
    };
  }
  
  if (triggerInfo && triggerInfo.needsVerification) {
    spawnTriggerVerificationAgent(triggerInfo);
  } else if (triggerInfo) {
    console.log(`⏭️ No verification needed for: ${triggerInfo.type}`);
    updateMonitoringLog('trigger-verification-skipped', triggerInfo);
  } else {
    console.log('📍 No verification triggers detected');
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBashCommand,
  analyzeGitCommit,
  spawnTriggerVerificationAgent
};