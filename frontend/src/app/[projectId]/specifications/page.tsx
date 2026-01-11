"use client";

import { useParams } from "next/navigation";
import { ProjectToolPage } from "@/components/layout/project-tool-page";
import { Card } from "@/components/ui/card";

export default function ProjectSpecificationsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Specifications"
      description="Project specifications"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Specifications for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
