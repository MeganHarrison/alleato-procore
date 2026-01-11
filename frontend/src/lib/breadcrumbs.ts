/**
 * Breadcrumb utility functions for generating breadcrumb paths
 */

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Project {
  id: number;
  name: string;
}

/**
 * Generate breadcrumbs for financial pages with project context
 */
export function getFinancialBreadcrumbs(
  pageName: string,
  selectedProject?: Project | null,
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Add Home if project is selected
  if (selectedProject) {
    breadcrumbs.push({
      label: "Home",
      href: `/${selectedProject.id}/home`,
    });
  }

  // Add project name as second breadcrumb
  if (selectedProject) {
    breadcrumbs.push({
      label: selectedProject.name,
      href: `/${selectedProject.id}/home`,
    });
  }

  // Add Financial category
  breadcrumbs.push({
    label: "Financial",
    href: "/financial",
  });

  // Add current page (no href = current page)
  breadcrumbs.push({
    label: pageName,
  });

  return breadcrumbs;
}

/**
 * Generate breadcrumbs for project management pages with project context
 */
export function getProjectManagementBreadcrumbs(
  pageName: string,
  selectedProject?: Project | null,
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Add Home if project is selected
  if (selectedProject) {
    breadcrumbs.push({
      label: "Home",
      href: `/${selectedProject.id}/home`,
    });
  }

  // Add project name
  if (selectedProject) {
    breadcrumbs.push({
      label: selectedProject.name,
      href: `/${selectedProject.id}/home`,
    });
  }

  // Add current page
  breadcrumbs.push({
    label: pageName,
  });

  return breadcrumbs;
}

/**
 * Generate breadcrumbs for general pages
 */
export function getGeneralBreadcrumbs(
  pageName: string,
  category?: string,
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  if (category) {
    breadcrumbs.push({
      label: category,
      href: `/${category.toLowerCase()}`,
    });
  }

  breadcrumbs.push({
    label: pageName,
  });

  return breadcrumbs;
}
