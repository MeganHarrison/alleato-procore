'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectPunchListPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Punch List"
      description="Track punch list items"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Punch List for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
