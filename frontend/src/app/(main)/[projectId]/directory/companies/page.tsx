"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import {
  Building2,
  Plus,
  ChevronDown,
  Users,
  Users2,
  Upload,
} from "lucide-react";
import { useInfiniteQuery } from "@/hooks/use-infinite-query";
import { updateCompany, deleteCompany } from "@/app/(other)/actions/table-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyFormDialog } from "@/components/domain/companies/CompanyFormDialog";
import { DistributionGroupFormDialog } from "@/components/domain/distribution-groups/DistributionGroupFormDialog";
import { ProjectPageHeader } from "@/components/layout/ProjectPageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageTabs } from "@/components/layout/PageTabs";
import { Text } from "@/components/ui/text";
import { ResponsiveCompaniesTable } from "@/components/directory/responsive/ResponsiveCompaniesTable";
import { CompanyListSkeleton } from "@/components/directory/skeletons/CompanyListSkeleton";
import { EmptyCompaniesList } from "@/components/directory/empty-states/EmptyCompaniesList";
import { getProjectDirectoryTabs } from "@/config/directory-tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/types/database.types";

type Company = Database["public"]["Tables"]["companies"]["Row"];

export default function ProjectDirectoryCompaniesPage() {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = React.useState(false);
  const [editingCompany, setEditingCompany] = React.useState<Company | null>(
    null,
  );

  const {
    data,
    count,
    isSuccess,
    isLoading,
    isFetching,
    error,
    hasMore,
    fetchNextPage,
  } = useInfiniteQuery<Company>({
    tableName: "companies",
    columns: "*",
    pageSize: 20,
    trailingQuery: (query) => {
      return query.order("name", { ascending: true });
    },
  });

  const handleAddCompany = () => {
    setEditingCompany(null);
    setDialogOpen(true);
  };

  const handleAddUser = () => {
    // TODO: Open add user modal
    console.warn("Add user functionality not yet implemented");
  };

  const handleAddDistributionGroup = () => {
    setGroupDialogOpen(true);
  };

  const handleBulkAddFromDirectory = () => {
    // TODO: Open bulk add from company directory modal
    console.warn(
      "Bulk add from company directory functionality not yet implemented",
    );
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const handleDeleteCompany = async (company: Company) => {
    if (window.confirm(`Are you sure you want to delete ${company.name}?`)) {
      await deleteCompany(company.id);
      window.location.reload();
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingCompany(null);
    window.location.reload();
  };

  const handleGroupDialogSuccess = () => {
    setGroupDialogOpen(false);
    window.location.reload();
  };

  const tabs = getProjectDirectoryTabs(projectId, pathname);

  if (error) {
    return (
      <>
        <ProjectPageHeader
          title="Project Directory"
          description="Manage companies and team members for this project"
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleAddUser}>
                  <Users className="mr-2 h-4 w-4" />
                  Add User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddCompany}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Add Company
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddDistributionGroup}>
                  <Users2 className="mr-2 h-4 w-4" />
                  Add Distribution Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkAddFromDirectory}>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Add from Company Directory
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
        <PageTabs tabs={tabs} />
        <PageContainer>
          <div className="text-center py-12">
            <h2 className="text-xl font-bold mb-4">Error Loading Companies</h2>
            <Text tone="destructive">{error.message}</Text>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <ProjectPageHeader
        title="Project Directory"
        description="Manage companies and team members for this project"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleAddUser}>
                <Users className="mr-2 h-4 w-4" />
                Add User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddCompany}>
                <Building2 className="mr-2 h-4 w-4" />
                Add Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddDistributionGroup}>
                <Users2 className="mr-2 h-4 w-4" />
                Add Distribution Group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkAddFromDirectory}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Add from Company Directory
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <PageTabs tabs={tabs} />
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              {isSuccess && (
                <Text as="p" size="sm" tone="muted">
                  <Text as="span" weight="medium">
                    {data.length}
                  </Text>{" "}
                  of{" "}
                  <Text as="span" weight="medium">
                    {count}
                  </Text>{" "}
                  companies
                </Text>
              )}
            </div>
          </div>

          <div>
            {isLoading ? (
              <CompanyListSkeleton count={5} />
            ) : data.length === 0 ? (
              <EmptyCompaniesList onAddCompany={handleAddCompany} />
            ) : (
              <ResponsiveCompaniesTable
                companies={data}
                onEdit={handleEditCompany}
                onDelete={handleDeleteCompany}
              />
            )}
          </div>

          {isSuccess && hasMore && (
            <div className="text-center">
              <Button
                onClick={fetchNextPage}
                disabled={isFetching}
                variant="outline"
                size="lg"
              >
                {isFetching ? "Loading..." : "Load More Companies"}
              </Button>
            </div>
          )}
        </div>
      </PageContainer>

      <CompanyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editingCompany}
        onSuccess={handleDialogSuccess}
      />

      <DistributionGroupFormDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        projectId={projectId}
        onSuccess={handleGroupDialogSuccess}
      />
    </>
  );
}
