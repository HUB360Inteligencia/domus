
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { useTheme } from "@/components/theme-provider";

interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

interface OverviewChartProps {
  data: ChartData[];
  title?: string;
}

export function OverviewChart({ data, title = "Visão Financeira" }: OverviewChartProps) {
  const { theme } = useTheme();
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    });
  };

  const tooltipStyle = {
    backgroundColor: theme === "dark" ? "#1c1c1c" : "#ffffff",
    border: "none",
    borderRadius: "0.375rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    padding: "0.75rem",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#eee"} />
              <XAxis 
                dataKey="name" 
                stroke={theme === "dark" ? "#888" : "#666"}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke={theme === "dark" ? "#888" : "#666"}
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={formatCurrency}
                contentStyle={tooltipStyle}
                labelStyle={{ 
                  color: theme === "dark" ? "#fff" : "#000",
                  fontWeight: "bold",
                  marginBottom: "0.5rem"
                }}
              />
              <Legend />
              <Bar 
                dataKey="income" 
                name="Receita" 
                fill="#0A5B6C" 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="expenses" 
                name="Despesas" 
                fill="#888888" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
