
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Property } from '@/types/property';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calculator } from 'lucide-react';
import { useContractsByProperty } from '@/hooks/use-contracts-by-property';
import { ContractForm } from '@/components/contracts/contract-form';
import { ContractStatusSelect } from '@/components/contracts/ContractStatusSelect';
import { useContractMutations } from '@/hooks/use-contract-mutations';
import { RentalManagementModal, RentalHistoryTable, MonthlyAverageCard } from './rental-management';

interface PropertyContractSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyContractSection: React.FC<PropertyContractSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [showRentalManagementModal, setShowRentalManagementModal] = useState(false);
  const { contracts, activeContract, isLoading: isLoadingContracts, refetch } = useContractsByProperty(property?.id || null);
  const { createContract } = useContractMutations();

  const handleCreateContract = async (contractData: any, documentFile?: File) => {
    try {
      await createContract({
        ...contractData,
        property_id: property?.id
      });
      setShowNewContractModal(false);
      refetch();
    } catch (error) {
      console.error('Error creating contract:', error);
    }
  };

  if (isLoading || isLoadingContracts) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasContractInfo = property?.tenant_name || property?.tenant_contact || 
                         property?.agency_name || property?.agency_responsible || 
                         property?.agency_contact || contracts.length > 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Contratos</h3>
          <div className="flex items-center gap-3">
            {property?.status && (
              <Badge variant={property.status === 'rented' ? 'default' : property.status === 'available' ? 'outline' : 'secondary'}>
                {property.status === 'rented' ? 'Alugado' : 
                 property.status === 'available' ? 'Disponível' : 
                 property.status === 'airbnb' ? 'Airbnb' : 
                 property.status === 'maintenance' ? 'Em manutenção' : 
                 property.status}
              </Badge>
            )}
            <Button 
              variant="outline"
              onClick={() => setShowRentalManagementModal(true)}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Gestão de Aluguéis
            </Button>
            <Button onClick={() => setShowNewContractModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </div>

        {/* Histórico de Aluguéis e Card de Média */}
        {property?.id && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <RentalHistoryTable propertyId={property.id} />
            </div>
            <div className="lg:col-span-1">
              <MonthlyAverageCard propertyId={property.id} />
            </div>
          </div>
        )}

        {/* Lista de Contratos */}
        {contracts.length > 0 ? (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{contract.title}</CardTitle>
                      <CardDescription>Locatário: {contract.tenant_name}</CardDescription>
                    </div>
                    <ContractStatusSelect contract={contract} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Início</p>
                      <p className="font-medium">
                        {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fim</p>
                      <p className="font-medium">
                        {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  {contract.tenant_contact && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contato do Locatário</p>
                      <p className="font-medium">{contract.tenant_contact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !hasContractInfo ? (
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
              <CardDescription>Gerencie os contratos de locação desta propriedade</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="text-center text-muted-foreground space-y-3">
                <p>Nenhum contrato cadastrado.</p>
                <p className="text-sm">
                  Crie um novo contrato para esta propriedade.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewContractModal(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Contrato
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader>
              <CardTitle>Informações Herdadas da Propriedade</CardTitle>
              <CardDescription>Dados do locatário e imobiliária cadastrados na propriedade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Locatário */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Informações do Locatário</h4>
                  <div className="space-y-2">
                    {property?.tenant_name ? (
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{property.tenant_name}</p>
                      </div>
                    ) : null}
                    
                    {property?.tenant_contact ? (
                      <div>
                        <p className="text-sm text-muted-foreground">Contato</p>
                        <p className="font-medium">{property.tenant_contact}</p>
                      </div>
                    ) : null}
                    
                    {!property?.tenant_name && !property?.tenant_contact ? (
                      <p className="text-sm text-muted-foreground">Nenhuma informação do locatário cadastrada</p>
                    ) : null}
                  </div>
                </div>
                
                {/* Imobiliária */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Informações da Imobiliária</h4>
                  <div className="space-y-2">
                    {property?.agency_name ? (
                      <div>
                        <p className="text-sm text-muted-foreground">Nome da Imobiliária</p>
                        <p className="font-medium">{property.agency_name}</p>
                      </div>
                    ) : null}
                    
                    {property?.agency_responsible ? (
                      <div>
                        <p className="text-sm text-muted-foreground">Responsável</p>
                        <p className="font-medium">{property.agency_responsible}</p>
                      </div>
                    ) : null}
                    
                    {property?.agency_contact ? (
                      <div>
                        <p className="text-sm text-muted-foreground">Contato</p>
                        <p className="font-medium">{property.agency_contact}</p>
                      </div>
                    ) : null}
                    
                    {!property?.agency_name && !property?.agency_responsible && !property?.agency_contact ? (
                      <p className="text-sm text-muted-foreground">Nenhuma informação da imobiliária cadastrada</p>
                    ) : null}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Termos do Contrato - Placeholder para futuras implementações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Termos do Contrato</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Os detalhes completos do contrato serão implementados em breve.</p>
                    <p>Você poderá registrar datas de início e fim, valor, condições especiais e muito mais.</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-4">Documentos</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Armazenamento de documentos relacionados ao contrato será implementado em breve.</p>
                    <p>Guarde contratos, vistorias e outros documentos importantes.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Novo Contrato */}
      <Dialog open={showNewContractModal} onOpenChange={setShowNewContractModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contrato de Locação</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <ContractForm
              onSubmit={handleCreateContract}
              onCancel={() => setShowNewContractModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Gestão de Aluguéis */}
      <RentalManagementModal
        isOpen={showRentalManagementModal}
        onClose={() => setShowRentalManagementModal(false)}
        propertyId={property?.id || ''}
        propertyTitle={property?.title || ''}
      />
    </>
  );
};
