"use client";

import { ReactNode } from "react";
import { PageHeader } from "@/components/design-system";
import { PageContainer } from "@/components/layout";

interface ProjectToolPageProps {
  project?: string;
  client?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Reusable layout component for project-scoped tool pages.
 * Provides consistent header and container styling.
 */
export function ProjectToolPage({
  project,
  client,
  title,
  description,
  actions,
  children,
}: ProjectToolPageProps) {
  return (
    <>
      <PageHeader
        project={project}
        client={client}
        title={title}
        description={description}
        actions={actions}
      />
      <PageContainer>{children}</PageContainer>
    </>
  );
}
