
import { supabase } from "@/integrations/supabase/client";
import { ContractTemplate, Clause } from "@/types/contract";

import { logger } from "@/lib/logger";
/**
 * Fetches all contract templates for the current user
 */
export const fetchContractTemplates = async (): Promise<ContractTemplate[]> => {
  try {
    logger.log('Fetching contract templates...');
    const session = await supabase.auth.getSession();
    
    if (!session.data.session) {
      logger.error('No active session found');
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching contract templates:', error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    logger.log('Contract templates fetched successfully:', data?.length || 0);
    return data || [];
  } catch (err) {
    logger.error('Failed to fetch contract templates:', err);
    throw err;
  }
};

/**
 * Creates a new contract template
 */
export const createContractTemplate = async (template: {
  title: string;
  content: string;
  is_default?: boolean;
}): Promise<ContractTemplate> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('contract_templates')
    .insert([{
      ...template,
      user_id: user.data.user.id
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error creating contract template:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Updates an existing contract template
 */
export const updateContractTemplate = async (
  id: string,
  updates: Partial<Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
): Promise<ContractTemplate> => {
  const { data, error } = await supabase
    .from('contract_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating contract template:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Deletes a contract template
 */
export const deleteContractTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contract_templates')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting contract template:', error);
    throw new Error(error.message);
  }
};

/**
 * Fetches all clauses by category
 */
export const fetchClausesByCategory = async (category: string): Promise<Clause[]> => {
  try {
    logger.log(`Fetching clauses for category: ${category}`);
    const { data, error } = await supabase
      .from('clauses')
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) {
      logger.error('Error fetching clauses:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (err) {
    logger.error(`Failed to fetch clauses for category ${category}:`, err);
    throw err;
  }
};

/**
 * Creates a new clause
 */
export const createClause = async (clause: {
  name: string;
  content: string;
  category: string;
  is_standard?: boolean;
}): Promise<Clause> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('clauses')
    .insert([{
      ...clause,
      user_id: user.data.user.id
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error creating clause:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Updates an existing clause
 */
export const updateClause = async (
  id: string,
  updates: Partial<Omit<Clause, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
): Promise<Clause> => {
  const { data, error } = await supabase
    .from('clauses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating clause:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Deletes a clause
 */
export const deleteClause = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('clauses')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting clause:', error);
    throw new Error(error.message);
  }
};
