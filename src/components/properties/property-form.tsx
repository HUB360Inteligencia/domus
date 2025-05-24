import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Building, Upload, Loader2, Search, MapPin, Calendar } from 'lucide-react';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FurnishedStatus, Property, PropertyFormData } from '@/types/property';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAddressFromCEP, formatCEP } from '@/utils/cep-lookup';
import { toast } from 'sonner';
import { PropertyMap } from './property-map';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvestmentsList, Investment } from './InvestmentsList';
import { applyDateMask, applyCurrencyMask, isValidDateFormat, parseCurrencyToNumber, convertToISO, convertFromISO } from '@/utils/masks';

const formSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  address: z.string().min(5, { message: 'O endereço deve ter pelo menos 5 caracteres' }),
  property_number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(2, { message: 'A cidade deve ter pelo menos 2 caracteres' }),
  state: z.string().min(2, { message: 'O estado deve ter pelo menos 2 caracteres' }),
  zip_code: z.string().optional(),
  type: z.string(),
  status: z.string(),
  value: z.coerce.number().positive({ message: 'O valor deve ser positivo' }),
  area: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  garage_spots: z.coerce.number().int().optional(),
  condo_fee: z.coerce.number().optional(),
  floor_number: z.coerce.number().int().optional(),
  furnished: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Dados de compra
  purchase_date: z.string().optional().nullable(),
  purchase_value: z.coerce.number().positive().optional().nullable(),
  square_meter_value: z.coerce.number().positive().optional().nullable(),
  // Dados da imobiliária
  agency_name: z.string().optional().nullable(),
  agency_responsible: z.string().optional().nullable(),
  agency_contact: z.string().optional().nullable(),
});

interface PropertyFormProps {
  initialData?: Property | null;
  onSubmit: (data: PropertyFormData, imageFile?: File) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isUploading?: boolean;
}

