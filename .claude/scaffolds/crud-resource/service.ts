// =============================================================================
// SCAFFOLD: Project-Scoped CRUD Service
// Replace: __ENTITY__, __entity__, __entities__, __ENTITY_TABLE__
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Extract types from database schema
type Tables = Database["public"]["Tables"];
type __ENTITY__Row = Tables["__ENTITY_TABLE__"]["Row"];
type __ENTITY__Insert = Tables["__ENTITY_TABLE__"]["Insert"];
type __ENTITY__Update = Tables["__ENTITY_TABLE__"]["Update"];

// Response types
export interface __ENTITY__ListResponse {
  data: __ENTITY__Row[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Filter interface
export interface __ENTITY__Filters {
  search?: string;
  status?: "active" | "inactive" | "all";
  sort?: string; // Format: "field:asc" or "field:desc"
  page?: number;
  per_page?: number;
}

// Create DTO (what the client sends)
export interface Create__ENTITY__DTO {
  name: string;
  description?: string;
  // Add other required fields
}

// Update DTO (all fields optional)
export interface Update__ENTITY__DTO {
  name?: string;
  description?: string;
  status?: "active" | "inactive";
  // Add other updatable fields
}

export class __ENTITY__Service {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get paginated list of __entities__ for a project
   */
  async get__ENTITY__s(
    projectId: number,
    filters: __ENTITY__Filters = {}
  ): Promise<__ENTITY__ListResponse> {
    const {
      search,
      status = "active",
      sort = "created_at:desc",
      page = 1,
      per_page = 25,
    } = filters;

    const offset = (page - 1) * per_page;

    // Build query
    let query = this.supabase
      .from("__ENTITY_TABLE__")
      .select("*", { count: "exact" })
      .eq("project_id", projectId);

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Apply search
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Apply sorting
    const [sortField, sortDirection = "asc"] = sort.split(":");
    query = query.order(sortField, { ascending: sortDirection === "asc" });

    // Apply pagination
    query = query.range(offset, offset + per_page - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        current_page: page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      },
    };
  }

  /**
   * Get a single __entity__ by ID
   */
  async get__ENTITY__(
    projectId: number,
    id: string
  ): Promise<__ENTITY__Row> {
    const { data, error } = await this.supabase
      .from("__ENTITY_TABLE__")
      .select("*")
      .eq("project_id", projectId)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        const notFoundError = new Error(`__ENTITY__ with ID ${id} not found.`);
        (notFoundError as NodeJS.ErrnoException).code = "RESOURCE_NOT_FOUND";
        throw notFoundError;
      }
      throw error;
    }

    return data;
  }

  /**
   * Create a new __entity__
   */
  async create__ENTITY__(
    projectId: number,
    dto: Create__ENTITY__DTO,
    userId?: string
  ): Promise<__ENTITY__Row> {
    const insertData: __ENTITY__Insert = {
      project_id: projectId,
      name: dto.name,
      description: dto.description,
      status: "active",
      created_by: userId,
      updated_by: userId,
    };

    const { data, error } = await this.supabase
      .from("__ENTITY_TABLE__")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Update an existing __entity__
   */
  async update__ENTITY__(
    projectId: number,
    id: string,
    dto: Update__ENTITY__DTO,
    userId?: string
  ): Promise<__ENTITY__Row> {
    const updateData: __ENTITY__Update = {
      ...dto,
      updated_by: userId,
    };

    const { data, error } = await this.supabase
      .from("__ENTITY_TABLE__")
      .update(updateData)
      .eq("project_id", projectId)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete a __entity__ (soft delete by setting status)
   */
  async delete__ENTITY__(
    projectId: number,
    id: string,
    userId?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("__ENTITY_TABLE__")
      .update({ status: "deleted", updated_by: userId })
      .eq("project_id", projectId)
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Hard delete a __entity__ (use with caution)
   */
  async hardDelete__ENTITY__(
    projectId: number,
    id: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("__ENTITY_TABLE__")
      .delete()
      .eq("project_id", projectId)
      .eq("id", id);

    if (error) throw error;
  }
}
