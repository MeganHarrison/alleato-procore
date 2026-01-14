"use client";

import { GenericDataTable, type GenericTableConfig } from "@/components/tables/generic-table-factory";

interface Props {
  data: Record<string, unknown>[];
  config: GenericTableConfig;
  tableName: string;
}

export function GenericTableWithDelete({ data, config, tableName }: Props) {
  return (
    <GenericDataTable
      data={data}
      config={config}
      onDeleteRow={async (id) => {
        const res = await fetch("/api/table-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: tableName, id }),
        });
        if (!res.ok) return { error: "Failed to delete" } as const;
        return { success: true } as const;
      }}
    />
  );
}

