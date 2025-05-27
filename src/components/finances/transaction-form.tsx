
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTransactionForm } from '@/hooks/use-transaction-form';

// Import Form Components
import { TransactionTypeSelector } from './transaction-form/transaction-type-selector';
import { NameField } from './transaction-form/name-field';
import { AmountField } from './transaction-form/amount-field';
import { DateField } from './transaction-form/date-field';
import { CategoryField } from './transaction-form/category-field';
import { MobileFields } from './transaction-form/mobile-fields';
import { DesktopFields } from './transaction-form/desktop-fields';
import { RecurringToggle } from './transaction-form/recurring-toggle';
import { RecurringFields } from './transaction-form/recurring-fields';

interface TransactionFormProps {
  initialData?: TransactionFormData & { id?: string };
  onSubmit: (data: TransactionFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  properties?: { value: string; label: string }[];
  categories?: { value: string; label: string; type?: string }[];
}

export function TransactionForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  properties = [],
  categories = []
}: TransactionFormProps) {
  const { form, watchRecurring, watchTransactionType } = useTransactionForm(initialData);
  const isMobile = useIsMobile();

  const handleSubmit = (data: TransactionFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Transaction Type */}
        <TransactionTypeSelector form={form} />

        {/* Name */}
        <NameField form={form} />

        {/* Amount */}
        <AmountField form={form} transactionType={watchTransactionType} />

        {/* Date */}
        <DateField form={form} name="transaction_date" label="Data" />

        {/* Category - Filter by transaction type */}
        <CategoryField 
          form={form} 
          categories={categories} 
          transactionType={watchTransactionType}
        />

        {/* Mobile or Desktop specific fields */}
        {isMobile ? (
          <MobileFields form={form} properties={properties} />
        ) : (
          <DesktopFields form={form} properties={properties} />
        )}
        
        {/* Recurring toggle */}
        <RecurringToggle form={form} />

        {/* Recurring fields if recurring is enabled */}
        {watchRecurring && <RecurringFields form={form} />}

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {initialData?.id ? 'Atualizar' : 'Criar'} Transação
          </Button>
        </div>
      </form>
    </Form>
  );
}
