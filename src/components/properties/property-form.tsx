
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Building, Upload, Loader2, Search } from 'lucide-react';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Property, PropertyFormData } from '@/types/property';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAddressFromCEP, formatCEP } from '@/utils/cep-lookup';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  address: z.string().min(5, { message: 'O endereço deve ter pelo menos 5 caracteres' }),
  city: z.string().min(2, { message: 'A cidade deve ter pelo menos 2 caracteres' }),
  state: z.string().min(2, { message: 'O estado deve ter pelo menos 2 caracteres' }),
  zip_code: z.string().optional(),
  type: z.string(),
  status: z.string(),
  value: z.coerce.number().positive({ message: 'O valor deve ser positivo' }),
  area: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
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

  // Log the initialData to debug
  console.log('PropertyForm initialData:', initialData);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zip_code: initialData?.zip_code || '',
      type: initialData?.type || 'apartment',
      status: initialData?.status || 'available',
      value: initialData?.value || 0,
      area: initialData?.area || undefined,
      bedrooms: initialData?.bedrooms || undefined,
      bathrooms: initialData?.bathrooms || undefined,
    },
  });

  // Effect to update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('Updating form with initialData:', initialData);
      form.reset({
        title: initialData.title || '',
        description: initialData.description || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip_code: initialData.zip_code || '',
        type: initialData.type || 'apartment',
        status: initialData.status || 'available',
        value: initialData.value || 0,
        area: initialData.area || undefined,
        bedrooms: initialData.bedrooms || undefined,
        bathrooms: initialData.bathrooms || undefined,
      });
      
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
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

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('Form submitted with data:', data);
    onSubmit(data as PropertyFormData, imageFile || undefined);
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
      form.setValue('city', addressData.localidade || '');
      form.setValue('state', addressData.uf || '');
      
      toast.success('Endereço encontrado!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar CEP');
    } finally {
      setIsSearchingCEP(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Informações do Imóvel</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              </div>
              
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
        </CardContent>
      </Card>
      
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
    </div>
  );
}

export type { PropertyFormProps };
