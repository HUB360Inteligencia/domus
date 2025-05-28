
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Paperclip, Trash2, Plus } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyInvestment } from '@/types/property-investment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropertyInvestments } from '@/hooks/use-property-investments';

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { deleteInvestment, isDeleting } = usePropertyInvestments(property?.id || null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getInvestmentTypeLabel = (type: string) => {
    const types = {
      'purchase': 'Compra',
      'improvement': 'Melhoria',
      'renovation': 'Reforma',
      'maintenance': 'Manutenção',
      'other': 'Outros'
    };
    return types[type as keyof typeof types] || type;
  };

  const getInvestmentTypeBadge = (type: string) => {
    const variants = {
      'purchase': 'default',
      'improvement': 'secondary',
      'renovation': 'outline',
      'maintenance': 'destructive',
      'other': 'secondary'
    };
    return variants[type as keyof typeof variants] || 'secondary';
  };

  const handleViewDetails = (investment: PropertyInvestment) => {
    setSelectedInvestment(investment);
    setShowDetailsModal(true);
  };

  const handleViewReceipt = (receiptUrl: string) => {
    window.open(receiptUrl, '_blank');
  };

  const handleDeleteInvestment = (investmentId: string) => {
    if (confirm('Tem certeza que deseja excluir este investimento?')) {
      deleteInvestment(investmentId);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
        <CardContent className="p-6">
          {investments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum investimento registrado ainda.</p>
              <p className="text-sm text-muted-foreground">
                Adicione investimentos para acompanhar o histórico financeiro do imóvel.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {investment.description || 'Investimento sem nome'}
                          </div>
                          {investment.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {investment.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getInvestmentTypeBadge(investment.investment_type) as any}
                          className="text-xs"
                        >
                          {getInvestmentTypeLabel(investment.investment_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(investment.amount)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(investment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(investment)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {investment.receipt_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewReceipt(investment.receipt_url!)}
                              className="h-8 w-8 p-0"
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteInvestment(investment.id)}
                            disabled={isDeleting}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Investimento */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Investimento</DialogTitle>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Tipo</label>
                <p>{getInvestmentTypeLabel(selectedInvestment.investment_type)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Valor</label>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(selectedInvestment.amount)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Data</label>
                <p>{format(new Date(selectedInvestment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
              </div>
              
              {selectedInvestment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Descrição</label>
                  <p className="text-sm text-gray-700">{selectedInvestment.description}</p>
                </div>
              )}
              
              {selectedInvestment.receipt_url && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Comprovante</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReceipt(selectedInvestment.receipt_url!)}
                    className="mt-1"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Ver Anexo
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
