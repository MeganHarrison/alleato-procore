"use client";

import * as React from "react";
import { Form } from "@/components/forms/Form";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { NumberField } from "@/components/forms/NumberField";
import { DateField } from "@/components/forms/DateField";
import { RichTextField } from "@/components/forms/RichTextField";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { FileUploadField } from "@/components/forms/FileUploadField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Info, Plus, HelpCircle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClients } from "@/hooks/use-clients";
import { useUsers } from "@/hooks/use-users";
import { getAutoFillData, isDevelopment } from "@/lib/dev-autofill";

// ============================================================================
// Types
// ============================================================================

export interface SOVLineItem {
  id: string;
  budgetCode?: string;
  description: string;
  amount: number;
  quantity?: number;
  unitCost?: number;
  unitOfMeasure?: string;
  billedToDate: number;
  amountRemaining: number;
}

export interface ContractFormData {
  // General Info
  number: string; // Contract #
  title: string;
  ownerClientId?: string; // Owner/Client
  contractorId?: string; // Contractor
  architectEngineerId?: string; // Architect/Engineer
  contractCompanyId?: string; // Contract Company ID
  status: string;
  executed: boolean;
  defaultRetainage?: number;
  retentionPercent?: number;
  description?: string;
  originalAmount?: number;
  revisedAmount?: number;

  // Contract Dates
  startDate?: Date;
  estimatedCompletionDate?: Date;
  substantialCompletionDate?: Date;
  actualCompletionDate?: Date;
  signedContractReceivedDate?: Date;
  contractTerminationDate?: Date;

  // Schedule of Values
  sovItems?: SOVLineItem[];
  accountingMethod?: "amount" | "unit_quantity";

  // Inclusions & Exclusions
  inclusions?: string;
  exclusions?: string;

  // Privacy
  isPrivate: boolean;
  allowedUsers?: string[];
  allowedUsersCanSeeSov?: boolean;

  // Attachments
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
  }>;
  attachmentFiles?: File[];
}

interface ContractFormProps {
  initialData?: Partial<ContractFormData>;
  onSubmit: (data: ContractFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  projectId?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CONTRACT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "out_for_bid", label: "Out for Bid" },
  { value: "out_for_signature", label: "Out for Signature" },
  { value: "approved", label: "Approved" },
  { value: "complete", label: "Complete" },
  { value: "terminated", label: "Terminated" },
];

// ============================================================================
// Main Component
// ============================================================================

