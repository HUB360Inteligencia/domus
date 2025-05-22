
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatPercentage } from '@/hooks/use-financial-dashboard';

interface RankingItem {
  id: string;
  name: string;
  [key: string]: any; // For additional properties
}

interface PropertyRankingItem extends RankingItem {
  type: string;
  location: string;
  return: number;
  percentage: number;
}

interface NeighborhoodRankingItem extends RankingItem {
  properties: number;
  totalReturn: number;
  averageReturn: number;
}

interface RankingCardProps {
  title: string;
  description: string;
  items: PropertyRankingItem[] | NeighborhoodRankingItem[];
  rankingType: 'value' | 'percentage';
  onRankingTypeChange: (value: 'value' | 'percentage') => void;
  itemType: 'property' | 'neighborhood';
  isLoading?: boolean;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  title,
  description,
  items,
  rankingType,
  onRankingTypeChange,
  itemType,
  isLoading
}) => {
  // Sort items based on ranking type and item type
  const sortedItems = React.useMemo(() => {
    if (items.length === 0) return [];
    
    return [...items].sort((a, b) => {
      if (itemType === 'property') {
        const propA = a as PropertyRankingItem;
        const propB = b as PropertyRankingItem;
        return rankingType === 'value' 
          ? propB.return - propA.return 
          : propB.percentage - propA.percentage;
      } else {
        const neighA = a as NeighborhoodRankingItem;
        const neighB = b as NeighborhoodRankingItem;
        return rankingType === 'value' 
          ? neighB.totalReturn - neighA.totalReturn 
          : neighB.averageReturn - neighA.averageReturn;
      }
    });
  }, [items, rankingType, itemType]);
  
  // Render property item
  const renderPropertyItem = (property: PropertyRankingItem, index: number) => (
    <div key={property.id} className="flex items-center">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mr-3">
        {index + 1}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between">
          <p className="font-medium">{property.name}</p>
          <p className="font-semibold">
            {rankingType === 'value' 
              ? formatCurrency(property.return)
              : formatPercentage(property.percentage)
            }
          </p>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{property.type} • {property.location}</span>
          <span>
            {rankingType === 'value' 
              ? formatPercentage(property.percentage)
              : formatCurrency(property.return)
            }
          </span>
        </div>
      </div>
    </div>
  );
  
  // Render neighborhood item
  const renderNeighborhoodItem = (neighborhood: NeighborhoodRankingItem, index: number) => (
    <div key={neighborhood.id} className="flex items-center">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mr-3">
        {index + 1}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between">
          <p className="font-medium">{neighborhood.name}</p>
          <p className="font-semibold">
            {rankingType === 'value' 
              ? formatCurrency(neighborhood.totalReturn)
              : formatPercentage(neighborhood.averageReturn)
            }
          </p>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{neighborhood.properties} imóveis</span>
          <span>
            {rankingType === 'value' 
              ? formatPercentage(neighborhood.averageReturn)
              : formatCurrency(neighborhood.totalReturn)
            }
          </span>
        </div>
      </div>
    </div>
  );
  
  return (
    <Card className="backdrop-blur-sm border-opacity-40 h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Tabs value={rankingType} onValueChange={(value: 'value' | 'percentage') => onRankingTypeChange(value as 'value' | 'percentage')}>
            <TabsList className="h-8">
              <TabsTrigger 
                className="text-xs px-3 h-7" 
                value="value"
              >
                Valor (R$)
              </TabsTrigger>
              <TabsTrigger 
                className="text-xs px-3 h-7" 
                value="percentage"
              >
                Percentual (%)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center">
                <div className="h-8 w-8 rounded-full bg-muted mr-3"></div>
                <div className="flex-grow">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="h-48 w-full flex items-center justify-center">
            <div className="text-muted-foreground">Sem dados para exibir</div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedItems.map((item, index) => 
              itemType === 'property' 
                ? renderPropertyItem(item as PropertyRankingItem, index) 
                : renderNeighborhoodItem(item as NeighborhoodRankingItem, index)
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
