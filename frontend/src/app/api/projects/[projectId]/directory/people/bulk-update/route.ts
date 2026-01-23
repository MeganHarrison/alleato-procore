import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PermissionService } from "@/services/permissionService";
import {
  DirectoryAdminService,
  type DirectoryBulkUpdatePayload,
} from "@/services/directoryAdminService";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissionService = new PermissionService(supabase);
    await permissionService.requirePermission(
      user.id,
      projectId,
      "directory",
      "write",
    );

    const payload = (await request.json()) as DirectoryBulkUpdatePayload;

    if (!payload?.personIds || payload.personIds.length === 0) {
      return NextResponse.json(
        { error: "personIds are required" },
        { status: 400 },
      );
    }

    const adminService = new DirectoryAdminService(serviceSupabase);
    const result = await adminService.bulkUpdatePeople(
      projectId,
      payload,
      user.id,
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[DirectoryBulkUpdate] Failed", error);
    return NextResponse.json(
      {
        error: "Failed to process bulk update",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
