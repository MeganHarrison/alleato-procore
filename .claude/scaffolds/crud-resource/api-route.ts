// =============================================================================
// SCAFFOLD: Project-Scoped CRUD API Route
// Replace: __ENTITY__, __entity__, __entities__, __ENTITY_TABLE__
// File path: frontend/src/app/api/projects/[projectId]/__entities__/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { __ENTITY__Service } from "@/services/__entity__Service";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

/**
 * GET /api/projects/[projectId]/__entities__
 * Get paginated list of __entities__
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const projectIdNum = parseInt(projectId, 10);

    if (isNaN(projectIdNum)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as "active" | "inactive" | "all") || "active",
      sort: searchParams.get("sort") || "created_at:desc",
      page: parseInt(searchParams.get("page") || "1", 10),
      per_page: parseInt(searchParams.get("per_page") || "25", 10),
    };

    const supabase = await createClient();
    const service = new __ENTITY__Service(supabase);
    const result = await service.get__ENTITY__s(projectIdNum, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching __entities__:", error);
    return NextResponse.json(
      { error: "Failed to fetch __entities__" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[projectId]/__entities__
 * Create a new __entity__
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const projectIdNum = parseInt(projectId, 10);

    if (isNaN(projectIdNum)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const service = new __ENTITY__Service(supabase);
    const created = await service.create__ENTITY__(
      projectIdNum,
      body,
      user?.id
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating __entity__:", error);
    return NextResponse.json(
      { error: "Failed to create __entity__" },
      { status: 500 }
    );
  }
}


// =============================================================================
// SCAFFOLD: Single Resource API Route
// File path: frontend/src/app/api/projects/[projectId]/__entities__/[__entity__Id]/route.ts
// =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";
// import { __ENTITY__Service } from "@/services/__entity__Service";

// interface RouteParams {
//   params: Promise<{ projectId: string; __entity__Id: string }>;
// }

// /**
//  * GET /api/projects/[projectId]/__entities__/[__entity__Id]
//  * Get a single __entity__
//  */
// export async function GET(request: NextRequest, { params }: RouteParams) {
//   try {
//     const { projectId, __entity__Id } = await params;
//     const projectIdNum = parseInt(projectId, 10);

//     const supabase = await createClient();
//     const service = new __ENTITY__Service(supabase);
//     const result = await service.get__ENTITY__(projectIdNum, __entity__Id);

//     return NextResponse.json(result);
//   } catch (error) {
//     if ((error as NodeJS.ErrnoException).code === "RESOURCE_NOT_FOUND") {
//       return NextResponse.json(
//         { error: (error as Error).message },
//         { status: 404 }
//       );
//     }
//     console.error("Error fetching __entity__:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch __entity__" },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * PATCH /api/projects/[projectId]/__entities__/[__entity__Id]
//  * Update a __entity__
//  */
// export async function PATCH(request: NextRequest, { params }: RouteParams) {
//   try {
//     const { projectId, __entity__Id } = await params;
//     const projectIdNum = parseInt(projectId, 10);
//     const body = await request.json();

//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     const service = new __ENTITY__Service(supabase);
//     const updated = await service.update__ENTITY__(
//       projectIdNum,
//       __entity__Id,
//       body,
//       user?.id
//     );

//     return NextResponse.json(updated);
//   } catch (error) {
//     console.error("Error updating __entity__:", error);
//     return NextResponse.json(
//       { error: "Failed to update __entity__" },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * DELETE /api/projects/[projectId]/__entities__/[__entity__Id]
//  * Delete a __entity__
//  */
// export async function DELETE(request: NextRequest, { params }: RouteParams) {
//   try {
//     const { projectId, __entity__Id } = await params;
//     const projectIdNum = parseInt(projectId, 10);

//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     const service = new __ENTITY__Service(supabase);
//     await service.delete__ENTITY__(projectIdNum, __entity__Id, user?.id);

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Error deleting __entity__:", error);
//     return NextResponse.json(
//       { error: "Failed to delete __entity__" },
//       { status: 500 }
//     );
//   }
// }