export function ContractForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
}: ContractFormProps) {
  const [formData, setFormData] = React.useState<Partial<ContractFormData>>({
    accountingMethod: "amount",
    sovItems: [],
    ...initialData,
  });
  const [validationErrors, setValidationErrors] = React.useState<
    Partial<Record<"number" | "title" | "executed", string>>
  >({});
  const [attachmentFiles, setAttachmentFiles] = React.useState<File[]>([]);
  const [attachmentFileInfos, setAttachmentFileInfos] = React.useState<
    Array<{ name: string; size: number; type: string }>
  >([]);

  // Data hooks
  const {
    options: clientOptions,
    isLoading: clientsLoading,
    createClient,
  } = useClients();
  const { options: userOptions } = useUsers();

  // State for "Add New Client" dialog
  const [showAddClient, setShowAddClient] = React.useState(false);
  const [newClientName, setNewClientName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Partial<Record<"number" | "title" | "executed", string>> = {};
    if (!formData.number?.trim()) {
      errors.number = "Contract # is required.";
    }
    if (!formData.title?.trim()) {
      errors.title = "Title is required.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Include the actual File objects in the submission
    const submissionData = {
      ...formData,
      attachmentFiles: attachmentFiles.length > 0 ? attachmentFiles : undefined
    };
    console.log('Submitting with attachments:', attachmentFiles.length);

    await onSubmit(submissionData as ContractFormData);
  };

  const updateFormData = (updates: Partial<ContractFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const clearValidationError = (field: "number" | "title" | "executed") => {
    setValidationErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;

    setIsCreating(true);
    const newClient = await createClient({
      name: newClientName.trim(),
      status: "active",
    });

    if (newClient) {
      updateFormData({ ownerClientId: newClient.id.toString() });
      setNewClientName("");
      setShowAddClient(false);
    }
    setIsCreating(false);
  };

  // SOV handlers
  const addSOVLine = () => {
    const isUnitQuantity = formData.accountingMethod === "unit_quantity";
    const newLine: SOVLineItem = {
      id: `sov-${Date.now()}`,
      description: "",
      amount: 0,
      // Only initialize quantity/unitCost in unit_quantity mode
      quantity: isUnitQuantity ? 1 : undefined,
      unitCost: isUnitQuantity ? 0 : undefined,
      unitOfMeasure: isUnitQuantity ? "" : undefined,
      billedToDate: 0,
      amountRemaining: 0,
    };
    updateFormData({ sovItems: [...(formData.sovItems || []), newLine] });
  };

  const updateSOVLine = (id: string, updates: Partial<SOVLineItem>) => {
    const items = formData.sovItems || [];
    const isUnitQuantity = formData.accountingMethod === "unit_quantity";
    updateFormData({
      sovItems: items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              amount:
                isUnitQuantity && (updates.quantity || updates.unitCost)
                  ? (updates.quantity ?? item.quantity ?? 0) *
                    (updates.unitCost ?? item.unitCost ?? 0)
                  : updates.amount ?? item.amount,
            }
          : item,
      ),
    });
  };

  const removeSOVLine = (id: string) => {
    const items = formData.sovItems || [];
    updateFormData({ sovItems: items.filter((item) => item.id !== id) });
  };

  const toggleAccountingMethod = () => {
    const nextMethod =
      formData.accountingMethod === "unit_quantity" ? "amount" : "unit_quantity";
    const updatedItems = (formData.sovItems || []).map((item) => {
      if (nextMethod === "unit_quantity") {
        // Switching TO unit/quantity mode from amount mode
        // Use existing quantity if available, otherwise default to 1
        const quantity = item.quantity ?? 1;

        // Calculate unitCost:
        // - If unitCost already exists (from previous toggle), use it
        // - Otherwise, derive from amount / quantity
        let unitCost = item.unitCost;
        if (unitCost === undefined || unitCost === null) {
          unitCost = (item.amount || 0) / quantity;
        }

        return {
          ...item,
          quantity,
          unitCost,
          unitOfMeasure: item.unitOfMeasure || "",
          amount: quantity * unitCost,
        };
      } else {
        // Switching FROM unit/quantity mode to amount mode
        // Calculate amount from quantity * unitCost
        const amount = (item.quantity ?? 1) * (item.unitCost ?? 0);
        return {
          ...item,
          amount: amount || item.amount || 0,
          // Keep quantity and unitCost for when we switch back
          quantity: item.quantity,
          unitCost: item.unitCost,
          unitOfMeasure: item.unitOfMeasure,
        };
      }
    });
    updateFormData({ accountingMethod: nextMethod, sovItems: updatedItems });
  };

  const handleFilesSelected = (files: File[]) => {
    // Add new files to our File array
    const updatedFiles = [...attachmentFiles, ...files];
    setAttachmentFiles(updatedFiles);

    // Create FileInfo objects for display
    const newFileInfos = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
    const updatedFileInfos = [...attachmentFileInfos, ...newFileInfos];
    setAttachmentFileInfos(updatedFileInfos);

    updateFormData({ attachmentFiles: updatedFiles });
  };

  const handleFilesChanged = (fileInfos: Array<{ name: string; size: number; type: string }>) => {
    // This is called when files are removed from the UI
    // Update our FileInfo array
    setAttachmentFileInfos(fileInfos);

    // Also update the actual File array to match
    const filtered = attachmentFiles.filter((file) =>
      fileInfos.some(
        (info) => info.name === file.name && info.size === file.size,
      ),
    );
    setAttachmentFiles(filtered);
    updateFormData({ attachmentFiles: filtered });
  };

  // Auto-fill handler (development only)
  const handleAutoFill = () => {
    if (!isDevelopment) return;
    const autoFillData = getAutoFillData("primeContract");
    updateFormData(autoFillData);
  };

  // Calculate SOV totals
  const sovTotals = React.useMemo(() => {
    const items = formData.sovItems || [];
    return {
      amount: items.reduce((sum, item) => sum + (item.amount || 0), 0),
      billedToDate: items.reduce(
        (sum, item) => sum + (item.billedToDate || 0),
        0,
      ),
      amountRemaining: items.reduce(
        (sum, item) => sum + ((item.amount || 0) - (item.billedToDate || 0)),
        0,
      ),
    };
  }, [formData.sovItems]);

  return (
    <Form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="prime-contract-form"
    >
      {/* ================================================================ */}
      {/* GENERAL INFORMATION */}
      {/* ================================================================ */}
      <h4 className="text-lg font-semibold">General Information</h4>
      <div className="space-y-4">
        {/* Row 1: Contract #, Owner/Client, Title */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="Contract #"
            value={formData.number || ""}
            onChange={(e) => {
              clearValidationError("number");
              updateFormData({ number: e.target.value });
            }}
            placeholder="2"
            error={validationErrors.number}
            required
          />

          <SearchableSelect
            label="Owner/Client"
            options={clientOptions}
            value={formData.ownerClientId}
            onValueChange={(value) => updateFormData({ ownerClientId: value })}
            placeholder="Select company"
            searchPlaceholder="Search"
            disabled={clientsLoading}
            triggerTestId="owner-client-select"
            optionTestIdPrefix="owner-client-option"
            addButton={
              <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Add new client">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Create a new client/owner for contracts.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="client-name">Client Name *</Label>
                    <Input
                      id="client-name"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Enter client name"
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddClient(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateClient}
                      disabled={!newClientName.trim() || isCreating}
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          />

          <TextField
            label="Title"
            value={formData.title || ""}
            onChange={(e) => {
              clearValidationError("title");
              updateFormData({ title: e.target.value });
            }}
            placeholder="Enter title"
            error={validationErrors.title}
            required
          />
        </div>

        {/* Row 2: Status, Executed, Default Retainage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Status"
            options={CONTRACT_STATUSES}
            value={formData.status || "draft"}
            onValueChange={(value) => updateFormData({ status: value })}
            required
          />

          <div className="space-y-2">
            <Label>Executed</Label>
            <div className="flex items-center h-10">
              <Checkbox
                id="executed"
                checked={formData.executed || false}
                onCheckedChange={(checked) => {
                  clearValidationError("executed");
                  updateFormData({ executed: checked === true });
                }}
              />
              <Label htmlFor="executed" className="ml-2 text-sm font-normal">
                Contract is executed
              </Label>
            </div>
            {validationErrors.executed && (
              <p
                className="text-sm text-red-600"
                data-testid="executed-error"
              >
                {validationErrors.executed}
              </p>
            )}
          </div>

          <NumberField
            label="Default Retainage"
            value={formData.defaultRetainage}
            onChange={(value) => updateFormData({ defaultRetainage: value })}
            suffix="%"
            placeholder=""
            min={0}
            max={100}
          />
        </div>

        {/* Row 3: Contractor, Architect/Engineer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchableSelect
            label="Contractor"
            options={clientOptions}
            value={formData.contractorId}
            onValueChange={(value) => updateFormData({ contractorId: value })}
            placeholder="Select contractor"
            searchPlaceholder="Search"
            disabled={clientsLoading}
          />

          <SearchableSelect
            label="Architect/Engineer"
            options={clientOptions}
            value={formData.architectEngineerId}
            onValueChange={(value) =>
              updateFormData({ architectEngineerId: value })
            }
            placeholder="Select architect/engineer"
            searchPlaceholder="Search"
            disabled={clientsLoading}
          />
        </div>

        {/* Description with rich text */}
        <RichTextField
          label="Description"
          value={formData.description || ""}
          onChange={(value) => updateFormData({ description: value })}
          placeholder="Enter contract description..."
          fullWidth
        />

        {/* Attachments */}
        <div className="space-y-2">
          <Label>Attachments</Label>
          <FileUploadField
            label=""
            value={attachmentFileInfos}
            onChange={handleFilesChanged}
            onFilesSelected={handleFilesSelected}
            multiple
            maxFiles={20}
            maxSize={10 * 1024 * 1024}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            hint="Attach contract documents, plans, or other relevant files"
            dropzoneTestId="prime-contract-attachments-dropzone"
            inputTestId="prime-contract-attachments-input"
            fileListTestId="prime-contract-attachments-list"
          />
        </div>
      </div>

      {/* ================================================================ */}
      {/* SCHEDULE OF VALUES */}
      {/* ================================================================ */}
      <div className="pt-8">
        {/* Accounting Method Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              This contract&apos;s default accounting method is amount-based. To
              use budget codes with a unit of measure association, select Change
              to Unit/Quantity.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={toggleAccountingMethod}
            type="button"
            data-testid="sov-accounting-toggle"
          >
            Change to Unit/Quantity
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Schedule of Values</h3>
          <Select defaultValue="add_group">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Add Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add_group">Add Group</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* SOV Table */}
        <div
          className="border rounded-lg overflow-hidden"
          data-testid="sov-table"
          data-accounting-method={formData.accountingMethod}
        >
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  <div className="flex items-center gap-1">
                    Budget Code
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Link to a budget code</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Description
                </th>
                {formData.accountingMethod === "unit_quantity" && (
                  <>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      UOM
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      Unit Cost
                    </th>
                  </>
                )}
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                  Billed to Date
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                  Amount Remaining
                </th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {(formData.sovItems || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-4xl">🤔</span>
                      </div>
                    <p className="text-lg font-medium text-foreground">
                      You Have No Line Items Yet
                    </p>
                    <Button
                      onClick={addSOVLine}
                      className="bg-orange-500 hover:bg-orange-600"
                      data-testid="sov-add-line-empty"
                    >
                      Add Line
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
                formData.sovItems?.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    data-testid={`sov-line-${index}`}
                  >
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3">
                      <Input
                        value={item.budgetCode || ""}
                        onChange={(e) =>
                          updateSOVLine(item.id, { budgetCode: e.target.value })
                        }
                        placeholder="Budget code"
                        className="h-8"
                        data-testid="sov-line-budget-code"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateSOVLine(item.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Description"
                        className="h-8"
                        data-testid="sov-line-description"
                      />
                    </td>
                    {formData.accountingMethod === "unit_quantity" && (
                      <>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={item.quantity ?? ""}
                            onChange={(e) =>
                              updateSOVLine(item.id, {
                                quantity: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-8 text-right"
                            data-testid="sov-line-quantity"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={item.unitOfMeasure || ""}
                            onChange={(e) =>
                              updateSOVLine(item.id, {
                                unitOfMeasure: e.target.value,
                              })
                            }
                            className="h-8"
                            data-testid="sov-line-unit-of-measure"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={item.unitCost ?? ""}
                            onChange={(e) =>
                              updateSOVLine(item.id, {
                                unitCost: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-8 text-right"
                            data-testid="sov-line-unit-cost"
                          />
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateSOVLine(item.id, {
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-right"
                        data-testid="sov-line-amount"
                        readOnly={
                          formData.accountingMethod === "unit_quantity"
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      ${item.billedToDate.toFixed(2)}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-sm"
                      data-testid="sov-line-amount-remaining"
                    >
                      ${(item.amount - item.billedToDate).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSOVLine(item.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-muted border-t">
              <tr>
                <td colSpan={2} className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSOVLine}
                    className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                    data-testid="sov-add-line-footer"
                  >
                    Add Line
                  </Button>
                </td>
                <td className="px-4 py-3 text-right font-medium">Total:</td>
                {formData.accountingMethod === "unit_quantity" && (
                  <>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3" />
                  </>
                )}
                <td
                  className="px-4 py-3 text-right font-medium"
                  data-testid="sov-total-amount"
                >
                  ${sovTotals.amount.toFixed(2)}
                </td>
                <td
                  className="px-4 py-3 text-right font-medium"
                  data-testid="sov-total-billed"
                >
                  ${sovTotals.billedToDate.toFixed(2)}
                </td>
                <td
                  className="px-4 py-3 text-right font-medium"
                  data-testid="sov-total-remaining"
                >
                  ${sovTotals.amountRemaining.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Import dropdown */}
        <div className="mt-4">
          <Select>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Import" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ================================================================ */}
      {/* INCLUSIONS & EXCLUSIONS */}
      {/* ================================================================ */}
      <div className="pt-8">
        <h4 className="text-lg font-semibold">Inclusions & Exclusions</h4>
      </div>
      <div className="space-y-4">
        <RichTextField
          label="Inclusions"
          value={formData.inclusions || ""}
          onChange={(value) => updateFormData({ inclusions: value })}
          placeholder="Enter what is included in contract scope..."
          fullWidth
        />

        <RichTextField
          label="Exclusions"
          value={formData.exclusions || ""}
          onChange={(value) => updateFormData({ exclusions: value })}
          placeholder="Enter what is excluded from contract scope..."
          fullWidth
        />
      </div>

      {/* ================================================================ */}
      {/* CONTRACT DATES */}
      {/* ================================================================ */}

      <div className="pt-8">
        <h4 className="text-lg font-semibold">Contract Dates</h4>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DateField
            label="Start Date"
            value={formData.startDate}
            onChange={(date) => updateFormData({ startDate: date })}
            placeholder="mm / dd / yyyy"
          />

          <DateField
            label="Estimated Completion Date"
            value={formData.estimatedCompletionDate}
            onChange={(date) =>
              updateFormData({ estimatedCompletionDate: date })
            }
            placeholder="mm / dd / yyyy"
          />

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>Substantial Completion Date</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Date when work is sufficiently complete for its intended
                      use
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <DateField
              label=""
              value={formData.substantialCompletionDate}
              onChange={(date) =>
                updateFormData({ substantialCompletionDate: date })
              }
              placeholder="mm / dd / yyyy"
            />
          </div>

          <DateField
            label="Actual Completion Date"
            value={formData.actualCompletionDate}
            onChange={(date) => updateFormData({ actualCompletionDate: date })}
            placeholder="mm / dd / yyyy"
          />

          <DateField
            label="Signed Contract Received Date"
            value={formData.signedContractReceivedDate}
            onChange={(date) =>
              updateFormData({ signedContractReceivedDate: date })
            }
            placeholder="mm / dd / yyyy"
          />

          <DateField
            label="Contract Termination Date"
            value={formData.contractTerminationDate}
            onChange={(date) =>
              updateFormData({ contractTerminationDate: date })
            }
            placeholder="mm / dd / yyyy"
          />
        </div>
      </div>

      {/* ================================================================ */}
      {/* CONTRACT PRIVACY */}
      {/* ================================================================ */}

      <div className="pt-8 text-lg font-semibold">
        <h4 className="text-lg font-semibold">Contract Privacy</h4>
      </div>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Using the privacy setting allows only project admins and the select
          non-admin users access.
        </p>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="private"
            checked={formData.isPrivate || false}
            onCheckedChange={(checked) =>
              updateFormData({ isPrivate: checked === true })
            }
          />
          <Label htmlFor="private" className="text-sm font-medium">
            Private
          </Label>
        </div>

        {formData.isPrivate && (
          <div className="space-y-4 pl-6 border-l-2 border-border">
            <div className="space-y-2">
              <Label>Access for Non-Admin Users</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Values" />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-sov-access"
                checked={formData.allowedUsersCanSeeSov || false}
                onCheckedChange={(checked) =>
                  updateFormData({ allowedUsersCanSeeSov: checked === true })
                }
              />
              <Label htmlFor="allow-sov-access" className="text-sm font-normal">
                Allow these non-admin users to view the SOV items.
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* FORM ACTIONS */}
      {/* ================================================================ */}
      <div className="flex justify-between items-center pt-4">
        {/* Auto-fill button (development only) */}
        {isDevelopment && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAutoFill}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Auto-fill
          </Button>
        )}

        {/* Main actions */}
        <div className="flex gap-3 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting
              ? "Creating..."
              : mode === "create"
                ? "Create"
                : "Update"}
          </Button>
        </div>
      </div>
    </Form>
  );
}
