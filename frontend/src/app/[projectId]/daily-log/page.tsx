'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectDailyLogPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Daily Log"
      description="Daily construction logs"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Daily Log for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
