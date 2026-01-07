import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

interface EmptyUsersListProps {
  onAddUser?: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyUsersList({ onAddUser, hasFilters, onClearFilters }: EmptyUsersListProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No users found"
        description="No users match your current filters. Try adjusting your search or filter criteria."
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
      icon={<Users className="h-12 w-12" />}
      title="No users yet"
      description="Get started by adding your first user to the project directory."
      action={
        onAddUser && (
          <Button onClick={onAddUser}>
            Add User
          </Button>
        )
      }
    />
  );
}
