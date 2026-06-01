import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserClientId } from '@/api/client-users';
import { logger } from '@/lib/logger';
import { ContactInteraction, InteractionType } from '@/types/contact';

export interface InteractionInput {
  contactId: string;
  type: InteractionType;
  description: string;
  interactionDate?: string;
  propertyId?: string | null;
  contractId?: string | null;
  nextAction?: string | null;
  assignedTo?: string | null;
}

export const fetchContactInteractions = async (
  contactId: string,
): Promise<ContactInteraction[]> => {
  const { data, error } = await supabase
    .from('contact_interactions')
    .select('*')
    .eq('contact_id', contactId)
    .is('deleted_at', null)
    .order('interaction_date', { ascending: false });

  if (error) {
    logger.error('Error fetching contact interactions:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as ContactInteraction[];
};

export const createContactInteraction = async (
  input: InteractionInput,
): Promise<ContactInteraction> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const clientId = await getCurrentUserClientId();

  const { data, error } = await supabase
    .from('contact_interactions')
    .insert({
      contact_id: input.contactId,
      user_id: user.id,
      client_id: clientId,
      interaction_type: input.type,
      description: input.description,
      interaction_date: input.interactionDate || new Date().toISOString(),
      property_id: input.propertyId || null,
      contract_id: input.contractId || null,
      next_action: input.nextAction || null,
      assigned_to: input.assignedTo || null,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Error creating contact interaction:', error);
    throw new Error(error.message);
  }
  return data as ContactInteraction;
};

export const softDeleteContactInteraction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contact_interactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    logger.error('Error deleting contact interaction:', error);
    throw new Error(error.message);
  }
};
