'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectDrawingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Drawings"
      description="Project drawings and blueprints"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Drawings for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
