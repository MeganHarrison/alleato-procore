/**
 * Budget Modals - Export all modal components
 *
 * Design System:
 * - All modals use BaseModal for consistent styling
 * - Wider modals (max-w-4xl default) for better content display
 * - Mobile responsive with appropriate breakpoints
 * - Dark header (gray-800) with white text matching Procore design
 * - ESC key closes modals
 * - Proper keyboard navigation
 */

export { BaseModal, ModalBody, ModalFooter } from "./BaseModal";
export { OriginalBudgetModal } from "./OriginalBudgetModal";
export { UnlockBudgetModal } from "./UnlockBudgetModal";
export { CreateBudgetLineItemsModal } from "./CreateBudgetLineItemsModal";

// Export types
export type {} from "./OriginalBudgetModal";
export type {} from "./UnlockBudgetModal";
export type {} from "./CreateBudgetLineItemsModal";
