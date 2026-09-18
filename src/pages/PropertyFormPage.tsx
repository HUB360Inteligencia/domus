import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PropertyForm } from '@/components/properties/property-form';
import { usePropertyFormSubmission } from '@/hooks/use-property-form-submission';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { fetchPropertyById } from '@/api/properties';
import { PropertyFormData } from '@/types/property';

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const goBack = useBackNavigation(isEditMode ? `/properties/${id}` : '/properties');

  const { submitProperty, isSubmitting } = usePropertyFormSubmission();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchPropertyById(id || ''),
    enabled: isEditMode,
  });

  const handleSubmit = useCallback(async (data: PropertyFormData) => {
    try {
      const savedId = await submitProperty(data, isEditMode, id);
      if (savedId) {
        // Abre o imóvel salvo para o usuário conferir, adicionar fotos, contratos etc.
        navigate(`/properties/${savedId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('Erro inesperado ao salvar o imóvel');
    }
  }, [submitProperty, isEditMode, id, navigate]);

  if (isEditMode && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-accent" />
        <p className="text-muted-foreground">Carregando dados do imóvel...</p>
      </div>
    );
  }

  if (isEditMode && (isError || !property)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-lg font-semibold">Imóvel não encontrado</h2>
        <p className="mb-6 mt-2 text-muted-foreground">Não foi possível carregar este imóvel para edição.</p>
        <Button onClick={() => navigate('/properties')}>Ver todos os imóveis</Button>
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
        title={isEditMode ? 'Editar imóvel' : 'Novo imóvel'}
        description={
          isEditMode
            ? property?.title
            : 'Cadastre os dados, a localização e as fotos do imóvel.'
        }
        className="mb-0"
      />

      <PropertyForm
        key={property?.id || 'new'}
        initialData={isEditMode ? property : undefined}
        onSubmit={handleSubmit}
        onCancel={goBack}
        isLoading={isSubmitting}
      />
    </div>
  );
}
