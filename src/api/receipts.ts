import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Bucket de comprovantes (transações e investimentos).
 * Os buckets "transaction_receipts" e "investment_receipts" usados antes nunca
 * existiram no Supabase, então todo upload de comprovante falhava.
 * `expense_receipts` existe, é público e aceita JPG, PNG e PDF de até 5MB.
 */
export const RECEIPTS_BUCKET = 'expense_receipts';
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const RECEIPT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const RECEIPT_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';

export type ReceiptFolder = 'transactions' | 'investments';

export const validateReceiptFile = (file: File): string | null => {
  const type = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (!RECEIPT_ALLOWED_TYPES.includes(type)) {
    return 'Envie o comprovante em JPG, PNG ou PDF.';
  }
  if (file.size > RECEIPT_MAX_BYTES) {
    return 'O comprovante deve ter no máximo 5MB.';
  }
  return null;
};

/** Envia o comprovante e devolve a URL pública. */
export const uploadReceiptFile = async (file: File, folder: ReceiptFolder): Promise<string> => {
  const validationError = validateReceiptFile(file);
  if (validationError) throw new Error(validationError);

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Usuário não autenticado');

  const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const filePath = `${userData.user.id}/${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(filePath, file, { contentType: file.type === 'image/jpg' ? 'image/jpeg' : file.type, upsert: false });

  if (error) {
    logger.error('Error uploading receipt:', error);
    throw new Error(`Não foi possível enviar o comprovante: ${error.message}`);
  }

  const { data } = supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

/** Caminho do arquivo no bucket a partir da URL pública (null se for de outro bucket). */
export const getReceiptStoragePath = (url?: string | null): string | null => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${RECEIPTS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
};

/** Remove o arquivo do comprovante; falhas só são registradas (o registro principal já foi apagado). */
export const removeReceiptFile = async (url?: string | null): Promise<void> => {
  const path = getReceiptStoragePath(url);
  if (!path) return;
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
  if (error) {
    logger.error('Error removing receipt from storage:', error);
  }
};
