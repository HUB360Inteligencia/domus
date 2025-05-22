
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from "recharts";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

// Dados mockados para o dashboard
const assetValueData = {
  acquisition: 'R$ 2.850.000,00',
  current: 'R$ 3.245.000,00',
  growthPercentage: 13.8
};

const performanceData = {
  monthlyAverage: '1,2%',
  previousMonth: {
    percentage: '1,5%',
    value: 'R$ 48.675,00',
    trend: 'up' as const
  },
  occupancyRate: '92%'
};

// Top 5 propriedades
const topPropertiesData = [
  { id: '1', name: 'Apartamento Jardins', type: 'Residencial', location: 'Jardins, São Paulo', return: 2450.00, percentage: 1.8 },
  { id: '2', name: 'Sala Comercial Paulista', type: 'Comercial', location: 'Av. Paulista, São Paulo', return: 3600.00, percentage: 1.5 },
  { id: '3', name: 'Casa Airbnb Campos do Jordão', type: 'Airbnb', location: 'Campos do Jordão, SP', return: 4200.00, percentage: 2.3 },
  { id: '4', name: 'Loja Shopping Vila Olímpia', type: 'Comercial', location: 'Vila Olímpia, São Paulo', return: 3100.00, percentage: 1.4 },
  { id: '5', name: 'Apartamento Vila Mariana', type: 'Residencial', location: 'Vila Mariana, São Paulo', return: 1950.00, percentage: 1.2 }
];

// Dados por bairro
const neighborhoodData = [
  { id: '1', name: 'Jardins', averageReturn: 1.8, totalReturn: 7350.00, properties: 3 },
  { id: '2', name: 'Vila Olímpia', averageReturn: 1.6, totalReturn: 6200.00, properties: 2 },
  { id: '3', name: 'Itaim Bibi', averageReturn: 1.5, totalReturn: 4900.00, properties: 2 },
  { id: '4', name: 'Pinheiros', averageReturn: 1.4, totalReturn: 3800.00, properties: 2 },
  { id: '5', name: 'Vila Mariana', averageReturn: 1.3, totalReturn: 3500.00, properties: 1 }
];

// Dados para gráfico de valorização patrimonial
const assetGrowthData = [
  { month: 'Jan', value: 2850000, acquisition: 2650000 },
  { month: 'Fev', value: 2865000, acquisition: 2650000 },
  { month: 'Mar', value: 2890000, acquisition: 2650000 },
  { month: 'Abr', value: 2910000, acquisition: 2650000 },
  { month: 'Mai', value: 2950000, acquisition: 2700000 },
  { month: 'Jun', value: 2980000, acquisition: 2700000 },
  { month: 'Jul', value: 3050000, acquisition: 2750000 },
  { month: 'Ago', value: 3100000, acquisition: 2750000 },
  { month: 'Set', value: 3150000, acquisition: 2850000 },
  { month: 'Out', value: 3180000, acquisition: 2850000 },
  { month: 'Nov', value: 3220000, acquisition: 2850000 },
  { month: 'Dez', value: 3245000, acquisition: 2850000 }
];

// Dados para gráfico de ROI por tipo de imóvel
const roiByPropertyType = [
  { type: 'Airbnb', roi: 2.3 },
  { type: 'Comercial', roi: 1.5 },
  { type: 'Residencial', roi: 1.2 },
  { type: 'Galpão', roi: 0.9 },
  { type: 'Terreno', roi: 0.5 }
];

