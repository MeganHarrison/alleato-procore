import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PermissionService } from "@/services/permissionService";
import { DirectoryAdminService } from "@/services/directoryAdminService";

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

    const body = (await request.json()) as { personIds: string[] };
    if (!body?.personIds || body.personIds.length === 0) {
      return NextResponse.json(
        { error: "personIds are required" },
        { status: 400 },
      );
    }

    const adminService = new DirectoryAdminService(serviceSupabase);
    const result = await adminService.bulkInvite(projectId, body.personIds);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[DirectoryBulkInvite] Failed", error);
    return NextResponse.json(
      {
        error: "Failed to send invitations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
