/**
 * =============================================================================
 * SCHEDULE TASK CRUD API ENDPOINTS
 * =============================================================================
 *
 * RESTful API endpoints for individual Schedule Task operations
 * Supports:
 * - Get single task with details
 * - Update task
 * - Delete task
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SchedulingService } from "@/lib/services/scheduling-service";
import { ScheduleTaskUpdate } from "@/types/scheduling";

// =============================================================================
// GET - Fetch Single Schedule Task
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  try {
    const { projectId, taskId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please log in" },
        { status: 401 }
      );
    }

    const service = new SchedulingService(supabase);
    const task = await service.getTaskById(projectId, taskId);

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("Failed to fetch schedule task:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule task" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT - Update Schedule Task
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  try {
    const { projectId, taskId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate name if provided
    if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim() === "")) {
      return NextResponse.json(
        { error: "Task name cannot be empty" },
        { status: 400 }
      );
    }

    // Validate date constraints if both are provided
    if (body.start_date && body.finish_date) {
      const start = new Date(body.start_date);
      const finish = new Date(body.finish_date);
      if (start > finish) {
        return NextResponse.json(
          { error: "Start date cannot be after finish date" },
          { status: 400 }
        );
      }
    }

    // Validate milestone constraints
    if (body.is_milestone && body.duration_days && body.duration_days !== 0) {
      return NextResponse.json(
        { error: "Milestones must have zero duration" },
        { status: 400 }
      );
    }

    // Validate percent_complete if provided
    if (body.percent_complete !== undefined) {
      if (body.percent_complete < 0 || body.percent_complete > 100) {
        return NextResponse.json(
          { error: "Percent complete must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    // Build update data - only include provided fields
    const updateData: ScheduleTaskUpdate = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.parent_task_id !== undefined) updateData.parent_task_id = body.parent_task_id;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.finish_date !== undefined) updateData.finish_date = body.finish_date;
    if (body.duration_days !== undefined) updateData.duration_days = body.duration_days;
    if (body.percent_complete !== undefined) updateData.percent_complete = body.percent_complete;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.is_milestone !== undefined) updateData.is_milestone = body.is_milestone;
    if (body.constraint_type !== undefined) updateData.constraint_type = body.constraint_type;
    if (body.constraint_date !== undefined) updateData.constraint_date = body.constraint_date;
    if (body.wbs_code !== undefined) updateData.wbs_code = body.wbs_code;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    const service = new SchedulingService(supabase);
    const task = await service.updateTask(projectId, taskId, updateData);

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("Failed to update schedule task:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      if (error.message.includes("circular")) {
        return NextResponse.json(
          { error: "Cannot create circular dependency" },
          { status: 400 }
        );
      }

      if (error.message.includes("permission")) {
        return NextResponse.json(
          { error: "Insufficient permissions to update task" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update schedule task" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Schedule Task
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  try {
    const { projectId, taskId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please log in" },
        { status: 401 }
      );
    }

    const service = new SchedulingService(supabase);
    const deleted = await service.deleteTask(projectId, taskId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Task deleted successfully",
      id: taskId,
    });
  } catch (error) {
    console.error("Failed to delete schedule task:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      if (error.message.includes("children") || error.message.includes("child")) {
        return NextResponse.json(
          { error: "Cannot delete task with child tasks. Delete children first." },
          { status: 400 }
        );
      }

      if (error.message.includes("permission")) {
        return NextResponse.json(
          { error: "Insufficient permissions to delete task" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete schedule task" },
      { status: 500 }
    );
  }
}
