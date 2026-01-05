'use client';

import { useEffect } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
  useModal,
} from '@/components/ui/modal/animated-modal';
import { BudgetLineItemForm } from './budget-line-item-form';

interface BudgetLineItemModalWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

function ModalController({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: BudgetLineItemModalWrapperProps) {
  const { setOpen } = useModal();

  useEffect(() => {
    setOpen(open);
  }, [open, setOpen]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <ModalBody>
      <ModalContent>
        <BudgetLineItemForm
          projectId={projectId}
          onSuccess={() => {
            onSuccess?.();
            handleClose();
          }}
          onCancel={handleClose}
        />
      </ModalContent>
    </ModalBody>
  );
}

export function BudgetLineItemModalWrapper(props: BudgetLineItemModalWrapperProps) {
  return (
    <Modal>
      <ModalController {...props} />
    </Modal>
  );
}