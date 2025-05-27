
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

// Schema for form validation with receipt
const transactionSchema = z.object({
  name: z.string().min(1, 'Nome da transação é obrigatório'),
  amount: z.number().positive('Amount must be positive'),
  transaction_type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  transaction_date: z.string(),
  payment_method: z.string().optional().nullable(),
  recurring: z.boolean().default(false),
  recurring_frequency: z.string().optional().nullable(),
  recurring_end_date: z.string().optional().nullable(),
  property_id: z.string().optional().nullable(),
  receipt_url: z.string().optional().nullable(),
});

export function useTransactionForm(initialData?: TransactionFormData & { id?: string }) {
  const defaultValues: TransactionFormData = initialData || {
    name: '',
    amount: 0,
    transaction_type: 'expense',
    category: '',
    subcategory: null,
    description: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: null,
    recurring: false,
    recurring_frequency: null,
    recurring_end_date: null,
    property_id: null,
    receipt_url: null,
  };

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  const watchRecurring = form.watch('recurring');
  const watchTransactionType = form.watch('transaction_type');

  return {
    form,
    watchRecurring,
    watchTransactionType
  };
}
