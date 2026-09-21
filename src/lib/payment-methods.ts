/**
 * Meios de pagamento de `financial_transactions.payment_method`.
 *
 * A coluna é texto livre no banco; esta lista é a fonte única dos rótulos usados
 * no formulário de transação e nas baixas de parcela.
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  cheque: 'Cheque',
  financiamento: 'Financiamento',
  consorcio: 'Consórcio',
  permuta: 'Permuta',
  outros: 'Outros',
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const formatPaymentMethod = (value?: string | null): string =>
  value ? PAYMENT_METHOD_LABELS[value] ?? value : '—';
