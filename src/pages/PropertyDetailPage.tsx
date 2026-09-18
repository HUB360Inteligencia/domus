import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PropertyDetail } from '@/components/properties/property-detail';
import { useProperties } from '@/hooks/use-properties';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { fetchPropertyById } from '@/api/properties';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useBackNavigation('/properties');
  const { deleteProperty, isDeleting } = useProperties();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchPropertyById(id || ''),
    enabled: !!id,
  });

  const handleEdit = () => {
    if (!id) return;
    navigate(`/properties/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteProperty(id);
      toast.success('Imóvel excluído com sucesso');
      navigate('/properties', { replace: true });
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error(error instanceof Error ? `Erro ao excluir imóvel: ${error.message}` : 'Erro ao excluir imóvel');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm">Carregando imóvel...</p>
      </div>
    );
  }

  if (!property || isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-muted">
          <Building2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Imóvel não encontrado</h2>
        <p className="mb-6 mt-2 max-w-md text-muted-foreground">
          O imóvel solicitado não existe, foi excluído ou você não tem permissão para visualizá-lo.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => navigate('/properties')}>Ver todos os imóveis</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PropertyDetail
        property={property}
        isLoading={false}
        onBack={goBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
