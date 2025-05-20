
/**
 * Fetches address information from a Brazilian postal code (CEP)
 */
export const fetchAddressFromCEP = async (cep: string): Promise<{
  logradouro?: string; // Street name
  bairro?: string; // Neighborhood
  localidade?: string; // City
  uf?: string; // State
  erro?: boolean; // Error flag
}> => {
  // Clean up the CEP by removing non-numeric characters
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    throw new Error('CEP inválido. O CEP deve conter 8 dígitos.');
  }
  
  try {
    // Use ViaCEP API (free and reliable)
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado.');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching address from CEP:', error);
    throw new Error('Erro ao buscar endereço pelo CEP. Tente novamente.');
  }
};

/**
 * Formats a CEP string (adds the dash)
 */
export const formatCEP = (cep: string): string => {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length <= 5) {
    return cleanCEP;
  }
  
  return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5, 8)}`;
};

/**
 * Creates a complete address string for geocoding
 */
export const createFullAddressString = (
  address: string,
  propertyNumber?: string,
  city?: string,
  state?: string
): string => {
  let fullAddress = address;
  
  if (propertyNumber) {
    fullAddress += `, ${propertyNumber}`;
  }
  
  if (city) {
    fullAddress += `, ${city}`;
  }
  
  if (state) {
    fullAddress += `, ${state}`;
  }
  
  return fullAddress;
};
