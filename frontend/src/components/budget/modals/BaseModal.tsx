'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
}

/**
 * BaseModal - Standard modal component for budget modals
 *
 * Features:
 * - Wider design (default: max-w-4xl)
 * - Mobile responsive
 * - Dark header with white text
 * - ESC key to close
 * - Overlay click to close
 * - Keyboard navigation support
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  className,
  showCloseButton = true
}: BaseModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl', // Default - wider modals
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          // Base styles
          'p-0 gap-0 overflow-hidden',
          // Width and responsive
          sizeClasses[size],
          'w-[95vw]', // Mobile: 95% of viewport width
          'sm:w-full', // Desktop: use max-width
          // Height constraints
          'max-h-[90vh]',
          'flex flex-col',
          className
        )}
        // Prevent close button from showing (we'll add our own)
        onPointerDownOutside={(e) => {
          // Allow closing on overlay click
        }}
      >
        {/* Header - Dark gray background like Procore */}
        <DialogHeader className="bg-gray-800 text-white px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-white">
              {title}
            </DialogTitle>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ModalFooter - Standard footer for modal actions
 */
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn(
      'px-6 py-4 bg-gray-50 border-t border-gray-200',
      'flex items-center justify-end gap-3',
      'flex-shrink-0',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * ModalBody - Standard body for modal content
 */
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}
