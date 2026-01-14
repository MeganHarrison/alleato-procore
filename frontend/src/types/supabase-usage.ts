export interface SupabaseFileUsageEntry {
  file: string;
  tables: string[];
}

export interface SupabaseTableUsageEntry {
  table: string;
  files: string[];
}

export interface SupabaseUsageData {
  fileUsage: SupabaseFileUsageEntry[];
  tableUsage: SupabaseTableUsageEntry[];
}
