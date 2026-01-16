import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectToolPage } from "@/components/layout/project-tool-page";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RfisTable, type RfiRow } from "@/components/rfis/rfis-table";

interface ProjectRfisPageProps {
  params: { projectId: string };
}

export default async function ProjectRFIsPage({
  params,
}: ProjectRfisPageProps) {
  const projectId = Number(params.projectId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project RFIs:", error);
    return <div>Error loading RFIs</div>;
  }

  return (
    <ProjectToolPage
      title="RFIs"
      description="Requests for Information"
      actions={
        <Button
          asChild
          className="bg-[hsl(var(--procore-orange))] hover:bg-[hsl(var(--procore-orange))]/90"
        >
          <Link href={`/form-rfi?projectId=${projectId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Create RFI
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <RfisTable rfis={(data as RfiRow[]) || []} />
      </div>
    </ProjectToolPage>
  );
}
