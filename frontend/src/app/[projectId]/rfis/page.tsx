"use client";

import { useParams } from "next/navigation";
import { ProjectToolPage } from "@/components/layout/project-tool-page";
import { Card } from "@/components/ui/card";

export default function ProjectRFIsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage title="RFIs" description="Requests for Information">
      <Card className="p-6">
        <p className="text-muted-foreground">
          RFIs for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
