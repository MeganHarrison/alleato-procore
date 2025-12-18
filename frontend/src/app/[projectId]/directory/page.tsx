'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectDirectoryPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Directory"
      description="Project directory and contacts"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Directory for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
