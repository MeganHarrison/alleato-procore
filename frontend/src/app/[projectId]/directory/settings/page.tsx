'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProjectRolesTab } from '@/components/directory/settings/ProjectRolesTab';
import { PermissionsTableTab } from '@/components/directory/settings/PermissionsTableTab';

type SettingsTab = 'roles' | 'permissions';

export default function ProjectDirectorySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('roles');

  const handleBack = () => {
    router.push(`/${projectId}/directory/users`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Project Directory Settings
          </h1>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <div className="p-4">
            {/* Back button */}
            <Button
              variant="default"
              className="w-full mb-6 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {/* Navigation tabs */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('roles')}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'roles'
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                Project Roles
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'permissions'
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                Permissions Table
              </button>
            </nav>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 p-6">
          {activeTab === 'roles' && <ProjectRolesTab projectId={projectId} />}
          {activeTab === 'permissions' && (
            <PermissionsTableTab projectId={projectId} />
          )}
        </div>
      </div>
    </div>
  );
}
