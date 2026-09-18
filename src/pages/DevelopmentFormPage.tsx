
import { useNavigate, useParams } from 'react-router-dom';
import { DevelopmentForm } from '@/components/developments/development-form';
import { useCreateDevelopment, useUpdateDevelopment, useDevelopment } from '@/hooks/use-developments';
import { DevelopmentFormData } from '@/types/development';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DevelopmentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  // Derivado da URL: evita renderizar o formulário vazio antes de detectar a edição
  const isEditMode = Boolean(id);
  
  const { data: development, isLoading: isLoadingDevelopment } = useDevelopment(id || '');
  const createDevelopment = useCreateDevelopment();
  const updateDevelopment = useUpdateDevelopment();

  const handleSubmit = async (data: DevelopmentFormData) => {
    try {
      if (isEditMode && id) {
        await updateDevelopment.mutateAsync({ id, data });
        navigate(`/developments/${id}`, { replace: true });
      } else {
        const created = await createDevelopment.mutateAsync(data);
        navigate(created?.id ? `/developments/${created.id}` : '/developments', { replace: true });
      }
    } catch (error) {
      console.error('Erro ao salvar empreendimento:', error);
      toast.error('Erro ao salvar empreendimento');
    }
  };

  const handleCancel = () => {
    navigate(isEditMode && id ? `/developments/${id}` : '/developments');
  };

  if (isEditMode && isLoadingDevelopment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground">Carregando dados do empreendimento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {isEditMode ? 'Editar Empreendimento' : 'Novo Empreendimento'}
      </h1>
      
      <DevelopmentForm
        key={development?.id || 'new'}
        initialData={isEditMode ? development : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createDevelopment.isPending || updateDevelopment.isPending}
      />
    </div>
  );
}
