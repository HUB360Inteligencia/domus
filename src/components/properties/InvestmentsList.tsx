
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Edit, Trash2, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Property } from '@/types/property';
import { PropertyInvestment } from '@/types/property-investment';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { formatCurrency } from '@/utils/currency';

interface InvestmentsListProps {
  property: Property | null | undefined;
  investments: PropertyInvestment[];
  isLoading?: boolean;
}

export const InvestmentsList: React.FC<InvestmentsListProps> = ({
  property,
  investments,
  isLoading = false
}) => {
  const { deleteInvestment, isDeleting } = usePropertyInvestments(property?.id || null);

  const investmentTypeLabels: Record<string, string> = {
    purchase: 'Compra',
    improvement: 'Melhorias',
    renovation: 'Reformas',
    maintenance: 'Manutenção',
    other: 'Outros'
  };

  const investmentTypeColors: Record<string, string> = {
    purchase: 'bg-blue-100 text-blue-800',
    improvement: 'bg-green-100 text-green-800',
    renovation: 'bg-purple-100 text-purple-800',
    maintenance: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800'
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center text-muted-foreground">
            <p>Nenhum investimento registrado.</p>
            <p className="text-sm mt-2">
              Os investimentos ajudam a calcular o ROI do imóvel.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {investments.map((investment) => (
        <Card key={investment.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <Badge className={investmentTypeColors[investment.investment_type] || investmentTypeColors.other}>
                    {investmentTypeLabels[investment.investment_type] || investment.investment_type}
                  </Badge>
                  <span className="text-lg font-semibold">
                    {formatCurrency(investment.amount)}
                  </span>
                </div>
                
                {investment.description && (
                  <p className="text-muted-foreground">
                    {investment.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {format(new Date(investment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                  {investment.receipt_url && (
                    <div className="flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      <span>Comprovante anexado</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {investment.receipt_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(investment.receipt_url!, '_blank')}
                  >
                    <Receipt className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteInvestment(investment.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
