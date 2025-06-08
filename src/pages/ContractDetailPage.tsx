
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Phone,
  Receipt
} from 'lucide-react';
import { useContracts } from '@/hooks/use-contracts';
import { ContractAdjustmentForm } from '@/components/contracts/contract-adjustment-form';
import { ContractAdjustmentHistory } from '@/components/contracts/contract-adjustment-history';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedContractId, selectedContract, isLoadingSelectedContract } = useContracts();

  React.useEffect(() => {
    if (id) {
      setSelectedContractId(id);
    }
  }, [id, setSelectedContractId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirado';
      case 'canceled': return 'Cancelado';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  if (isLoadingSelectedContract) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedContract) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Contrato não encontrado</h3>
        <p className="text-muted-foreground mb-4">
          O contrato solicitado não existe ou você não tem permissão para visualizá-lo.
        </p>
        <Button onClick={() => navigate('/contracts')}>
          Voltar para Contratos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/contracts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedContract.title}</h1>
            <Badge className={getStatusColor(selectedContract.status)}>
              {getStatusLabel(selectedContract.status)}
            </Badge>
          </div>
        </div>
        <Button onClick={() => navigate(`/contracts/edit/${selectedContract.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Informações do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor</label>
                <p className="text-lg font-semibold">{formatCurrency(selectedContract.value)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dia de Pagamento</label>
                <p className="text-lg font-semibold">{selectedContract.payment_day}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(selectedContract.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Término</label>
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(selectedContract.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>

            {selectedContract.deposit_value && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor do Depósito</label>
                <p className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {formatCurrency(selectedContract.deposit_value)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Inquilino */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações do Inquilino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="text-lg font-semibold">{selectedContract.tenant_name}</p>
            </div>
            
            {selectedContract.tenant_contact && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contato</label>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {selectedContract.tenant_contact}
                </p>
              </div>
            )}
            
            {selectedContract.tenant_document && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Documento</label>
                <p>{selectedContract.tenant_document}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da Propriedade */}
        {selectedContract.property && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Propriedade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Título</label>
                <p className="text-lg font-semibold">{selectedContract.property.title}</p>
              </div>
              
              {selectedContract.property.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                  <p>{selectedContract.property.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Termos e Condições */}
        {(selectedContract.terms || selectedContract.special_conditions) && (
          <Card>
            <CardHeader>
              <CardTitle>Termos e Condições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedContract.terms && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Termos</label>
                  <p className="whitespace-pre-wrap">{selectedContract.terms}</p>
                </div>
              )}
              
              {selectedContract.special_conditions && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Condições Especiais</label>
                  <p className="whitespace-pre-wrap">{selectedContract.special_conditions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seção de Reajustes */}
      <div className="space-y-6">
        <Separator />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Reajustes de Contrato
              </CardTitle>
              <ContractAdjustmentForm 
                contractId={selectedContract.id}
                currentValue={selectedContract.value}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ContractAdjustmentHistory contractId={selectedContract.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
