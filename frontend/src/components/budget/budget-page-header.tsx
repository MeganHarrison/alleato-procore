"use client";

import * as React from "react";
import {
  Plus,
  ArrowRight,
  Unlock,
  Lock,
  Download,
  Upload,
  MoreVertical,
  MessageSquare,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectPageHeader } from "@/components/layout/ProjectPageHeader";

interface BudgetPageHeaderProps {
  title?: string;
  isLocked?: boolean;
  lockedAt?: string | null;
  lockedBy?: string | null;
  onCreateClick?: () => void;
  onModificationClick?: () => void;
  onResendToERP?: () => void;
  onLockBudget?: () => void;
  onUnlockBudget?: () => void;
  onImport?: () => void;
  onExport?: (format: string) => void;
}

export function BudgetPageHeader({
  title = "Budget",
  isLocked = false,
  lockedAt,
  lockedBy,
  onCreateClick,
  onModificationClick,
  onResendToERP,
  onLockBudget,
  onUnlockBudget,
  onImport,
  onExport,
}: BudgetPageHeaderProps) {
  const [showLockDialog, setShowLockDialog] = React.useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = React.useState(false);

  const handleLockConfirm = () => {
    onLockBudget?.();
    setShowLockDialog(false);
  };

  const handleUnlockConfirm = () => {
    onUnlockBudget?.();
    setShowUnlockDialog(false);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const titleContent = (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {isLocked && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Locked
        </Badge>
      )}
    </div>
  );

  const statusDescription =
    isLocked && lockedAt
      ? `Locked ${formatDate(lockedAt)}${lockedBy ? ` by ${lockedBy}` : ""}`
      : undefined;

  const actionButtons = (
    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:justify-end">
      {/* Primary Action - Create Budget Item */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 h-10 font-medium shadow-sm hover:shadow transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Budget Item
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onCreateClick} className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Budget Line Item
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Plus className="w-4 h-4 mr-2" />
            Snapshot
          </DropdownMenuItem>
          {isLocked && (
            <DropdownMenuItem onClick={onModificationClick} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Budget Modification
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Secondary Actions Group */}
      <div className="flex items-center gap-2">
        {/* Resend to ERP Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onResendToERP}
          className="h-9 px-3 hover:bg-accent transition-colors"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          <span className="hidden lg:inline">Resend to ERP</span>
          <span className="lg:hidden">ERP</span>
        </Button>

        {/* Lock/Unlock Budget Button */}
        {isLocked ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnlockDialog(true)}
            className="h-9 px-3 hover:bg-accent transition-colors"
          >
            <Unlock className="w-4 h-4 mr-2" />
            <span className="hidden lg:inline">Unlock Budget</span>
            <span className="lg:hidden">Unlock</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLockDialog(true)}
            className="h-9 px-3 hover:bg-accent transition-colors"
          >
            <Lock className="w-4 h-4 mr-2" />
            <span className="hidden lg:inline">Lock Budget</span>
            <span className="lg:hidden">Lock</span>
          </Button>
        )}

        {/* Import Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onImport}
          className="h-9 px-3 hover:bg-accent transition-colors"
        >
          <Upload className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Import</span>
        </Button>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport?.("pdf")} className="cursor-pointer">
              Export to PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport?.("excel")} className="cursor-pointer">
              Export to Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport?.("csv")} className="cursor-pointer">
              Export to CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-accent transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">Configure Columns</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Budget Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">View Audit Log</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Chat/Converse Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:bg-accent transition-colors"
          aria-label="Open chat"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ProjectPageHeader
        title={title}
        titleContent={titleContent}
        description={statusDescription}
        actions={actionButtons}
      />

      {/* Lock Budget Confirmation Dialog */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Lock Budget
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to lock the budget for this project?</p>
              <div className="bg-muted border rounded-md p-3 mt-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">What happens when you lock:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Budget line items cannot be added, edited, or deleted
                      </li>
                      <li>Original budget amounts become read-only</li>
                      <li>
                        Changes can only be made through approved change orders
                      </li>
                      <li>Budget modifications require unlock permission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLockConfirm}>
              Lock Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlock Budget Confirmation Dialog */}
      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              Unlock Budget
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to unlock the budget for this project?
              </p>
              <div className="bg-muted border rounded-md p-3 mt-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">What happens when you unlock:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Budget line items can be added, edited, or deleted
                      </li>
                      <li>Original budget amounts become editable</li>
                      <li>
                        All users with budget permissions can make changes
                      </li>
                      <li>Changes will be tracked in the audit log</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlockConfirm}>
              Unlock Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
