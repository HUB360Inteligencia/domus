
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Save, X, TrendingUp } from 'lucide-react';
import { Property, PropertyValuation } from '@/types/property';
import { 
  fetchPropertyValuations, 
  createPropertyValuation, 
  updatePropertyValuation, 
  deletePropertyValuation 
} from '@/api/property-valuations';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';

interface PropertyValuationManagerProps {
  property: Property | null | undefined;
  onSuccess?: () => void;
}

interface EditingValuation {
  id?: string;
  value: number;
  valuation_date: string;
  notes?: string;
}

export const PropertyValuationManager: React.FC<PropertyValuationManagerProps> = ({
  property,
  onSuccess
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingValuation, setEditingValuation] = useState<EditingValuation | null>(null);
  const [newValuation, setNewValuation] = useState({
    value: 0,
    valuation_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: valuations = [], isLoading } = useQuery({
    queryKey: ['property-valuations', property?.id],
    queryFn: () => property?.id ? fetchPropertyValuations(property.id) : [],
    enabled: !!property?.id
  });

  const createMutation = useMutation({
    mutationFn: ({ propertyId, value, date, notes }: { 
      propertyId: string; 
      value: number; 
      date: string; 
      notes?: string 
    }) => createPropertyValuation(propertyId, value, date, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-valuations', property?.id] });
      toast.success('Avaliação adicionada com sucesso!');
      setIsAdding(false);
      setNewValuation({ value: 0, valuation_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    },
    onError: (error) => {
      console.error('Error creating valuation:', error);
      toast.error('Erro ao adicionar avaliação');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PropertyValuation> }) => 
      updatePropertyValuation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-valuations', property?.id] });
      toast.success('Avaliação atualizada com sucesso!');
      setEditingValuation(null);
    },
    onError: (error) => {
      console.error('Error updating valuation:', error);
      toast.error('Erro ao atualizar avaliação');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePropertyValuation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-valuations', property?.id] });
      toast.success('Avaliação removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting valuation:', error);
      toast.error('Erro ao remover avaliação');
    }
  });

  const handleAddValuation = () => {
    if (!property?.id || !newValuation.value) {
      toast.error('Preencha o valor da avaliação');
      return;
    }

    createMutation.mutate({
      propertyId: property.id,
      value: newValuation.value,
      date: newValuation.valuation_date,
      notes: newValuation.notes || undefined
    });
  };

  const handleEditValuation = (valuation: PropertyValuation) => {
    setEditingValuation({
      id: valuation.id,
      value: valuation.value,
      valuation_date: valuation.valuation_date,
      notes: valuation.notes || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingValuation?.id) return;

    updateMutation.mutate({
      id: editingValuation.id,
      updates: {
        value: editingValuation.value,
        valuation_date: editingValuation.valuation_date,
        notes: editingValuation.notes
      }
    });
  };

  const handleDeleteValuation = (valuationId: string) => {
    if (confirm('Tem certeza que deseja remover esta avaliação?')) {
      deleteMutation.mutate(valuationId);
    }
  };

  if (!property) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Propriedade não encontrada</p>
      </div>
    );
  }

  const sortedValuations = [...valuations].sort((a, b) => 
    new Date(b.valuation_date).getTime() - new Date(a.valuation_date).getTime()
  );

  const latestValuation = sortedValuations[0];
  const previousValuation = sortedValuations[1];
  const valueChange = latestValuation && previousValuation 
    ? latestValuation.value - previousValuation.value 
    : 0;
  const percentChange = latestValuation && previousValuation && previousValuation.value > 0
    ? ((valueChange / previousValuation.value) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Resumo de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Valor Atual</div>
              <div className="text-lg font-bold">
                {latestValuation ? formatCurrency(latestValuation.value) : formatCurrency(property.value)}
              </div>
            </div>
            
            {valueChange !== 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Variação</div>
                <div className={`text-lg font-bold ${valueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {valueChange >= 0 ? '+' : ''}{formatCurrency(valueChange)}
                </div>
              </div>
            )}
            
            {percentChange !== 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Percentual</div>
                <div className={`text-lg font-bold ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add New Valuation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Nova Avaliação</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              variant={isAdding ? "outline" : "default"}
            >
              {isAdding ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              {isAdding ? 'Cancelar' : 'Adicionar'}
            </Button>
          </div>
        </CardHeader>
        
        {isAdding && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newValuation.value || ''}
                  onChange={(e) => setNewValuation(prev => ({ 
                    ...prev, 
                    value: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="R$ 0,00"
                  className="h-8"
                />
              </div>
              
              <div>
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={newValuation.valuation_date}
                  onChange={(e) => setNewValuation(prev => ({ 
                    ...prev, 
                    valuation_date: e.target.value 
                  }))}
                  className="h-8"
                />
              </div>
              
              <div>
                <Label className="text-xs">Observações</Label>
                <Input
                  value={newValuation.notes}
                  onChange={(e) => setNewValuation(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Observações opcionais"
                  className="h-8"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-3">
              <Button
                size="sm"
                onClick={handleAddValuation}
                disabled={createMutation.isPending || !newValuation.value}
              >
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Valuations List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Avaliações</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : sortedValuations.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">
              Nenhuma avaliação registrada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedValuations.map((valuation) => (
                <div key={valuation.id} className="border rounded-lg p-3">
                  {editingValuation?.id === valuation.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Valor</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingValuation.value}
                            onChange={(e) => setEditingValuation(prev => prev ? ({ 
                              ...prev, 
                              value: parseFloat(e.target.value) || 0 
                            }) : null)}
                            className="h-8"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Data</Label>
                          <Input
                            type="date"
                            value={editingValuation.valuation_date}
                            onChange={(e) => setEditingValuation(prev => prev ? ({ 
                              ...prev, 
                              valuation_date: e.target.value 
                            }) : null)}
                            className="h-8"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Observações</Label>
                          <Input
                            value={editingValuation.notes || ''}
                            onChange={(e) => setEditingValuation(prev => prev ? ({ 
                              ...prev, 
                              notes: e.target.value 
                            }) : null)}
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingValuation(null)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-semibold text-lg">
                              {formatCurrency(valuation.value)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(valuation.valuation_date), 'dd/MM/yyyy')}
                            </div>
                          </div>
                          
                          {valuation.notes && (
                            <div className="text-sm text-muted-foreground max-w-md">
                              {valuation.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditValuation(valuation)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteValuation(valuation.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
