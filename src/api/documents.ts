
import { supabase } from "@/integrations/supabase/client";
import { Document, DocumentFormData } from "@/types/contract";
import CryptoJS from "crypto-js";

import { logger } from "@/lib/logger";
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
 * Uploads a document with optional encryption
 */
export const uploadDocument = async (documentData: DocumentFormData): Promise<Document> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    let file = documentData.file;
    let isEncrypted = documentData.is_encrypted || false;
    let encryptionKey = '';
    
    // If encryption is requested, encrypt the file
    if (isEncrypted) {
      // Generate a random key for encryption
      encryptionKey = CryptoJS.lib.WordArray.random(16).toString();
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      // Convert to WordArray for CryptoJS
      const wordArray = CryptoJS.lib.WordArray.create(fileData);
      
      // Encrypt the file
      const encrypted = CryptoJS.AES.encrypt(wordArray.toString(CryptoJS.enc.Base64), encryptionKey).toString();
      
      // Create a new file with encrypted content
      const encryptedBlob = new Blob([encrypted], { type: 'application/encrypted' });
      file = new File([encryptedBlob], `${file.name}.encrypted`, { type: 'application/encrypted' });
      
      // Store encryption key in localStorage (in a real app, consider more secure storage)
      localStorage.setItem(`docKey_${file.name}`, encryptionKey);
    }

    // Create a unique file path
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filePath = `${user.data.user.id}/${timestamp}-${randomString}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('contract_documents')
      .upload(filePath, file);

    if (uploadError) {
      logger.error('Error uploading document:', uploadError);
      throw new Error(uploadError.message);
    }

    // Get the URL of the uploaded file
    const { data: fileData } = supabase
      .storage
      .from('contract_documents')
      .getPublicUrl(filePath);

    // Save document metadata to the database
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        name: documentData.name,
        file_path: filePath,
        file_type: isEncrypted ? 'application/encrypted' : file.type,
        file_size: file.size,
        is_encrypted: isEncrypted,
        category: documentData.category,
        contract_id: documentData.contract_id,
        user_id: user.data.user.id
      }])
      .select()
      .single();

    if (error) {
      // If database insert fails, try to clean up the uploaded file
      await supabase.storage.from('contract_documents').remove([filePath]);
      logger.error('Error saving document metadata:', error);
      throw new Error(error.message);
    }

    logger.log('Document uploaded successfully:', data);
    return data;
  } catch (err) {
    logger.error('Upload document error:', err);
    throw err;
  }
};

/**
 * Downloads a document, decrypting if necessary
 */
export const downloadDocument = async (document: Document): Promise<{ url: string, filename: string }> => {
  try {
    // Get the document from storage
    const { data, error } = await supabase
      .storage
      .from('contract_documents')
      .download(document.file_path);
    
    if (error) {
      logger.error('Error downloading document:', error);
      throw new Error(error.message);
    }

    // If the document is encrypted, decrypt it
    if (document.is_encrypted) {
      // Get the encryption key from localStorage
      const encryptionKey = localStorage.getItem(`docKey_${document.name}`);
      
      if (!encryptionKey) {
        throw new Error('Encryption key not found. Cannot decrypt document.');
      }

      // Read the encrypted data as text
      const encryptedText = await data.text();
      
      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(encryptedText, encryptionKey).toString(CryptoJS.enc.Base64);
      
      // Convert Base64 to ArrayBuffer
      const binaryString = window.atob(decrypted);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create a blob from the decrypted data
      const blob = new Blob([bytes], { type: document.file_type });
      const url = URL.createObjectURL(blob);
      
      // Strip the .encrypted extension if present
      const filename = document.name.endsWith('.encrypted')
        ? document.name.substring(0, document.name.length - 10)
        : document.name;
        
      return { url, filename };
    }
    
    // For non-encrypted files, just return the URL
    const url = URL.createObjectURL(data);
    return { url, filename: document.name };
  } catch (err) {
    logger.error('Download document error:', err);
    throw err;
  }
};

/**
 * Deletes a document
 */
export const deleteDocument = async (document: Document): Promise<void> => {
  try {
    // Delete from storage first
    const { error: storageError } = await supabase
      .storage
      .from('contract_documents')
      .remove([document.file_path]);
      
    if (storageError) {
      logger.error('Error deleting document from storage:', storageError);
      throw new Error(storageError.message);
    }

    // Then delete the metadata from the database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', document.id);
      
    if (dbError) {
      logger.error('Error deleting document from database:', dbError);
      throw new Error(dbError.message);
    }

    // Remove encryption key if it exists
    if (document.is_encrypted) {
      localStorage.removeItem(`docKey_${document.name}`);
    }

    logger.log('Document deleted successfully');
  } catch (err) {
    logger.error('Delete document error:', err);
    throw err;
  }
};
