"use client";

import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Star,
  CheckSquare,
  TrendingUp,
  DollarSign,
  Upload,
  Folder,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { HeroMetrics } from "./hero-metrics";
import { EditableSummary } from "./editable-summary";
import type { Database } from "@/types/database.types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProjectSidebar } from "./project-sidebar";
import { InfoSection } from "./info-section";
import { InlineTeamMemberForm } from "@/components/project-home/inline-team-member-form";

interface TeamMember {
  name: string;
  role: string;
  personId?: string;
}

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Task = Database["public"]["Tables"]["project_tasks"]["Row"];
type Meeting = Database["public"]["Tables"]["document_metadata"]["Row"];
type ChangeOrder = Database["public"]["Tables"]["change_orders"]["Row"];
type RFI = Database["public"]["Tables"]["rfis"]["Row"];
type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
// Commitment is from the commitments_unified view (combines subcontracts + purchase_orders)
interface Commitment {
  id: string;
  project_id: number;
  number: string;
  contract_company_id: string | null;
  title: string | null;
  status: string;
  executed: boolean;
  type: "subcontract" | "purchase_order";
  contract_amount?: number;
  retention_percentage: number | null;
  start_date: string | null;
  executed_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  original_amount?: number;
  approved_change_orders?: number;
  revised_contract_amount?: number;
  billed_to_date?: number;
  balance_to_finish?: number;
}
type Contract = Database["public"]["Tables"]["financial_contracts"]["Row"];
type BudgetItem = Database["public"]["Tables"]["budget_lines"]["Row"];
type ChangeEvent = Database["public"]["Tables"]["change_events"]["Row"];
type SOV = Database["public"]["Tables"]["schedule_of_values"]["Row"];

interface ProjectHomeClientProps {
  project: Project;
  tasks: Task[];
  meetings: Meeting[];
  changeOrders: ChangeOrder[];
  rfis: RFI[];
  dailyLogs: DailyLog[];
  commitments: Commitment[];
  contracts: Contract[];
  budget?: BudgetItem[];
  changeEvents?: ChangeEvent[];
  schedule?: any[];
  sov?: SOV[];
}

// Project Tools Links - matching the dropdown in the header
interface ToolLink {
  name: string;
  href: string;
  badge?: string;
  isFavorite?: boolean;
  hasCreateAction?: boolean;
}

const coreTools: ToolLink[] = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Directory", href: "/directory" },
  { name: "Meetings", href: "/meetings" },
];

const projectManagementTools: ToolLink[] = [
  { name: "Tasks", href: "/tasks" },
  { name: "Schedule", href: "/schedule", hasCreateAction: true },
  { name: "Daily Logs", href: "/daily-logs" },
];

const financialManagementTools: ToolLink[] = [
  { name: "Commitments", href: "/commitments", hasCreateAction: true },
  { name: "Invoices", href: "/invoices" },
  { name: "Budget", href: "/budget", hasCreateAction: true },
];

