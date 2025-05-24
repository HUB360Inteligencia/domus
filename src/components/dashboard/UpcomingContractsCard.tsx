
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Contract } from '@/types/contract';

interface UpcomingContractsCardProps {
  contracts: Contract[];
  isLoading: boolean;
}

export function UpcomingContractsCard({ contracts, isLoading }: UpcomingContractsCardProps) {
  const today = new Date();
  const in90Days = addDays(today, 90);

  const upcomingContracts = contracts
    .filter(contract => {
      const endDate = parseISO(contract.end_date);
      return endDate >= today && endDate <= in90Days;
    })
    .map(contract => {
      const endDate = parseISO(contract.end_date);
      const daysRemaining = differenceInDays(endDate, today);
      return {
        ...contract,
        daysRemaining,
        endDate
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const getBadgeVariant = (days: number) => {
    if (days <= 15) return "destructive";
    if (days <= 30) return "secondary";
    return "default";
  };

  return (
    <Card>
      <CardHeader className="px-3 md:px-6 py-3 md:py-6">
        <CardTitle className="text-sm md:text-lg">Próximos Vencimentos</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Contratos com vencimento nos próximos 90 dias
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : upcomingContracts.length > 0 ? (
          <div className="space-y-4 max-h-[200px] overflow-y-auto">
            {upcomingContracts.map((contract) => (
              <div key={contract.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs md:text-sm truncate">
                    {contract.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {contract.property?.title || 'Sem imóvel'} - {contract.property?.neighborhood || ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vence em {format(contract.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <Badge variant={getBadgeVariant(contract.daysRemaining)} className="text-xs ml-2">
                  {contract.daysRemaining} dias
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-xs md:text-sm text-muted-foreground">
              Nenhum contrato com vencimento próximo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
