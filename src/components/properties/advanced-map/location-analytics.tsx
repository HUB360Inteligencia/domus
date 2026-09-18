import { useMemo } from 'react';
import { Building2, DollarSign, Home, MapPin, TrendingUp, Users } from 'lucide-react';
import type { Property } from '@/types/property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { calculateLocationAnalytics } from '@/lib/property-map-data';

interface LocationAnalyticsProps {
  properties: Property[];
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  airbnb: 'Airbnb',
  maintenance: 'Em manutenção',
  sold: 'Vendido',
};

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  commercial: 'Comercial',
  land: 'Terreno',
  rural: 'Rural',
};

export function LocationAnalytics({ properties }: LocationAnalyticsProps) {
  const analytics = useMemo(() => calculateLocationAnalytics(properties), [properties]);

  if (!analytics.totalProperties) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-8 text-center">
        <MapPin className="mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="font-semibold">Sem dados para analisar</h3>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre imóveis para gerar a análise geográfica.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={Home}
          title="Portfólio total"
          value={String(analytics.totalProperties)}
          details={[
            `Valor total: ${formatCurrency(analytics.totalValue)}`,
            `Valor médio: ${formatCurrency(analytics.avgValue)}`,
          ]}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Taxa de ocupação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{analytics.occupancyRate.toFixed(1)}%</div>
            <ProgressBar value={analytics.occupancyRate} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {analytics.occupiedCount} ocupados de {analytics.totalProperties}
            </p>
          </CardContent>
        </Card>

        <MetricCard
          icon={TrendingUp}
          title="Principais mercados"
          value={analytics.cityWithMostProperties?.city || '—'}
          details={[
            `${analytics.cityWithMostProperties?.count || 0} imóveis na maior carteira`,
            analytics.highestValueCity
              ? `Maior valor médio: ${analytics.highestValueCity.city}`
              : 'Sem valores de mercado',
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Análise por cidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.cityStats.map((city, index) => (
            <div key={city.city} className="rounded-lg border p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{city.city}</h3>
                  <p className="text-sm text-muted-foreground">
                    {city.count} imóveis • Valor médio: {formatCurrency(city.avgValue)}
                  </p>
                </div>
                <Badge variant={index === 0 ? 'default' : 'secondary'}>#{index + 1}</Badge>
              </div>

              <Distribution
                title="Status"
                values={city.statusDistribution}
                labels={STATUS_LABELS}
              />
              <Distribution
                title="Tipos"
                values={city.typeDistribution}
                labels={TYPE_LABELS}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bairros com dados cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.neighborhoodStats.length ? (
            <div className="space-y-3">
              {analytics.neighborhoodStats.slice(0, 10).map((neighborhood, index) => (
                <div key={neighborhood.neighborhood} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <div className="font-medium">#{index + 1} {neighborhood.neighborhood}</div>
                    <div className="text-sm text-muted-foreground">{neighborhood.count} imóveis</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{formatCurrency(neighborhood.avgValue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {neighborhood.avgPricePerSqm === null
                        ? 'Preço/m² não informado'
                        : `${formatCurrency(neighborhood.avgPricePerSqm)}/m²`}
                    </div>
                    {neighborhood.avgAnnualReturn !== null && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {neighborhood.avgAnnualReturn.toFixed(1)}% a.a.
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Informe o bairro dos imóveis para habilitar esta comparação.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Indicadores acionáveis
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Insight
            title="Disponibilidade"
            description={`${analytics.availableCount} imóvel(eis) disponível(is) para ocupação ou comercialização.`}
          />
          <Insight
            title="Maior ticket médio"
            description={
              analytics.highestValueCity
                ? `${analytics.highestValueCity.city}: ${formatCurrency(analytics.highestValueCity.avgValue)} por imóvel.`
                : 'Não há valores suficientes para comparar cidades.'
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  details,
}: {
  icon: typeof Home;
  title: string;
  value: string;
  details: string[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{value}</div>
        {details.map((detail) => (
          <p key={detail} className="text-sm text-muted-foreground">{detail}</p>
        ))}
      </CardContent>
    </Card>
  );
}

function Distribution({
  title,
  values,
  labels,
}: {
  title: string;
  values: Record<string, number>;
  labels: Record<string, string>;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(values).map(([key, count]) => (
          <Badge key={key} variant="outline">{labels[key] || key}: {count}</Badge>
        ))}
      </div>
    </div>
  );
}

function Insight({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-1 font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
  );
}
