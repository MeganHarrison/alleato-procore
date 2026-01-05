'use client';

import { useEffect } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  useModal,
} from '@/components/ui/modal/animated-modal';
import { BudgetLineItemForm } from './budget-line-item-form';

interface BudgetLineItemModalAnimatedProps {
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
}: BudgetLineItemModalAnimatedProps) {
  const { open: modalOpen, setOpen } = useModal();

  useEffect(() => {
    setOpen(open);
  }, [open, setOpen]);

  useEffect(() => {
    if (!modalOpen && open) {
      onOpenChange(false);
    }
  }, [modalOpen, open, onOpenChange]);

  return (
    <ModalBody>
      <ModalContent className="max-w-[1200px] max-h-[90vh] overflow-hidden">
        <BudgetLineItemForm
          projectId={projectId}
          onSuccess={() => {
            onSuccess?.();
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </ModalContent>
    </ModalBody>
  );
}

export function BudgetLineItemModalAnimated(props: BudgetLineItemModalAnimatedProps) {
  if (!props.open) return null;

  return (
    <Modal>
      <ModalController {...props} />
    </Modal>
  );
}