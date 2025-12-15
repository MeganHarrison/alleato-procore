'use client';

import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Card } from '@/components/ui/card';

export default function ProjectReportingPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectToolPage
      title="360 Reporting"
      description="Comprehensive project reporting and analytics"
    >
      <Card className="p-6">
        <p className="text-muted-foreground">
          360 Reporting tool for project {projectId} - Coming soon
        </p>
      </Card>
    </ProjectToolPage>
  );
}
