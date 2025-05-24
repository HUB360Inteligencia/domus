import { useState, useMemo } from 'react';
import { Property } from '@/types/property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { MapPin, TrendingUp, Users, DollarSign, Home, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LocationAnalyticsProps {
  properties: Property[];
}

interface LocationStats {
  city: string;
  count: number;
  avgValue: number;
  totalValue: number;
  statusDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  coordinates?: { lat: number; lng: number };
}

interface NeighborhoodStats {
  neighborhood: string;
  count: number;
  avgValue: number;
  pricePerSqm?: number;
  appreciation?: number;
}

export function LocationAnalytics({ properties }: LocationAnalyticsProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Calculate city statistics
  const cityStats = useMemo(() => {
    const cityMap = new Map<string, LocationStats>();

    properties.forEach(property => {
      const city = property.city;
      if (!cityMap.has(city)) {
        cityMap.set(city, {
          city,
          count: 0,
          avgValue: 0,
          totalValue: 0,
          statusDistribution: {},
          typeDistribution: {},
          coordinates: property.latitude && property.longitude ? 
            { lat: property.latitude, lng: property.longitude } : undefined
        });
      }

      const stats = cityMap.get(city)!;
      stats.count++;
      stats.totalValue += property.value;
      
      // Status distribution
      stats.statusDistribution[property.status] = 
        (stats.statusDistribution[property.status] || 0) + 1;
      
      // Type distribution
      stats.typeDistribution[property.type] = 
        (stats.typeDistribution[property.type] || 0) + 1;
    });

    // Calculate averages
    cityMap.forEach(stats => {
      stats.avgValue = stats.totalValue / stats.count;
    });

    return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
  }, [properties]);

  // Calculate neighborhood statistics (simplified - using address as neighborhood)
  const neighborhoodStats = useMemo(() => {
    const neighborhoodMap = new Map<string, NeighborhoodStats>();

    properties.forEach(property => {
      // Simple neighborhood extraction from address (first part)
      const neighborhood = property.address.split(',')[0].trim();
      
      if (!neighborhoodMap.has(neighborhood)) {
        neighborhoodMap.set(neighborhood, {
          neighborhood,
          count: 0,
          avgValue: 0,
          pricePerSqm: Math.random() * 5000 + 2000, // Simulated data
          appreciation: (Math.random() - 0.5) * 20 // -10% to +10%
        });
      }

      const stats = neighborhoodMap.get(neighborhood)!;
      stats.count++;
      stats.avgValue += property.value;
    });

    // Calculate averages
    neighborhoodMap.forEach(stats => {
      stats.avgValue = stats.avgValue / stats.count;
    });

    return Array.from(neighborhoodMap.values()).sort((a, b) => b.count - a.count);
  }, [properties]);

  // Market insights
  const marketInsights = useMemo(() => {
    const totalProperties = properties.length;
    const totalValue = properties.reduce((sum, p) => sum + p.value, 0);
    const avgValue = totalValue / totalProperties;
    
    const availableCount = properties.filter(p => p.status === 'available').length;
    const rentedCount = properties.filter(p => p.status === 'rented').length;
    const occupancyRate = ((rentedCount / totalProperties) * 100);

    const cityWithMostProperties = cityStats[0];
    const highestValueCity = cityStats.reduce((prev, current) => 
      prev.avgValue > current.avgValue ? prev : current
    );

    return {
      totalProperties,
      totalValue,
      avgValue,
      occupancyRate,
      availableCount,
      rentedCount,
      cityWithMostProperties,
      highestValueCity,
      topNeighborhoods: neighborhoodStats.slice(0, 5)
    };
  }, [properties, cityStats, neighborhoodStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'rented': return 'bg-blue-500';
      case 'airbnb': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'sold': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment': return Building2;
      case 'house': return Home;
      default: return MapPin;
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Home className="h-4 w-4" />
              Portfolio Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{marketInsights.totalProperties}</div>
              <div className="text-sm text-muted-foreground">
                Valor Total: {formatCurrency(marketInsights.totalValue)}
              </div>
              <div className="text-sm text-muted-foreground">
                Valor Médio: {formatCurrency(marketInsights.avgValue)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Taxa de Ocupação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{marketInsights.occupancyRate.toFixed(1)}%</div>
              <ProgressBar value={marketInsights.occupancyRate} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {marketInsights.rentedCount} alugados de {marketInsights.totalProperties}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Principais Mercados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <div className="font-medium">{marketInsights.cityWithMostProperties?.city}</div>
                <div className="text-muted-foreground">
                  {marketInsights.cityWithMostProperties?.count} propriedades
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">{marketInsights.highestValueCity?.city}</div>
                <div className="text-muted-foreground">
                  Maior valor médio: {formatCurrency(marketInsights.highestValueCity?.avgValue || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Análise por Cidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cityStats.map((city, index) => (
              <div key={city.city} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{city.city}</h3>
                    <p className="text-sm text-muted-foreground">
                      {city.count} propriedades • Valor médio: {formatCurrency(city.avgValue)}
                    </p>
                  </div>
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                </div>

                {/* Status Distribution */}
                <div className="mb-3">
                  <div className="text-sm font-medium mb-2">Status das Propriedades:</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(city.statusDistribution).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-1 text-xs">
                        <div className={`w-3 h-3 rounded ${getStatusColor(status)}`} />
                        <span>{status}: {count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type Distribution */}
                <div>
                  <div className="text-sm font-medium mb-2">Tipos de Propriedades:</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(city.typeDistribution).map(([type, count]) => {
                      const Icon = getTypeIcon(type);
                      return (
                        <div key={type} className="flex items-center gap-1 text-xs">
                          <Icon className="w-3 h-3" />
                          <span>{type}: {count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Neighborhood Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Top Bairros/Regiões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {marketInsights.topNeighborhoods.map((neighborhood, index) => (
              <div key={neighborhood.neighborhood} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{neighborhood.neighborhood}</div>
                  <div className="text-sm text-muted-foreground">
                    {neighborhood.count} propriedades
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">
                    {formatCurrency(neighborhood.avgValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    R$ {neighborhood.pricePerSqm?.toFixed(0)}/m²
                  </div>
                  {neighborhood.appreciation && (
                    <Badge 
                      variant={neighborhood.appreciation > 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {neighborhood.appreciation > 0 ? '+' : ''}{neighborhood.appreciation.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Investment Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Oportunidades de Investimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-medium text-green-800 mb-1">Mercado em Crescimento</div>
              <div className="text-sm text-green-700">
                {marketInsights.highestValueCity?.city} apresenta o maior valor médio de propriedades
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800 mb-1">Expansão Recomendada</div>
              <div className="text-sm text-blue-700">
                Considere expandir em {marketInsights.cityWithMostProperties?.city} - já possui {marketInsights.cityWithMostProperties?.count} propriedades
              </div>
            </div>

            {marketInsights.availableCount > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800 mb-1">Oportunidade de Aluguel</div>
                <div className="text-sm text-yellow-700">
                  {marketInsights.availableCount} propriedades disponíveis podem gerar receita adicional
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
