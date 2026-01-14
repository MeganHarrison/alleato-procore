import {
  GenericDataTable,
  type GenericTableConfig,
} from "@/components/tables/generic-table-factory";
import { ProjectToolPage } from "@/components/layout/project-tool-page";
import { getProjectSchedule } from "@/lib/supabase/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";

const config: GenericTableConfig = {
  title: "Schedule",
  description: "Track project schedule tasks and milestones",
  searchFields: ["name", "description"],
  exportFilename: "schedule-export.csv",
  columns: [
    {
      id: "name",
      label: "Task",
      defaultVisible: true,
      type: "text",
      isPrimary: true,
    },
    {
      id: "task_type",
      label: "Type",
      defaultVisible: true,
      type: "badge",
      renderConfig: {
        type: "badge",
        variantMap: {
          milestone: "secondary",
          task: "default",
          summary: "outline",
        },
        defaultVariant: "outline",
      },
    },
    {
      id: "start_date",
      label: "Start",
      defaultVisible: true,
      type: "date",
    },
    {
      id: "finish_date",
      label: "Finish",
      defaultVisible: true,
      type: "date",
    },
    {
      id: "duration_days",
      label: "Duration (Days)",
      defaultVisible: true,
      type: "number",
    },
    {
      id: "percent_complete",
      label: "% Complete",
      defaultVisible: true,
      type: "number",
    },
    {
      id: "sequence",
      label: "Sequence",
      defaultVisible: false,
      type: "number",
    },
    {
      id: "description",
      label: "Description",
      defaultVisible: false,
      type: "text",
      renderConfig: {
        type: "truncate",
        maxLength: 80,
      },
    },
  ],
};

export default async function ProjectSchedulePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  let project: { name: string | null; client: string | null } = {
    name: "Project",
    client: null,
  };
  let scheduleTasks: Record<string, unknown>[] = [];
  let loadError: string | null = null;

  try {
    const numericProjectId = Number.parseInt(projectId, 10);

    if (Number.isNaN(numericProjectId)) {
      if (process.env.NODE_ENV === "production") {
        notFound();
      }
      loadError = "Invalid project identifier. Showing empty results.";
    } else {
      const supabase = createServiceClient();
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, name, client")
        .eq("id", numericProjectId)
        .single();

      if (projectError || !projectData) {
        if (process.env.NODE_ENV === "production") {
          notFound();
        }
        loadError =
          "Project data unavailable in this environment. Showing empty results.";
      } else {
        project = projectData;
        const { data, error } = await getProjectSchedule(
          supabase,
          numericProjectId,
        );

        if (error) {
          loadError = "Error loading schedule tasks. Please try again later.";
        } else {
          scheduleTasks = data ?? [];
        }
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    loadError =
      "Schedule data unavailable in this environment. Showing empty results.";
  }

  return (
    <ProjectToolPage
      project={project.name || undefined}
      client={project.client || undefined}
      title="Schedule"
      description="Track project schedule tasks and milestones"
    >
      {loadError && (
        <div className="text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
          {loadError}
        </div>
      )}
      <GenericDataTable data={scheduleTasks} config={config} />
    </ProjectToolPage>
  );
}
