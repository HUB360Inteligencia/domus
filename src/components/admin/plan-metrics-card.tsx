
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlanMetricsCardProps {
  planName: string;
  clientCount: number;
  mrr: number;
  retentionRate: number;
}

export function PlanMetricsCard({
  planName,
  clientCount,
  mrr,
  retentionRate
}: PlanMetricsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{planName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Clientes</p>
            <p className="text-2xl font-bold">{clientCount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">MRR</p>
            <p className="text-2xl font-bold">
              {mrr.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Retenção</p>
            <p className="text-2xl font-bold">{retentionRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
