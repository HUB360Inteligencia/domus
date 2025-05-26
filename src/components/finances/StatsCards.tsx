
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

interface AssetValueData {
  acquisition: string;
  current: string;
  growthPercentage: number;
}

interface PerformanceData {
  monthlyAverage: string;
  previousMonth: {
    percentage: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  occupancyRate: string;
}

interface StatsCardsProps {
  assetValueData: AssetValueData;
  performanceData: PerformanceData;
  showMarketValue: boolean;
  setShowMarketValue: (value: boolean) => void;
  isLoading?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  assetValueData,
  performanceData,
  showMarketValue,
  setShowMarketValue,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6 h-24">
              <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="backdrop-blur-sm border-opacity-40 hover:shadow-lg transition-all duration-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-muted-foreground">Valor do Patrimônio</h3>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Aquisição</span>
              <Switch 
                checked={showMarketValue} 
                onCheckedChange={setShowMarketValue} 
              />
              <span className="text-xs text-muted-foreground">Mercado</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-primary">
            {showMarketValue ? assetValueData.current : assetValueData.acquisition}
          </p>
          {showMarketValue && assetValueData.growthPercentage !== 0 && (
            <div className="flex items-center mt-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  assetValueData.growthPercentage > 0 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {assetValueData.growthPercentage > 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(assetValueData.growthPercentage).toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">vs. valor de aquisição</span>
            </div>
          )}
        </CardContent>
      </Card>

      <StatsCard
        title="Rentabilidade Mensal Média"
        value={performanceData.monthlyAverage}
        description="Média dos últimos 12 meses"
        icon={TrendingUp}
        iconColor="text-primary"
      />

      <Card className="backdrop-blur-sm border-opacity-40 hover:shadow-lg transition-all duration-200">
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium text-muted-foreground">Rentabilidade Mês Anterior</h3>
          <p className="text-2xl font-bold">
            {performanceData.previousMonth.percentage}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm">{performanceData.previousMonth.value}</span>
            {performanceData.previousMonth.trend === 'up' ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <ArrowUp className="h-3 w-3 mr-1" />
                Crescimento
              </Badge>
            ) : performanceData.previousMonth.trend === 'down' ? (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                <ArrowDown className="h-3 w-3 mr-1" />
                Queda
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Estável
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <StatsCard
        title="Taxa de Ocupação"
        value={performanceData.occupancyRate}
        description="Imóveis alugados vs. total"
        icon={Building}
        iconColor="text-primary"
      />
    </div>
  );
};
