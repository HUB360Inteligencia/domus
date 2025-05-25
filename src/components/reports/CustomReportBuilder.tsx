
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Download, Plus, Save, Settings } from 'lucide-react';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useContracts } from '@/hooks/use-contracts';
import { toast } from '@/hooks/use-toast';

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'currency';
  category: string;
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

const availableFields: ReportField[] = [
  { id: 'property_title', name: 'Título do Imóvel', type: 'text', category: 'Propriedade' },
  { id: 'property_type', name: 'Tipo', type: 'text', category: 'Propriedade' },
  { id: 'property_value', name: 'Valor', type: 'currency', category: 'Propriedade' },
  { id: 'property_area', name: 'Área (m²)', type: 'number', category: 'Propriedade' },
  { id: 'property_city', name: 'Cidade', type: 'text', category: 'Propriedade' },
  { id: 'property_status', name: 'Status', type: 'text', category: 'Propriedade' },
  { id: 'monthly_income', name: 'Receita Mensal', type: 'currency', category: 'Financeiro' },
  { id: 'monthly_expenses', name: 'Despesas Mensais', type: 'currency', category: 'Financeiro' },
  { id: 'roi', name: 'ROI (%)', type: 'number', category: 'Financeiro' },
  { id: 'contract_value', name: 'Valor do Contrato', type: 'currency', category: 'Contratos' },
  { id: 'contract_start', name: 'Início do Contrato', type: 'date', category: 'Contratos' },
  { id: 'contract_end', name: 'Fim do Contrato', type: 'date', category: 'Contratos' },
  { id: 'tenant_name', name: 'Nome do Inquilino', type: 'text', category: 'Inquilino' },
];

