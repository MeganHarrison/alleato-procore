"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectPageHeader } from "@/components/layout/ProjectPageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageTabs } from "@/components/layout/PageTabs";
import { Text } from "@/components/ui/text";
import { ResponsiveUsersTable } from "@/components/directory/responsive/ResponsiveUsersTable";
import { UserListSkeleton } from "@/components/directory/skeletons/UserListSkeleton";
import { EmptyUsersList } from "@/components/directory/empty-states/EmptyUsersList";
import { getProjectDirectoryTabs } from "@/config/directory-tabs";
import { useProjectUsers } from "@/hooks/use-project-users";
import { UserFormDialog } from "@/components/directory/UserFormDialog";

export default function ProjectDirectoryUsersPage() {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { users, isLoading, error, refetch } = useProjectUsers(projectId);

  const handleAddUser = () => {
    setIsDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    refetch();
  };

  const handleEditUser = (user: unknown) => {
    // TODO: Open edit user modal
    console.warn("Edit user functionality not yet implemented", user);
  };

  const handleDeactivateUser = async (user: unknown) => {
    // TODO: Implement deactivate user
    console.warn("Deactivate user functionality not yet implemented", user);
  };

  const tabs = getProjectDirectoryTabs(projectId, pathname);

  if (error) {
    return (
      <>
        <ProjectPageHeader
          title="Directory"
          description="Manage companies and team members for this project"
          actions={
            <Button onClick={handleAddUser} variant="default">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          }
        />
        <PageTabs tabs={tabs} />
        <PageContainer>
          <div className="text-center py-12">
            <h2 className="text-xl font-bold mb-4">Error Loading Users</h2>
            <Text tone="destructive">{error.message}</Text>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <ProjectPageHeader
        title="Directory"
        description="Manage companies and team members for this project"
        actions={
          <Button onClick={handleAddUser} variant="default">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />
      <PageTabs tabs={tabs} />
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              {users.length > 0 && (
                <Text as="p" size="sm" tone="muted">
                  <Text as="span" weight="medium">
                    {users.length}
                  </Text>{" "}
                  users
                </Text>
              )}
            </div>
          </div>

          <div>
            {isLoading ? (
              <UserListSkeleton count={5} />
            ) : users.length === 0 ? (
              <EmptyUsersList onAddUser={handleAddUser} />
            ) : (
              <ResponsiveUsersTable
                users={users}
                onEdit={handleEditUser}
                onDeactivate={handleDeactivateUser}
              />
            )}
          </div>
        </div>
      </PageContainer>

      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        projectId={projectId}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
}
