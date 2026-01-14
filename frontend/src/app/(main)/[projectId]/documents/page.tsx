"use client";

import { useParams } from "next/navigation";
import { ProjectToolPage } from "@/components/layout/project-tool-page";
import { Card } from "@/components/ui/card";

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Documents"
      description="Manage project documents and files"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Documents for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
