
import { supabase } from '@/integrations/supabase/client';
import { Contract, ContractFormData, ContractStatus, SignatureStatus, VariableRentValue } from '@/types/contract';
import { Json } from '@/integrations/supabase/types';

// Helper function to ensure proper type conversion
const convertJsonToVariableRentValues = (jsonValue: Json | null): VariableRentValue[] | null => {
  if (!jsonValue) return null;
  try {
    if (typeof jsonValue === 'string') {
      return JSON.parse(jsonValue) as VariableRentValue[];
    }
    return jsonValue as unknown as VariableRentValue[];
  } catch (e) {
    console.error('Error parsing variable_rent_values:', e);
    return null;
  }
};

// Helper function to convert VariableRentValue[] to Json for Supabase
const convertVariableRentValuesToJson = (values: VariableRentValue[] | null | undefined): Json => {
  if (!values) return null;
  return values as unknown as Json;
};

/**
 * Fetches all contracts for the current user
 */
export const fetchContracts = async (): Promise<Contract[]> => {
  try {
    console.log('Fetching contracts from Supabase...');
    const session = await supabase.auth.getSession();
    
    if (!session.data.session) {
      console.error('No active session found');
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
      console.error('Error fetching contracts:', error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    console.log('Contracts fetched successfully:', data?.length || 0);

    if (!data) {
      return [];
    }

    // Transform the data to ensure contract types are correctly cast and all fields are present
    return data.map(item => ({
      ...item,
      status: item.status as ContractStatus,
      signature_status: item.signature_status as SignatureStatus,
      // Add default values for fields that might not exist in the database yet
      has_variable_rent: item.has_variable_rent ?? false,
      variable_rent_values: convertJsonToVariableRentValues(item.variable_rent_values),
      payment_due_day: item.payment_due_day ?? item.payment_day,
      on_time_discount_percentage: item.on_time_discount_percentage ?? null,
      late_fee_percentage: item.late_fee_percentage ?? null,
      is_discount_not_fee: item.is_discount_not_fee ?? true,
      late_interest_percentage: item.late_interest_percentage ?? null,
      late_daily_interest: item.late_daily_interest ?? null,
      fine_percentage: item.fine_percentage ?? null,
      payment_terms: item.payment_terms ?? null
    }));
  } catch (err) {
    console.error('Failed to fetch contracts:', err);
    throw err;
  }
};

/**
 * Fetches a contract by its ID
 */
export const fetchContractById = async (id: string): Promise<Contract | null> => {
  if (!id) return null;
  
  try {
    console.log(`Fetching contract details for ID: ${id}`);
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.error('No active session found');
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
      console.error(`Error fetching contract ${id}:`, error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    console.log('Contract detail fetch result:', data ? 'Success' : 'Not found');

    if (!data) {
      return null;
    }

    // Transform the data to ensure contract types are correctly cast and all fields are present
    return {
      ...data,
      status: data.status as ContractStatus,
      signature_status: data.signature_status as SignatureStatus,
      // Add default values for new fields
      has_variable_rent: data.has_variable_rent ?? false,
      variable_rent_values: convertJsonToVariableRentValues(data.variable_rent_values),
      payment_due_day: data.payment_due_day ?? data.payment_day,
      on_time_discount_percentage: data.on_time_discount_percentage ?? null,
      late_fee_percentage: data.late_fee_percentage ?? null,
      is_discount_not_fee: data.is_discount_not_fee ?? true,
      late_interest_percentage: data.late_interest_percentage ?? null,
      late_daily_interest: data.late_daily_interest ?? null,
      fine_percentage: data.fine_percentage ?? null,
      payment_terms: data.payment_terms ?? null
    };
  } catch (err) {
    console.error(`Failed to fetch contract ${id}:`, err);
    throw err;
  }
};

/**
 * Creates a new contract
 */
export const createContract = async (contractData: ContractFormData): Promise<Contract> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');
  
  console.log('Creating new contract with data:', contractData);
  
  // If the contract is active, update the property with tenant information
  if (contractData.status === 'active' && contractData.property_id) {
    await updatePropertyTenantInfo(contractData.property_id, {
      tenant_name: contractData.tenant_name,
      tenant_contact: contractData.tenant_contact || null,
    });
  }

  // Convert variable_rent_values to JSON for Supabase
  const supabaseData = {
    ...contractData,
    variable_rent_values: convertVariableRentValuesToJson(contractData.variable_rent_values),
    user_id: user.data.user?.id,
  };
  
  const { data, error } = await supabase
    .from('contracts')
    .insert(supabaseData)
    .select()
    .single();

  if (error) {
    console.error('Error creating contract:', error);
    throw new Error(error.message);
  }

  console.log('Contract created successfully:', data.id);

  // Transform the data to ensure contract types are correctly cast
  return {
    ...data,
    status: data.status as ContractStatus,
    signature_status: data.signature_status as SignatureStatus,
    // Add default values for new fields that might not exist in the database yet
    has_variable_rent: data.has_variable_rent ?? false,
    variable_rent_values: convertJsonToVariableRentValues(data.variable_rent_values),
    payment_due_day: data.payment_due_day ?? data.payment_day,
    on_time_discount_percentage: data.on_time_discount_percentage ?? null,
    late_fee_percentage: data.late_fee_percentage ?? null,
    is_discount_not_fee: data.is_discount_not_fee ?? true,
    late_interest_percentage: data.late_interest_percentage ?? null,
    late_daily_interest: data.late_daily_interest ?? null,
    fine_percentage: data.fine_percentage ?? null,
    payment_terms: data.payment_terms ?? null
  };
};

/**
 * Updates an existing contract
 */
export const updateContract = async (contractData: Partial<Contract> & { id: string }): Promise<Contract> => {
  const { id, ...data } = contractData;
  
  console.log(`Updating contract ${id} with data:`, data);
  
  // If the contract is active, update the property with tenant information
  if (data.status === 'active' && data.property_id) {
    await updatePropertyTenantInfo(data.property_id, {
      tenant_name: data.tenant_name,
      tenant_contact: data.tenant_contact || null,
    });
  }
  
  // Convert variable_rent_values to JSON for Supabase
  const supabaseData = {
    ...data,
    variable_rent_values: data.variable_rent_values ? convertVariableRentValuesToJson(data.variable_rent_values) : undefined,
  };
  
  const { data: updatedData, error } = await supabase
    .from('contracts')
    .update(supabaseData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating contract:', error);
    throw new Error(error.message);
  }

  console.log('Contract updated successfully:', updatedData.id);

  return {
    ...updatedData,
    status: updatedData.status as ContractStatus,
    signature_status: updatedData.signature_status as SignatureStatus,
    // Add default values for new fields
    has_variable_rent: updatedData.has_variable_rent ?? false,
    variable_rent_values: convertJsonToVariableRentValues(updatedData.variable_rent_values),
    payment_due_day: updatedData.payment_due_day ?? updatedData.payment_day,
    on_time_discount_percentage: updatedData.on_time_discount_percentage ?? null,
    late_fee_percentage: updatedData.late_fee_percentage ?? null,
    is_discount_not_fee: updatedData.is_discount_not_fee ?? true,
    late_interest_percentage: updatedData.late_interest_percentage ?? null,
    late_daily_interest: updatedData.late_daily_interest ?? null,
    fine_percentage: updatedData.fine_percentage ?? null,
    payment_terms: updatedData.payment_terms ?? null
  };
};

/**
 * Updates property with tenant information when a contract becomes active
 */
const updatePropertyTenantInfo = async (propertyId: string, tenantInfo: { tenant_name: string; tenant_contact: string | null }) => {
  try {
    console.log(`Updating property ${propertyId} with tenant info:`, tenantInfo);
    
    const { error } = await supabase
      .from('properties')
      .update({
        tenant_name: tenantInfo.tenant_name,
        tenant_contact: tenantInfo.tenant_contact,
        status: 'rented' // Update property status to rented
      })
      .eq('id', propertyId);

    if (error) {
      console.error('Error updating property tenant info:', error);
      // We don't throw here to avoid blocking the contract creation/update
    } else {
      console.log('Property tenant info updated successfully');
    }
  } catch (err) {
    console.error('Failed to update property tenant info:', err);
    // We don't throw here to avoid blocking the contract creation/update
  }
};

/**
 * Deletes a contract
 */
export const deleteContract = async (id: string): Promise<void> => {
  console.log(`Deleting contract ${id}`);
  
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting contract:', error);
    throw new Error(error.message);
  }
  
  console.log('Contract deleted successfully');
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

  console.log(`Uploading document for contract ${contractId} to contract_documents bucket`);

  const { error: uploadError } = await supabase
    .storage
    .from('contract_documents')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading document:', uploadError);
    throw new Error(uploadError.message);
  }

  // Get the public URL
  const { data } = supabase
    .storage
    .from('contract_documents')
    .getPublicUrl(filePath);

  console.log('Document uploaded successfully, URL:', data.publicUrl);

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
    console.error('Error recording document in database:', dbError);
    throw new Error(dbError.message);
  }

  // Update the contract with the document URL
  const { error: updateError } = await supabase
    .from('contracts')
    .update({ document_url: data.publicUrl })
    .eq('id', contractId);

  if (updateError) {
    console.error('Error updating contract with document URL:', updateError);
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
  console.log(`Updating status of contract ${id} to ${status}`);
  
  // Get current contract to check if we need to update property
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('property_id, tenant_name, tenant_contact')
    .eq('id', id)
    .single();
  
  if (fetchError) {
    console.error('Error fetching contract for status update:', fetchError);
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
    console.error('Error updating contract status:', error);
    throw new Error(error.message);
  }

  console.log('Contract status updated successfully');

  return {
    ...data,
    status: data.status as ContractStatus,
    signature_status: data.signature_status as SignatureStatus,
    // Add default values for new fields
    has_variable_rent: data.has_variable_rent ?? false,
    variable_rent_values: convertJsonToVariableRentValues(data.variable_rent_values),
    payment_due_day: data.payment_due_day ?? data.payment_day,
    on_time_discount_percentage: data.on_time_discount_percentage ?? null,
    late_fee_percentage: data.late_fee_percentage ?? null,
    is_discount_not_fee: data.is_discount_not_fee ?? true,
    late_interest_percentage: data.late_interest_percentage ?? null,
    late_daily_interest: data.late_daily_interest ?? null,
    fine_percentage: data.fine_percentage ?? null,
    payment_terms: data.payment_terms ?? null
  };
};

