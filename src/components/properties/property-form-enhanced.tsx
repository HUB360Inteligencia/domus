
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Calculator, TrendingUp } from 'lucide-react';
import { PropertyTags, AreaValueCalculator, CEPValidator, PhoneFormatter, PropertySuggestions, useFormValidation } from './property-form-improvements';
import { calculateROI, calculatePaybackPeriod, suggestRentValue, validatePropertyForm } from '@/utils/form-helpers';
import { toast } from 'sonner';

interface PropertyFormEnhancedProps {
  formData: any;
  onFormDataChange: (data: any) => void;
}

export function PropertyFormEnhanced({ formData, onFormDataChange }: PropertyFormEnhancedProps) {
  const [isCEPValid, setIsCEPValid] = useState(true);
  const [suggestedRent, setSuggestedRent] = useState<number>(0);
  const { errors, validateField, hasErrors } = useFormValidation();

  // Calcular ROI e período de payback
  const roi = calculateROI(formData.value * 0.006, formData.purchase_value || formData.value);
  const paybackPeriod = calculatePaybackPeriod(formData.purchase_value || formData.value, formData.value * 0.006);

  useEffect(() => {
    if (formData.value && formData.area && formData.type) {
      const suggested = suggestRentValue(formData.value, formData.area, formData.type);
      setSuggestedRent(suggested);
    }
  }, [formData.value, formData.area, formData.type]);

  const handleTagsChange = (tags: string[]) => {
    onFormDataChange({ ...formData, tags });
  };

  const handleSuggestionSelect = (suggestion: any) => {
    const updatedData = { ...formData, ...suggestion };
    onFormDataChange(updatedData);
    toast.success('Sugestões aplicadas com sucesso!');
  };

  const handleAgencyContactChange = (value: string) => {
    onFormDataChange({ ...formData, agency_contact: value });
  };

  const handleTenantContactChange = (value: string) => {
    onFormDataChange({ ...formData, tenant_contact: value });
  };

  const validateForm = () => {
    const validation = validatePropertyForm(formData);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast.error(error);
      });
    }
    
    return validation.isValid;
  };

  return (
    <div className="space-y-6">
      {/* Seção de Sugestões */}
      {formData.type && (
        <PropertySuggestions 
          type={formData.type} 
          onSuggestionSelect={handleSuggestionSelect}
        />
      )}

      {/* Calculadora de Valor por m² */}
      {formData.value && formData.area && (
        <AreaValueCalculator
          value={formData.value}
          area={formData.area}
          onSquareMeterValueChange={(value) => 
            onFormDataChange({ ...formData, square_meter_value: value })
          }
        />
      )}

      {/* Tags Personalizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Tags e Características
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyTags 
            tags={formData.tags || []} 
            onChange={handleTagsChange}
          />
        </CardContent>
      </Card>

      {/* Validação de CEP */}
      {formData.zip_code && (
        <CEPValidator 
          cep={formData.zip_code} 
          onValidation={setIsCEPValid}
        />
      )}

      {/* Formatação de Contatos */}
      <Card>
        <CardHeader>
          <CardTitle>Contatos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contato da Imobiliária</Label>
            <PhoneFormatter 
              value={formData.agency_contact || ''} 
              onChange={handleAgencyContactChange}
            />
          </div>
          
          <div>
            <Label>Contato do Inquilino</Label>
            <PhoneFormatter 
              value={formData.tenant_contact || ''} 
              onChange={handleTenantContactChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Análise Financeira */}
      {formData.value && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Análise Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <Label className="text-sm text-green-700">ROI Estimado (Anual)</Label>
                <p className="text-lg font-bold text-green-800">{roi.toFixed(2)}%</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <Label className="text-sm text-blue-700">Payback (Meses)</Label>
                <p className="text-lg font-bold text-blue-800">
                  {paybackPeriod > 0 ? Math.round(paybackPeriod) : 'N/A'}
                </p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <Label className="text-sm text-purple-700">Aluguel Sugerido</Label>
                <p className="text-lg font-bold text-purple-800">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(suggestedRent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas de Validação */}
      {!isCEPValid && (
        <Alert variant="destructive">
          <AlertDescription>
            CEP inválido. Verifique se o CEP está correto.
          </AlertDescription>
        </Alert>
      )}

      {hasErrors && (
        <Alert variant="destructive">
          <AlertDescription>
            Existem erros no formulário. Verifique os campos destacados.
          </AlertDescription>
        </Alert>
      )}

      {/* Botão de Validação */}
      <Button 
        type="button" 
        variant="outline" 
        onClick={validateForm}
        className="w-full"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Validar Formulário
      </Button>
    </div>
  );
}
