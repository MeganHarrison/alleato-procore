'use client';

import { BaseModal, ModalBody, ModalFooter } from './BaseModal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface UnlockBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * UnlockBudgetModal - Confirmation dialog for unlocking budget
 *
 * Features:
 * - Warning message about preserving modifications
 * - Two-button action (Cancel / Preserve and Unlock)
 * - Mobile responsive
 */
export function UnlockBudgetModal({
  isOpen,
  onClose,
  onConfirm
}: UnlockBudgetModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Unlock the Budget"
      size="md"
    >
      <ModalBody className="py-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-gray-700">
              Unlocking the Budget will preserve your Budget Modifications.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Once unlocked, you will be able to edit Original Budget amounts directly.
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Preserve and Unlock
        </Button>
      </ModalFooter>
    </BaseModal>
  );
}
