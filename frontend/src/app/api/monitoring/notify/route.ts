import { NextRequest, NextResponse } from 'next/server';

/**
 * Dashboard notification endpoint
 * Receives real-time updates from monitoring scripts
 */

// Simple in-memory store for recent notifications
// In production, you'd use Redis or a database
let recentNotifications: NotificationWithId[] = [];
const MAX_NOTIFICATIONS = 100;

interface NotificationData {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface NotificationWithId extends NotificationData {
  id: string;
  received: string;
}

/**
 * POST: Receive notification from monitoring scripts
 */
export async function POST(request: NextRequest) {
  try {
    const notification: NotificationData = await request.json();

    // Validate required fields
    if (!notification.type || !notification.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: type, timestamp' },
        { status: 400 }
      );
    }

    // Add to recent notifications
    const notificationWithId: NotificationWithId = {
      id: `notif-${Date.now()}`,
      ...notification,
      received: new Date().toISOString(),
    };

    recentNotifications.unshift(notificationWithId);

    // Keep only recent notifications
    if (recentNotifications.length > MAX_NOTIFICATIONS) {
      recentNotifications = recentNotifications.slice(0, MAX_NOTIFICATIONS);
    }

    console.warn(
      `📊 Dashboard notification received: ${notification.type}`,
      notification.data
    );

    // Handle notification type-specific logic
    await handleNotificationType(notification);

    return NextResponse.json({
      success: true,
      message: 'Notification received',
      id: notificationWithId.id,
    });
  } catch (error) {
    console.error('Error handling dashboard notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve recent notifications
 */
export async function GET() {
  try {
    return NextResponse.json({
      notifications: recentNotifications.slice(0, 20), // Last 20
      count: recentNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * Handle different notification types
 */
async function handleNotificationType(
  notification: NotificationData
): Promise<void> {
  switch (notification.type) {
    case 'activity_log':
      console.warn(`📝 Activity: ${notification.data.activity}`);
      break;

    case 'initiative_update':
      console.warn(
        `📋 Initiative ${notification.data.initiativeId} updated: ${notification.data.status}`
      );
      break;

    case 'task_completion':
      console.warn(`✅ Task completed: ${notification.data.taskId}`);
      // Could trigger verification here
      break;

    case 'verification_result':
      console.warn(
        `🔍 Verification result for ${notification.data.targetId}: ${notification.data.result}`
      );
      break;

    case 'system_health':
      console.warn(
        `🏥 System health update: ${notification.data.component} = ${notification.data.status}`
      );
      break;

    case 'agent_activity':
      console.warn(
        `🤖 Agent activity: ${notification.data.agent} - ${notification.data.activity}`
      );
      break;

    default:
      console.warn(`📢 Unknown notification type: ${notification.type}`);
  }
}
