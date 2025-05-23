
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

    // Transform the data to ensure contract types are correctly cast
    return (data || []).map(item => ({
      ...item,
      status: item.status as ContractStatus,
      signature_status: item.signature_status as SignatureStatus
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

    // Transform the data to ensure contract types are correctly cast
    return data ? {
      ...data,
      status: data.status as ContractStatus,
      signature_status: data.signature_status as SignatureStatus
    } : null;
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
  
  const { data, error } = await supabase
    .from('contracts')
    .insert([
      {
        ...contractData,
        user_id: user.data.user?.id,
      }
    ])
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
    signature_status: data.signature_status as SignatureStatus
  };
};

/**
 * Updates an existing contract
 */
export const updateContract = async (contractData: Partial<Contract> & { id: string }): Promise<Contract> => {
  const { id, ...data } = contractData;
  
  console.log(`Updating contract ${id} with data:`, data);
  
  const { data: updatedData, error } = await supabase
    .from('contracts')
    .update(data)
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
    signature_status: updatedData.signature_status as SignatureStatus
  };
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
    signature_status: data.signature_status as SignatureStatus
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
    signature_status: data.signature_status as SignatureStatus
  };
};
