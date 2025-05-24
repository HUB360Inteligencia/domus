
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Property, PropertyType } from '@/types/property';

interface PropertyTypeChartProps {
  properties: Property[];
  isLoading: boolean;
}

const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: 'Apartamentos',
  house: 'Casas',
  commercial: 'Comerciais',
  land: 'Terrenos',
  rural: 'Rurais'
};

export function PropertyTypeChart({ properties, isLoading }: PropertyTypeChartProps) {
  const propertyTypeData = properties.reduce((acc: { [key in PropertyType]: number }, property) => {
    const type = property.type as PropertyType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {
    apartment: 0,
    house: 0,
    commercial: 0,
    land: 0,
    rural: 0,
  });

  // Filter out types with 0 properties
  const chartData = Object.entries(propertyTypeData)
    .filter(([_, value]) => value > 0)
    .map(([type, value]) => ({
      type: propertyTypeLabels[type as PropertyType],
      count: value,
    }));

  const chartConfig = {
    count: {
      label: "Quantidade",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader className="px-3 md:px-6 py-3 md:py-6">
        <CardTitle className="text-sm md:text-lg">Tipos de Imóveis</CardTitle>
        <CardDescription className="text-xs md:text-sm">Distribuição dos tipos de imóveis cadastrados</CardDescription>
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        {isLoading ? (
          <div className="h-48 md:h-[250px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-48 md:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="horizontal"
                margin={{
                  top: 5,
                  right: 30,
                  left: 60,
                  bottom: 5,
                }}
              >
                <XAxis type="number" />
                <YAxis 
                  dataKey="type" 
                  type="category" 
                  width={60}
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-48 md:h-[250px] flex items-center justify-center">
            <p className="text-xs md:text-sm text-muted-foreground text-center">
              Nenhum imóvel cadastrado ainda
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
