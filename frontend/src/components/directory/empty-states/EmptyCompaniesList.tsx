import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

interface EmptyCompaniesListProps {
  onAddCompany?: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyCompaniesList({ onAddCompany, hasFilters, onClearFilters }: EmptyCompaniesListProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<Building2 className="h-12 w-12" />}
        title="No companies found"
        description="No companies match your current filters. Try adjusting your search or filter criteria."
        action={
          onClearFilters && (
            <Button onClick={onClearFilters} variant="outline">
              Clear Filters
            </Button>
          )
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<Building2 className="h-12 w-12" />}
      title="No companies yet"
      description="Get started by adding your first company to the project directory."
      action={
        onAddCompany && (
          <Button onClick={onAddCompany}>
            Add Company
          </Button>
        )
      }
    />
  );
}
