"use client";

// This component is deprecated - use page-header-unified.tsx instead
// Keeping for backwards compatibility during migration

import * as React from "react";
import { PageHeader as UnifiedPageHeader } from "./page-header-unified";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ProjectPageHeaderProps {
  title: string;
  titleContent?: React.ReactNode;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
  showProjectName?: boolean;
  showExportButton?: boolean;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  exportLabel?: string;
}

/**
 * @deprecated Use PageHeader from page-header-unified.tsx instead
 * This is a compatibility wrapper that will be removed in the future
 */
export function ProjectPageHeader(props: ProjectPageHeaderProps) {
  // Default showProjectName to true for backwards compatibility
  return (
    <UnifiedPageHeader
      {...props}
      showProjectName={props.showProjectName ?? true}
    />
  );
}
