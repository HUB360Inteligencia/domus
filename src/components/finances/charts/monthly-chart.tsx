
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/financial-formatters';

interface MonthlyChartProps {
  monthlyData: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
}

export const MonthlyChart = ({ monthlyData }: MonthlyChartProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Receitas vs Despesas (Mensal)</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {monthlyData && monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#10b981" />
              <Bar dataKey="expense" name="Despesas" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Nenhuma transação registrada nos últimos meses</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
