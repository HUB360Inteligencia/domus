
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

export interface Partner {
  id: string;
  name: string;
  percentage: number;
}

interface PartnersListProps {
  partners: Partner[];
  ownerPercentage: number;
  onChange: (partners: Partner[], ownerPercentage: number) => void;
}

export const PartnersList: React.FC<PartnersListProps> = ({
  partners,
  ownerPercentage,
  onChange
}) => {
  const [newPartner, setNewPartner] = useState<Omit<Partner, 'id'>>({
    name: '',
    percentage: 0
  });

  const addPartner = () => {
    if (!newPartner.name || !newPartner.percentage) {
      return;
    }

    const partner: Partner = {
      id: Math.random().toString(36).substring(2, 15),
      ...newPartner
    };

    onChange([...partners, partner], ownerPercentage);
    setNewPartner({
      name: '',
      percentage: 0
    });
  };

  const removePartner = (id: string) => {
    onChange(partners.filter(partner => partner.id !== id), ownerPercentage);
  };

  const handleOwnerPercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    onChange(partners, percentage);
  };

  const totalPartnerPercentage = partners.reduce((sum, partner) => sum + partner.percentage, 0);
  const totalPercentage = totalPartnerPercentage + ownerPercentage;
  const isValidTotal = totalPercentage === 100;

  return (
    <div className="space-y-4">
      {/* Campo de percentual do proprietário da conta */}
      <div>
        <Label htmlFor="owner-percentage">Percentual do Proprietário da Conta (%)</Label>
        <Input
          id="owner-percentage"
          type="number"
          min="0"
          max="100"
          value={ownerPercentage || ''}
          onChange={(e) => handleOwnerPercentageChange(e.target.value)}
          placeholder="Ex: 60"
        />
      </div>

      {/* Lista de sócios existentes */}
      {partners.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-medium">Sócios Cadastrados</Label>
          {partners.map((partner) => (
            <Card key={partner.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{partner.name}</span>
                    <span className="text-muted-foreground">{partner.percentage}%</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePartner(partner.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário para novo sócio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Sócio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partner-name">Nome do Sócio</Label>
              <Input
                id="partner-name"
                placeholder="Nome completo"
                value={newPartner.name}
                onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="partner-percentage">Percentual (%)</Label>
              <Input
                id="partner-percentage"
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 30"
                value={newPartner.percentage || ''}
                onChange={(e) => setNewPartner(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={addPartner}
            disabled={!newPartner.name || !newPartner.percentage}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Sócio
          </Button>
        </CardContent>
      </Card>

      {/* Validação de percentual total */}
      <div className={`text-sm p-2 rounded ${isValidTotal ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        <strong>Total: {totalPercentage}%</strong>
        {!isValidTotal && (
          <span className="block mt-1">
            {totalPercentage > 100 
              ? 'O total excede 100%. Ajuste os percentuais.' 
              : 'O total deve somar 100%.'}
          </span>
        )}
      </div>
    </div>
  );
};
