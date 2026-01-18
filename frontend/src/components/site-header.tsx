"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tool configuration - these will be scoped to projectId when available
const coreTools: Array<{
  name: string;
  path: string;
  requiresProject?: boolean;
}> = [
  { name: "Home", path: "home", requiresProject: true },
  { name: "360 Reporting", path: "reporting", requiresProject: true },
  { name: "Documents", path: "documents", requiresProject: true },
  { name: "Directory", path: "directory", requiresProject: true },
  { name: "Tables Directory", path: "tables-directory", requiresProject: false },
  { name: "Settings", path: "settings/plugins", requiresProject: false },
  { name: "Tasks", path: "tasks", requiresProject: true },
  { name: "Admin", path: "admin", requiresProject: true },
];

const projectManagementTools: Array<{
  name: string;
  path: string;
  requiresProject?: boolean;
}> = [
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

const financialManagementTools: Array<{
  name: string;
  path: string;
  requiresProject?: boolean;
}> = [
  { name: "Prime Contracts", path: "prime-contracts", requiresProject: true },
  { name: "Budget", path: "budget", requiresProject: true },
  { name: "Budget V2", path: "budget-v2", requiresProject: true },
  { name: "Commitments", path: "commitments", requiresProject: true },
  { name: "Change Orders", path: "change-orders", requiresProject: true },
  { name: "Change Events", path: "change-events", requiresProject: true },
  { name: "Direct Costs", path: "direct-costs", requiresProject: true },
  { name: "Invoicing", path: "invoices", requiresProject: true },
];

const adminTools: Array<{
  name: string;
  path: string;
  requiresProject?: boolean;
}> = [
  {
    name: "Document Pipeline",
    path: "/admin/documents/pipeline",
    requiresProject: false,
  },
];

interface Project {
  id: number;
  name: string;
  "job number": string | null;
}

export function SiteHeader() {
  const [projectToolsOpen, setProjectToolsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const parseProjectsResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch (error) {
        console.error("Failed to parse project response JSON:", error);
        return null;
      }
    }

    const fallbackBody = await response.text();
    console.error(
      "Projects API returned non-JSON response:",
      fallbackBody.slice(0, 200),
    );
    return null;
  };

  // Extract project ID from URL path or query parameters
  const projectId = useMemo(() => {
    // First check URL path segments
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const firstSegment = segments[0];
    if (firstSegment && /^\d+$/.test(firstSegment)) {
      return parseInt(firstSegment);
    }

    // Then check query parameters (both 'project' and 'projectId' for compatibility)
    const projectParam =
      searchParams?.get("project") || searchParams?.get("projectId");
    if (projectParam && /^\d+$/.test(projectParam)) {
      return parseInt(projectParam);
    }

    return null;
  }, [pathname, searchParams]);

  // Fetch current project details when project ID changes
  useEffect(() => {
    const fetchCurrentProject = async () => {
      if (projectId) {
        try {
          const response = await fetch(`/api/projects`);
          const data = await parseProjectsResponse(response);
          if (data?.data?.length) {
            const project = data.data.find((p: Project) => p.id === projectId);
            if (project) {
              setCurrentProject(project);
            }
          } else if (!response.ok) {
            console.error(
              "Failed to fetch current project:",
              response.statusText,
            );
          }
        } catch (error) {
          console.error("Failed to fetch current project:", error);
        }
      } else {
        setCurrentProject(null);
      }
    };

    fetchCurrentProject();
  }, [projectId]);

  // Fetch projects when dropdown is opened
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch("/api/projects?limit=10&archived=false");
      const data = await parseProjectsResponse(response);
      if (data?.data) {
        setProjects(data.data);
      } else if (!response.ok) {
        console.error(
          "Failed to fetch projects for dropdown:",
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Handle project selection - navigate to the same tool for the new project
  const handleProjectSelect = (newProjectId: number) => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];

    // Check if we're currently on a project-scoped page
    if (segments.length >= 2 && /^\d+$/.test(segments[0])) {
      // We're on a project page - navigate to the same tool for the new project
      const toolPath = segments.slice(1).join("/");
      router.push(`/${newProjectId}/${toolPath}`);
    } else {
      // Not on a project page - navigate to home for the new project
      router.push(`/${newProjectId}/home`);
    }
  };

  // Helper function to build project-scoped URLs
  const buildToolUrl = (toolPath: string, requiresProject: boolean = true) => {
    if (requiresProject && projectId) {
      return `/${projectId}/${toolPath}`;
    }
    return `/${toolPath}`;
  };

  // Determine the currently active tool from the URL
  const activeToolName = useMemo(() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];

    // Check if we're on a project-scoped page (/{projectId}/{tool})
    if (segments.length >= 2 && /^\d+$/.test(segments[0])) {
      const toolPath = segments[1];

      // Search through all tool arrays to find the matching tool name
      const allTools = [
        ...coreTools,
        ...projectManagementTools,
        ...financialManagementTools,
      ];
      const matchingTool = allTools.find((tool) => tool.path === toolPath);

      return matchingTool?.name || "Home";
    }

    // Check if we're on a legacy query-param based page (e.g., /budget/line-item/new?projectId=47)
    if (segments.length >= 1) {
      const firstSegment = segments[0];
      const allTools = [
        ...coreTools,
        ...projectManagementTools,
        ...financialManagementTools,
      ];
      const matchingTool = allTools.find((tool) => tool.path === firstSegment);

      if (matchingTool) {
        return matchingTool.name;
      }
    }

    return "Home";
  }, [pathname]);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 pt-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* Company/Project Selector */}
          <Select
            value={projectId?.toString() || ""}
            onValueChange={(value) => {
              if (value === "view-all") {
                router.push("/");
              } else {
                handleProjectSelect(parseInt(value));
              }
            }}
            onOpenChange={(open) => open && fetchProjects()}
          >
            <SelectTrigger className="h-8 w-[280px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Recent Projects</SelectLabel>
                {loadingProjects ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading projects...
                  </div>
                ) : projects.length > 0 ? (
                  projects.slice(0, 10).map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id.toString()}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        {project["job number"] && (
                          <span className="text-xs text-muted-foreground">
                            Job #{project["job number"]}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No projects found
                  </div>
                )}
              </SelectGroup>
              <SelectGroup>
                <SelectItem value="view-all" className="font-medium">
                  View All Projects
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Project Tools */}
          <DropdownMenu
            open={projectToolsOpen}
            onOpenChange={setProjectToolsOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 items-center gap-2 px-3"
              >
                <span className="text-xs text-muted-foreground">Project Tools</span>
                <span className="text-sm font-medium">
                  {activeToolName}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-screen p-6 rounded-none border-x-0"
            >
              <div className="container mx-auto">
                <div className="grid grid-cols-4 gap-8">
                  {/* Core Tools Column */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      Core Tools
                    </h3>
                    <div className="space-y-1">
                      {coreTools.map((tool) => {
                        const href = buildToolUrl(
                          tool.path,
                          tool.requiresProject,
                        );
                        const isDisabled = tool.requiresProject && !projectId;

                        return (
                          <Link
                            key={tool.name}
                            href={href}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                              } else {
                                setProjectToolsOpen(false);
                              }
                            }}
                            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
                              isDisabled
                                ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                                : "hover:bg-muted"
                            }`}
                            aria-disabled={isDisabled}
                          >
                            <span>{tool.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Project Management Column */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      Project Management
                    </h3>
                    <div className="space-y-1">
                      {projectManagementTools.map((tool) => {
                        const href = buildToolUrl(
                          tool.path,
                          tool.requiresProject,
                        );
                        const isDisabled = tool.requiresProject && !projectId;

                        return (
                          <Link
                            key={tool.name}
                            href={href}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                              } else {
                                setProjectToolsOpen(false);
                              }
                            }}
                            className={`flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${
                              isDisabled
                                ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                                : "hover:bg-muted"
                            }`}
                            aria-disabled={isDisabled}
                          >
                            <span className="flex items-center gap-2">
                              {tool.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial Management Column */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      Financial Management
                    </h3>
                    <div className="space-y-1">
                      {financialManagementTools.map((tool) => {
                        const href = buildToolUrl(
                          tool.path,
                          tool.requiresProject,
                        );
                        const isDisabled = tool.requiresProject && !projectId;

                        return (
                          <Link
                            key={tool.name}
                            href={href}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                              } else {
                                setProjectToolsOpen(false);
                              }
                            }}
                            className={`flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${
                              isDisabled
                                ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                                : "hover:bg-muted"
                            }`}
                            aria-disabled={isDisabled}
                          >
                            <span>{tool.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Admin Tools Column */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">
                      Admin Tools
                    </h3>
                    <div className="space-y-1">
                      {adminTools.map((tool) => {
                        const href = tool.path;

                        return (
                          <Link
                            key={tool.name}
                            href={href}
                            onClick={() => setProjectToolsOpen(false)}
                            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                          >
                            <span>{tool.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
