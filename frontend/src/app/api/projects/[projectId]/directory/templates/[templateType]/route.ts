import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PermissionService } from "@/services/permissionService";
import { DirectoryAdminService } from "@/services/directoryAdminService";
import { createServiceClient } from "@/lib/supabase/service";
import type { DirectoryTemplateType } from "@/services/directoryAdminService";

interface RouteParams {
  params: Promise<{ projectId: string; templateType: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, templateType } = await params;
    const type = (templateType as DirectoryTemplateType) || "users";

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
      "read",
    );

    const adminService = new DirectoryAdminService(serviceSupabase);
    const csv = await adminService.generateTemplateCsv(type);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="directory-${type}-template.csv"`,
      },
    });
  } catch (error) {
    console.error("[DirectoryTemplate] Failed", error);
    return NextResponse.json(
      {
        error: "Failed to generate template",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