export function CustomReportBuilder() {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [reportName, setReportName] = useState('');
  const [groupBy, setGroupBy] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);

  const { properties } = useProperties();
  const { transactions } = useFinancialTransactions();
  const { contracts } = useContracts();

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const addFilter = () => {
    setFilters(prev => [...prev, { field: '', operator: 'equals', value: '' }]);
  };

  const updateFilter = (index: number, key: keyof ReportFilter, value: string) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, [key]: value } : filter
    ));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const generateReport = () => {
    if (!properties || !transactions || !contracts) {
      toast({
        title: "Erro",
        description: "Dados não carregados. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    // Combinar dados de propriedades, transações e contratos
    const combinedData = properties.map(property => {
      const propertyTransactions = transactions.filter(t => t.property_id === property.id);
      const propertyContracts = contracts.filter(c => c.property_id === property.id);
      const activeContract = propertyContracts.find(c => c.status === 'active');

      const monthlyIncome = propertyTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpenses = propertyTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const roi = monthlyExpenses > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyExpenses) * 100 : 0;

      return {
        property_title: property.title,
        property_type: property.type,
        property_value: property.value,
        property_area: property.area,
        property_city: property.city,
        property_status: property.status,
        monthly_income: monthlyIncome,
        monthly_expenses: monthlyExpenses,
        roi: roi,
        contract_value: activeContract?.value || 0,
        contract_start: activeContract?.start_date || '',
        contract_end: activeContract?.end_date || '',
        tenant_name: activeContract?.tenant_name || property.tenant_name || '',
      };
    });

    // Aplicar filtros
    let filteredData = combinedData;
    filters.forEach(filter => {
      if (filter.field && filter.value) {
        filteredData = filteredData.filter(item => {
          const fieldValue = String(item[filter.field as keyof typeof item] || '').toLowerCase();
          const filterValue = filter.value.toLowerCase();

          switch (filter.operator) {
            case 'contains':
              return fieldValue.includes(filterValue);
            case 'equals':
              return fieldValue === filterValue;
            case 'greater':
              return Number(fieldValue) > Number(filterValue);
            case 'less':
              return Number(fieldValue) < Number(filterValue);
            default:
              return true;
          }
        });
      }
    });

    // Selecionar apenas os campos escolhidos
    const reportResult = filteredData.map(item => {
      const result: any = {};
      selectedFields.forEach(field => {
        result[field] = item[field as keyof typeof item];
      });
      return result;
    });

    setReportData(reportResult);
    
    toast({
      title: "Relatório Gerado",
      description: `Relatório gerado com ${reportResult.length} registros.`,
    });

    console.log('Dados do relatório:', {
      fields: selectedFields,
      filters,
      dateRange,
      groupBy,
      reportName,
      data: reportResult
    });
  };

  const exportReport = (format: 'pdf' | 'excel') => {
    if (reportData.length === 0) {
      toast({
        title: "Erro",
        description: "Gere o relatório primeiro antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    // Aqui seria implementada a lógica real de exportação
    toast({
      title: "Exportação Iniciada",
      description: `Iniciando exportação do relatório em formato ${format.toUpperCase()}.`,
    });
    
    console.log(`Exportando relatório como ${format}`, reportData);
  };

  const saveTemplate = () => {
    if (!reportName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o template.",
        variant: "destructive",
      });
      return;
    }

    // Aqui seria implementada a lógica real de salvamento
    toast({
      title: "Template Salvo",
      description: `Template "${reportName}" salvo com sucesso.`,
    });
    
    console.log('Salvando template:', {
      name: reportName,
      fields: selectedFields,
      filters,
      groupBy
    });
  };

  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ReportField[]>);

  // Filter valid fields to ensure no empty IDs
  const validAvailableFields = availableFields.filter(field => 
    field.id && 
    typeof field.id === 'string' && 
    field.id.trim() !== '' &&
    field.name &&
    typeof field.name === 'string' &&
    field.name.trim() !== ''
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Construtor de Relatórios Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nome do Relatório */}
          <div>
            <Label htmlFor="reportName">Nome do Relatório</Label>
            <Input
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Ex: Relatório Mensal de Propriedades"
            />
          </div>

          {/* Seleção de Campos */}
          <div>
            <Label className="text-base font-medium">Campos do Relatório</Label>
            <div className="mt-2 space-y-4">
              {Object.entries(fieldsByCategory).map(([category, fields]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {fields
                      .filter(field => 
                        field.id && 
                        typeof field.id === 'string' && 
                        field.id.trim() !== '' &&
                        field.name &&
                        typeof field.name === 'string' &&
                        field.name.trim() !== ''
                      )
                      .map((field) => (
                        <div key={field.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.id}
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={() => handleFieldToggle(field.id)}
                          />
                          <Label htmlFor={field.id} className="text-sm">{field.name}</Label>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Período */}
          <div>
            <Label className="text-base font-medium">Período</Label>
            <div className="mt-2">
              <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            </div>
          </div>

          {/* Agrupamento */}
          <div>
            <Label htmlFor="groupBy">Agrupar Por</Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um campo para agrupamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem agrupamento</SelectItem>
                <SelectItem value="property_type">Tipo de Propriedade</SelectItem>
                <SelectItem value="property_city">Cidade</SelectItem>
                <SelectItem value="property_status">Status</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">Filtros</Label>
              <Button variant="outline" size="sm" onClick={addFilter}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Filtro
              </Button>
            </div>
            
            {filters.map((filter, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Select 
                  value={filter.field} 
                  onValueChange={(value) => updateFilter(index, 'field', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {validAvailableFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filter.operator} 
                  onValueChange={(value) => updateFilter(index, 'operator', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Igual a</SelectItem>
                    <SelectItem value="contains">Contém</SelectItem>
                    <SelectItem value="greater">Maior que</SelectItem>
                    <SelectItem value="less">Menor que</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  placeholder="Valor"
                  className="flex-1"
                />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => removeFilter(index)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={generateReport} disabled={selectedFields.length === 0}>
              Gerar Relatório
            </Button>
            <Button variant="outline" onClick={saveTemplate} disabled={!reportName}>
              <Save className="h-4 w-4 mr-1" />
              Salvar Template
            </Button>
            <Button variant="outline" onClick={() => exportReport('pdf')}>
              <Download className="h-4 w-4 mr-1" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport('excel')}>
              <Download className="h-4 w-4 mr-1" />
              Exportar Excel
            </Button>
          </div>

          {/* Resultado do Relatório */}
          {reportData.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Dados do Relatório ({reportData.length} registros)</h3>
              <div className="max-h-64 overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedFields.map(field => (
                        <th key={field} className="px-3 py-2 text-left border-b">
                          {availableFields.find(f => f.id === field)?.name || field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b">
                        {selectedFields.map(field => (
                          <td key={field} className="px-3 py-2">
                            {typeof row[field] === 'number' && field.includes('value') 
                              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row[field])
                              : String(row[field] || '-')
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.length > 10 && (
                  <div className="p-2 text-center text-gray-500 text-xs">
                    Mostrando 10 de {reportData.length} registros
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
