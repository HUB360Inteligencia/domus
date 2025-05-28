
import React, { useState } from 'react';
import { Property } from '@/types/property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useContractsByProperty } from '@/hooks/use-contracts-by-property';
import { ContractForm } from '@/components/contracts/contract-form';
import { ContractStatusSelect } from '@/components/contracts/contract-status-select';
import { useContractMutations } from '@/hooks/use-contract-mutations';
import { toast } from 'sonner';

interface PropertyContractSectionProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyContractSection: React.FC<PropertyContractSectionProps> = ({
  property,
  isLoading,
}) => {
  const [showContractModal, setShowContractModal] = useState(false);
  const { contracts, isLoading: isLoadingContracts, refetch } = useContractsByProperty(property?.id || null);
  const { createContract, isCreatingContract } = useContractMutations();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'expired':
        return 'Expirado';
      case 'canceled':
        return 'Cancelado';
      case 'draft':
        return 'Rascunho';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'outline';
      case 'expired':
      case 'canceled':
        return 'destructive';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleContractSubmit = async (data: any) => {
    try {
      await createContract({
        ...data,
        property_id: property?.id || ''
      });
      setShowContractModal(false);
      refetch();
      toast.success('Contrato criado com sucesso!');
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Erro ao criar contrato');
    }
  };

  if (isLoading || isLoadingContracts) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contratos da Propriedade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contratos da Propriedade
            </CardTitle>
            <Button onClick={() => setShowContractModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contrato cadastrado para esta propriedade.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowContractModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Contrato
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div 
                    key={contract.id} 
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{contract.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <ContractStatusSelect
                            contractId={contract.id}
                            currentStatus={contract.status}
                            onStatusChange={() => refetch()}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(contract.value)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          /mês
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{contract.tenant_name}</div>
                          {contract.tenant_contact && (
                            <div className="text-muted-foreground">{contract.tenant_contact}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Início: {formatDate(contract.start_date)}</div>
                          <div className="text-muted-foreground">Fim: {formatDate(contract.end_date)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Dia {contract.payment_day}</div>
                          <div className="text-muted-foreground">Vencimento</div>
                        </div>
                      </div>

                      {contract.deposit_value && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{formatCurrency(contract.deposit_value)}</div>
                            <div className="text-muted-foreground">Depósito</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {contract.terms && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-sm mb-2">Observações:</h4>
                        <p className="text-sm text-muted-foreground">{contract.terms}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract Modal */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Contrato</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <ContractForm 
              initialData={{ property_id: property?.id || '' }}
              onSubmit={handleContractSubmit}
              onCancel={() => setShowContractModal(false)}
              isLoading={isCreatingContract}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
