import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { formatCurrency } from '@/lib/format';

interface PropertyInvestmentSectionProps {
  marketValue: number | null;
  totalInvestment: number | null;
  monthlyNetReturn: number | null;
  monthlyNetIncome: number | null;
  accumulatedROI: number | null;
  totalProfit: number | null;
  vacancyRate: number | null;
  onMarketValueChange: (value: number | null) => void;
  onTotalInvestmentChange: (value: number | null) => void;
  onMonthlyNetReturnChange: (value: number | null) => void;
  onMonthlyNetIncomeChange: (value: number | null) => void;
  onVacancyRateChange: (value: number | null) => void;
  onAddInvestment: () => void;
}

const formSchema = z.object({
  marketValue: z.number().optional(),
  totalInvestment: z.number().optional(),
  monthlyNetReturn: z.number().optional(),
  monthlyNetIncome: z.number().optional(),
  vacancyRate: z.number().optional(),
})

export const PropertyInvestmentSection = ({
  marketValue,
  totalInvestment,
  monthlyNetReturn,
  monthlyNetIncome,
  accumulatedROI,
  totalProfit,
  vacancyRate,
  onMarketValueChange,
  onTotalInvestmentChange,
  onMonthlyNetReturnChange,
  onMonthlyNetIncomeChange,
  onVacancyRateChange,
  onAddInvestment,
}: PropertyInvestmentSectionProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      marketValue: marketValue || 0,
      totalInvestment: totalInvestment || 0,
      monthlyNetReturn: monthlyNetReturn || 0,
      monthlyNetIncome: monthlyNetIncome || 0,
      vacancyRate: vacancyRate || 0,
    },
  })

  const handleCurrencyBlur = (e: React.FocusEvent<HTMLInputElement>, field: any) => {
    const value = parseFloat(e.target.value.replace(/[^\d,]/g, '').replace('.', '').replace(',', '.') || '0');
    field.onChange(isNaN(value) ? 0 : value);
    e.target.value = formatCurrency(value);
  };

  const handlePercentageBlur = (e: React.FocusEvent<HTMLInputElement>, field: any) => {
    const value = parseFloat(e.target.value.replace('%', '').replace(',', '.'));
    field.onChange(isNaN(value) ? 0 : value);
    e.target.value = `${isNaN(value) ? 0 : value.toFixed(2).replace('.', ',')}%`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dados Financeiros</CardTitle>
          <CardDescription>
            Informações sobre o investimento no imóvel
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="marketValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor de Mercado</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="R$ 0,00"
                      {...field}
                      value={typeof field.value === 'number' ? formatCurrency(field.value) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^\d,]/g, '');
                        e.target.value = rawValue;
                      }}
                      onBlur={(e) => {
                        handleCurrencyBlur(e, field);
                        onMarketValueChange(field.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalInvestment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investimento Total</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="R$ 0,00"
                      {...field}
                      value={typeof field.value === 'number' ? formatCurrency(field.value) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^\d,]/g, '');
                        e.target.value = rawValue;
                      }}
                      onBlur={(e) => {
                        handleCurrencyBlur(e, field);
                        onTotalInvestmentChange(field.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="monthlyNetReturn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retorno Mensal Líquido</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="R$ 0,00"
                      {...field}
                      value={typeof field.value === 'number' ? formatCurrency(field.value) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^\d,]/g, '');
                        e.target.value = rawValue;
                      }}
                      onBlur={(e) => {
                        handleCurrencyBlur(e, field);
                        onMonthlyNetReturnChange(field.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyNetIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Renda Mensal Líquida</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="R$ 0,00"
                      {...field}
                      value={typeof field.value === 'number' ? formatCurrency(field.value) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^\d,]/g, '');
                        e.target.value = rawValue;
                      }}
                      onBlur={(e) => {
                        handleCurrencyBlur(e, field);
                        onMonthlyNetIncomeChange(field.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="vacancyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Vacância</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0%"
                      {...field}
                      value={`${field.value || 0}%`}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,]/g, '');
                        field.onChange(parseFloat(value.replace(',', '.')) || 0);
                      }}
                      onBlur={(e) => {
                        handlePercentageBlur(e, field);
                        onVacancyRateChange(field.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Label>ROI Acumulado</Label>
              <Input value={`${accumulatedROI?.toFixed(2) || 0}%`} disabled />
            </div>
          </div>
          <div>
            <Label>Lucro Total</Label>
            <Input value={formatCurrency(totalProfit || 0)} disabled />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => onAddInvestment()}
            size="sm" // Changed from "xs" to "sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Investimento
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
