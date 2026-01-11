// This component is deprecated - use page-header-unified.tsx instead
// Keeping for backwards compatibility during migration

import React from "react";
import { PageHeader as UnifiedPageHeader } from "../layout/page-header-unified";

interface PageHeaderProps {
  project?: string;
  client?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * @deprecated Use PageHeader from layout/page-header-unified.tsx with variant="executive"
 * This is a compatibility wrapper that will be removed in the future
 *
 * Executive-level page header component
 * Follows the architectural design system with serif typography and refined spacing
 */
export function PageHeader({
  project,
  client,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <UnifiedPageHeader
      variant="executive"
      title={title}
      description={description}
      actions={actions}
      preHeading={{ project, client }}
      showProjectName={false}
    />
  );
}
