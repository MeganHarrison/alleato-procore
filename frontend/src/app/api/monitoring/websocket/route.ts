import { NextRequest, NextResponse } from 'next/server';

// Server-Sent Events endpoint for real-time monitoring updates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel') || 'monitoring';

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'connection',
            message: 'Connected to monitoring updates',
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      );

      // Simulate real-time updates (in production, this would listen to actual events)
      const interval = setInterval(() => {
        const updates = [
          {
            type: 'task_progress',
            data: {
              initiativeId: 'INI-2026-01-09-001',
              progress: Math.floor(Math.random() * 100),
              timestamp: new Date().toISOString(),
            },
          },
          {
            type: 'agent_activity',
            data: {
              agent: 'backend-architect',
              action: 'Working on Change Events database schema',
              status: 'active',
              timestamp: new Date().toISOString(),
            },
          },
          {
            type: 'verification_update',
            data: {
              initiativeId: 'INI-2026-01-09-923',
              level: 'Level 2: Functional',
              status: 'passed',
              timestamp: new Date().toISOString(),
            },
          },
          {
            type: 'system_alert',
            data: {
              severity: 'info',
              title: 'System Status Update',
              message: 'All monitoring systems operational',
              timestamp: new Date().toISOString(),
            },
          },
        ];

        const randomUpdate = updates[Math.floor(Math.random() * updates.length)];

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(randomUpdate)}\n\n`)
          );
        } catch (error) {
          console.error('Error sending SSE update:', error);
          clearInterval(interval);
          controller.close();
        }
      }, 5000); // Send update every 5 seconds

      // Cleanup on connection close
      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (error) {
          // Controller already closed
        }
      };

      // Handle client disconnect
      request.signal?.addEventListener('abort', cleanup);

      // Cleanup after 5 minutes max
      setTimeout(cleanup, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    // In a real implementation, you'd broadcast this to all connected clients
    console.log('Broadcasting event:', event, data);

    // Simulate processing the event
    return NextResponse.json({
      success: true,
      message: 'Event broadcasted successfully',
      event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    },
  });
}