/**
 * Updates a contract's signature status
 */
export const updateSignatureStatus = async (
  id: string, 
  signature_status: SignatureStatus
): Promise<Contract> => {
  console.log(`Updating signature status of contract ${id} to ${signature_status}`);
  
  const { data, error } = await supabase
    .from('contracts')
    .update({ signature_status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating contract signature status:', error);
    throw new Error(error.message);
  }

  console.log('Contract signature status updated successfully');

  return {
    ...data,
    status: data.status as ContractStatus,
    signature_status: data.signature_status as SignatureStatus,
    // Add default values for new fields
    has_variable_rent: data.has_variable_rent ?? false,
    variable_rent_values: convertJsonToVariableRentValues(data.variable_rent_values),
    payment_due_day: data.payment_due_day ?? data.payment_day,
    on_time_discount_percentage: data.on_time_discount_percentage ?? null,
    late_fee_percentage: data.late_fee_percentage ?? null,
    is_discount_not_fee: data.is_discount_not_fee ?? true,
    late_interest_percentage: data.late_interest_percentage ?? null,
    late_daily_interest: data.late_daily_interest ?? null,
    fine_percentage: data.fine_percentage ?? null,
    payment_terms: data.payment_terms ?? null
  };
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
      console.error('Error fetching properties for occupancy rate:', propertiesError);
      return 0;
    }
    
    if (!properties || properties.length === 0) {
      return 0;
    }
    
    const rentedCount = properties.filter(p => p.status === 'rented').length;
    return (rentedCount / properties.length) * 100;
  } catch (err) {
    console.error('Error calculating occupancy rate:', err);
    return 0;
  }
};
