
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, Home } from "lucide-react";
import { cn } from "@/lib/utils";

type PropertyStatus = "available" | "rented" | "airbnb";

interface PropertyCardProps {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  type: string;
  status: PropertyStatus;
  value: number;
  imageUrl?: string;
  onSelect?: (id: string) => void;
}

export function PropertyCard({
  id,
  title,
  address,
  city,
  state,
  type,
  status,
  value,
  imageUrl,
  onSelect,
}: PropertyCardProps) {
  const statusConfig = {
    available: {
      label: "Disponível",
      color: "bg-emerald-500",
    },
    rented: {
      label: "Alugado",
      color: "bg-blue-500",
    },
    airbnb: {
      label: "Airbnb",
      color: "bg-red-500",
    },
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-40 bg-muted relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Home className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
        )}
        <div
          className={cn(
            "absolute top-3 right-3 px-2 py-1 text-xs font-medium text-white rounded",
            statusConfig[status].color
          )}
        >
          {statusConfig[status].label}
        </div>
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="line-clamp-1">{title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate text-xs">{address}</span>
            </CardDescription>
            <div className="text-xs text-muted-foreground mt-1">
              {city}, {state}
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold text-petroleum-500">
          {formatCurrency(value)}
        </div>
        <div className="text-xs text-muted-foreground">
          {status === "available" ? "Valor de venda" : "Valor do aluguel"}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onSelect && onSelect(id)}
        >
          Ver detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
