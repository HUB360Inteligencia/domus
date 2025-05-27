
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Save, Plus, X, Filter } from 'lucide-react';
import { useAdvancedReports } from '@/hooks/use-advanced-reports';
import { toast } from 'sonner';

export function CustomReportBuilder() {
  const { 
    templates, 
    reportData, 
    generateReport, 
    exportReport, 
    saveTemplate, 
    isLoadingTemplates 
  } = useAdvancedReports();

  const [reportConfig, setReportConfig] = useState({
    name: '',
    fields: [] as string[],
    filters: [],
    groupBy: '',
    dateRange: { start: '', end: '' }
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const availableFields = [
    { id: 'property', label: 'Propriedade', category: 'Imóveis' },
    { id: 'value', label: 'Valor', category: 'Financeiro' },
    { id: 'rental_value', label: 'Valor de Aluguel', category: 'Financeiro' },
    { id: 'revenue', label: 'Receita', category: 'Financeiro' },
    { id: 'expenses', label: 'Despesas', category: 'Financeiro' },
    { id: 'roi', label: 'ROI (%)', category: 'Financeiro' },
    { id: 'status', label: 'Status', category: 'Imóveis' },
    { id: 'type', label: 'Tipo', category: 'Imóveis' },
    { id: 'city', label: 'Cidade', category: 'Localização' },
    { id: 'neighborhood', label: 'Bairro', category: 'Localização' }
  ];

  const handleFieldToggle = (fieldId: string) => {
    setReportConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter(f => f !== fieldId)
        : [...prev.fields, fieldId]
    }));
  };

  const handleGenerateReport = async () => {
    if (reportConfig.fields.length === 0) {
      toast.error('Selecione pelo menos um campo para o relatório');
      return;
    }

    setIsGenerating(true);
    try {
      await generateReport(reportConfig);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!reportConfig.name) {
      toast.error('Digite um nome para o template');
      return;
    }

    try {
      await saveTemplate({
        name: reportConfig.name,
        fields: reportConfig.fields,
        filters: reportConfig.filters,
        groupBy: reportConfig.groupBy,
        isDefault: false
      });
      toast.success('Template salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar template');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (reportData.length === 0) {
      toast.error('Gere um relatório primeiro antes de exportar');
      return;
    }

    try {
      const filename = await exportReport(format, reportData);
      toast.success(`Relatório exportado como ${filename}`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  };

  const groupedFields = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof availableFields>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Construtor de Relatórios Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nome do Relatório */}
          <div className="space-y-2">
            <Label htmlFor="report-name">Nome do Relatório</Label>
            <Input
              id="report-name"
              placeholder="Ex: Relatório Mensal de Receitas"
              value={reportConfig.name}
              onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Seleção de Campos */}
          <div className="space-y-4">
            <Label>Campos a Incluir no Relatório</Label>
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={reportConfig.fields.includes(field.id)}
                        onCheckedChange={() => handleFieldToggle(field.id)}
                      />
                      <Label htmlFor={field.id} className="text-sm">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Campos Selecionados */}
          {reportConfig.fields.length > 0 && (
            <div className="space-y-2">
              <Label>Campos Selecionados</Label>
              <div className="flex flex-wrap gap-2">
                {reportConfig.fields.map((fieldId) => {
                  const field = availableFields.find(f => f.id === fieldId);
                  return (
                    <Badge key={fieldId} variant="secondary" className="flex items-center gap-1">
                      {field?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFieldToggle(fieldId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Filtros de Data */}
          <div className="space-y-4">
            <Label>Período (Opcional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-sm">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={reportConfig.dateRange.start}
                  onChange={(e) => setReportConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={reportConfig.dateRange.end}
                  onChange={(e) => setReportConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating || reportConfig.fields.length === 0}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>

            <Button 
              variant="outline" 
              onClick={handleSaveTemplate}
              disabled={!reportConfig.name || reportConfig.fields.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Template
            </Button>

            {reportData.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('excel')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar Excel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates Salvos */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Templates Salvos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.fields.length} campos selecionados
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setReportConfig(prev => ({
                        ...prev,
                        fields: template.fields,
                        name: template.name
                      }))}
                    >
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado do Relatório */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {reportConfig.fields.map((fieldId) => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return (
                        <th key={fieldId} className="border border-gray-200 px-4 py-2 text-left">
                          {field?.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {reportConfig.fields.map((fieldId) => (
                        <td key={fieldId} className="border border-gray-200 px-4 py-2">
                          {typeof row[fieldId] === 'number' ? 
                            fieldId.includes('value') || fieldId.includes('revenue') || fieldId.includes('expenses') ? 
                              `R$ ${row[fieldId].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                              fieldId === 'roi' ?
                                `${row[fieldId].toFixed(2)}%` :
                                row[fieldId] :
                            row[fieldId] || '-'
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {reportData.length} registro(s) encontrado(s)
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
