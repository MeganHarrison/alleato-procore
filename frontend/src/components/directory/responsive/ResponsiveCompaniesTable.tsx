"use client";

import { type Database } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, MapPin, Phone, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Company = Database["public"]["Tables"]["companies"]["Row"];

interface ResponsiveCompaniesTableProps {
  companies: Company[];
  onEdit?: (company: Company) => void;
  onDelete?: (company: Company) => void;
  onViewDetails?: (company: Company) => void;
}

export function ResponsiveCompaniesTable({
  companies,
  onEdit,
  onDelete,
  onViewDetails,
}: ResponsiveCompaniesTableProps) {
  return (
    <div className="space-y-3">
      {/* Desktop View - Hidden on mobile */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">
                  Company Name
                </th>
                <th className="p-3 text-left text-sm font-medium">Location</th>
                <th className="p-3 text-left text-sm font-medium">Type</th>
                <th className="p-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="p-3">
                    <div className="font-medium">{company.name}</div>
                    {company.title && (
                      <div className="text-sm text-muted-foreground">
                        {company.title}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {company.city && company.state
                      ? `${company.city}, ${company.state}`
                      : company.city || company.state || "-"}
                  </td>
                  <td className="p-3 text-sm">{company.type || "-"}</td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onViewDetails && (
                          <DropdownMenuItem
                            onClick={() => onViewDetails(company)}
                          >
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(company)}>
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem onClick={() => onDelete(company)}>
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Card layout */}
      <div className="md:hidden space-y-3">
        {companies.map((company) => (
          <div key={company.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{company.name}</h3>
                {company.title && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {company.title}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewDetails && (
                    <DropdownMenuItem onClick={() => onViewDetails(company)}>
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(company)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(company)}>
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              {(company.city || company.state) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {company.city && company.state
                      ? `${company.city}, ${company.state}`
                      : company.city || company.state}
                  </span>
                </div>
              )}
              {company.type && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Type: </span>
                  <span>{company.type}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {company.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