export default function FinanceDashboardPage() {
  const { theme } = useTheme();
  const [showMarketValue, setShowMarketValue] = useState(true);
  const [propertyRankingType, setPropertyRankingType] = useState<'value' | 'percentage'>('value');
  const [neighborhoodRankingType, setNeighborhoodRankingType] = useState<'value' | 'percentage'>('value');
  
  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Formatação de percentuais
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Define cores com base no tema
  const primaryColor = theme === 'dark' ? '#3ABAB4' : '#0A5B6C';
  const secondaryColor = theme === 'dark' ? '#2D3748' : '#94A3B8';
  const tertiaryColor = theme === 'dark' ? '#4C1D95' : '#7C3AED';

  // Tooltip customizado para os gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-2 shadow-lg text-xs">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Estilo para o gráfico de barras ROI
  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width + 5}
        y={y + 15}
        fill={theme === 'dark' ? '#E2E8F0' : '#334155'}
        fontSize={12}
        textAnchor="start"
      >
        {formatPercentage(value)}
      </text>
    );
  };

  return (
    <div className="container py-6">
      <PageHeader 
        title="Painel Financeiro" 
        description="Visão geral do seu patrimônio e rendimentos"
      />
      
      {/* Cards de Indicadores-Chave (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="backdrop-blur-sm border-opacity-40 hover:shadow-lg transition-all duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Valor do Patrimônio</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Aquisição</span>
                <Switch 
                  checked={showMarketValue} 
                  onCheckedChange={setShowMarketValue} 
                />
                <span className="text-xs text-muted-foreground">Mercado</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary">
              {showMarketValue ? assetValueData.current : assetValueData.acquisition}
            </p>
            {showMarketValue && (
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {assetValueData.growthPercentage}%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">vs. valor de aquisição</span>
              </div>
            )}
          </CardContent>
        </Card>

        <StatsCard
          title="Rentabilidade Mensal Média"
          value={performanceData.monthlyAverage}
          description="Média dos últimos 12 meses"
          icon={TrendingUp}
          iconColor="text-primary"
        />

        <Card className="backdrop-blur-sm border-opacity-40 hover:shadow-lg transition-all duration-200">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground">Rentabilidade Mês Anterior</h3>
            <p className="text-2xl font-bold">
              {performanceData.previousMonth.percentage}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">{performanceData.previousMonth.value}</span>
              {performanceData.previousMonth.trend === 'up' ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  0.3%
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  0.2%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <StatsCard
          title="Taxa de Ocupação"
          value={performanceData.occupancyRate}
          description="Imóveis alugados vs. total"
          icon={Building}
          iconColor="text-primary"
        />
      </div>

      {/* Gráficos e Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de Valorização Patrimonial */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-sm border-opacity-40">
            <CardHeader>
              <CardTitle className="text-xl">Valorização Patrimonial</CardTitle>
              <CardDescription>Últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={assetGrowthData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#eee"} opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={theme === "dark" ? "#888" : "#666"} />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 12 }}
                    stroke={theme === "dark" ? "#888" : "#666"}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="acquisition"
                    stroke={secondaryColor}
                    strokeWidth={2}
                    dot={false}
                    name="Valor de Aquisição"
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={primaryColor}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1, stroke: primaryColor, fill: "white" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: primaryColor }}
                    name="Valor de Mercado"
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    fill={primaryColor}
                    fillOpacity={0.1}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de ROI por Tipo de Imóvel */}
        <div>
          <Card className="backdrop-blur-sm border-opacity-40 h-full">
            <CardHeader>
              <CardTitle className="text-xl">ROI por Tipo de Imóvel</CardTitle>
              <CardDescription>Rentabilidade média mensal (%)</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roiByPropertyType}
                  layout="vertical"
                  margin={{ top: 5, right: 45, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === "dark" ? "#333" : "#eee"} opacity={0.5} />
                  <XAxis 
                    type="number" 
                    domain={[0, 'dataMax']} 
                    tick={{ fontSize: 12 }}
                    stroke={theme === "dark" ? "#888" : "#666"}
                    tickFormatter={formatPercentage}
                  />
                  <YAxis 
                    dataKey="type" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    stroke={theme === "dark" ? "#888" : "#666"}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${formatPercentage(value)}`, 'ROI Mensal']}
                    cursor={{ fill: theme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  />
                  <Bar 
                    dataKey="roi" 
                    fill={tertiaryColor}
                    radius={[0, 4, 4, 0]}
                    label={<CustomBarLabel />}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rankings Estratégicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Propriedades */}
        <Card className="backdrop-blur-sm border-opacity-40">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Top 5 Propriedades</CardTitle>
              <div className="flex gap-2">
                <TabsList className="h-8">
                  <TabsTrigger 
                    className="text-xs px-3 h-7" 
                    value="value" 
                    onClick={() => setPropertyRankingType('value')}
                    data-state={propertyRankingType === 'value' ? 'active' : ''}
                  >
                    Valor (R$)
                  </TabsTrigger>
                  <TabsTrigger 
                    className="text-xs px-3 h-7" 
                    value="percentage" 
                    onClick={() => setPropertyRankingType('percentage')}
                    data-state={propertyRankingType === 'percentage' ? 'active' : ''}
                  >
                    Percentual (%)
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <CardDescription>Propriedades com maior rentabilidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPropertiesData
                .sort((a, b) => 
                  propertyRankingType === 'value' 
                    ? b.return - a.return 
                    : b.percentage - a.percentage
                )
                .map((property, index) => (
                  <div key={property.id} className="flex items-center">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <p className="font-medium">{property.name}</p>
                        <p className="font-semibold">
                          {propertyRankingType === 'value' 
                            ? `R$ ${property.return.toFixed(2).replace('.', ',')}`
                            : `${property.percentage.toFixed(1)}%`
                          }
                        </p>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{property.type} • {property.location}</span>
                        <span>
                          {propertyRankingType === 'value' 
                            ? `${property.percentage.toFixed(1)}%`
                            : `R$ ${property.return.toFixed(2).replace('.', ',')}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        {/* Ranking por Bairro */}
        <Card className="backdrop-blur-sm border-opacity-40">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Rentabilidade por Bairro</CardTitle>
              <div className="flex gap-2">
                <TabsList className="h-8">
                  <TabsTrigger 
                    className="text-xs px-3 h-7" 
                    value="value" 
                    onClick={() => setNeighborhoodRankingType('value')}
                    data-state={neighborhoodRankingType === 'value' ? 'active' : ''}
                  >
                    Valor (R$)
                  </TabsTrigger>
                  <TabsTrigger 
                    className="text-xs px-3 h-7" 
                    value="percentage" 
                    onClick={() => setNeighborhoodRankingType('percentage')}
                    data-state={neighborhoodRankingType === 'percentage' ? 'active' : ''}
                  >
                    Percentual (%)
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <CardDescription>Bairros com melhor desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {neighborhoodData
                .sort((a, b) => 
                  neighborhoodRankingType === 'value' 
                    ? b.totalReturn - a.totalReturn 
                    : b.averageReturn - a.averageReturn
                )
                .map((neighborhood, index) => (
                  <div key={neighborhood.id} className="flex items-center">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <p className="font-medium">{neighborhood.name}</p>
                        <p className="font-semibold">
                          {neighborhoodRankingType === 'value' 
                            ? `R$ ${neighborhood.totalReturn.toFixed(2).replace('.', ',')}`
                            : `${neighborhood.averageReturn.toFixed(1)}%`
                          }
                        </p>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{neighborhood.properties} imóveis</span>
                        <span>
                          {neighborhoodRankingType === 'value' 
                            ? `${neighborhood.averageReturn.toFixed(1)}%`
                            : `R$ ${neighborhood.totalReturn.toFixed(2).replace('.', ',')}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
