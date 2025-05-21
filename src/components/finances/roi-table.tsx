
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/utils/financial-formatters';

interface RoiTableProps {
  propertyROIs: Array<{
    propertyId: string;
    propertyTitle: string;
    roi: number;
    monthlyROI: number;
    annualROI: number;
  }>;
  propertyValues: Record<string, number>;
}

export const RoiTable = ({ propertyROIs, propertyValues }: RoiTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de ROI por Imóvel</CardTitle>
      </CardHeader>
      <CardContent>
        {propertyROIs && propertyROIs.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="py-2 px-4 text-left">Imóvel</th>
                  <th className="py-2 px-4 text-right">Valor</th>
                  <th className="py-2 px-4 text-right">ROI Mensal</th>
                  <th className="py-2 px-4 text-right">ROI Anual</th>
                </tr>
              </thead>
              <tbody>
                {propertyROIs.map((item) => (
                  <tr key={item.propertyId} className="border-b">
                    <td className="py-2 px-4">{item.propertyTitle || 'Sem título'}</td>
                    <td className="py-2 px-4 text-right">
                      {formatCurrency(propertyValues[item.propertyId] || 0)}
                    </td>
                    <td className="py-2 px-4 text-right">{formatPercentage(item.monthlyROI || 0)}</td>
                    <td className="py-2 px-4 text-right">{formatPercentage(item.annualROI || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">Nenhuma análise de ROI disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
