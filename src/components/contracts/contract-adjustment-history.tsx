
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Calendar, Percent, FileText } from 'lucide-react';
import { useContractAdjustments } from '@/hooks/use-contract-adjustments';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractAdjustmentHistoryProps {
  contractId: string;
}

export function ContractAdjustmentHistory({ contractId }: ContractAdjustmentHistoryProps) {
  const { adjustments, isLoadingAdjustments } = useContractAdjustments(contractId);

  if (isLoadingAdjustments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Histórico de Reajustes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!adjustments || adjustments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Histórico de Reajustes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum reajuste foi aplicado a este contrato ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Histórico de Reajustes ({adjustments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {adjustments.map((adjustment) => {
          const percentageChange = ((adjustment.new_value - adjustment.old_value) / adjustment.old_value) * 100;
          
          return (
            <div 
              key={adjustment.id} 
              className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(new Date(adjustment.adjustment_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  {adjustment.applied_index && (
                    <Badge variant="secondary" className="text-xs">
                      {adjustment.applied_index}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">
                    De {formatCurrency(adjustment.old_value)} → {formatCurrency(adjustment.new_value)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Percent className="h-3 w-3 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      +{percentageChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                {adjustment.adjustment_reason && (
                  <div className="flex items-start space-x-2 mt-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {adjustment.adjustment_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
