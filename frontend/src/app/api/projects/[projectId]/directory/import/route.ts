import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PermissionService } from "@/services/permissionService";
import {
  DirectoryAdminService,
  type DirectoryImportOptions,
  type DirectoryTemplateType,
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "CSV file is required" },
        { status: 400 },
      );
    }

    const type = (formData.get("type") as DirectoryTemplateType) || "users";
    const options: DirectoryImportOptions = {
      type,
      hasHeaders: formData.get("hasHeaders") !== "false",
      skipDuplicates: formData.get("skipDuplicates") === "true",
      updateExisting: formData.get("updateExisting") === "true",
      defaultCompanyId: formData.get("defaultCompanyId") || undefined,
      defaultPermissionTemplateId:
        formData.get("defaultPermissionTemplateId") || undefined,
    };

    const buffer = await file.arrayBuffer();
    const adminService = new DirectoryAdminService(serviceSupabase);
    const result = await adminService.importFromCsv(
      projectId,
      buffer,
      options,
      user.id,
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[DirectoryImport] Failed", error);
    return NextResponse.json(
      {
        error: "Failed to import directory data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
