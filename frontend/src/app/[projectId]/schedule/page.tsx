'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectSchedulePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Schedule"
      description="Project schedule management"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Schedule for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
