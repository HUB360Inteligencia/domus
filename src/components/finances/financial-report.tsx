import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileIcon, 
  DownloadIcon,
  PieChartIcon,
  BarChartIcon,
  TableIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { FinancialFilters } from './financial-filters';
import { generateFinancialReport } from '@/api/financial-transactions';
import { useFinancialAnalytics, useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useProperties } from '@/hooks/use-properties';
import { FinancialReportFilters } from '@/types/financial';

export const FinancialReport = () => {
  const [filters, setFilters] = useState<FinancialReportFilters>({});
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: transactions, isLoading: isLoadingTransactions } = useFinancialTransactions(filters);
  const { data: analytics, isLoading: isLoadingAnalytics } = useFinancialAnalytics(filters);
  const { properties } = useProperties();

  const handleFilterChange = (newFilters: FinancialReportFilters) => {
    setFilters(newFilters);
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      // Preparar dados para o relatório
      const reportData = {
        title: 'Relatório Financeiro',
        filters: {
          startDate: filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy') : 'Início dos registros',
          endDate: filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy') : 'Hoje',
          properties: filters.propertyIds?.length
            ? filters.propertyIds.map(id => {
                const property = properties?.find(p => p.id === id);
                return property ? property.title : 'Imóvel desconhecido';
              })
            : ['Todos os imóveis'],
          transactionTypes: filters.transactionTypes?.length
            ? filters.transactionTypes.map(type => type === 'income' ? 'Receitas' : 'Despesas')
            : ['Todas as transações'],
        },
        analytics: analytics,
        transactions: transactions,
        generatedAt: format(new Date(), 'dd/MM/yyyy HH:mm'),
      };
      
      // Gerar e baixar o relatório
      const blob = await generateFinancialReport(reportFormat, reportData, 'Relatório Financeiro');
      
      // Criar um link para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.${reportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar Relatório Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs>
          <TabsList>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
            <TabsTrigger value="report">Relatório</TabsTrigger>
          </TabsList>
          <TabsContent value="filters">
            <FinancialFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
          <TabsContent value="report">
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="flex gap-2"
              >
                {isGenerating ? 'Gerando relatório...' : 'Gerar e Baixar Relatório'}
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
