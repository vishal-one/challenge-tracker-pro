import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-surface border border-neutral-border p-6 rounded-lg shadow-2xl z-50 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-neutral-border/50 pb-4 mb-4">
            <div>
              <Dialog.Title className="text-lg font-mono font-semibold text-neutral-txt uppercase tracking-wide">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-neutral-muted mt-1 font-sans">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded text-neutral-muted hover:text-neutral-txt hover:bg-surface-high transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          <div>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
