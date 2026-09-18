import { supabase } from "@/integrations/supabase/client";
import { Document, DocumentFormData } from "@/types/contract";

import { logger } from "@/lib/logger";

const BUCKET = 'contract_documents';
export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;

// Cabeçalho dos arquivos criptografados: "DOMUSENC1" + salt(16) + iv(12) + dados AES-GCM
const ENCRYPTION_MAGIC = new TextEncoder().encode('DOMUSENC1');
const SALT_BYTES = 16;
const IV_BYTES = 12;
const PBKDF2_ITERATIONS = 250_000;

export class DocumentPasswordError extends Error {
  constructor(message = 'Senha incorreta. Não foi possível abrir o documento.') {
    super(message);
    this.name = 'DocumentPasswordError';
  }
}

/**
 * O Storage do Supabase rejeita chaves com acentos e vários símbolos ("Invalid key"),
 * então o nome original fica só na tabela e o caminho usa uma versão ASCII segura.
 */
export const sanitizeStorageFileName = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  const rawBase = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  const rawExt = lastDot > 0 ? fileName.slice(lastDot + 1) : '';

  const clean = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');

  const base = clean(rawBase).slice(0, 80) || 'documento';
  const ext = clean(rawExt).toLowerCase().slice(0, 10);
  return ext ? `${base}.${ext}` : base;
};

const deriveKey = async (password: string, salt: Uint8Array) => {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

export const encryptFileContent = async (file: Blob, password: string): Promise<Blob> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await file.arrayBuffer());

  return new Blob([ENCRYPTION_MAGIC, salt, iv, new Uint8Array(cipher)], { type: 'application/octet-stream' });
};

export const decryptFileContent = async (encrypted: Blob, password: string, mimeType: string): Promise<Blob> => {
  const bytes = new Uint8Array(await encrypted.arrayBuffer());
  const headerLength = ENCRYPTION_MAGIC.length;
  const hasHeader = ENCRYPTION_MAGIC.every((byte, index) => bytes[index] === byte);

  if (!hasHeader) {
    throw new Error('Formato de criptografia não reconhecido para este documento.');
  }

  const salt = bytes.slice(headerLength, headerLength + SALT_BYTES);
  const iv = bytes.slice(headerLength + SALT_BYTES, headerLength + SALT_BYTES + IV_BYTES);
  const payload = bytes.slice(headerLength + SALT_BYTES + IV_BYTES);

  try {
    const key = await deriveKey(password, salt);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, payload);
    return new Blob([plain], { type: mimeType || 'application/octet-stream' });
  } catch {
    throw new DocumentPasswordError();
  }
};

/**
 * Fetches all documents for the current user
 */
export const fetchDocuments = async (category?: string): Promise<Document[]> => {
  try {
    logger.log('Fetching documents...');
    let query = supabase.from('documents').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching documents:', error);
      throw new Error(error.message);
    }

    logger.log(`Documents fetched successfully: ${data?.length || 0}`);
    return data || [];
  } catch (err) {
    logger.error('Failed to fetch documents:', err);
    throw err;
  }
};

/**
 * Fetches documents associated with a specific contract
 */
export const fetchContractDocuments = async (contractId: string): Promise<Document[]> => {
  try {
    logger.log(`Fetching documents for contract: ${contractId}`);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching contract documents:', error);
      throw new Error(error.message);
    }

    logger.log(`Contract documents fetched successfully: ${data?.length || 0}`);
    return data || [];
  } catch (err) {
    logger.error(`Failed to fetch documents for contract ${contractId}:`, err);
    throw err;
  }
};

/**
 * Uploads a document. When `is_encrypted` is set the file is encrypted in the
 * browser with the given password (AES-GCM + PBKDF2) before leaving the device.
 */
