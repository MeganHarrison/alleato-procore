'use client';

import { ReactNode } from 'react';
import { ProjectPageHeader, PageContainer } from '@/components/layout';

interface ProjectToolPageProps {
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
  title,
  description,
  actions,
  children,
}: ProjectToolPageProps) {
  return (
    <>
      <ProjectPageHeader
        title={title}
        description={description}
        actions={actions}
      />
      <PageContainer>
        {children}
      </PageContainer>
    </>
  );
}
