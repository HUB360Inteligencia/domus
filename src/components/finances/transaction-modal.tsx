
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TransactionForm } from './transaction-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  initialData?: TransactionFormData & { id?: string };
  isSubmitting?: boolean;
  properties?: { value: string; label: string }[];
  categories?: { value: string; label: string }[];
}

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  properties = [],
  categories = []
}: TransactionModalProps) {
  const isMobile = useIsMobile();
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={isMobile ? "sm:max-w-[100%] p-4" : "sm:max-w-[600px] max-h-[85vh]"}>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Editar' : 'Adicionar'} Transação</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-80px)] overflow-auto pr-4">
          <div className="pb-2">
            <TransactionForm
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
              properties={properties}
              categories={categories}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
