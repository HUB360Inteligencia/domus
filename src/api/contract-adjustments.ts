
import { supabase } from '@/integrations/supabase/client';
import { ContractValueAdjustment, ContractAdjustmentFormData } from '@/types/contract-adjustment';

export const fetchContractAdjustments = async (contractId: string): Promise<ContractValueAdjustment[]> => {
  try {
    console.log('Fetching contract adjustments for contract:', contractId);
    
    const { data, error } = await supabase
      .from('contract_value_adjustments')
      .select('*')
      .eq('contract_id', contractId)
      .order('adjustment_date', { ascending: false });

    if (error) {
      console.error('Error fetching contract adjustments:', error);
      throw new Error(error.message);
    }

    console.log('Contract adjustments fetched successfully:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('Failed to fetch contract adjustments:', err);
    throw err;
  }
};

export const createContractAdjustment = async (adjustmentData: ContractAdjustmentFormData): Promise<ContractValueAdjustment> => {
  try {
    console.log('Creating contract adjustment:', adjustmentData);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado');
    }

    // Calculate new value if percentage is provided
    let newValue = adjustmentData.new_value;
    if (adjustmentData.adjustment_percentage && !newValue) {
      newValue = adjustmentData.old_value * (1 + adjustmentData.adjustment_percentage / 100);
    }

    const insertData = {
      ...adjustmentData,
      new_value: newValue || adjustmentData.old_value,
      user_id: session.user.id,
    };

    const { data, error } = await supabase
      .from('contract_value_adjustments')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating contract adjustment:', error);
      throw new Error(error.message);
    }

    console.log('Contract adjustment created successfully:', data);
    return data;
  } catch (err: any) {
    console.error('Failed to create contract adjustment:', err);
    throw new Error(err.message || 'Erro ao criar reajuste');
  }
};

export const updateContractValue = async (contractId: string, newValue: number): Promise<void> => {
  try {
    console.log('Updating contract value:', contractId, newValue);
    
    const { error } = await supabase
      .from('contracts')
      .update({ value: newValue })
      .eq('id', contractId);

    if (error) {
      console.error('Error updating contract value:', error);
      throw new Error(error.message);
    }

    console.log('Contract value updated successfully');
  } catch (err: any) {
    console.error('Failed to update contract value:', err);
    throw new Error(err.message || 'Erro ao atualizar valor do contrato');
  }
};
