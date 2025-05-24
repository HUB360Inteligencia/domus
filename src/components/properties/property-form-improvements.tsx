
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

// Componente para tags personalizadas
export function PropertyTags({ 
  tags = [], 
  onChange 
}: { 
  tags: string[]; 
  onChange: (tags: string[]) => void;
}) {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => removeTag(tag)}
            />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Adicionar tag..."
          className="flex-1"
        />
        <Button type="button" onClick={addTag} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Componente para cálculo automático de valor por m²
export function AreaValueCalculator({
  value,
  area,
  onSquareMeterValueChange
}: {
  value: number;
  area?: number;
  onSquareMeterValueChange: (value: number) => void;
}) {
  const squareMeterValue = area && area > 0 ? value / area : 0;

  useEffect(() => {
    if (squareMeterValue > 0) {
      onSquareMeterValueChange(squareMeterValue);
    }
  }, [squareMeterValue, onSquareMeterValueChange]);

  if (!area || area <= 0) return null;

  return (
    <div className="bg-muted p-3 rounded-lg">
      <Label className="text-sm font-medium">Valor por m²</Label>
      <p className="text-lg font-bold text-petroleum">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(squareMeterValue)}
      </p>
    </div>
  );
}

// Componente para validação de CEP aprimorada
export function CEPValidator({ 
  cep, 
  onValidation 
}: { 
  cep: string; 
  onValidation: (isValid: boolean) => void;
}) {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length === 0) {
      setIsValid(null);
      onValidation(true);
      return;
    }

    if (cleanCEP.length === 8) {
      // Validação básica de CEP brasileiro
      const cepRegex = /^[0-9]{8}$/;
      const valid = cepRegex.test(cleanCEP);
      setIsValid(valid);
      onValidation(valid);
    } else {
      setIsValid(false);
      onValidation(false);
    }
  }, [cep, onValidation]);

  if (isValid === null) return null;

  return (
    <div className={`text-xs mt-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
      {isValid ? '✓ CEP válido' : '✗ CEP deve ter 8 dígitos'}
    </div>
  );
}

// Componente para formatação de telefone
export function PhoneFormatter({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onChange(formatted);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder="(11) 99999-9999"
      maxLength={15}
    />
  );
}

// Hook para validação de formulário aprimorada
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any, rules: ValidationRule[]) => {
    const fieldErrors: string[] = [];

    rules.forEach(rule => {
      if (!rule.validator(value)) {
        fieldErrors.push(rule.message);
      }
    });

    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors[0] || ''
    }));

    return fieldErrors.length === 0;
  };

  const clearError = (name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    validateField,
    clearError,
    hasErrors,
    setErrors
  };
}

interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

// Componente para sugestões de preenchimento automático
export function PropertySuggestions({ 
  type, 
  onSuggestionSelect 
}: { 
  type: string; 
  onSuggestionSelect: (suggestion: Partial<any>) => void;
}) {
  const suggestions = {
    apartment: {
      features: ['Elevador', 'Portaria 24h', 'Área de lazer', 'Garagem'],
      area: 60,
      bathrooms: 2,
      bedrooms: 2
    },
    house: {
      features: ['Quintal', 'Garagem', 'Churrasqueira', 'Área de serviço'],
      area: 120,
      bathrooms: 2,
      bedrooms: 3
    },
    commercial: {
      features: ['Estacionamento', 'Recepção', 'Ar condicionado'],
      area: 80,
      bathrooms: 1
    }
  };

  const currentSuggestion = suggestions[type as keyof typeof suggestions];

  if (!currentSuggestion) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <Label className="text-sm font-medium text-blue-800">
        Sugestões para {type === 'apartment' ? 'Apartamento' : type === 'house' ? 'Casa' : 'Comercial'}
      </Label>
      <Button 
        type="button"
        variant="outline" 
        size="sm" 
        className="mt-2"
        onClick={() => onSuggestionSelect(currentSuggestion)}
      >
        Aplicar sugestões
      </Button>
    </div>
  );
}