export const uploadDocument = async (documentData: DocumentFormData): Promise<Document> => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Usuário não autenticado');

  const originalFile = documentData.file;
  if (!originalFile) throw new Error('Selecione um arquivo para enviar.');
  if (originalFile.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(`O arquivo deve ter no máximo ${Math.round(MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024)}MB.`);
  }

  const isEncrypted = Boolean(documentData.is_encrypted);
  if (isEncrypted && !documentData.password) {
    throw new Error('Informe uma senha para criptografar o documento.');
  }

  const mimeType = originalFile.type || 'application/octet-stream';
  const body = isEncrypted
    ? await encryptFileContent(originalFile, documentData.password as string)
    : originalFile;

  const randomString = Math.random().toString(36).substring(2, 8);
  const safeName = sanitizeStorageFileName(originalFile.name);
  const filePath = `${user.id}/${Date.now()}-${randomString}-${safeName}${isEncrypted ? '.enc' : ''}`;

  const { error: uploadError } = await supabase
    .storage
    .from(BUCKET)
    .upload(filePath, body, {
      contentType: isEncrypted ? 'application/octet-stream' : mimeType,
      upsert: false,
    });

  if (uploadError) {
    logger.error('Error uploading document:', uploadError);
    throw new Error(`Falha ao enviar o arquivo: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      name: documentData.name.trim() || originalFile.name,
      file_path: filePath,
      // Guardamos o tipo original para conseguir exibir o arquivo depois de descriptografar
      file_type: mimeType,
      file_size: originalFile.size,
      is_encrypted: isEncrypted,
      category: documentData.category,
      contract_id: documentData.contract_id || null,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    logger.error('Error saving document metadata:', error);
    throw new Error(error.message);
  }

  logger.log('Document uploaded successfully:', data?.id);
  return data;
};

/**
 * Returns the document content as a Blob (decrypted when needed).
 */
export const getDocumentBlob = async (document: Document, password?: string): Promise<Blob> => {
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .download(document.file_path);

  if (error || !data) {
    logger.error('Error downloading document:', error);
    const message = error?.message || '';
    if (/not found|object not found|404/i.test(message)) {
      throw new Error('O arquivo deste documento não foi encontrado no armazenamento.');
    }
    throw new Error(message || 'Não foi possível baixar o documento.');
  }

  if (document.is_encrypted) {
    if (!password) throw new DocumentPasswordError('Informe a senha do documento.');
    const mimeType = document.file_type === 'application/encrypted' ? 'application/octet-stream' : document.file_type;
    return decryptFileContent(data, password, mimeType);
  }

  return data.type ? data : new Blob([data], { type: document.file_type });
};

/** Nome de arquivo para download, garantindo a extensão original. */
export const getDocumentDownloadName = (document: Document): string => {
  const pathName = document.file_path.split('/').pop() || '';
  const storedExt = pathName.replace(/\.enc$/, '').split('.').pop();
  const hasExt = /\.[A-Za-z0-9]{1,10}$/.test(document.name);
  return hasExt || !storedExt || storedExt === pathName ? document.name : `${document.name}.${storedExt}`;
};

/**
 * Deletes a document
 */
export const deleteDocument = async (document: Document): Promise<void> => {
  try {
    // Delete the metadata from the database first: RLS silently filters rows
    // the user cannot delete (0 rows, no error), and we must not remove the
    // file from storage in that case.
    const { error: dbError, count } = await supabase
      .from('documents')
      .delete({ count: 'exact' })
      .eq('id', document.id);

    if (dbError) {
      logger.error('Error deleting document from database:', dbError);
      throw new Error(dbError.message);
    }

    if (!count) {
      throw new Error('Você não tem permissão para excluir este documento.');
    }

    const { error: storageError } = await supabase
      .storage
      .from(BUCKET)
      .remove([document.file_path]);

    if (storageError) {
      // The metadata is already gone; log but don't fail the whole operation.
      logger.error('Error deleting document file from storage:', storageError);
    }

    logger.log('Document deleted successfully');
  } catch (err) {
    logger.error('Delete document error:', err);
    throw err;
  }
};
