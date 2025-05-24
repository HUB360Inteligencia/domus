
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  transaction_date: string;
}

interface RevenueExpenseChartProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function RevenueExpenseChart({ transactions, isLoading }: RevenueExpenseChartProps) {
  // Generate last 12 months
  const endDate = new Date();
  const startDate = subMonths(endDate, 11);
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  const chartData = months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthTransactions = transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.transaction_date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const income = monthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expenses;

    return {
      month: format(month, 'MMM', { locale: ptBR }),
      fullMonth: format(month, 'MMMM yyyy', { locale: ptBR }),
      income,
      expenses,
      balance,
    };
  });

  const chartConfig = {
    balance: {
      label: "Saldo",
      color: "hsl(var(--chart-1))",
    },
    income: {
      label: "Receitas",
      color: "hsl(var(--chart-2))",
    },
    expenses: {
      label: "Despesas", 
      color: "hsl(var(--chart-3))",
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{data.fullMonth}</p>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-muted-foreground">Receitas:</span>
              <span className="text-xs font-medium text-green-600">
                {formatCurrency(data.income)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-muted-foreground">Despesas:</span>
              <span className="text-xs font-medium text-red-600">
                {formatCurrency(data.expenses)}
              </span>
            </div>
            <hr className="my-1" />
            <div className="flex justify-between gap-4">
              <span className="text-xs font-medium">Saldo:</span>
              <span className={`text-xs font-medium ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.balance)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="px-3 md:px-6 py-3 md:py-6">
        <CardTitle className="text-sm md:text-lg">Receitas vs Despesas</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Saldo mensal da carteira (últimos 12 meses)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        {isLoading ? (
          <div className="h-64 md:h-[300px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-64 md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCurrency}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <ChartTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-balance)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-balance)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-64 md:h-[300px] flex items-center justify-center">
            <p className="text-xs md:text-sm text-muted-foreground text-center">
              Nenhuma transação financeira encontrada
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
