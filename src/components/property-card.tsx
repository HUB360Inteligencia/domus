
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Bed, Bath, Car, SquareIcon } from 'lucide-react';

interface PropertyCardProps {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  type: string;
  status: string;
  value: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  garage_spots?: number;
  imageUrl?: string;
  onSelect: () => void;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  commercial: 'Comercial',
  land: 'Terreno',
  rural: 'Rural',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  airbnb: 'Airbnb',
  maintenance: 'Em manutenção',
  sold: 'Vendido',
};

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-[#4a7c59] border-[#4a7c59]',
  rented: 'bg-[#6f8f74] border-[#6f8f74]',
  airbnb: 'bg-[#c4934f] border-[#c4934f]',
  maintenance: 'bg-amber-500 border-amber-500',
  sold: 'bg-stone-500 border-stone-500',
};

export function PropertyCard({
  id,
  title,
  address,
  city,
  state,
  type,
  status,
  value,
  area,
  bedrooms,
  bathrooms,
  garage_spots,
  imageUrl,
  onSelect
}: PropertyCardProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <div className="aspect-video relative overflow-hidden bg-muted">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="h-16 w-16 text-muted-foreground opacity-20" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge 
            className={`text-white ${STATUS_COLORS[status] || 'bg-gray-500'}`}
          >
            {STATUS_LABELS[status] || status}
          </Badge>
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="border-[#e5e0d8] bg-[#f5f2eb] text-[#242021] dark:border-white/10 dark:bg-white/10 dark:text-white font-medium shadow-sm">
            {PROPERTY_TYPE_LABELS[type] || type}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">{title}</h3>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">{address}, {city}, {state}</span>
          </div>
          
          <div className="text-xl font-bold text-primary">
            {formatCurrency(value)}
          </div>
          
          {/* Property details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {area && (
              <div className="flex items-center gap-1">
                <SquareIcon className="h-4 w-4" />
                <span>{area} m²</span>
              </div>
            )}
            {bedrooms && bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{bedrooms}</span>
              </div>
            )}
            {bathrooms && bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{bathrooms}</span>
              </div>
            )}
            {garage_spots && garage_spots > 0 && (
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                <span>{garage_spots}</span>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full mt-4" 
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
