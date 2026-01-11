import { Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface EmptyDistributionGroupsProps {
  onAddGroup?: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyDistributionGroups({
  onAddGroup,
  hasFilters,
  onClearFilters,
}: EmptyDistributionGroupsProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<Users2 className="h-12 w-12" />}
        title="No groups found"
        description="No distribution groups match your current filters. Try adjusting your search or filter criteria."
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
      icon={<Users2 className="h-12 w-12" />}
      title="No distribution groups yet"
      description="Create distribution groups to organize and communicate with team members more efficiently."
      action={onAddGroup && <Button onClick={onAddGroup}>Create Group</Button>}
    />
  );
}