export function ProjectHomeClient({
  project,
  tasks,
  meetings,
  changeOrders,
  rfis,
  dailyLogs,
  commitments,
  contracts,
  budget = [],
  changeEvents = [],
  schedule = [],
  sov = [],
}: ProjectHomeClientProps) {
  const router = useRouter();
  const [currentTool, setCurrentTool] = useState("Tools");
  const [isTeamOpen, setIsTeamOpen] = useState(true);
  const [isContractsOpen, setIsContractsOpen] = useState(true);
  const [isCommitmentsOpen, setIsCommitmentsOpen] = useState(true);
  const [isBudgetOpen, setIsBudgetOpen] = useState(true);
  const [isSovOpen, setIsSovOpen] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const [showAddTeamMemberForm, setShowAddTeamMemberForm] = useState(false);

  // Parse existing team members to ensure consistent format
  const parseTeamMembers = (): TeamMember[] => {
    if (!project.team_members || !Array.isArray(project.team_members)) {
      return [];
    }
    return project.team_members.map((member) => {
      if (typeof member === "string") {
        return { name: member, role: "Role not specified" };
      }
      const memberObj = member as Record<string, unknown>;
      return {
        name: String(memberObj?.name || "Team Member"),
        role: String(memberObj?.role || "Role not specified"),
        personId: memberObj?.personId as string | undefined,
      };
    });
  };

  // Handle saving team members
  const handleSaveTeamMembers = async (members: TeamMember[]) => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_members: members }),
      });

      if (!response.ok) {
        throw new Error("Failed to update team members");
      }

      setShowAddTeamMemberForm(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating team members:", error);
      throw error;
    }
  };

  // Handle saving project updates
  const handleSaveProject = async (updates: Record<string, string>) => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  };

  // Handle saving summary
  const handleSaveSummary = async (summary: string) => {
    await handleSaveProject({ summary });
  };

  // Calculate financial metrics for hero section
  const totalBudget = budget.reduce(
    (sum, item) => sum + (item.original_amount || 0),
    0,
  );
  const committed = commitments.reduce(
    (sum, c) => sum + (c.contract_amount || 0),
    0,
  );
  const spent = 0; // TODO: Implement cost tracking
  const forecastedCost = totalBudget; // TODO: Implement cost forecasting

  // Change orders don't have an 'amount' field in the schema, so we'll count them instead
  const changeOrdersTotal = changeOrders.filter(
    (co) => co.status === "approved",
  ).length;
  const activeTasks = tasks.length;

  // Calculate project setup steps completion
  const projectSteps = [
    {
      id: "prime-contract",
      label: "Prime Contract",
      completed: contracts.length > 0,
    },
    { id: "cost-codes", label: "Cost Codes", completed: budget.length > 0 },
    { id: "budget", label: "Budget", completed: budget.length > 0 },
    { id: "schedule", label: "Schedule", completed: schedule.length > 0 },
    {
      id: "project-team",
      label: "Project Team",
      completed:
        project.team_members &&
        Array.isArray(project.team_members) &&
        project.team_members.length > 0,
    },
    { id: "sov", label: "SOV", completed: sov.length > 0 },
    {
      id: "commitments",
      label: "Commitments",
      completed: commitments.length > 0,
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="flex-1 overflow-auto">
          <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 py-2 sm:py-6 max-w-[1800px] mx-auto">
            {/* Header Section - Refined Architectural Hierarchy */}
            <header className="mb-4 sm:mb-6">
              {/* Client Pre-heading */}
              <div className="mb-1 sm:mb-2">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400">
                  {project.client || ""}
                </p>
              </div>

              {/* Project Title - Editorial Typography with Enhanced Scale */}
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <h1>{project.name || project["job number"]}</h1>

                {/* Project Tools Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-8 rounded-sm justify-between px-4 bg-brand text-white hover:bg-brand/90 transition-colors md:w-auto md:justify-center">
                      <span className="text-sm font-medium">{currentTool}</span>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[calc(100vw-2rem)] sm:w-screen sm:max-w-4xl rounded-lg border-neutral-200 p-4 sm:p-8 shadow-lg max-h-[80vh] overflow-y-auto"
                  >
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
                      {/* Core Tools */}
                      <div>
                        <h3 className="mb-4 text-xs font-semibold tracking-[0.15em] uppercase text-neutral-500">
                          Core Tools
                        </h3>
                        <div className="space-y-1">
                          {coreTools.map((tool) => (
                            <Link
                              key={tool.name}
                              href={`/${project.id}${tool.href}`}
                              onClick={() => setCurrentTool(tool.name)}
                              className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-neutral-100 transition-colors"
                            >
                              <span className="text-neutral-900">
                                {tool.name}
                              </span>
                              {tool.badge && (
                                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  {tool.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Project Management */}
                      <div>
                        <h3 className="mb-4 text-xs font-semibold tracking-[0.15em] uppercase text-neutral-500">
                          Project Management
                        </h3>
                        <div className="space-y-1">
                          {projectManagementTools.map((tool) => (
                            <Link
                              key={tool.name}
                              href={`/${project.id}${tool.href}`}
                              onClick={() => setCurrentTool(tool.name)}
                              className="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-neutral-100 transition-colors"
                            >
                              <span className="flex items-center gap-2 text-neutral-900">
                                {tool.isFavorite && (
                                  <Star className="h-3.5 w-3.5 text-neutral-400" />
                                )}
                                {tool.name}
                                {tool.hasCreateAction && (
                                  <Plus className="ml-1 h-4 w-4 rounded-full bg-orange-500 p-0.5 text-white" />
                                )}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Financial Management */}
                      <div>
                        <h3 className="mb-4 text-xs font-semibold tracking-[0.15em] uppercase text-neutral-500">
                          Financial Management
                        </h3>
                        <div className="space-y-1">
                          {financialManagementTools.map((tool) => (
                            <Link
                              key={tool.name}
                              href={`/${project.id}${tool.href}`}
                              onClick={() => setCurrentTool(tool.name)}
                              className="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-neutral-100 transition-colors"
                            >
                              <span className="flex items-center gap-2 text-neutral-900">
                                {tool.name}
                                {tool.hasCreateAction && (
                                  <Plus className="ml-1 h-4 w-4 rounded-full bg-orange-500 p-0.5 text-white" />
                                )}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Project Summary */}
              <div>
                <EditableSummary
                  summary={project.summary || "No project summary available."}
                  onSave={handleSaveSummary}
                />
              </div>

              {/* Project Team */}
              <div className="rounded-sm border border-neutral-200 bg-background mb-6">
                <Collapsible open={isTeamOpen} onOpenChange={setIsTeamOpen}>
                  <div className="px-8 py-6 pb-4 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-brand">
                        Project Team
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddTeamMemberForm(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                        <span className="text-neutral-300">|</span>
                        <Link
                          href={`/${project.id}/directory/users`}
                          className="text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                        >
                          View All
                        </Link>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                          >
                            {isTeamOpen ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            <span className="sr-only">Toggle team</span>
                          </button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="px-8">
                      <div className="space-y-4">
                        {project.team_members &&
                        Array.isArray(project.team_members) &&
                        project.team_members.length > 0 ? (
                          project.team_members.map((member, index) => {
                            const memberName =
                              typeof member === "string"
                                ? member
                                : (member as Record<string, unknown>)?.name ||
                                  "Team Member";
                            const memberRole =
                              typeof member === "object" &&
                              member !== null &&
                              (member as Record<string, unknown>)?.role
                                ? (member as Record<string, unknown>).role
                                : "Role not specified";
                            const initials =
                              typeof member === "string"
                                ? member.substring(0, 2).toUpperCase()
                                : "TM";

                            return (
                              <div
                                key={`team-${project.id}-${index}`}
                                className="flex items-center gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                              >
                                <Avatar className="h-10 w-10 border border-neutral-200">
                                  <AvatarFallback className="bg-neutral-100 text-neutral-600 text-xs font-medium">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-neutral-900 truncate">
                                    {String(memberName)}
                                  </p>
                                  <p className="text-xs text-neutral-500 truncate">
                                    {String(memberRole)}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : showAddTeamMemberForm ? (
                          <InlineTeamMemberForm
                            projectId={project.id}
                            existingMembers={parseTeamMembers()}
                            onSave={handleSaveTeamMembers}
                            onCancel={() => setShowAddTeamMemberForm(false)}
                            directoryUrl={`/${project.id}/directory/users`}
                          />
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-sm text-neutral-400 mb-2">
                              No team members
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowAddTeamMemberForm(true)}
                              className="text-xs text-brand hover:text-brand/80 underline transition-colors"
                            >
                              Click here to assign team
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Show inline form below existing members when there are members */}
                      {project.team_members &&
                        Array.isArray(project.team_members) &&
                        project.team_members.length > 0 &&
                        showAddTeamMemberForm && (
                          <div className="mt-4">
                            <InlineTeamMemberForm
                              projectId={project.id}
                              existingMembers={parseTeamMembers()}
                              onSave={handleSaveTeamMembers}
                              onCancel={() => setShowAddTeamMemberForm(false)}
                              directoryUrl={`/${project.id}/directory/users`}
                            />
                          </div>
                        )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {/* Prime Contracts */}
            <div className="rounded-sm border border-neutral-200 bg-background mb-6">
              <Collapsible
                open={isContractsOpen}
                onOpenChange={setIsContractsOpen}
              >
                <div className="px-8 py-6 pb-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-brand">
                      Prime Contracts
                    </h3>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${project.id}/contracts/new`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Link>
                      <span className="text-neutral-300">|</span>
                      <Link
                        href={`/${project.id}/contracts`}
                        className="text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        View All
                      </Link>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                        >
                          {isContractsOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">Toggle contracts</span>
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="px-8 py-4">
                    <div className="space-y-4">
                      {contracts.length > 0 ? (
                        contracts.map((contract) => {
                          const formatCurrency = (amount: number) => {
                            return new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(amount);
                          };

                          return (
                            <Link
                              key={contract.id}
                              href={`/${project.id}/contracts/${contract.id}`}
                              className="flex items-start justify-between pb-4 border-b border-neutral-100 last:border-0 last:pb-0 hover:opacity-70 transition-opacity"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-neutral-900 truncate">
                                  {contract.title ||
                                    `Contract #${contract.contract_number}`}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-neutral-500">
                                    {contract.contract_number || "No number"}
                                  </p>
                                  {contract.contract_amount && (
                                    <>
                                      <span className="text-xs text-neutral-300">
                                        •
                                      </span>
                                      <p className="text-xs font-medium text-neutral-900">
                                        {formatCurrency(
                                          contract.contract_amount,
                                        )}
                                      </p>
                                    </>
                                  )}
                                </div>
                                {contract.status && (
                                  <p className="text-xs text-neutral-500 mt-1 capitalize">
                                    {contract.status}
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-neutral-400 mb-2">
                            No prime contracts
                          </p>
                          <p className="text-xs text-neutral-400">
                            Click &quot;Add&quot; to create a contract
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Commitments */}
            <div className="rounded-sm border border-neutral-200 bg-background mb-6">
              <Collapsible
                open={isCommitmentsOpen}
                onOpenChange={setIsCommitmentsOpen}
              >
                <div className="px-8 py-6 pb-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-brand">
                      Commitments
                    </h3>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${project.id}/commitments/new`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Link>
                      <span className="text-neutral-300">|</span>
                      <Link
                        href={`/${project.id}/commitments`}
                        className="text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        View All
                      </Link>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                        >
                          {isCommitmentsOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">Toggle commitments</span>
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="px-8 py-4">
                    <div className="space-y-4">
                      {commitments.length > 0 ? (
                        commitments.slice(0, 5).map((commitment) => {
                          const formatCurrency = (amount: number) => {
                            return new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(amount);
                          };

                          return (
                            <Link
                              key={commitment.id}
                              href={`/${project.id}/commitments/${commitment.id}`}
                              className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-4 border-b border-neutral-100 last:border-0 last:pb-0 hover:opacity-70 transition-opacity"
                            >
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-neutral-900">
                                  {commitment.title ||
                                    `${commitment.type === "subcontract" ? "Subcontract" : "PO"} #${commitment.number}`}
                                </p>
                                <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 uppercase tracking-wider whitespace-nowrap">
                                  {commitment.type === "subcontract"
                                    ? "SC"
                                    : "PO"}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500">
                                {commitment.number || "No number"}
                              </p>
                              {commitment.contract_amount && (
                                <p className="text-xs font-medium text-neutral-900">
                                  {formatCurrency(commitment.contract_amount)}
                                </p>
                              )}
                              {commitment.status && (
                                <p className="text-xs text-neutral-500 capitalize">
                                  {commitment.status}
                                </p>
                              )}
                            </Link>
                          );
                        })
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-neutral-400 mb-2">
                            No commitments
                          </p>
                          <p className="text-xs text-neutral-400">
                            Click &quot;Add&quot; to create a commitment
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Budget */}
            <div className="rounded-sm border border-neutral-200 bg-background mb-6">
              <Collapsible open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
                <div className="px-8 py-6 pb-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-500">
                      Budget
                    </h3>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${project.id}/budget/line-item/new`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Link>
                      <span className="text-neutral-300">|</span>
                      <Link
                        href={`/${project.id}/budget`}
                        className="text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        View All
                      </Link>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                        >
                          {isBudgetOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">Toggle budget</span>
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="px-8 py-4">
                    {budget.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="p-3 bg-muted/50">
                            <p className="text-xs text-muted-foreground">
                              Original Budget
                            </p>
                            <p className="font-semibold">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                budget.reduce(
                                  (sum, item) =>
                                    sum + (item.original_amount || 0),
                                  0,
                                ),
                              )}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50">
                            <p className="text-xs text-muted-foreground">
                              Revised Budget
                            </p>
                            <p className="font-semibold">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                budget.reduce(
                                  (sum, item) =>
                                    sum + (item.original_amount || 0),
                                  0,
                                ),
                              )}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50">
                            <p className="text-xs text-muted-foreground">
                              Variance
                            </p>
                            <p className="font-semibold text-green-600">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                budget.reduce(
                                  (sum, item) =>
                                    sum + (item.original_amount || 0),
                                  0,
                                ),
                              )}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-neutral-400 mb-2">
                          No budget items
                        </p>
                        <p className="text-xs text-neutral-400">
                          Click &quot;Add&quot; to create a budget
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Schedule of Values */}
            <div className="rounded-sm border border-neutral-200 bg-background mb-6">
              <Collapsible open={isSovOpen} onOpenChange={setIsSovOpen}>
                <div className="px-8 py-6 pb-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-brand">
                      Schedule of Values
                    </h3>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${project.id}/sov/new`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Link>
                      <span className="text-neutral-300">|</span>
                      <Link
                        href={`/${project.id}/sov`}
                        className="text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        View All
                      </Link>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                        >
                          {isSovOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">Toggle SOV</span>
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="px-8 py-4">
                    {sov && sov.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-muted/50">
                            <p className="text-xs text-muted-foreground">
                              Total Value
                            </p>
                            <p className="font-semibold">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                sov.reduce(
                                  (sum, item) => sum + (item.total_amount || 0),
                                  0,
                                ),
                              )}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50">
                            <p className="text-xs text-muted-foreground">
                              Items
                            </p>
                            <p className="font-semibold">{sov.length}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {sov.slice(0, 3).map((item) => (
                            <div key={item.id} className="p-3 bg-muted/50">
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-sm">
                                  SOV Item #{item.id}
                                </p>
                                <p className="text-sm font-medium">
                                  {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(item.total_amount || 0)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-neutral-400 mb-2">
                          No schedule of values
                        </p>
                        <p className="text-xs text-neutral-400">
                          Click &quot;Add&quot; to create an SOV
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Schedule */}
            <div className="rounded-sm border border-neutral-200 bg-background mb-6">
              <Collapsible
                open={isScheduleOpen}
                onOpenChange={setIsScheduleOpen}
              >
                <div className="px-8 py-6 pb-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-brand">
                      Schedule
                    </h3>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${project.id}/schedule/new`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Link>
                      <span className="text-neutral-300">|</span>
                      <Link
                        href={`/${project.id}/schedule`}
                        className="text-xs font-medium text-neutral-600 hover:text-brand transition-colors duration-200"
                      >
                        View All
                      </Link>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                        >
                          {isScheduleOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">Toggle schedule</span>
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="px-8 py-4">
                    {schedule && schedule.length > 0 ? (
                      <div className="space-y-2">
                        {schedule.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between p-3 bg-muted/50"
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{item.task}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.start_date &&
                                  format(
                                    new Date(item.start_date),
                                    "MMM d",
                                  )}{" "}
                                -
                                {item.end_date &&
                                  format(
                                    new Date(item.end_date),
                                    "MMM d, yyyy",
                                  )}
                              </p>
                            </div>
                            {item.status && (
                              <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 capitalize">
                                {item.status}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-neutral-400 mb-2">
                          No schedule items
                        </p>
                        <p className="text-xs text-neutral-400">
                          Click &quot;Add&quot; to create a schedule
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* 2 Column Grid for Info Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Recent Meetings */}
              <InfoSection
                title="Recent Meetings"
                icon={Calendar}
                items={meetings.map((meeting) => ({
                  id: meeting.id,
                  title: meeting.title || "Untitled Meeting",
                  subtitle: meeting.date
                    ? format(new Date(meeting.date), "MMM d, yyyy")
                    : undefined,
                  href: `/${project.id}/meetings/${meeting.id}`,
                }))}
                viewAllHref={`/${project.id}/meetings`}
                emptyMessage="No recent meetings"
              />

              {/* Tasks */}
              <InfoSection
                title="Tasks"
                icon={CheckSquare}
                items={tasks.map((task) => ({
                  id: task.id,
                  title: task.task_description || "Untitled Task",
                  subtitle: task.due_date
                    ? `Due ${format(new Date(task.due_date), "MMM d, yyyy")}`
                    : undefined,
                  href: `/${project.id}/tasks/${task.id}`,
                }))}
                viewAllHref={`/${project.id}/tasks`}
                emptyMessage="No tasks"
              />

              {/* RFIs */}
              <InfoSection
                title="RFI's"
                icon={FileText}
                items={rfis.map((rfi) => ({
                  id: rfi.id,
                  title: `RFI #${rfi.number || rfi.id}`,
                  subtitle: rfi.subject || undefined,
                  href: `/${project.id}/rfis/${rfi.id}`,
                }))}
                viewAllHref={`/${project.id}/rfis`}
                emptyMessage="No active RFIs"
              />

              {/* Change Orders */}
              <InfoSection
                title="Change Orders"
                icon={DollarSign}
                items={changeOrders.map((co) => ({
                  id: co.id,
                  title: `CO #${co.co_number || co.id}`,
                  subtitle: co.title || undefined,
                  href: `/${project.id}/change-orders/${co.id}`,
                }))}
                viewAllHref={`/${project.id}/change-orders`}
                emptyMessage="No change orders"
              />

              {/* Change Events */}
              {changeEvents && changeEvents.length > 0 && (
                <InfoSection
                  title="Change Events"
                  icon={TrendingUp}
                  items={changeEvents.map((ce) => ({
                    id: ce.id,
                    title: ce.title || `Change Event #${ce.id}`,
                    subtitle: ce.created_at
                      ? format(new Date(ce.created_at), "MMM d, yyyy")
                      : undefined,
                    href: `/${project.id}/change-events/${ce.id}`,
                  }))}
                  viewAllHref={`/${project.id}/change-events`}
                  emptyMessage="No change events"
                />
              )}

              {/* Submittals */}
              <InfoSection
                title="Submittals"
                icon={Upload}
                items={[]}
                viewAllHref={`/${project.id}/submittals`}
                emptyMessage="No submittals"
              />

              {/* Documents */}
              <InfoSection
                title="Documents"
                icon={Folder}
                items={[]}
                viewAllHref={`/${project.id}/documents`}
                emptyMessage="No recent documents"
              />
            </div>

            {/* Budget */}
            <div className="mb-20">
              {/* Heading */}
              <h2 className="pb-4 text-2xl md:text-3xl font-sans font-light tracking-tight text-neutral-900 mb-2">
                Budget
              </h2>

              {/* Hero Metrics - Executive Dashboard KPIs */}
              <HeroMetrics
                projectId={project.id.toString()}
                totalBudget={totalBudget}
                committed={committed}
                spent={spent}
                forecastedCost={forecastedCost}
                changeOrdersTotal={changeOrdersTotal}
                activeTasks={0}
              />
            </div>

            {/* Drawings */}
            <div className="mb-20">
              {/* Heading */}
              <div>
                <h2 className="text-2xl md:text-3xl font-sans font-light tracking-tight text-neutral-900 mb-2">
                  Drawings
                </h2>
              </div>
            </div>

            {/* Photos */}
            <div className="mb-20">
              {/* Heading */}
              <div>
                <h2 className="text-2xl md:text-3xl font-sans font-light tracking-tight text-neutral-900 mb-2">
                  Photos
                </h2>
              </div>
            </div>
          </div>
        </div>
        <ProjectSidebar projectSteps={projectSteps} />
      </div>
    </SidebarProvider>
  );
}
