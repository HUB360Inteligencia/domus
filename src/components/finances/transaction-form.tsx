
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

// Schema for form validation
const transactionSchema = z.object({
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
});

interface TransactionFormProps {
  initialData?: TransactionFormData & { id?: string };
  onSubmit: (data: TransactionFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  properties?: { value: string; label: string }[];
  categories?: { value: string; label: string }[];
}

export function TransactionForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  properties = [],
  categories = []
}: TransactionFormProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData || {
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
    },
  });

  const watchRecurring = form.watch('recurring');
  const watchTransactionType = form.watch('transaction_type');

  const handleSubmit = (data: TransactionFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Transaction Type */}
        <FormField
          control={form.control}
          name="transaction_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <div className="flex gap-4">
                <Card 
                  className={`flex-1 cursor-pointer ${
                    field.value === 'income' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                  onClick={() => field.onChange('income')}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="font-medium">Income</div>
                    {field.value === 'income' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </CardContent>
                </Card>
                
                <Card 
                  className={`flex-1 cursor-pointer ${
                    field.value === 'expense' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}
                  onClick={() => field.onChange('expense')}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="font-medium">Expense</div>
                    {field.value === 'expense' && <CheckCircle className="h-5 w-5 text-red-500" />}
                  </CardContent>
                </Card>
              </div>
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  className={`text-lg ${
                    watchTransactionType === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                  {...field} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date */}
        <FormField
          control={form.control}
          name="transaction_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className="pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="taxes">Taxes</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subcategory (optional) */}
        <FormField
          control={form.control}
          name="subcategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategory (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Subcategory" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter a description..." 
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Method */}
        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Property */}
        {properties.length > 0 && (
          <FormField
            control={form.control}
            name="property_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.value} value={property.value}>
                        {property.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Recurring */}
        <FormField
          control={form.control}
          name="recurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Recurring Transaction</FormLabel>
                <FormDescription>
                  Is this a recurring transaction?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {watchRecurring && (
          <div className="space-y-4">
            {/* Frequency */}
            <FormField
              control={form.control}
              name="recurring_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="recurring_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>No end date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Leave blank for no end date
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {initialData?.id ? 'Update' : 'Create'} Transaction
          </Button>
        </div>
      </form>
    </Form>
  );
}
