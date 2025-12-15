'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Tasks"
      description="Manage project tasks and assignments"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Tasks for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
