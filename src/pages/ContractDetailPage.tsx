
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContracts } from '@/hooks/use-contracts';
import { Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    setSelectedContractId, 
    selectedContract, 
    isLoadingSelectedContract,
    deleteContract,
    isDeletingContract
  } = useContracts();

  useEffect(() => {
    if (id) {
      setSelectedContractId(id);
    } else {
      navigate('/contracts');
    }
  }, [id, setSelectedContractId, navigate]);

  const handleBack = () => {
    navigate('/contracts');
  };

  const handleEdit = () => {
    navigate(`/contracts/${id}/edit`);
  };

  const handleDelete = async () => {
    if (id && window.confirm('Tem certeza que deseja excluir este contrato?')) {
      deleteContract(id);
      navigate('/contracts');
    }
  };

  if (isLoadingSelectedContract) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do contrato...</p>
      </div>
    );
  }

  if (!selectedContract) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Contrato não encontrado</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Contratos
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">{selectedContract.title}</h1>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeletingContract}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeletingContract ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={selectedContract.status === 'active' ? 'default' : 'secondary'}>
                  {selectedContract.status === 'active' ? 'Ativo' : 
                   selectedContract.status === 'pending' ? 'Pendente' :
                   selectedContract.status === 'expired' ? 'Expirado' :
                   selectedContract.status === 'canceled' ? 'Cancelado' : 'Rascunho'}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Período</label>
              <p className="mt-1">
                {format(new Date(selectedContract.start_date), 'dd/MM/yyyy', { locale: ptBR })} - {' '}
                {format(new Date(selectedContract.end_date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
              <p className="mt-1 text-lg font-semibold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(selectedContract.value)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dia de Pagamento</label>
              <p className="mt-1">Dia {selectedContract.payment_day}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Inquilino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="mt-1">{selectedContract.tenant_name}</p>
            </div>
            
            {selectedContract.tenant_contact && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contato</label>
                <p className="mt-1">{selectedContract.tenant_contact}</p>
              </div>
            )}
            
            {selectedContract.tenant_document && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Documento</label>
                <p className="mt-1">{selectedContract.tenant_document}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedContract.property && (
        <Card>
          <CardHeader>
            <CardTitle>Propriedade Associada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{selectedContract.property.title}</p>
              <p className="text-muted-foreground">{selectedContract.property.address}</p>
              <p className="text-sm text-muted-foreground">
                {selectedContract.property.neighborhood}, {selectedContract.property.city} - {selectedContract.property.state}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedContract.terms && (
        <Card>
          <CardHeader>
            <CardTitle>Termos do Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{selectedContract.terms}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
