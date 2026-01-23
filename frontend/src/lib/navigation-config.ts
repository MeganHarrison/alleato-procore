// Shared navigation configuration for site header and sidebar
// This ensures consistency between different navigation components

export interface NavigationTool {
  name: string;
  path: string;
  requiresProject?: boolean;
  isFavorite?: boolean;
}

export const coreTools: NavigationTool[] = [
  { name: "Projects", path: "", requiresProject: false },
  { name: "Company Directory", path: "directory/companies", requiresProject: false },
  { name: "Home", path: "home", requiresProject: true },
  { name: "360 Reporting", path: "reporting", requiresProject: true },
  { name: "Documents", path: "documents", requiresProject: true },
  { name: "Directory", path: "directory", requiresProject: true },
  { name: "Tables Directory", path: "tables-directory", requiresProject: false },
  { name: "Settings", path: "settings/plugins", requiresProject: false },
  { name: "Tasks", path: "tasks", requiresProject: true },
  { name: "Admin", path: "admin", requiresProject: true },
];

export const projectManagementTools: NavigationTool[] = [
  { name: "Emails", path: "emails", requiresProject: true },
  { name: "RFIs", path: "rfis", requiresProject: true },
  { name: "Submittals", path: "submittals", requiresProject: true },
  { name: "Transmittals", path: "transmittals", requiresProject: true },
  { name: "Punch List", path: "punch-list", requiresProject: true },
  { name: "Meetings", path: "meetings", requiresProject: true },
  { name: "Schedule", path: "schedule", requiresProject: true },
  { name: "Daily Log", path: "daily-log", requiresProject: true },
  { name: "Photos", path: "photos", requiresProject: true },
  { name: "Drawings", path: "drawings", requiresProject: true },
  { name: "Specifications", path: "specifications", requiresProject: true },
];

export const financialManagementTools: NavigationTool[] = [
  { name: "Prime Contracts", path: "prime-contracts", requiresProject: true },
  { name: "Budget", path: "budget", requiresProject: true },
  { name: "Budget V2", path: "budget-v2", requiresProject: true },
  { name: "Commitments", path: "commitments", requiresProject: true },
  { name: "Change Orders", path: "change-orders", requiresProject: true },
  { name: "Change Events", path: "change-events", requiresProject: true },
  { name: "Direct Costs", path: "direct-costs", requiresProject: true },
  { name: "Invoicing", path: "invoices", requiresProject: true },
];

export const adminTools: NavigationTool[] = [
  {
    name: "Document Pipeline",
    path: "/admin/documents/pipeline",
    requiresProject: false,
  },
];

// Helper function to build project-scoped URLs
export const buildToolUrl = (
  toolPath: string,
  projectId: number | null,
  requiresProject: boolean = true
): string => {
  if (requiresProject && projectId) {
    return `/${projectId}/${toolPath}`;
  }
  return `/${toolPath}`;
};

// Helper function to check if a path is currently active
export const isActivePath = (
  pathname: string,
  toolPath: string
): boolean => {
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  if (segments.length >= 2 && /^\d+$/.test(segments[0])) {
    return segments[1] === toolPath.split("/")[0];
  }
  return segments[0] === toolPath.split("/")[0];
};

// Helper to extract project ID from pathname
export const extractProjectId = (pathname: string): number | null => {
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const firstSegment = segments[0];
  if (firstSegment && /^\d+$/.test(firstSegment)) {
    return parseInt(firstSegment);
  }
  return null;
};