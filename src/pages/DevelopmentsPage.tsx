
import { useState } from 'react';
import { Plus, Search, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDevelopments } from '@/hooks/use-developments';
import { Development } from '@/types/development';
import { Loader2 } from 'lucide-react';

export default function DevelopmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: developments, isLoading, error } = useDevelopments();

  const filteredDevelopments = developments?.filter(dev =>
    dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dev.city.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getPhaseColor = (phase: Development['current_phase']) => {
    const colors = {
      planning: 'bg-blue-500',
      land: 'bg-yellow-500',
      project: 'bg-orange-500',
      construction: 'bg-purple-500',
      sales: 'bg-green-500',
      completed: 'bg-gray-500'
    };
    return colors[phase];
  };

  const getPhaseLabel = (phase: Development['current_phase']) => {
    const labels = {
      planning: 'Planejamento',
      land: 'Terreno',
      project: 'Projeto',
      construction: 'Construção',
      sales: 'Vendas',
      completed: 'Concluído'
    };
    return labels[phase];
  };

  const getTypeLabel = (type: Development['type']) => {
    const labels = {
      residential_building: 'Edifício Residencial',
      commercial_building: 'Edifício Comercial',
      horizontal_condominium: 'Condomínio Horizontal',
      subdivision: 'Loteamento'
    };
    return labels[type];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-petroleum" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Erro ao carregar empreendimentos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incorporações</h1>
          <p className="text-muted-foreground">
            Gerencie seus empreendimentos imobiliários
          </p>
        </div>
        <Button asChild>
          <Link to="/developments/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Empreendimento
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empreendimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredDevelopments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum empreendimento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Nenhum empreendimento corresponde à sua busca.' : 'Comece criando seu primeiro empreendimento.'}
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link to="/developments/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Empreendimento
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevelopments.map((development) => (
            <Card key={development.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{development.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getTypeLabel(development.type)}
                    </p>
                  </div>
                  <Badge className={`${getPhaseColor(development.current_phase)} text-white`}>
                    {getPhaseLabel(development.current_phase)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>📍 {development.city}, {development.state}</span>
                  </div>
                  {development.total_units && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>🏠 {development.total_units} unidades</span>
                    </div>
                  )}
                  {development.total_land_area && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>📐 {development.total_land_area.toLocaleString('pt-BR')} m²</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/developments/${development.id}`}>
                      Ver Detalhes
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/developments/${development.id}/edit`}>
                      <TrendingUp className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
