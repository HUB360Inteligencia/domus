
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@/types/property';
import { CHART_COLORS, formatCurrency } from '@/utils/financial-formatters';

interface PropertyValueChartProps {
  properties: Property[];
  totalValue: number;
}

export const PropertyValueChart = ({ properties, totalValue }: PropertyValueChartProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Valor Total do Patrimônio: {formatCurrency(totalValue || 0)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <div className="h-60">
          {properties.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={properties.map(p => ({ 
                    name: p.title || 'Sem título',
                    value: Number(p.value) || 0
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {properties.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhum imóvel com valor registrado</p>
            </div>
          )}
        </div>
        <div className="space-y-1">
          {properties.map((property, index) => (
            <div key={property.id} className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span>{property.title || 'Sem título'}</span>
              </div>
              <span>{formatCurrency(Number(property.value) || 0)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
