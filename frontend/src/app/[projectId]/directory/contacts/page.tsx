"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectPageHeader } from "@/components/layout/ProjectPageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageTabs } from "@/components/layout/PageTabs";
import { Text } from "@/components/ui/text";
import { getProjectDirectoryTabs } from "@/config/directory-tabs";

export default function ProjectDirectoryContactsPage() {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;

  const handleAddContact = () => {
    // TODO: Open add contact modal
    console.warn("Add contact functionality not yet implemented");
  };

  const tabs = getProjectDirectoryTabs(projectId, pathname);

  return (
    <>
      <ProjectPageHeader
        title="Directory"
        description="Manage companies and team members for this project"
        actions={
          <Button onClick={handleAddContact} variant="default">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        }
      />
      <PageTabs tabs={tabs} />
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Text as="p" size="sm" tone="muted">
                Contacts page - Coming soon
              </Text>
            </div>
          </div>

          <div className="text-center py-12">
            <Text tone="muted">
              Contact management functionality will be available soon.
            </Text>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
