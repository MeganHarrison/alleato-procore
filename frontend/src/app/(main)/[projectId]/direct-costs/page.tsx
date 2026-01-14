"use client";

import { useParams } from "next/navigation";
import {
  ProjectPageHeader,
  PageContainer,
  PageTabs,
} from "@/components/layout";
import { Card } from "@/components/ui/card";

export default function ProjectDirectCostsPage() {
  const params = useParams();
  const projectId = parseInt(params.projectId as string, 10);

  return (
    <>
      <ProjectPageHeader
        title="Direct Costs"
        description="Track and manage direct project costs"
      />

      <PageTabs
        tabs={[
          { label: "All Direct Costs", href: `/${projectId}/direct-costs` },
          { label: "Labor", href: `/${projectId}/direct-costs?type=labor` },
          {
            label: "Materials",
            href: `/${projectId}/direct-costs?type=materials`,
          },
          {
            label: "Equipment",
            href: `/${projectId}/direct-costs?type=equipment`,
          },
        ]}
      />

      <PageContainer>
        <Card className="p-6">
          <p className="text-muted-foreground">
            Direct Costs for project {projectId} - Coming soon
          </p>
        </Card>
      </PageContainer>
    </>
  );
}
