import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InvoiceStatus = "draft" | "submitted" | "approved" | "paid" | "void";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

/**
 * Invoice Status Badge Component
 *
 * Displays a status badge with appropriate styling for invoice statuses.
 * This is a specialized version of the StatusBadge component for invoices.
 *
 * @example
 * <InvoiceStatusBadge status="approved" />
 */
export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const getVariant = (): "default" | "secondary" | "success" | "destructive" => {
    switch (status) {
      case "paid":
        return "success";
      case "approved":
        return "success";
      case "submitted":
        return "default";
      case "draft":
        return "secondary";
      case "void":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getLabel = (): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Badge variant={getVariant()} className={cn("capitalize", className)}>
      {getLabel()}
    </Badge>
  );
}
