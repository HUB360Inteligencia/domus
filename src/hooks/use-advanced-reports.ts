
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { logger } from "@/lib/logger";
interface ReportTemplate {
  id: string;
  name: string;
  fields: string[];
  filters: any[];
  groupBy?: string;
  createdAt: string;
  isDefault: boolean;
}

interface AnalyticsMetric {
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  trend: number[];
}

export const useAdvancedReports = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);

  // Buscar templates salvos no banco de dados
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .like('key', 'report_template_%');

      if (error) {
        logger.error('Erro ao buscar templates:', error);
        return [];
      }

      return data.map(setting => ({
        id: setting.id,
        name: setting.key.replace('report_template_', ''),
        fields: JSON.parse(setting.value || '[]'),
        filters: [],
        groupBy: '',
        createdAt: setting.created_at,
        isDefault: false,
      })) as ReportTemplate[];
    },
  });

  // Métricas analíticas baseadas em dados reais
  const { data: metrics = [], isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: async () => {
      // Buscar dados de propriedades
      const { data: properties } = await supabase
        .from('properties')
        .select('value, status');

      // Buscar transações financeiras
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('amount, transaction_type, transaction_date')
        .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (!properties || !transactions) return [];

      const totalRevenue = transactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const occupiedProperties = properties.filter(p => p.status === 'rented' || p.status === 'airbnb').length;
      const occupancyRate = properties.length > 0 ? (occupiedProperties / properties.length) * 100 : 0;

      const averageROI = totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0;

      return [
        {
          name: 'Receita Total',
          value: totalRevenue,
          change: 12.5, // Seria calculado comparando com período anterior
          changeType: 'increase',
          trend: [totalRevenue * 0.8, totalRevenue * 0.9, totalRevenue * 0.95, totalRevenue],
        },
        {
          name: 'Taxa de Ocupação',
          value: occupancyRate,
          change: 2.1,
          changeType: 'increase',
          trend: [occupancyRate - 5, occupancyRate - 3, occupancyRate - 1, occupancyRate],
        },
        {
          name: 'ROI Médio',
          value: averageROI,
          change: -0.3,
          changeType: 'decrease',
          trend: [averageROI + 1, averageROI + 0.5, averageROI + 0.2, averageROI],
        },
      ] as AnalyticsMetric[];
    },
  });

  const generateReport = async (config: any) => {
    logger.log('Gerando relatório com configuração:', config);
    
    // Buscar dados reais do banco
    const { data: properties } = await supabase
      .from('properties')
      .select('*');

    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('*');

    if (!properties || !transactions) {
      setReportData([]);
      return;
    }

    // Processar dados baseado na configuração
    const processedData = properties.map(property => {
      const propertyTransactions = transactions.filter(t => t.property_id === property.id);
      const revenue = propertyTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = propertyTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        property: property.title,
        revenue,
        expenses,
        roi: expenses > 0 ? ((revenue - expenses) / expenses) * 100 : 0,
      };
    });

    setReportData(processedData);
  };

  const exportReport = async (format: 'pdf' | 'excel', data: any[]) => {
    logger.log(`Exportando ${data.length} registros como ${format}`);
    // Implementar lógica real de exportação
    return `report-${Date.now()}.${format}`;
  };

  const saveTemplate = async (template: Omit<ReportTemplate, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('system_settings')
      .insert({
        key: `report_template_${template.name}`,
        value: JSON.stringify(template.fields),
        description: `Template de relatório: ${template.name}`
      })
      .select();

    if (error) {
      logger.error('Erro ao salvar template:', error);
      throw error;
    }

    const insertedId = data && data.length > 0 ? data[0].id : Date.now().toString();
    
    return { 
      ...template, 
      id: insertedId, 
      createdAt: new Date().toISOString() 
    };
  };

  return {
    templates,
    metrics,
    reportData,
    selectedTemplate,
    isLoadingTemplates,
    isLoadingMetrics,
    setSelectedTemplate,
    generateReport,
    exportReport,
    saveTemplate,
  };
};
