'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ContactsDataTable } from '@/components/tables/contacts-data-table';
import { ProjectPageHeader } from '@/components/layout/ProjectPageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageTabs } from '@/components/layout/PageTabs';
import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { getDirectoryTabs } from '@/config/directory-tabs';
import type { Database } from '@/types/database.types';

type Contact = Database['public']['Tables']['contacts']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

interface ContactWithCompany extends Contact {
  company?: Company | null;
}

export default function DirectoryContactsPage() {
  const pathname = usePathname();
  const [contacts, setContacts] = React.useState<ContactWithCompany[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchContacts = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('contacts')
          .select(`
            *,
            company:companies(*)
          `)
          .order('last_name', { ascending: true });

        if (error) throw error;
        setContacts(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const tabs = getDirectoryTabs(pathname);

  if (isLoading) {
    return (
      <>
        <ProjectPageHeader
          title="Directory"
          description="Manage companies, clients, contacts, users, and employees across your organization"
          showProjectName={false}
        />
        <PageTabs tabs={tabs} />
        <PageContainer>
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Text tone="muted">Loading contacts...</Text>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ProjectPageHeader
          title="Directory"
          description="Manage companies, clients, contacts, users, and employees across your organization"
          showProjectName={false}
        />
        <PageTabs tabs={tabs} />
        <PageContainer>
          <div className="text-center py-12">
            <Text tone="destructive">Error loading contacts: {error.message}</Text>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <ProjectPageHeader
        title="Directory"
        description="Manage companies, clients, contacts, users, and employees across your organization"
        showProjectName={false}
      />
      <PageTabs tabs={tabs} />
      <PageContainer>
          <ContactsDataTable contacts={contacts} />
      </PageContainer>
    </>
  );
}
