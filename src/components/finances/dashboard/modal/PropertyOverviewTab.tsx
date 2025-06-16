
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PropertyAnalyticsData } from '@/api/property-analytics';
import { formatCurrency } from '@/utils/currency';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle,
  Home,
  MapPin,
  Calendar
} from 'lucide-react';

interface PropertyOverviewTabProps {
  property: PropertyAnalyticsData;
}

export function PropertyOverviewTab({ property }: PropertyOverviewTabProps) {
  const kpis = [
    {
      title: 'ROI Mensal',
      value: `${property.monthlyROI.toFixed(2)}%`,
      icon: property.monthlyROI > 0 ? TrendingUp : TrendingDown,
      color: property.monthlyROI > 0 ? 'text-green-600' : 'text-red-600',
      bgColor: property.monthlyROI > 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Cap Rate',
      value: `${property.capRate.toFixed(2)}%`,
      icon: Target,
      color: property.capRate > 6 ? 'text-green-600' : property.capRate > 4 ? 'text-yellow-600' : 'text-red-600',
      bgColor: property.capRate > 6 ? 'bg-green-50' : property.capRate > 4 ? 'bg-yellow-50' : 'bg-red-50'
    },
    {
      title: 'Cash-on-Cash',
      value: `${property.cashOnCash.toFixed(2)}%`,
      icon: DollarSign,
      color: property.cashOnCash > 8 ? 'text-green-600' : property.cashOnCash > 5 ? 'text-yellow-600' : 'text-red-600',
      bgColor: property.cashOnCash > 8 ? 'bg-green-50' : property.cashOnCash > 5 ? 'bg-yellow-50' : 'bg-red-50'
    },
    {
      title: 'Taxa de Vacância',
      value: `${property.vacancyRate.toFixed(1)}%`,
      icon: AlertTriangle,
      color: property.vacancyRate < 10 ? 'text-green-600' : property.vacancyRate < 25 ? 'text-yellow-600' : 'text-red-600',
      bgColor: property.vacancyRate < 10 ? 'bg-green-50' : property.vacancyRate < 25 ? 'bg-yellow-50' : 'bg-red-50'
    }
  ];

  const translateType = (type: string) => {
    const translations: Record<string, string> = {
      'apartment': 'Apartamento',
      'house': 'Casa',
      'commercial': 'Comercial',
      'land': 'Terreno'
    };
    return translations[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className={`${kpi.bgColor} border-0`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {kpi.title}
                  </p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>
                    {kpi.value}
                  </p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Informações da Propriedade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="font-semibold">{translateType(property.type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant="outline">{property.status}</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Localização
              </label>
              <p className="font-semibold">{property.city}</p>
              {property.neighborhood && (
                <p className="text-sm text-muted-foreground">{property.neighborhood}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Métricas Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor de Mercado:</span>
                <span className="font-semibold">{formatCurrency(property.marketValue)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Investimento Total:</span>
                <span className="font-semibold">{formatCurrency(property.totalInvestment)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Receita Média Mensal:</span>
                <span className="font-semibold text-green-600">{formatCurrency(property.averageRevenue)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Despesa Média Mensal:</span>
                <span className="font-semibold text-red-600">{formatCurrency(property.averageExpense)}</span>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Lucro Líquido Anual:</span>
                  <span className={`font-bold ${property.netIncome > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(property.netIncome)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análise de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {property.monthlyROI > 1 ? 'Excelente' : property.monthlyROI > 0.5 ? 'Bom' : 'Baixo'}
              </div>
              <div className="text-sm text-muted-foreground">Performance ROI</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {property.vacancyRate < 10 ? 'Baixa' : property.vacancyRate < 25 ? 'Média' : 'Alta'}
              </div>
              <div className="text-sm text-muted-foreground">Vacância</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {property.capRate > 6 ? 'Ótimo' : property.capRate > 4 ? 'Bom' : 'Regular'}
              </div>
              <div className="text-sm text-muted-foreground">Cap Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
