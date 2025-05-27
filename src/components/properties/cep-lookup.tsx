
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Check } from 'lucide-react';
import { fetchAddressFromCEP, formatCEP } from '@/utils/cep-lookup';
import { toast } from 'sonner';

interface CEPLookupProps {
  value: string;
  onChange: (value: string) => void;
  onAddressFound: (address: {
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => void;
}

export function CEPLookup({ value, onChange, onAddressFound }: CEPLookupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleCEPChange = (newValue: string) => {
    const formatted = formatCEP(newValue);
    onChange(formatted);
    setIsValid(false);
  };

  const handleCEPLookup = async () => {
    if (!value || value.length < 9) {
      toast.error('Digite um CEP válido');
      return;
    }

    setIsLoading(true);
    try {
      const addressData = await fetchAddressFromCEP(value);
      
      if (addressData && !addressData.erro) {
        onAddressFound({
          address: addressData.logradouro || '',
          neighborhood: addressData.bairro || '',
          city: addressData.localidade || '',
          state: addressData.uf || '',
        });
        setIsValid(true);
        toast.success('Endereço encontrado com sucesso!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
      toast.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCEPLookup();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cep">CEP *</Label>
      <div className="flex gap-2">
        <Input
          id="cep"
          value={value}
          onChange={(e) => handleCEPChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="00000-000"
          maxLength={9}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCEPLookup}
          disabled={isLoading || !value || value.length < 9}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isValid ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          {isLoading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>
    </div>
  );
}
