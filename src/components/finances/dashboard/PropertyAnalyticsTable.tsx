
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { PropertyAnalyticsData } from '@/api/property-analytics';
import { formatCurrency } from '@/utils/currency';

interface PropertyAnalyticsTableProps {
  data: PropertyAnalyticsData[];
  isLoading: boolean;
  onPropertyClick?: (property: PropertyAnalyticsData) => void;
}

type SortField = keyof PropertyAnalyticsData;
type SortDirection = 'asc' | 'desc';

export function PropertyAnalyticsTable({ data, isLoading, onPropertyClick }: PropertyAnalyticsTableProps) {
  const [sortField, setSortField] = useState<SortField>('monthlyROI');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const getROIBadgeVariant = (roi: number) => {
    if (roi >= 1) return 'default';
    if (roi >= 0.5) return 'secondary';
    return 'outline';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'rented':
      case 'alugado':
        return 'default';
      case 'available':
      case 'disponível':
        return 'secondary';
      case 'maintenance':
      case 'manutenção':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'rented': 'Alugado',
      'available': 'Disponível',
      'maintenance': 'Manutenção',
      'sold': 'Vendido'
    };
    return translations[status] || status;
  };

  const translateType = (type: string) => {
    const translations: Record<string, string> = {
      'apartment': 'Apartamento',
      'house': 'Casa',
      'commercial': 'Comercial',
      'land': 'Terreno'
    };
    return translations[type] || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Propriedades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-12 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Análise de Propriedades
          <Badge variant="secondary" className="ml-auto">
            {data.length} propriedades
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('title')}
                    className="h-8 p-0 font-semibold"
                  >
                    Propriedade
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('type')}
                    className="h-8 p-0 font-semibold"
                  >
                    Tipo
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('city')}
                    className="h-8 p-0 font-semibold"
                  >
                    Localização
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('marketValue')}
                    className="h-8 p-0 font-semibold"
                  >
                    Valor de Mercado
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('monthlyROI')}
                    className="h-8 p-0 font-semibold"
                  >
                    ROI Mensal
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('vacancyRate')}
                    className="h-8 p-0 font-semibold"
                  >
                    Vacância
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('averageRevenue')}
                    className="h-8 p-0 font-semibold"
                  >
                    Receita Média
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((property) => (
                <TableRow key={property.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-sm">{property.title}</div>
                      {property.neighborhood && (
                        <div className="text-xs text-muted-foreground">{property.neighborhood}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {translateType(property.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{property.city}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(property.status)} className="text-xs">
                      {translateStatus(property.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(property.marketValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Badge variant={getROIBadgeVariant(property.monthlyROI)} className="text-xs">
                        {property.monthlyROI.toFixed(2)}%
                      </Badge>
                      {property.monthlyROI > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm ${property.vacancyRate > 50 ? 'text-red-600' : property.vacancyRate > 25 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {property.vacancyRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(property.averageRevenue)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPropertyClick?.(property)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma propriedade encontrada com os filtros aplicados.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
