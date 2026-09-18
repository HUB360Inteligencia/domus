import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Filter, Loader2, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  formatReportCell,
  REPORT_FIELDS,
  ReportConfig,
  useAdvancedReports,
} from '@/hooks/use-advanced-reports';
import { cn } from '@/lib/utils';

const DEFAULT_FIELDS = ['property', 'revenue', 'expenses', 'net', 'roi'];

export function CustomReportBuilder() {
  const { templates, reportData, generateReport, exportReport, saveTemplate, deleteTemplate } = useAdvancedReports();

  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    fields: DEFAULT_FIELDS,
    dateRange: { start: '', end: '' },
  });
  const [generatedFields, setGeneratedFields] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFieldToggle = (fieldId: string) => {
    setReportConfig((prev) => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter((f) => f !== fieldId)
        : // mantém a ordem do catálogo de campos
          REPORT_FIELDS.map((field) => field.id as string).filter((id) => id === fieldId || prev.fields.includes(id)),
    }));
  };

  const handleGenerateReport = async () => {
    if (reportConfig.fields.length === 0) {
      toast.error('Selecione pelo menos um campo para o relatório');
      return;
    }
    if (reportConfig.dateRange.start && reportConfig.dateRange.end && reportConfig.dateRange.start > reportConfig.dateRange.end) {
      toast.error('A data inicial precisa ser anterior à data final');
      return;
    }

    setIsGenerating(true);
    try {
      const rows = await generateReport(reportConfig);
      setGeneratedFields(reportConfig.fields);
      toast.success(`Relatório gerado com ${rows.length} imóve${rows.length === 1 ? 'l' : 'is'}`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!reportConfig.name.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }
    try {
      saveTemplate(reportConfig.name, reportConfig.fields);
      toast.success('Template salvo');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar template');
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    try {
      exportReport(format, { ...reportConfig, fields: generatedFields });
      toast.success(format === 'excel' ? 'Planilha baixada' : 'Abrindo impressão — escolha "Salvar como PDF"');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar relatório');
    }
  };

  const groupedFields = REPORT_FIELDS.reduce((acc, field) => {
    (acc[field.category] ||= []).push(field);
    return acc;
  }, {} as Record<string, (typeof REPORT_FIELDS)[number][]>);

  const fieldLabel = (id: string) => REPORT_FIELDS.find((field) => field.id === id)?.label || id;
  const totals = generatedFields.reduce((acc, id) => {
    const field = REPORT_FIELDS.find((item) => item.id === id);
    if (field?.kind === 'currency') {
      acc[id] = reportData.reduce((sum, row) => sum + (typeof row[id] === 'number' ? (row[id] as number) : 0), 0);
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Construtor de relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-name">Nome do relatório</Label>
            <Input
              id="report-name"
              placeholder="Ex.: Resultado por imóvel — 2026"
              value={reportConfig.name}
              onChange={(e) => setReportConfig((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <Label>Colunas do relatório</Label>
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {fields.map((field) => (
                    <label key={field.id} htmlFor={`field-${field.id}`} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        id={`field-${field.id}`}
                        checked={reportConfig.fields.includes(field.id)}
                        onCheckedChange={() => handleFieldToggle(field.id)}
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {reportConfig.fields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {reportConfig.fields.map((fieldId) => (
                <Badge key={fieldId} variant="secondary" className="flex items-center gap-1">
                  {fieldLabel(fieldId)}
                  <button type="button" onClick={() => handleFieldToggle(fieldId)} aria-label={`Remover ${fieldLabel(fieldId)}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <Label>Período das receitas e despesas (opcional)</Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">Data inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={reportConfig.dateRange.start}
                  onChange={(e) => setReportConfig((prev) => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">Data final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={reportConfig.dateRange.end}
                  onChange={(e) => setReportConfig((prev) => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleGenerateReport} disabled={isGenerating || reportConfig.fields.length === 0}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              {isGenerating ? 'Gerando...' : 'Gerar relatório'}
            </Button>
            <Button variant="outline" onClick={handleSaveTemplate} disabled={!reportConfig.name.trim() || reportConfig.fields.length === 0}>
              <Save className="h-4 w-4" />
              Salvar template
            </Button>
            {reportData.length > 0 && (
              <>
                <Button variant="outline" onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Planilha (CSV)
                </Button>
                <Button variant="outline" onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Templates salvos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div key={template.id} className="rounded-3xl border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.fields.length} coluna(s)</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteTemplate(template.id)}
                      aria-label={`Excluir template ${template.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setReportConfig((prev) => ({ ...prev, fields: template.fields, name: template.name }))}
                  >
                    Usar template
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportData.length > 0 && generatedFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{reportConfig.name.trim() || 'Resultado do relatório'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    {generatedFields.map((fieldId) => (
                      <th key={fieldId} className="px-4 py-2.5 text-left font-semibold">
                        {fieldLabel(fieldId)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index} className="border-t border-border/60">
                      {generatedFields.map((fieldId) => (
                        <td
                          key={fieldId}
                          className={cn(
                            'px-4 py-2',
                            typeof row[fieldId] === 'number' && 'text-right tabular-nums',
                            fieldId === 'net' && typeof row[fieldId] === 'number' && (row[fieldId] as number) < 0 && 'text-rose-600'
                          )}
                        >
                          {formatReportCell(fieldId, row[fieldId])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {Object.keys(totals).length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                      {generatedFields.map((fieldId, index) => (
                        <td key={fieldId} className={cn('px-4 py-2.5', fieldId in totals && 'text-right tabular-nums')}>
                          {fieldId in totals ? formatReportCell(fieldId, totals[fieldId]) : index === 0 ? 'Total' : ''}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{reportData.length} registro(s)</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