export function PropertyForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isUploading = false,
}: PropertyFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [investments, setInvestments] = useState<Investment[]>([]);

  // Check if we have initial coordinates
  useEffect(() => {
    if (initialData?.latitude && initialData.longitude) {
      setMapCoordinates({
        lat: Number(initialData.latitude),
        lng: Number(initialData.longitude)
      });
      setShowMap(true);
    }
  }, [initialData]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      address: initialData?.address || '',
      property_number: initialData?.property_number || '',
      complement: initialData?.complement || '',
      neighborhood: initialData?.neighborhood || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zip_code: initialData?.zip_code || '',
      type: initialData?.type || 'apartment',
      status: initialData?.status || 'available',
      value: initialData?.value || 0,
      area: initialData?.area || undefined,
      bedrooms: initialData?.bedrooms || undefined,
      bathrooms: initialData?.bathrooms || undefined,
      garage_spots: initialData?.garage_spots || undefined,
      condo_fee: initialData?.condo_fee || undefined,
      floor_number: initialData?.floor_number || undefined,
      furnished: initialData?.furnished || 'not_furnished',
      latitude: initialData?.latitude !== undefined && initialData.latitude !== null 
        ? Number(initialData.latitude) 
        : undefined,
      longitude: initialData?.longitude !== undefined && initialData.longitude !== null 
        ? Number(initialData.longitude) 
        : undefined,
      // Dados de compra
      purchase_date: initialData?.purchase_date ? convertFromISO(initialData.purchase_date) : '',
      purchase_value: initialData?.purchase_value || null,
      square_meter_value: initialData?.square_meter_value || null,
      // Dados da imobiliária
      agency_name: initialData?.agency_name || null,
      agency_responsible: initialData?.agency_responsible || null,
      agency_contact: initialData?.agency_contact || null,
    },
  });

  // Calcular valor do m² automaticamente quando área ou valor são alterados
  const area = form.watch('area');
  const value = form.watch('value');
  
  useEffect(() => {
    if (area && value && area > 0) {
      const squareMeterValue = value / area;
      form.setValue('square_meter_value', squareMeterValue);
    }
  }, [area, value, form]);

  // Effect to update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || '',
        description: initialData.description || '',
        address: initialData.address || '',
        property_number: initialData.property_number || '',
        complement: initialData.complement || '',
        neighborhood: initialData.neighborhood || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip_code: initialData.zip_code || '',
        type: initialData.type || 'apartment',
        status: initialData.status || 'available',
        value: initialData.value || 0,
        area: initialData.area || undefined,
        bedrooms: initialData.bedrooms || undefined,
        bathrooms: initialData.bathrooms || undefined,
        garage_spots: initialData.garage_spots || undefined,
        condo_fee: initialData.condo_fee || undefined,
        floor_number: initialData.floor_number || undefined,
        furnished: initialData.furnished || 'not_furnished',
        latitude: initialData.latitude !== undefined && initialData.latitude !== null 
          ? Number(initialData.latitude) 
          : undefined,
        longitude: initialData.longitude !== undefined && initialData.longitude !== null 
          ? Number(initialData.longitude) 
          : undefined,
        // Dados de compra
        purchase_date: initialData.purchase_date ? convertFromISO(initialData.purchase_date) : '',
        purchase_value: initialData.purchase_value || null,
        square_meter_value: initialData.square_meter_value || null,
        // Dados da imobiliária
        agency_name: initialData.agency_name || null,
        agency_responsible: initialData.agency_responsible || null,
        agency_contact: initialData.agency_contact || null,
      });
      
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }

      if (initialData.latitude && initialData.longitude) {
        setMapCoordinates({
          lat: Number(initialData.latitude),
          lng: Number(initialData.longitude)
        });
        setShowMap(true);
      }
    }
  }, [initialData, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCoordsChange = (coords: { lat: number; lng: number }) => {
    setMapCoordinates(coords);
    form.setValue('latitude', coords.lat);
    form.setValue('longitude', coords.lng);
  };

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert purchase_date to ISO format if provided
    const formattedData = {
      ...data,
      purchase_date: data.purchase_date ? convertToISO(data.purchase_date) : null
    };

    // If we have map coordinates, make sure they're included in the submission
    if (mapCoordinates) {
      formattedData.latitude = mapCoordinates.lat;
      formattedData.longitude = mapCoordinates.lng;
    }
    onSubmit(formattedData as PropertyFormData, imageFile || undefined);
  };

  const handleCEPLookup = async () => {
    const cep = form.getValues('zip_code');
    
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      toast.error('CEP inválido. Digite um CEP com 8 dígitos.');
      return;
    }
    
    setIsSearchingCEP(true);
    
    try {
      const addressData = await fetchAddressFromCEP(cep);
      
      if (addressData.erro) {
        toast.error('CEP não encontrado.');
        return;
      }
      
      // Update form fields with the retrieved data
      form.setValue('address', addressData.logradouro || '');
      form.setValue('neighborhood', addressData.bairro || '');
      form.setValue('city', addressData.localidade || '');
      form.setValue('state', addressData.uf || '');
      
      // Show the map once we have address data
      setShowMap(true);
      
      toast.success('Endereço encontrado!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar CEP');
    } finally {
      setIsSearchingCEP(false);
    }
  };

  // Get the current address values from the form
  const currentAddress = form.watch('address');
  const currentPropertyNumber = form.watch('property_number');
  const currentCity = form.watch('city');
  const currentState = form.watch('state');
  
  // Only show the map if we have at least address and city
  const canShowMap = !!currentAddress && !!currentCity && !!currentState;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="details">Detalhes do Imóvel</TabsTrigger>
          <TabsTrigger value="purchase">Dados de Compra</TabsTrigger>
          <TabsTrigger value="agency">Dados da Imobiliária</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TabsContent value="details" className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Imóvel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Título do imóvel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descrição do imóvel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* CEP Field with search button */}
                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder="CEP (apenas números)" 
                                {...field}
                                onChange={(e) => {
                                  const formattedCEP = formatCEP(e.target.value);
                                  field.onChange(formattedCEP);
                                }}
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleCEPLookup}
                              disabled={isSearchingCEP}
                            >
                              {isSearchingCEP ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Address fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="property_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="Número" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Apto, Bloco, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input placeholder="Estado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Map section */}
                    {canShowMap && showMap && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel className="text-base">Localização no Mapa</FormLabel>
                          <div className="text-xs text-muted-foreground">
                            Arraste o marcador para ajustar a posição do imóvel
                          </div>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                          <PropertyMap
                            address={currentAddress}
                            property_number={currentPropertyNumber}
                            city={currentCity}
                            state={currentState}
                            initialCoords={mapCoordinates}
                            editable={true}
                            onCoordsChange={handleCoordsChange}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo de imóvel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="apartment">Apartamento</SelectItem>
                                <SelectItem value="house">Casa</SelectItem>
                                <SelectItem value="commercial">Comercial</SelectItem>
                                <SelectItem value="land">Terreno</SelectItem>
                                <SelectItem value="rural">Rural</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="available">Disponível</SelectItem>
                                <SelectItem value="rented">Alugado</SelectItem>
                                <SelectItem value="airbnb">Airbnb</SelectItem>
                                <SelectItem value="maintenance">Em manutenção</SelectItem>
                                <SelectItem value="sold">Vendido</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Property value and condo fee */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Valor do imóvel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="condo_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor do Condomínio</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Valor do condomínio" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="square_meter_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor do m²</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Valor do m²" {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Área (m²)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Área" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="floor_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Andar</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Número do andar" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="furnished"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobiliado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "not_furnished"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma opção" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="not_furnished">Não mobiliado</SelectItem>
                                <SelectItem value="partially_furnished">Parcialmente mobiliado</SelectItem>
                                <SelectItem value="fully_furnished">Totalmente mobiliado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quartos</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Número de quartos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banheiros</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Número de banheiros" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="garage_spots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vagas de Garagem</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Número de vagas" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="purchase" className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados de Compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchase_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Compra</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="dd/mm/aaaa"
                                value={field.value || ''}
                                onChange={(e) => {
                                  const maskedValue = applyDateMask(e.target.value);
                                  field.onChange(maskedValue);
                                }}
                                maxLength={10}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="purchase_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor de Compra</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="R$ 0,00"
                                value={field.value ? applyCurrencyMask(field.value.toString()) : ''}
                                onChange={(e) => {
                                  const maskedValue = applyCurrencyMask(e.target.value);
                                  field.onChange(parseCurrencyToNumber(maskedValue));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Seção de Investimentos */}
                    <div className="pt-4">
                      <InvestmentsList
                        investments={investments}
                        onChange={setInvestments}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="agency" className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados da Imobiliária</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="agency_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Imobiliária</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da imobiliária" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="agency_responsible"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável na Imobiliária</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do corretor responsável" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="agency_contact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contato da Imobiliária</FormLabel>
                            <FormControl>
                              <Input placeholder="Telefone ou email" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {activeTab === "details" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Imagem do Imóvel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Property preview" className="w-full h-full object-cover" />
                      ) : (
                        <Building className="h-20 w-20 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mb-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="flex justify-between mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>Salvar</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}

export type { PropertyFormProps };
