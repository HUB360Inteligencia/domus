
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDevelopment, useDeleteDevelopment } from '@/hooks/use-developments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, ArrowLeft, Building2, MapPin, Calendar, Ruler } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DevelopmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: development, isLoading } = useDevelopment(id || '');
  const deleteDevelopment = useDeleteDevelopment();

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteDevelopment.mutateAsync(id);
      navigate('/developments');
    } catch (error) {
      console.error('Erro ao excluir empreendimento:', error);
      toast.error('Erro ao excluir empreendimento');
    }
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      planning: 'bg-blue-500',
      land: 'bg-yellow-500',
      project: 'bg-orange-500',
      construction: 'bg-purple-500',
      sales: 'bg-green-500',
      completed: 'bg-gray-500'
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-500';
  };

  const getPhaseLabel = (phase: string) => {
    const labels = {
      planning: 'Planejamento',
      land: 'Terreno',
      project: 'Projeto',
      construction: 'Construção',
      sales: 'Vendas',
      completed: 'Concluído'
    };
    return labels[phase as keyof typeof labels] || phase;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      residential_building: 'Edifício Residencial',
      commercial_building: 'Edifício Comercial',
      horizontal_condominium: 'Condomínio Horizontal',
      subdivision: 'Loteamento'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-petroleum" />
      </div>
    );
  }

  if (!development) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Empreendimento não encontrado</h3>
        <p className="text-muted-foreground mb-4">
          O empreendimento que você está procurando não existe ou foi removido.
        </p>
        <Button asChild>
          <Link to="/developments">Voltar para Empreendimentos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/developments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{development.name}</h1>
            <p className="text-muted-foreground">{getTypeLabel(development.type)}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link to={`/developments/${development.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o empreendimento "{development.name}"?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fase Atual</label>
              <div className="mt-1">
                <Badge className={`${getPhaseColor(development.current_phase)} text-white`}>
                  {getPhaseLabel(development.current_phase)}
                </Badge>
              </div>
            </div>
            
            {development.total_units && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unidades</label>
                <p className="text-lg font-semibold">{development.total_units}</p>
              </div>
            )}
            
            {development.total_land_area && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Área do Terreno</label>
                <p className="text-lg font-semibold">{development.total_land_area.toLocaleString('pt-BR')} m²</p>
              </div>
            )}
            
            {development.planned_built_area && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Área Construída Prevista</label>
                <p className="text-lg font-semibold">{development.planned_built_area.toLocaleString('pt-BR')} m²</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{development.address}</p>
            <p className="text-sm text-muted-foreground">
              {development.city}, {development.state}
            </p>
            {development.zip_code && (
              <p className="text-sm text-muted-foreground">CEP: {development.zip_code}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {development.planned_start_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Início Previsto</label>
                <p className="text-sm">{new Date(development.planned_start_date).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            
            {development.planned_end_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Término Previsto</label>
                <p className="text-sm">{new Date(development.planned_end_date).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {development.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{development.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
