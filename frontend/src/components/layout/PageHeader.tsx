"use client";

// This component is deprecated - use page-header-unified.tsx instead
// Keeping for backwards compatibility during migration

import * as React from "react";
import { PageHeader as UnifiedPageHeader } from "./page-header-unified";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * @deprecated Use PageHeader from page-header-unified.tsx instead
 * This is a compatibility wrapper that will be removed in the future
 */
export function PageHeader(props: PageHeaderProps) {
  return <UnifiedPageHeader {...props} />;
}
