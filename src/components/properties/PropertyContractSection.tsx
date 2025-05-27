
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Property } from '@/types/property';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

interface PropertyContractSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyContractSection: React.FC<PropertyContractSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const [showNewContractModal, setShowNewContractModal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
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
                         property?.agency_contact;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Contrato</h3>
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
            <Button onClick={() => setShowNewContractModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Contrato
            </Button>
          </div>
        </div>

        {!hasContractInfo ? (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Contrato</CardTitle>
              <CardDescription>Detalhes sobre o contrato de locação atual</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="text-center text-muted-foreground space-y-3">
                <p>Nenhuma informação de contrato cadastrada.</p>
                <p className="text-sm">
                  Edite o imóvel para adicionar informações do locatário e/ou imobiliária.
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
          <Card>
            <CardHeader>
              <CardTitle>Informações do Contrato</CardTitle>
              <CardDescription>Detalhes sobre o contrato de locação atual</CardDescription>
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

      {/* New Contract Modal */}
      <Dialog open={showNewContractModal} onOpenChange={setShowNewContractModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Contrato de Locação</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-muted-foreground">
              Formulário completo de contrato será implementado aqui.
              Propriedade: {property?.title}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Incluirá campos para: dados do locatário, valor do aluguel, período do contrato, 
              condições especiais, documentos anexos, etc.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
