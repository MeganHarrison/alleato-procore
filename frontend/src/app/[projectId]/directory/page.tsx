"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProjectToolPage } from '@/components/layout/project-tool-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DirectoryTable } from '@/components/directory/DirectoryTable';
import { InviteDialog } from '@/components/directory/InviteDialog';
import { PersonEditDialog } from '@/components/directory/PersonEditDialog';
import { Button } from '@/components/ui/button';
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
import type { PersonWithDetails } from '@/components/directory/DirectoryFilters';

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
        `/api/projects/${projectId}/directory/people/${person.id}/deactivate`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to deactivate person');
      }

      toast({
        title: 'Person Deactivated',
        description: `${person.first_name} ${person.last_name} has been deactivated.`,
      });

      // Refresh the table
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate person. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReactivate = async (person: PersonWithDetails) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/directory/people/${person.id}/reactivate`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to reactivate person');
      }

      toast({
        title: 'Person Reactivated',
        description: `${person.first_name} ${person.last_name} has been reactivated.`,
      });

      // Refresh the table
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reactivate person. Please try again.',
        variant: 'destructive',
      });
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
        <Button onClick={handleCreate}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      }
    >
      {/* Directory Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <DirectoryTable
            key={`users-${refreshKey}`}
            projectId={projectId}
            type="users"
            status="active"
            onInvite={handleInvite}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
          />
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <DirectoryTable
            key={`contacts-${refreshKey}`}
            projectId={projectId}
            type="contacts"
            status="active"
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
          />
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <div className="rounded-lg border p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">Companies Directory</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Company management coming soon
            </p>
          </div>
        </TabsContent>

        {/* Distribution Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="rounded-lg border p-8 text-center">
            <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">Distribution Groups</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Group management coming soon
            </p>
          </div>
        </TabsContent>

        {/* Inactive Users Tab */}
        <TabsContent value="inactive-users" className="space-y-4">
          <DirectoryTable
            key={`inactive-users-${refreshKey}`}
            projectId={projectId}
            type="users"
            status="inactive"
            onEdit={handleEdit}
            onReactivate={handleReactivate}
          />
        </TabsContent>

        {/* Inactive Contacts Tab */}
        <TabsContent value="inactive-contacts" className="space-y-4">
          <DirectoryTable
            key={`inactive-contacts-${refreshKey}`}
            projectId={projectId}
            type="contacts"
            status="inactive"
            onEdit={handleEdit}
            onReactivate={handleReactivate}
          />
        </TabsContent>

        {/* Inactive Companies Tab */}
        <TabsContent value="inactive-companies" className="space-y-4">
          <div className="rounded-lg border p-8 text-center">
            <Building className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">Inactive Companies</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Inactive company management coming soon
            </p>
          </div>
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
