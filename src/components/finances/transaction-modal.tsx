
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from './transaction-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit' : 'Add'} Transaction</DialogTitle>
        </DialogHeader>
        <TransactionForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          properties={properties}
          categories={categories}
        />
      </DialogContent>
    </Dialog>
  );
}
