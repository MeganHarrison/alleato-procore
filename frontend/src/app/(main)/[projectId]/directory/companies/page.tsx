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
import {
  useCreateProjectCompany,
  useDeleteProjectCompany,
  useProjectCompanies,
  useUpdateProjectCompany,
} from "@/hooks/use-project-companies";
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
import type { CompanyCreateDTO, CompanyUpdateDTO } from "@/services/companyService";
import type { ProjectCompany } from "@/services/companyService";
import { toast } from "@/hooks/use-toast";

export default function ProjectDirectoryCompaniesPage() {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = React.useState(false);
  const [editingCompany, setEditingCompany] =
    React.useState<ProjectCompany | null>(null);
  const [page, setPage] = React.useState(1);
  const [companies, setCompanies] = React.useState<ProjectCompany[]>([]);

  const pageSize = 20;
  const {
    companies: pageCompanies,
    pagination,
    isLoading,
    isFetching,
    error,
  } = useProjectCompanies(projectId, {
    page,
    per_page: pageSize,
    sort: "name",
    status: "ACTIVE",
  });

  const createCompanyMutation = useCreateProjectCompany(projectId);
  const updateCompanyMutation = useUpdateProjectCompany(projectId);
  const deleteCompanyMutation = useDeleteProjectCompany(projectId);

  React.useEffect(() => {
    if (!pageCompanies) return;

    setCompanies((prev) => {
      if (page === 1) {
        return pageCompanies;
      }

      const existingIds = new Set(prev.map((company) => company.id));
      const nextCompanies = pageCompanies.filter(
        (company) => !existingIds.has(company.id),
      );
      return [...prev, ...nextCompanies];
    });
  }, [pageCompanies, page]);

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

  const handleEditCompany = (company: ProjectCompany) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const handleDeleteCompany = async (company: ProjectCompany) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${company.company?.name || "this company"}?`,
      )
    ) {
      try {
        await deleteCompanyMutation.mutateAsync(company.id);
        setPage(1);
        setCompanies([]);
        toast.success("Company removed successfully");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove company. Please try again.",
        );
      }
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingCompany(null);
    setPage(1);
    setCompanies([]);
  };

  const handleGroupDialogSuccess = () => {
    setGroupDialogOpen(false);
    setPage(1);
    setCompanies([]);
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
          {pagination && (
            <div className="flex items-center justify-between">
              <div>
                <Text as="p" size="sm" tone="muted">
                  <Text as="span" weight="medium">
                    {companies.length}
                  </Text>{" "}
                  of{" "}
                  <Text as="span" weight="medium">
                    {pagination.total}
                  </Text>{" "}
                  companies
                </Text>
              </div>
            </div>
          )}

          <div>
            {isLoading ? (
              <CompanyListSkeleton count={5} />
            ) : companies.length === 0 ? (
              <EmptyCompaniesList onAddCompany={handleAddCompany} />
            ) : (
              <ResponsiveCompaniesTable
                companies={companies}
                onEdit={handleEditCompany}
                onDelete={handleDeleteCompany}
              />
            )}
          </div>

          {pagination && page < pagination.total_pages && (
            <div className="text-center">
              <Button
                onClick={() => setPage((current) => current + 1)}
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
        company={
          editingCompany?.company
            ? { ...editingCompany.company, id: editingCompany.id }
            : null
        }
        onSuccess={handleDialogSuccess}
        onCreate={async (formData) => {
          const payload: CompanyCreateDTO = {
            name: formData.name,
            address: formData.address || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
          };
          try {
            await createCompanyMutation.mutateAsync(payload);
          } catch (error) {
            return {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to create company. Please try again.",
            };
          }
        }}
        onUpdate={async (companyId, formData) => {
          const payload: CompanyUpdateDTO = {
            name: formData.name || undefined,
            address: formData.address || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
          };
          try {
            await updateCompanyMutation.mutateAsync({
              companyId,
              data: payload,
            });
          } catch (error) {
            return {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to update company. Please try again.",
            };
          }
        }}
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
