
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyHeroHeader } from '@/components/properties/property-hero-header';
import { PropertyOverviewSection } from '@/components/properties/PropertyOverviewSection';
import { PropertyTransactionsSection } from '@/components/properties/PropertyTransactionsSection';
import { PropertyActivitiesSection } from '@/components/properties/PropertyActivitiesSection';
import { PropertyDocumentsSection } from '@/components/properties/PropertyDocumentsSection';
import { PropertyContractsSection } from '@/components/properties/PropertyContractsSection';
import { useProperties } from '@/hooks/use-properties';
import { toast } from 'sonner';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    selectedProperty, 
    setSelectedPropertyId, 
    deleteProperty, 
    isDeleting 
  } = useProperties();

  useEffect(() => {
    if (id) {
      setSelectedPropertyId(id);
    } else {
      navigate('/properties');
    }
  }, [id, setSelectedPropertyId, navigate]);

  const handleBack = () => {
    navigate('/properties');
  };

  const handleEdit = () => {
    if (!id) {
      toast.error('ID do imóvel não encontrado');
      return;
    }
    try {
      console.log('Navigating to edit page with ID:', id);
      navigate(`/properties/edit/${id}`);
    } catch (error) {
      console.error('Error navigating to edit page:', error);
      toast.error('Erro ao navegar para página de edição');
    }
  };

  const handleDelete = async () => {
    if (!id) {
      toast.error('ID do imóvel não encontrado');
      return;
    }
    try {
      await deleteProperty(id);
      toast.success('Imóvel excluído com sucesso');
      navigate('/properties');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Erro ao excluir imóvel');
    }
  };

  if (!selectedProperty && id) {
    return (
      <div className="container py-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!selectedProperty) {
    return (
      <div className="container py-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Imóvel não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 space-y-6">
      <PropertyHeroHeader
        property={selectedProperty}
        isLoading={false}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="finances">Financeiro</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PropertyOverviewSection property={selectedProperty} />
        </TabsContent>

        <TabsContent value="finances">
          <PropertyTransactionsSection property={selectedProperty} />
        </TabsContent>

        <TabsContent value="activities">
          <PropertyActivitiesSection property={selectedProperty} />
        </TabsContent>

        <TabsContent value="documents">
          <PropertyDocumentsSection property={selectedProperty} />
        </TabsContent>

        <TabsContent value="contracts">
          <PropertyContractsSection property={selectedProperty} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
