/**
 * =============================================================================
 * LINE ITEMS MANAGER COMPONENT
 * =============================================================================
 *
 * Advanced line item management with inline editing, drag-and-drop reordering,
 * real-time calculations, and validation feedback
 */

'use client'

import { useCallback } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Minus,
} from 'lucide-react'
import { Text } from '@/components/ui/text'
import {
  DirectCostCreate,
  DirectCostUpdate,
  UnitTypes,
  type DirectCostLineItem,
} from '@/lib/schemas/direct-costs'
import { formatCurrency } from '@/lib/table-config/formatters'
import { cn } from '@/lib/utils'

// =============================================================================
// INTERFACES
// =============================================================================

interface BudgetCode {
  id: string
  code: string
  description: string
  category?: string
}

interface LineItemsManagerProps {
  items: Array<DirectCostLineItem & { id?: string }>
  budgetCodes: BudgetCode[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, item: DirectCostLineItem) => void
  form: UseFormReturn<DirectCostCreate | DirectCostUpdate>
}

interface SortableLineItemRowProps {
  item: DirectCostLineItem & { id?: string }
  index: number
  budgetCodes: BudgetCode[]
  onRemove: () => void
  onDuplicate: () => void
  form: UseFormReturn<DirectCostCreate | DirectCostUpdate>
  errors?: Record<string, { message?: string }>
  isValid: boolean
}

// =============================================================================
// SORTABLE LINE ITEM ROW COMPONENT
// =============================================================================

