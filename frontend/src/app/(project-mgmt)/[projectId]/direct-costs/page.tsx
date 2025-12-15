'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectDirectCostsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Direct Costs"
      description="Direct cost tracking"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Direct Costs for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
