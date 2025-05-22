
import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormData } from '@/hooks/use-financial-transactions';

interface DateFieldProps {
  form: UseFormReturn<TransactionFormData>;
  name: "transaction_date" | "recurring_end_date";
  label: string;
  placeholder?: string;
  optional?: boolean;
}

export function DateField({ 
  form, 
  name, 
  label, 
  placeholder = "Pick a date",
  optional = false 
}: DateFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
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
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => {
                  if (optional) {
                    field.onChange(date ? format(date, "yyyy-MM-dd") : null);
                  } else {
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                  }
                }}
                initialFocus
                disabled={name === "recurring_end_date" ? (date) => date < new Date() : undefined}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
