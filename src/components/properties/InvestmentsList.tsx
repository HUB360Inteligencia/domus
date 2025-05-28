
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Trash2, Receipt, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [selectedInvestment, setSelectedInvestment] = useState<PropertyInvestment | null>(null);
  const { deleteInvestment, isDeleting } = usePropertyInvestments(property?.id || null);

  const investmentTypeLabels: Record<string, string> = {
    purchase: 'Compra',
    improvement: 'Melhorias',
    renovation: 'Reformas',
    maintenance: 'Manutenção',
    other: 'Outros'
  };

  const investmentTypeColors: Record<string, string> = {
    purchase: 'bg-blue-100 text-blue-800 border-blue-200',
    improvement: 'bg-green-100 text-green-800 border-green-200',
    renovation: 'bg-purple-100 text-purple-800 border-purple-200',
    maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (investments.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
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
    <>
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {investment.description || `Investimento ${investmentTypeLabels[investment.investment_type]}`}
                      </div>
                      {investment.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {investment.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={investmentTypeColors[investment.investment_type] || investmentTypeColors.other}
                    >
                      {investmentTypeLabels[investment.investment_type] || investment.investment_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {formatCurrency(investment.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(investment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {investment.receipt_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(investment.receipt_url!, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedInvestment(investment)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvestment(investment.id)}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Investimento */}
      <Dialog open={!!selectedInvestment} onOpenChange={() => setSelectedInvestment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Investimento</DialogTitle>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="font-medium">
                    {investmentTypeLabels[selectedInvestment.investment_type] || selectedInvestment.investment_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <p className="font-medium">{formatCurrency(selectedInvestment.amount)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data do Investimento</label>
                <p className="font-medium">
                  {format(new Date(selectedInvestment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              
              {selectedInvestment.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="font-medium">{selectedInvestment.description}</p>
                </div>
              )}
              
              {selectedInvestment.receipt_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Comprovante</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedInvestment.receipt_url!, '_blank')}
                    className="w-full mt-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Comprovante
                  </Button>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span>Criado em:</span>
                    <p>{format(new Date(selectedInvestment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                  <div>
                    <span>Atualizado em:</span>
                    <p>{format(new Date(selectedInvestment.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
