
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/utils/financial-formatters';
import { FinancialAnalytics } from '@/types/financial';

interface FinancialStatsCardsProps {
  analytics: FinancialAnalytics;
}

export const FinancialStatsCards = ({ analytics }: FinancialStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card de Receita Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(analytics.totalIncome || 0)}</div>
        </CardContent>
      </Card>

      {/* Card de Despesa Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(analytics.totalExpenses || 0)}</div>
        </CardContent>
      </Card>

      {/* Card de Receita Líquida */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
          {analytics.netIncome >= 0 ? (
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            analytics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(analytics.netIncome || 0)}
          </div>
        </CardContent>
      </Card>

      {/* Card de ROI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">ROI Anual</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(analytics.annualROI || 0)}</div>
          <p className="text-xs text-muted-foreground">
            Mensal: {formatPercentage(analytics.monthlyROI || 0)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
