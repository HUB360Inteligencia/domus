
import React, { useState, useMemo } from 'react';
import { Property } from '@/types/property';
import { PropertyInvestment } from '@/types/property-investment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Receipt, Trash2, Filter, SortAsc, SortDesc, Search, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface InvestmentHistoryTableProps {
  property: Property | null | undefined;
  investments: PropertyInvestment[];
  isLoading: boolean;
}

export const InvestmentHistoryTable: React.FC<InvestmentHistoryTableProps> = ({
  property,
  investments,
  isLoading
}) => {
  const { deleteInvestment } = usePropertyInvestments(property?.id || null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const typeLabels: Record<string, string> = {
    purchase: 'Compra',
    improvement: 'Melhorias',
    renovation: 'Reformas',
    maintenance: 'Manutenção',
    other: 'Outros'
  };

  const getInvestmentTypeBadgeColor = (type: string) => {
    const colors = {
      purchase: 'bg-orange-100 text-orange-800',
      improvement: 'bg-blue-100 text-blue-800',
      renovation: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredAndSortedInvestments = useMemo(() => {
    let filtered = investments.filter(investment => {
      const matchesSearch = 
        investment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeLabels[investment.investment_type]?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || investment.investment_type === typeFilter;
      
      return matchesSearch && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.investment_date).getTime();
          bValue = new Date(b.investment_date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'type':
          aValue = typeLabels[a.investment_type] || a.investment_type;
          bValue = typeLabels[b.investment_type] || b.investment_type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [investments, searchTerm, typeFilter, sortField, sortDirection]);

  const handleSort = (field: 'date' | 'amount' | 'type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: 'date' | 'amount' | 'type') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
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
          <Receipt className="h-5 w-5" />
          Histórico de Investimentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros e Pesquisa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pesquisa */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar investimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro por Tipo */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="purchase">Compra</SelectItem>
              <SelectItem value="improvement">Melhorias</SelectItem>
              <SelectItem value="renovation">Reformas</SelectItem>
              <SelectItem value="maintenance">Manutenção</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>

          {/* Botões de Ordenação */}
          <div className="flex gap-2">
            <Button
              variant={sortField === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('date')}
              className="flex items-center gap-1"
            >
              Data {getSortIcon('date')}
            </Button>
            <Button
              variant={sortField === 'amount' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('amount')}
              className="flex items-center gap-1"
            >
              Valor {getSortIcon('amount')}
            </Button>
            <Button
              variant={sortField === 'type' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('type')}
              className="flex items-center gap-1"
            >
              Tipo {getSortIcon('type')}
            </Button>
          </div>
        </div>

        {/* Tabela de Investimentos */}
        <div className="space-y-3">
          {filteredAndSortedInvestments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchTerm || typeFilter !== 'all' ? (
                <p>Nenhum investimento encontrado com os filtros aplicados</p>
              ) : (
                <>
                  <p>Nenhum investimento adicional registrado</p>
                  <p className="text-sm">Adicione investimentos como melhorias, reparos e manutenções</p>
                </>
              )}
            </div>
          ) : (
            filteredAndSortedInvestments.map((investment) => (
              <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getInvestmentTypeBadgeColor(investment.investment_type)}>
                      {typeLabels[investment.investment_type] || investment.investment_type}
                    </Badge>
                    <span className="font-medium text-lg">{formatCurrency(investment.amount)}</span>
                  </div>
                  {investment.description && (
                    <p className="text-sm text-muted-foreground mb-1">{investment.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(investment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {investment.receipt_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(investment.receipt_url, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Ver Anexo</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteInvestment(investment.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumo */}
        {filteredAndSortedInvestments.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Exibindo {filteredAndSortedInvestments.length} de {investments.length} investimentos
              {(searchTerm || typeFilter !== 'all') && ' (filtrados)'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
