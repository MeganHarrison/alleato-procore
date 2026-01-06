"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DirectoryTable } from '@/components/directory/DirectoryTable';
import { InviteDialog } from '@/components/directory/InviteDialog';
import { PersonEditDialog } from '@/components/directory/PersonEditDialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CompanyDirectoryTable } from '@/components/directory/CompanyDirectoryTable';
import {
  UserPlus,
  Users,
  UserCheck,
  Building2,
  UsersRound,
  UserX,
  UserMinus,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DirectoryPermissions, PersonWithDetails } from '@/types/directory';

/**
 * Render the Project Directory page with tabs for active and inactive users, contacts, companies, and distribution groups.
 *
 * Provides UI and handlers to create, edit, and invite people, and to deactivate/reactivate people; updates and refreshes the directory tables when changes occur.
 *
 * @returns The Project Directory page component.
 */
export default function ProjectDirectoryPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonWithDetails | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [directoryPermissions, setDirectoryPermissions] = useState<DirectoryPermissions | null>(null);

  const handleInvite = (person: PersonWithDetails) => {
    setSelectedPerson(person);
    setInviteDialogOpen(true);
  };

  const handleEdit = (person: PersonWithDetails) => {
    setSelectedPerson(person);
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPerson(null);
    setCreateDialogOpen(true);
  };

  const handleDeactivate = async (person: PersonWithDetails) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/directory/users/${person.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to deactivate person');
      }

      toast.success(`${person.first_name} ${person.last_name} has been deactivated.`);

      // Refresh the table
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to deactivate person. Please try again.');
    }
  };

  const handleReactivate = async (person: PersonWithDetails) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/directory/users/${person.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'active' })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reactivate person');
      }

      toast.success(`${person.first_name} ${person.last_name} has been reactivated.`);

      // Refresh the table
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to reactivate person. Please try again.');
    }
  };

  const handleSuccess = () => {
    // Refresh the table
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ProjectToolPage
      title="Project Directory"
      description="Manage project team members, contacts, companies, and distribution groups"
      actions={
        <Button
          onClick={handleCreate}
          disabled={directoryPermissions ? !(directoryPermissions.canInvite || directoryPermissions.canEdit) : true}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>

          <TabsTrigger value="contacts" className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>

          <TabsTrigger value="companies" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Companies</span>
          </TabsTrigger>

          <TabsTrigger value="groups" className="gap-2">
            <UsersRound className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
          </TabsTrigger>

          <TabsTrigger value="inactive-users" className="gap-2">
            <UserX className="h-4 w-4" />
            <span className="hidden sm:inline">Inactive Users</span>
          </TabsTrigger>

          <TabsTrigger value="inactive-contacts" className="gap-2">
            <UserMinus className="h-4 w-4" />
            <span className="hidden sm:inline">Inactive Contacts</span>
          </TabsTrigger>

          <TabsTrigger value="inactive-companies" className="gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Inactive Companies</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <DirectoryTable
            key={`users-${refreshKey}`}
            projectId={projectId}
            type="users"
            status="active"
            onInvite={handleInvite}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
            onPermissionsChange={setDirectoryPermissions}
          />
        </TabsContent>

        <TabsContent value="contacts">
          <DirectoryTable
            key={`contacts-${refreshKey}`}
            projectId={projectId}
            type="contacts"
            status="active"
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
            onPermissionsChange={setDirectoryPermissions}
          />
        </TabsContent>

        <TabsContent value="companies">
          <CompanyDirectoryTable
            key={`companies-${refreshKey}`}
            projectId={projectId}
            status="active"
          />
        </TabsContent>

        <TabsContent value="groups">
          <EmptyState
            icon={<UsersRound />}
            title="Distribution Groups"
            description="Group management coming soon"
          />
        </TabsContent>

        <TabsContent value="inactive-users">
          <DirectoryTable
            key={`inactive-users-${refreshKey}`}
            projectId={projectId}
            type="users"
            status="inactive"
            onEdit={handleEdit}
            onReactivate={handleReactivate}
            onPermissionsChange={setDirectoryPermissions}
          />
        </TabsContent>

        <TabsContent value="inactive-contacts">
          <DirectoryTable
            key={`inactive-contacts-${refreshKey}`}
            projectId={projectId}
            type="contacts"
            status="inactive"
            onEdit={handleEdit}
            onReactivate={handleReactivate}
            onPermissionsChange={setDirectoryPermissions}
          />
        </TabsContent>

        <TabsContent value="inactive-companies">
          <CompanyDirectoryTable
            key={`inactive-companies-${refreshKey}`}
            projectId={projectId}
            status="inactive"
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InviteDialog
        person={selectedPerson}
        projectId={projectId}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={handleSuccess}
      />

      <PersonEditDialog
        person={selectedPerson}
        projectId={projectId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleSuccess}
        mode="edit"
      />

      <PersonEditDialog
        person={null}
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
        mode="create"
      />
    </ProjectToolPage>
  );
}
