import {
  GenericDataTable,
  type GenericTableConfig,
} from "@/components/tables/generic-table-factory";
import { TableLayout } from "@/components/layouts";
import { getProjectInfo } from "@/lib/supabase/project-fetcher";

const config: GenericTableConfig = {
  title: "Daily Log",
  description: "Daily construction logs and site reports",
  searchFields: ["log_date", "created_by"],
  exportFilename: "daily-logs-export.csv",
  editConfig: {
    tableName: "daily_logs",
    editableFields: ["log_date", "weather_conditions"],
  },
  columns: [
    {
      id: "log_date",
      label: "Date",
      defaultVisible: true,
      type: "date",
    },
    {
      id: "weather_conditions",
      label: "Weather",
      defaultVisible: true,
      type: "text",
      renderConfig: {
        type: "json",
        maxLength: 100,
      },
    },
    {
      id: "created_by",
      label: "Created By",
      defaultVisible: true,
      type: "text",
    },
    {
      id: "created_at",
      label: "Created",
      defaultVisible: false,
      type: "date",
    },
    {
      id: "updated_at",
      label: "Updated",
      defaultVisible: false,
      type: "date",
    },
  ],
  filters: [],
};

export default async function ProjectDailyLogPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { numericProjectId, supabase } = await getProjectInfo(projectId);

  const { data: dailyLogs, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", numericProjectId)
    .order("log_date", { ascending: false });

  if (error) {
    return (
      <TableLayout>
        <div className="text-center text-destructive p-6">
          Error loading daily logs. Please try again later.
        </div>
      </TableLayout>
    );
  }

  return (
    <TableLayout>
      <GenericDataTable data={dailyLogs || []} config={config} />
    </TableLayout>
  );
}
