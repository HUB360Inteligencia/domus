import { supabase } from '@/integrations/supabase/client';
import { Contract, ContractFormData, ContractStatus, SignatureStatus, VariableRentValue, RecurringTransaction } from '@/types/contract';
import { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

import { logger } from "@/lib/logger";
type ContractWithProperty = Tables<'contracts'> & {
  property?: Contract['property'] | null;
};

// Helper function to ensure proper type conversion
const convertJsonToVariableRentValues = (jsonValue: Json | null): VariableRentValue[] | null => {
  if (!jsonValue) return null;
  try {
    if (typeof jsonValue === 'string') {
      return JSON.parse(jsonValue) as VariableRentValue[];
    }
    return jsonValue as unknown as VariableRentValue[];
  } catch (e) {
    logger.error('Error parsing variable_rent_values:', e);
    return null;
  }
};

// Helper function to convert VariableRentValue[] to Json for Supabase
const convertVariableRentValuesToJson = (values: VariableRentValue[] | null | undefined): Json => {
  if (!values) return null;
  return values as unknown as Json;
};

// Helper to convert recurring_transactions from Json
const convertJsonToRecurringTransactions = (jsonValue: Json | null): RecurringTransaction[] | null => {
  if (!jsonValue) return null;
  try {
    if (typeof jsonValue === 'string') {
      return JSON.parse(jsonValue);
    }
    return jsonValue as unknown as RecurringTransaction[];
  } catch (e) {
    logger.error('Error parsing recurring_transactions:', e);
    return null;
  }
};

// Helper to cast a raw Supabase contract row to our Contract type
const mapRawToContract = (item: ContractWithProperty): Contract => ({
  ...item,
  property: item.property ?? undefined,
  status: item.status as ContractStatus,
  signature_status: (item.signature_status ?? 'unsigned') as SignatureStatus,
  has_variable_rent: item.has_variable_rent ?? false,
  variable_rent_values: convertJsonToVariableRentValues(item.variable_rent_values),
  recurring_transactions: convertJsonToRecurringTransactions(item.recurring_transactions),
  payment_due_day: item.payment_due_day ?? item.payment_day,
  on_time_discount_percentage: item.on_time_discount_percentage ?? null,
  late_fee_percentage: item.late_fee_percentage ?? null,
  is_discount_not_fee: item.is_discount_not_fee ?? true,
  late_interest_percentage: item.late_interest_percentage ?? null,
  late_daily_interest: item.late_daily_interest ?? null,
  fine_percentage: item.fine_percentage ?? null,
  payment_terms: item.payment_terms ?? null,
  adjustment_index: item.adjustment_index ?? null,
  adjustment_date: item.adjustment_date ?? null,
  agency_name: item.agency_name ?? null,
  agency_contact: item.agency_contact ?? null,
  agency_responsible_name: item.agency_responsible_name ?? null,
  agency_responsible_contact: item.agency_responsible_contact ?? null,
  commission_type: (item.commission_type as 'percentage' | 'monetary' | null) ?? null,
  commission_value: item.commission_value ?? null,
});

/**
 * Fetches all contracts for the current user
 */
export const fetchContracts = async (): Promise<Contract[]> => {
  try {
    logger.log('Fetching contracts from Supabase...');
    const session = await supabase.auth.getSession();
    
    if (!session.data.session) {
      logger.error('No active session found');
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        property:properties(
          title, 
          address, 
          city, 
          state, 
          neighborhood, 
          type,
          tags
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching contracts:', error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    logger.log('Contracts fetched successfully:', data?.length || 0);

    if (!data) {
      return [];
    }

    return data.map(mapRawToContract);
  } catch (err) {
    logger.error('Failed to fetch contracts:', err);
    throw err;
  }
};

/**
 * Fetches a contract by its ID
 */
export const fetchContractById = async (id: string): Promise<Contract | null> => {
  if (!id) return null;
  
  try {
    logger.log(`Fetching contract details for ID: ${id}`);
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      logger.error('No active session found');
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        property:properties(
          title, 
          address, 
          city, 
          state, 
          neighborhood, 
          type,
          tags
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error(`Error fetching contract ${id}:`, error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    logger.log('Contract detail fetch result:', data ? 'Success' : 'Not found');

    if (!data) {
      return null;
    }

    return mapRawToContract(data);
  } catch (err) {
    logger.error(`Failed to fetch contract ${id}:`, err);
    throw err;
  }
};

/**
 * Creates a new contract
 */
export const createContract = async (contractData: ContractFormData): Promise<Contract> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');
  
  logger.log('Creating new contract with data:', contractData);
  
  // If the contract is active, update the property with tenant information
  if (contractData.status === 'active' && contractData.property_id) {
    await updatePropertyTenantInfo(contractData.property_id, {
      tenant_name: contractData.tenant_name,
      tenant_contact: contractData.tenant_contact || null,
    });
  }

  // Convert variable_rent_values and recurring_transactions to JSON for Supabase
  const { recurring_transactions, variable_rent_values, ...restData } = contractData;
  const supabaseData: TablesInsert<'contracts'> = {
    ...restData,
    variable_rent_values: convertVariableRentValuesToJson(variable_rent_values),
    recurring_transactions: recurring_transactions ? (recurring_transactions as unknown as Json) : undefined,
    user_id: user.data.user.id,
  };
  
  const { data, error } = await supabase
    .from('contracts')
    .insert(supabaseData)
    .select()
    .single();

  if (error) {
    logger.error('Error creating contract:', error);
    throw new Error(error.message);
  }

  logger.log('Contract created successfully:', data.id);

  return mapRawToContract(data);
};

/**
 * Updates an existing contract
 */
export const updateContract = async (contractData: Partial<Contract> & { id: string }): Promise<Contract> => {
  const { id, ...data } = contractData;
  
  logger.log(`Updating contract ${id} with data:`, data);
  
  // If the contract is active, update the property with tenant information
  if (data.status === 'active' && data.property_id) {
    await updatePropertyTenantInfo(data.property_id, {
      tenant_name: data.tenant_name,
      tenant_contact: data.tenant_contact || null,
    });
  }
  
  // Convert for Supabase - cast recurring_transactions too
  const { recurring_transactions: rt, variable_rent_values, property, ...restUpdateData } = data;
  void property;
  const supabaseData: TablesUpdate<'contracts'> = {
    ...restUpdateData,
    variable_rent_values: variable_rent_values ? convertVariableRentValuesToJson(variable_rent_values) : undefined,
    recurring_transactions: rt ? (rt as unknown as Json) : undefined,
  };
  
  const { data: updatedData, error } = await supabase
    .from('contracts')
    .update(supabaseData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating contract:', error);
    throw new Error(error.message);
  }

  logger.log('Contract updated successfully:', updatedData.id);

  return mapRawToContract(updatedData);
};

/**
 * Updates property with tenant information when a contract becomes active
 */
const updatePropertyTenantInfo = async (propertyId: string, tenantInfo: { tenant_name: string; tenant_contact: string | null }) => {
  try {
    logger.log(`Updating property ${propertyId} with tenant info:`, tenantInfo);
    
    const { error } = await supabase
      .from('properties')
      .update({
        tenant_name: tenantInfo.tenant_name,
        tenant_contact: tenantInfo.tenant_contact,
        status: 'rented' // Update property status to rented
      })
      .eq('id', propertyId);

    if (error) {
      logger.error('Error updating property tenant info:', error);
      // We don't throw here to avoid blocking the contract creation/update
    } else {
      logger.log('Property tenant info updated successfully');
    }
  } catch (err) {
    logger.error('Failed to update property tenant info:', err);
    // We don't throw here to avoid blocking the contract creation/update
  }
};

const isMissingRpcError = (error: { code?: string; message?: string }) =>
  error.code === 'PGRST202' ||
  error.message?.toLowerCase().includes('could not find the function') ||
  error.message?.toLowerCase().includes('schema cache');

/**
 * Deletes a contract and all related data
 */
export const deleteContract = async (id: string): Promise<void> => {
  logger.log(`Deleting contract ${id} and related data`);
  
  try {
    const { error: rpcError } = await supabase.rpc('delete_contract_cascade', {
      p_contract_id: id,
    });

    if (!rpcError) {
      logger.log('Contract deleted via delete_contract_cascade RPC');
      return;
    }

    if (!isMissingRpcError(rpcError)) {
      logger.error('Error deleting contract via RPC:', rpcError);
      throw new Error(`Erro ao excluir contrato: ${rpcError.message}`);
    }

    logger.warn('delete_contract_cascade RPC unavailable; falling back to client-side delete flow');

    // First, delete related activities
    const { error: activitiesError } = await supabase
      .from('activities')
      .delete()
      .eq('contract_id', id);

    if (activitiesError) {
      logger.error('Error deleting related activities:', activitiesError);
      throw new Error(`Erro ao excluir atividades relacionadas: ${activitiesError.message}`);
    }

    // Delete contract adjustments
    const { error: adjustmentsError } = await supabase
      .from('contract_value_adjustments')
      .delete()
      .eq('contract_id', id);

    if (adjustmentsError) {
      logger.error('Error deleting contract adjustments:', adjustmentsError);
      throw new Error(`Erro ao excluir reajustes do contrato: ${adjustmentsError.message}`);
    }

    // Delete documents related to the contract
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .eq('contract_id', id);

    if (documentsError) {
      logger.error('Error deleting contract documents:', documentsError);
      throw new Error(`Erro ao excluir documentos do contrato: ${documentsError.message}`);
    }

    // Finally, delete the contract
    const { error: contractError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (contractError) {
      logger.error('Error deleting contract:', contractError);
      throw new Error(`Erro ao excluir contrato: ${contractError.message}`);
    }
    
    logger.log('Contract and all related data deleted successfully');
  } catch (err) {
    logger.error('Failed to delete contract:', err);
    throw err;
  }
};

/**
 * Uploads a document for a contract
 */
export const uploadContractDocument = async ({ 
  contractId, 
  file,
  isEncrypted = false
}: { 
  contractId: string; 
  file: File;
  isEncrypted?: boolean;
}): Promise<string> => {
  // Get current user
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');

  // Create a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${contractId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  logger.log(`Uploading document for contract ${contractId} to contract_documents bucket`);

  const { error: uploadError } = await supabase
    .storage
    .from('contract_documents')
    .upload(filePath, file);

  if (uploadError) {
    logger.error('Error uploading document:', uploadError);
    throw new Error(uploadError.message);
  }

  // Get the public URL
  const { data } = supabase
    .storage
    .from('contract_documents')
    .getPublicUrl(filePath);

  logger.log('Document uploaded successfully, URL:', data.publicUrl);

  // Add the document to the documents table
  const { error: dbError } = await supabase
    .from('documents')
    .insert({
      name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      category: 'contract',
      contract_id: contractId,
      is_encrypted: isEncrypted,
      user_id: user.data.user.id
    });

  if (dbError) {
    logger.error('Error recording document in database:', dbError);
    throw new Error(dbError.message);
  }

  // Update the contract with the document URL
  const { error: updateError } = await supabase
    .from('contracts')
    .update({ document_url: data.publicUrl })
    .eq('id', contractId);

  if (updateError) {
    logger.error('Error updating contract with document URL:', updateError);
    throw new Error(updateError.message);
  }

  return data.publicUrl;
};

/**
 * Updates a contract's status
 */
export const updateContractStatus = async (
  id: string, 
  status: ContractStatus
): Promise<Contract> => {
  logger.log(`Updating status of contract ${id} to ${status}`);
  
  // Get current contract to check if we need to update property
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('property_id, tenant_name, tenant_contact')
    .eq('id', id)
    .single();
  
  if (fetchError) {
    logger.error('Error fetching contract for status update:', fetchError);
    throw new Error(fetchError.message);
  }
  
  // If status is active and we have property info, update the property
  if (status === 'active' && contract?.property_id) {
    await updatePropertyTenantInfo(contract.property_id, {
      tenant_name: contract.tenant_name,
      tenant_contact: contract.tenant_contact,
    });
  }
  
  const { data, error } = await supabase
    .from('contracts')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating contract status:', error);
    throw new Error(error.message);
  }

  logger.log('Contract status updated successfully');

  return mapRawToContract(data);
};

/**
 * Updates a contract's signature status
 */
export const updateSignatureStatus = async (
  id: string, 
  signature_status: SignatureStatus
): Promise<Contract> => {
  logger.log(`Updating signature status of contract ${id} to ${signature_status}`);
  
  const { data, error } = await supabase
    .from('contracts')
    .update({ signature_status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating contract signature status:', error);
    throw new Error(error.message);
  }

  logger.log('Contract signature status updated successfully');

  return mapRawToContract(data);
};

/**
 * Calculate occupancy rate for financial dashboard
 */
export const calculateOccupancyRate = async (): Promise<number> => {
  try {
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, status')
      .not('status', 'eq', 'sold');
      
    if (propertiesError) {
      logger.error('Error fetching properties for occupancy rate:', propertiesError);
      return 0;
    }
    
    if (!properties || properties.length === 0) {
      return 0;
    }
    
    const rentedCount = properties.filter(p => p.status === 'rented').length;
    return (rentedCount / properties.length) * 100;
  } catch (err) {
    logger.error('Error calculating occupancy rate:', err);
    return 0;
  }
};
