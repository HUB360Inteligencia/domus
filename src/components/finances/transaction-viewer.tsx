
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FinancialTransaction } from '@/hooks/use-financial-transactions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Eye, Calendar, CreditCard, MapPin, Tag, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionViewerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinancialTransaction | null;
}

export const TransactionViewer: React.FC<TransactionViewerProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!transaction) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Parse rental details if it's a rental management transaction
  let rentalDetails = null;
  if (transaction.subcategory === 'rental-management' && transaction.description) {
    try {
      rentalDetails = JSON.parse(transaction.description);
    } catch (error) {
      console.log('Could not parse rental details:', error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Detalhes da Transação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm font-semibold">{transaction.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <div className="flex items-center gap-2">
                  <Badge variant={transaction.transaction_type === 'income' ? 'default' : 'destructive'} className="text-xs">
                    {transaction.transaction_type === 'income' ? 'Receita' : 'Despesa'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor</label>
                <p className={`text-lg font-bold ${
                  transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Data
                </label>
                <p className="text-sm">{formatDate(transaction.transaction_date)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Categoria
                </label>
                <p className="text-sm">{transaction.category_name}</p>
              </div>

              {transaction.payment_method && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Forma de Pagamento
                  </label>
                  <p className="text-sm capitalize">{transaction.payment_method}</p>
                </div>
              )}
            </div>
          </div>

          {/* Property Information */}
          {transaction.property_title && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Propriedade
                </label>
                <p className="text-sm font-semibold">{transaction.property_title}</p>
              </div>
            </>
          )}

          {/* Description */}
          {transaction.description && !rentalDetails && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{transaction.description}</p>
              </div>
            </>
          )}

          {/* Rental Management Details */}
          {rentalDetails && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Extrato de Gestão de Aluguéis
                </label>
                
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Receitas</div>
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(rentalDetails.totalIncome || 0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Despesas</div>
                    <div className="text-sm font-semibold text-red-600">
                      {formatCurrency(rentalDetails.totalExpense || 0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Saldo</div>
                    <div className={`text-sm font-semibold ${(rentalDetails.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(rentalDetails.balance || 0)}
                    </div>
                  </div>
                </div>

                {/* Items */}
                {rentalDetails.items && rentalDetails.items.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <h4 className="text-sm font-medium">Itens do Período:</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {rentalDetails.items.map((item: any, index: number) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded text-xs ${
                          item.type === 'income' ? 'bg-green-50 border-l-2 border-green-500' : 'bg-red-50 border-l-2 border-red-500'
                        }`}>
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-muted-foreground">{item.categoryName}</div>
                          </div>
                          <div className={`font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Receipt */}
          {transaction.receipt_url && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Comprovante</label>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(transaction.receipt_url!, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-3 w-3" />
                    Ver Comprovante
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Recurring Information */}
          {transaction.recurring && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Informações de Recorrência</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Frequência</div>
                    <div className="text-sm capitalize">{transaction.recurring_frequency}</div>
                  </div>
                  {transaction.recurring_end_date && (
                    <div>
                      <div className="text-xs text-muted-foreground">Data de Término</div>
                      <div className="text-sm">{formatDate(transaction.recurring_end_date)}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <div>Criado em: {formatDate(transaction.created_at)}</div>
            </div>
            <div>
              <div>Atualizado em: {formatDate(transaction.updated_at)}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
