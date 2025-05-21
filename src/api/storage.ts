
import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica se o bucket de armazenamento existe e cria se não existir
 */
export const ensureStorageBucket = async (bucketName: string) => {
  try {
    // Verifica se o bucket existe
    const { data: buckets, error: getBucketError } = await supabase
      .storage
      .listBuckets();
      
    if (getBucketError) {
      console.error('Erro ao listar buckets:', getBucketError);
      throw getBucketError;
    }
    
    // Verifica se o bucket já existe
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    // Se não existir, cria o bucket
    if (!bucketExists) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'application/pdf']
        });
      
      if (createBucketError) {
        console.error('Erro ao criar bucket:', createBucketError);
        throw createBucketError;
      }
      
      console.log(`Bucket ${bucketName} criado com sucesso`);
    } else {
      console.log(`Bucket ${bucketName} já existe`);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error);
    throw error;
  }
};

/**
 * Configuração inicial dos buckets de armazenamento
 */
export const initializeStorage = async () => {
  try {
    // Garante que os buckets necessários existam
    await ensureStorageBucket('financial_docs');
    console.log('Storage inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar storage:', error);
  }
};