function SortableLineItemRow({
  item,
  index,
  budgetCodes,
  onRemove,
  onDuplicate,
  form,
  errors,
  isValid,
}: SortableLineItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `line-item-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const lineTotal = (item.quantity || 0) * (item.unit_cost || 0)
  const selectedBudgetCode = budgetCodes?.find(
    (bc) => bc.id === item.budget_code_id
  )

  return (
    <TableRow
      ref={setNodeRef}
      className={cn(
        'group hover:bg-muted/50 transition-colors',
        isDragging && 'opacity-50',
        errors && 'bg-destructive/5'
      )}
      // eslint-disable-next-line react/forbid-component-props
      style={style}
    >
      {/* Drag handle */}
      <TableCell className="w-10 p-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>

      {/* Budget Code */}
      <TableCell className="min-w-52">
        <FormField
          control={form.control}
          name={`line_items.${index}.budget_code_id`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <SelectTrigger
                    className={cn(
                      errors?.budget_code_id && 'border-destructive'
                    )}
                  >
                    <SelectValue placeholder="Select budget code" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCodes.map((code) => (
                      <SelectItem key={code.id} value={code.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{code.code}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {code.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        {selectedBudgetCode && (
          <div className="mt-1 text-xs text-muted-foreground">
            {selectedBudgetCode.category && (
              <Badge variant="outline" className="text-xs">
                {selectedBudgetCode.category}
              </Badge>
            )}
          </div>
        )}
      </TableCell>

      {/* Description */}
      <TableCell className="min-w-52">
        <FormField
          control={form.control}
          name={`line_items.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Line item description"
                  {...field}
                  value={field.value || ''}
                  className="border-none bg-transparent focus-visible:ring-1"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Quantity */}
      <TableCell className="w-32">
        <FormField
          control={form.control}
          name={`line_items.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center space-x-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const currentValue = Number(field.value) || 0
                      if (currentValue > 1) {
                        field.onChange(currentValue - 1)
                      }
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={cn(
                      'w-16 text-center border-none bg-transparent focus-visible:ring-1',
                      errors?.quantity && 'text-destructive'
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const currentValue = Number(field.value) || 0
                      field.onChange(currentValue + 1)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </TableCell>

      {/* UOM */}
      <TableCell className="w-24">
        <FormField
          control={form.control}
          name={`line_items.${index}.uom`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-none bg-transparent focus:ring-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UnitTypes.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Unit Cost */}
      <TableCell className="w-32">
        <FormField
          control={form.control}
          name={`line_items.${index}.unit_cost`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={cn(
                      'pl-6 border-none bg-transparent focus-visible:ring-1',
                      errors?.unit_cost && 'border-destructive'
                    )}
                    placeholder="0.00"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Line Total */}
      <TableCell className="w-32">
        <div
          className={cn(
            'font-medium text-right',
            lineTotal > 0 ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {formatCurrency(lineTotal)}
        </div>
        {lineTotal > 1000 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-3 w-3 text-amber-500 mt-1" />
              </TooltipTrigger>
              <TooltipContent>
                <p>High value line item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="w-24">
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDuplicate}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate line item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  disabled={
                    (form.getValues('line_items') || []).length === 1
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove line item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Validation indicator */}
        <div className="mt-1">
          {isValid ? (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          ) : errors ? (
            <AlertCircle className="h-3 w-3 text-destructive" />
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LineItemsManager({
  items,
  budgetCodes,
  onAdd,
  onRemove,
  form,
}: LineItemsManagerProps) {

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Calculate totals
  const calculateGrandTotal = useCallback(() => {
    return items.reduce((total, item) => {
      return total + (item.quantity || 0) * (item.unit_cost || 0)
    }, 0)
  }, [items])

  const grandTotal = calculateGrandTotal()

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(
        (_, index) => `line-item-${index}` === active.id
      )
      const newIndex = items.findIndex(
        (_, index) => `line-item-${index}` === over.id
      )

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(items, oldIndex, newIndex)

        // Update form values
        reorderedItems.forEach((item, index) => {
          form.setValue(`line_items.${index}`, item)
        })
      }
    }
  }

  // Handle duplicate line item
  const handleDuplicate = (index: number) => {
    const itemToDuplicate = items[index]
    const duplicatedItem = {
      ...itemToDuplicate,
      id: undefined, // Remove ID for new item
      description: `${itemToDuplicate.description || ''} (Copy)`.trim(),
    }

    onAdd()

    // Set the values for the new item after onAdd creates it
    setTimeout(() => {
      const newIndex = items.length
      Object.entries(duplicatedItem).forEach(([key, value]) => {
        if (key !== 'id') {
          form.setValue(
            `line_items.${newIndex}.${key}` as keyof DirectCostLineItem,
            value
          )
        }
      })
    }, 0)
  }

  return (
    <div className="space-y-4">
      {/* Line Items Table */}
      <Card>
        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((_, index) => `line-item-${index}`)}
              strategy={verticalListSortingStrategy}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="min-w-48">Budget Code *</TableHead>
                    <TableHead className="min-w-48">Description</TableHead>
                    <TableHead className="w-32">Quantity *</TableHead>
                    <TableHead className="w-24">UOM</TableHead>
                    <TableHead className="w-32">Unit Cost *</TableHead>
                    <TableHead className="w-32 text-right">
                      Line Total
                    </TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Calculator className="h-8 w-8 text-muted-foreground/50" />
                          <Text>No line items yet</Text>
                          <Text size="sm">
                            Click &ldquo;Add Line Item&rdquo; to get started
                          </Text>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => {
                      const errors = form.formState.errors.line_items?.[index]
                      const isValid =
                        !errors &&
                        !!form.getValues(`line_items.${index}.budget_code_id`) &&
                        !!form.getValues(`line_items.${index}.quantity`) &&
                        form.getValues(`line_items.${index}.unit_cost`) !==
                          undefined

                      return (
                        <SortableLineItemRow
                          key={`line-item-${index}`}
                          item={item}
                          index={index}
                          budgetCodes={budgetCodes}
                          onRemove={() => onRemove(index)}
                          onDuplicate={() => handleDuplicate(index)}
                          form={form}
                          errors={errors}
                          isValid={isValid}
                        />
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Actions and Total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Line Item
          </Button>

          {items.length > 1 && (
            <div className="text-sm text-muted-foreground">
              {items.length} line items
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm text-muted-foreground">Grand Total</div>
          <div className="text-xl font-semibold">
            {formatCurrency(grandTotal)}
          </div>
          {grandTotal > 10000 && (
            <Badge variant="secondary" className="text-xs mt-1">
              High Value
            </Badge>
          )}
        </div>
      </div>

      {/* Line Items Summary */}
      {items.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Line Items</div>
                <div className="text-lg font-semibold">{items.length}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-muted-foreground">
                $
              </span>
              <div>
                <div className="text-sm font-medium">Avg per Line</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(
                    items.length > 0 ? grandTotal / items.length : 0
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Valid Lines</div>
                <div className="text-lg font-semibold">
                  {
                    items.filter((_, index) => {
                      const errors = form.formState.errors.line_items?.[index]
                      return (
                        !errors &&
                        !!form.getValues(
                          `line_items.${index}.budget_code_id`
                        ) &&
                        !!form.getValues(`line_items.${index}.quantity`)
                      )
                    }).length
                  }{' '}
                  / {items.length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
