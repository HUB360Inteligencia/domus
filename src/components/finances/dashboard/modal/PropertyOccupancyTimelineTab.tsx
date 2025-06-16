
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PropertyAnalyticsData } from '@/api/property-analytics';
import { usePropertyOccupancy } from '@/hooks/use-property-occupancy';
import { Calendar, User, Clock, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PropertyOccupancyTimelineTabProps {
  property: PropertyAnalyticsData;
}

export function PropertyOccupancyTimelineTab({ property }: PropertyOccupancyTimelineTabProps) {
  const { occupancyPeriods, vacancyRate, isLoadingOccupancy } = usePropertyOccupancy(property.id);

  const getOccupancyStatusBadge = (period: any) => {
    if (period.end_date) {
      return <Badge variant="outline">Finalizado</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  const getOccupancyTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rental':
      case 'aluguel':
        return 'bg-blue-100 border-blue-300';
      case 'airbnb':
        return 'bg-purple-100 border-purple-300';
      case 'vacant':
      case 'vago':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-green-100 border-green-300';
    }
  };

  const translateOccupancyType = (type: string) => {
    const translations: Record<string, string> = {
      'rental': 'Aluguel',
      'airbnb': 'Airbnb',
      'vacant': 'Vago',
      'owner_occupied': 'Ocupação Própria'
    };
    return translations[type] || type;
  };

  if (isLoadingOccupancy) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="bg-gray-200 h-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Ocupação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                <p className="text-xl font-bold text-blue-600">
                  {(100 - (vacancyRate || 0)).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Vacância</p>
                <p className="text-xl font-bold text-red-600">
                  {(vacancyRate || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Períodos Registrados</p>
                <p className="text-xl font-bold text-green-600">
                  {occupancyPeriods.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Ocupação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline de Ocupação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {occupancyPeriods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum período de ocupação registrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {occupancyPeriods
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                .map((period, index) => (
                  <div
                    key={period.id}
                    className={`p-4 rounded-lg border-2 ${getOccupancyTypeColor(period.occupancy_type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">
                            {translateOccupancyType(period.occupancy_type)}
                          </h4>
                          {getOccupancyStatusBadge(period)}
                        </div>
                        
                        {period.tenant_name && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <User className="h-3 w-3 inline mr-1" />
                            {period.tenant_name}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Início: {format(new Date(period.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {period.end_date && (
                            <span>
                              Fim: {format(new Date(period.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                        
                        {period.notes && (
                          <p className="text-sm mt-2 p-2 bg-white/50 rounded">
                            {period.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {period.end_date ? 'Duração' : 'Em andamento'}
                        </div>
                        <div className="font-semibold">
                          {period.end_date ? (
                            `${Math.ceil((new Date(period.end_date).getTime() - new Date(period.start_date).getTime()) / (1000 * 60 * 60 * 24))} dias`
                          ) : (
                            `${Math.ceil((new Date().getTime() - new Date(period.start_date).getTime()) / (1000 * 60 * 60 * 24))} dias`
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise de Padrões */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Padrões de Ocupação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Tipos de Ocupação</h4>
              <div className="space-y-2">
                {Object.entries(
                  occupancyPeriods.reduce((acc, period) => {
                    const type = translateOccupancyType(period.occupancy_type);
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm">{type}</span>
                    <Badge variant="outline">{count} período{count > 1 ? 's' : ''}</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Estatísticas</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Duração média de contratos:</span>
                  <span className="font-semibold">
                    {occupancyPeriods.length > 0 ? (
                      `${Math.round(
                        occupancyPeriods
                          .filter(p => p.end_date)
                          .reduce((acc, p) => acc + Math.ceil((new Date(p.end_date!).getTime() - new Date(p.start_date).getTime()) / (1000 * 60 * 60 * 24)), 0) /
                        occupancyPeriods.filter(p => p.end_date).length
                      )} dias`
                    ) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Período mais longo:</span>
                  <span className="font-semibold">
                    {occupancyPeriods.length > 0 ? (
                      `${Math.max(
                        ...occupancyPeriods.map(p => 
                          Math.ceil((new Date(p.end_date || new Date()).getTime() - new Date(p.start_date).getTime()) / (1000 * 60 * 60 * 24))
                        )
                      )} dias`
                    ) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
