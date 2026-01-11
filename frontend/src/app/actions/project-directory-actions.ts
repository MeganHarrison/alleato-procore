"use server";

import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database.types";

type ProjectDirectoryInsert =
  Database["public"]["Tables"]["project_directory"]["Insert"];
type ProjectDirectoryUpdate =
  Database["public"]["Tables"]["project_directory"]["Update"];

export async function addToProjectDirectory(entry: ProjectDirectoryInsert) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("project_directory")
    .insert(entry)
    .select(
      `
      *,
      company:companies(*)
    `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateProjectDirectoryEntry(
  id: string,
  updates: ProjectDirectoryUpdate,
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("project_directory")
    .update(updates)
    .eq("id", id)
    .select(
      `
      *,
      company:companies(*)
    `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteProjectDirectoryEntry(id: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("project_directory")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getProjectDirectory(projectId: number) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("project_directory")
    .select(
      `
      *,
      company:companies(*)
    `,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
