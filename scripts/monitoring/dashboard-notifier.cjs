#!/usr/bin/env node
/**
 * Dashboard Notifier
 * Automatically notifies the dashboard of updates via API calls
 */

const http = require('http');
const https = require('https');

/**
 * Notify dashboard of monitoring updates
 */
async function notifyDashboard(updateType, data = {}) {
  try {
    // Dashboard API endpoint
    const apiUrl = process.env.DASHBOARD_API_URL || 'http://localhost:3001/api/monitoring/notify';
    
    const payload = {
      type: updateType,
      timestamp: new Date().toISOString(),
      data: data
    };
    
    // Simple HTTP POST to notify dashboard
    await makeHttpRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📊 Dashboard notified: ${updateType}`);
    
  } catch (error) {
    // Don't fail the script if dashboard notification fails
    console.log(`⚠️ Dashboard notification failed: ${error.message}`);
  }
}

/**
 * Make HTTP request
 */
function makeHttpRequest(url, options) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    
    const req = lib.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Integration with monitoring scripts
 */
module.exports = {
  notifyDashboard,
  
  // Specific notification types
  notifyInitiativeUpdate: (initiativeId, status) => {
    return notifyDashboard('initiative_update', { initiativeId, status });
  },
  
  notifyTaskCompletion: (taskId, result) => {
    return notifyDashboard('task_completion', { taskId, result });
  },
  
  notifyVerificationResult: (targetId, result) => {
    return notifyDashboard('verification_result', { targetId, result });
  },
  
  notifySystemHealth: (component, status) => {
    return notifyDashboard('system_health', { component, status });
  },
  
  notifyAgentActivity: (agent, activity) => {
    return notifyDashboard('agent_activity', { agent, activity });
  }
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const updateType = args[0];
  const data = args[1] ? JSON.parse(args[1]) : {};
  
  notifyDashboard(updateType, data);
}