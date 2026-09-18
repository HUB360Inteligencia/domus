import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ContractFormEnhanced } from '@/components/contracts/contract-form-enhanced';
import { fetchContractById } from '@/api/contracts';
import { useBackNavigation } from '@/hooks/use-back-navigation';

export default function ContractFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const defaultPropertyId = searchParams.get('property_id');
  const goBack = useBackNavigation(isEditMode ? `/contracts/${id}` : '/contracts');

  const { data: contract, isLoading, isError } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => fetchContractById(id || ''),
    enabled: isEditMode,
  });

  // O toast de sucesso vem da mutation; aqui só levamos o usuário ao contrato salvo
  const handleSuccess = useCallback((contractId: string) => {
    navigate(`/contracts/${contractId}`, { replace: true });
  }, [navigate]);

  if (isEditMode && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-accent" />
        <p className="text-muted-foreground">Carregando dados do contrato...</p>
      </div>
    );
  }

  if (isEditMode && (isError || !contract)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-lg font-semibold">Contrato não encontrado</h2>
        <p className="mb-6 mt-2 text-muted-foreground">Não foi possível carregar este contrato para edição.</p>
        <Button onClick={() => navigate('/contracts')}>Ver todos os contratos</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <PageHeader
        title={isEditMode ? 'Editar contrato' : 'Novo contrato'}
        description={isEditMode ? contract?.title : 'Cadastre as condições da locação, o locatário e o imóvel.'}
        className="mb-0"
      />

      <ContractFormEnhanced
        key={contract?.id || 'new'}
        initialData={isEditMode ? contract : null}
        defaultPropertyId={defaultPropertyId}
        onSuccess={handleSuccess}
        onCancel={goBack}
      />
    </div>
  );
}
