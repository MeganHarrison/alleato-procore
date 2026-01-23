import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PermissionService } from "@/services/permissionService";
import { DirectoryPreferencesService } from "@/services/directoryPreferencesService";
import type { DirectoryFilters } from "@/components/directory/DirectoryFilters";
import type { ColumnConfig } from "@/components/directory/ColumnManager";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

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

    const prefService = new DirectoryPreferencesService(supabase);
    const [lastFilters, columnPreferences] = await Promise.all([
      prefService.getLastFilters(user.id, projectId),
      prefService.getColumnPreferences(user.id, projectId),
    ]);

    return NextResponse.json({ data: { lastFilters, columnPreferences } });
  } catch (error) {
    console.error("[DirectoryPreferences] Failed to fetch", error);
    return NextResponse.json(
      { error: "Failed to load preferences" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

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

    const body = (await request.json()) as {
      lastFilters?: DirectoryFilters;
      columnPreferences?: ColumnConfig[];
    };

    const prefService = new DirectoryPreferencesService(supabase);
    if (body.lastFilters) {
      await prefService.saveLastFilters(user.id, projectId, body.lastFilters);
    }
    if (body.columnPreferences) {
      await prefService.saveColumnPreferences(
        user.id,
        projectId,
        body.columnPreferences,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DirectoryPreferences] Failed to save", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 },
    );
  }
}
