
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePropertyFinancial } from '@/hooks/use-property-financial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { PropertyFinancialData } from '@/types/property';
import { Loader2, RefreshCw } from 'lucide-react';

interface PropertyRoiReportSectionProps {
  propertyId: string;
}

export const PropertyRoiReportSection: React.FC<PropertyRoiReportSectionProps> = ({ propertyId }) => {
  const [activeTab, setActiveTab] = useState('monthly');
  
  const { 
    financialData, 
    monthlyReportData,
    roiComparisonData,
    isLoading,
    isCalculating,
    calculateFinancial,
    refreshFinancialData
  } = usePropertyFinancial(propertyId);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  const renderFinancialOverview = (data: PropertyFinancialData | undefined) => {
    if (!data) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Valor de Mercado Atual</p>
            <div className="text-2xl font-bold">{formatCurrency(data.marketValue)}</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Investido</p>
            <div className="text-2xl font-bold">{formatCurrency(data.totalInvestment)}</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Lucro Total</p>
            <div className={`text-2xl font-bold ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.totalProfit)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Renda Mensal Líquida</p>
            <div className="text-2xl font-bold">{formatCurrency(data.monthlyNetIncome)}</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Taxa de Retorno Mensal</p>
            <div className="text-2xl font-bold">{formatPercent(data.monthlyNetReturn)}</div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Valorização Acumulada</p>
            <div className={`text-2xl font-bold ${data.accumulatedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(data.accumulatedROI)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderMonthlyChart = () => {
    if (!monthlyReportData || monthlyReportData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Não há dados financeiros mensais disponíveis para este imóvel.</p>
        </div>
      );
    }
    
    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyReportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label: string) => `Período: ${label}`}
            />
            <Legend />
            <Bar dataKey="income" name="Receitas" fill="#22c55e" />
            <Bar dataKey="expenses" name="Despesas" fill="#ef4444" />
            <Bar dataKey="profit" name="Lucro" fill="#3b82f6" />
            <ReferenceLine y={0} stroke="#000" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderRoiComparisonChart = () => {
    if (!roiComparisonData || roiComparisonData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Não há dados de ROI disponíveis para este imóvel.</p>
        </div>
      );
    }
    
    return (
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={roiComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} />
            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === 'value') return formatCurrency(value);
                if (name === 'roi') return `${value}%`;
                return value;
              }}
              labelFormatter={(label: string) => `Data: ${label}`}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="value"
              name="Valor do Imóvel"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roi"
              name="ROI Acumulado (%)"
              stroke="#82ca9d"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <h3 className="text-lg font-semibold">Análise de ROI</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshFinancialData()}
            disabled={isLoading || isCalculating}
          >
            {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar Dados
          </Button>
        </div>
        
        {isLoading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </>
        ) : (
          <>
            {renderFinancialOverview(financialData)}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="monthly">Análise Mensal</TabsTrigger>
                <TabsTrigger value="roi">Evolução do ROI</TabsTrigger>
              </TabsList>
              
              <TabsContent value="monthly" className="mt-0">
                {renderMonthlyChart()}
              </TabsContent>
              
              <TabsContent value="roi" className="mt-0">
                {renderRoiComparisonChart()}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};
