"use client";

import { useParams } from "next/navigation";
import { ProjectToolPage } from "@/components/layout/project-tool-page";
import { Card } from "@/components/ui/card";

export default function ProjectSubmittalsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Submittals"
      description="Manage submittals and approvals"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Submittals for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
