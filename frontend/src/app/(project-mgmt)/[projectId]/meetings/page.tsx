'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectMeetingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="Meetings"
      description="Meeting minutes and schedules"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          Meetings for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
