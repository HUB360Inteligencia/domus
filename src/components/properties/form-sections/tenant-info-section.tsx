
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { PropertyFormData } from '@/types/property';

interface TenantInfoSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
}

export function TenantInfoSection({ formData, onInputChange }: TenantInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Informações de Inquilino e Imobiliária
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tenant_name">Nome do Inquilino</Label>
            <Input
              id="tenant_name"
              value={formData.tenant_name || ''}
              onChange={(e) => onInputChange('tenant_name', e.target.value)}
              placeholder="João Silva"
            />
          </div>
          
          <div>
            <Label htmlFor="tenant_contact">Contato do Inquilino</Label>
            <Input
              id="tenant_contact"
              value={formData.tenant_contact || ''}
              onChange={(e) => onInputChange('tenant_contact', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="agency_name">Nome da Imobiliária</Label>
            <Input
              id="agency_name"
              value={formData.agency_name || ''}
              onChange={(e) => onInputChange('agency_name', e.target.value)}
              placeholder="Imobiliária XYZ"
            />
          </div>
          
          <div>
            <Label htmlFor="agency_responsible">Responsável</Label>
            <Input
              id="agency_responsible"
              value={formData.agency_responsible || ''}
              onChange={(e) => onInputChange('agency_responsible', e.target.value)}
              placeholder="Maria Santos"
            />
          </div>
          
          <div>
            <Label htmlFor="agency_contact">Contato da Imobiliária</Label>
            <Input
              id="agency_contact"
              value={formData.agency_contact || ''}
              onChange={(e) => onInputChange('agency_contact', e.target.value)}
              placeholder="(11) 3333-3333"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
