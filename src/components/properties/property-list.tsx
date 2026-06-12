import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Bath,
  BedDouble,
  Building,
  Car,
  ChevronRight,
  Filter,
  Home,
  LayoutGrid,
  LayoutList,
  Map as MapIcon,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Property } from "@/types/property";
import { PropertyTable } from "./property-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PropertyMapView } from "./property-map-view";
import { AdvancedMapView } from "./advanced-map/advanced-map-view";
import { formatCurrency } from "@/utils/currency";
import { cn } from "@/lib/utils";

interface PropertyListProps {
  properties: Property[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type ViewMode = "card" | "list" | "table" | "map" | "advanced";

const viewModes: ViewMode[] = ["card", "list", "table", "map", "advanced"];

const propertyTypeLabels: Record<string, string> = {
  apartment: "Apartamento",
  house: "Casa",
  commercial: "Comercial",
  land: "Terreno",
  rural: "Rural",
};

const statusConfig: Record<string, { label: string; className: string; overlayClassName: string; dot: string }> = {
  available: {
    label: "Disponível",
    className: "border-[#4a7c59]/25 bg-[#4a7c59]/12 text-[#2f543a]",
    overlayClassName: "border-white/30 bg-white/15 backdrop-blur-md text-white shadow-sm",
    dot: "bg-[#4a7c59]",
  },
  rented: {
    label: "Alugado",
    className: "border-[#6f8f74]/25 bg-[#6f8f74]/12 text-[#3f5f45]",
    overlayClassName: "border-white/30 bg-white/15 backdrop-blur-md text-white shadow-sm",
    dot: "bg-[#6f8f74]",
  },
  airbnb: {
    label: "Airbnb",
    className: "border-[#c4934f]/30 bg-[#c4934f]/14 text-[#7a5529]",
    overlayClassName: "border-white/30 bg-white/15 backdrop-blur-md text-white shadow-sm",
    dot: "bg-[#c4934f]",
  },
  maintenance: {
    label: "Em manutenção",
    className: "border-amber-200/40 bg-amber-500/10 text-amber-800",
    overlayClassName: "border-white/30 bg-white/15 backdrop-blur-md text-white shadow-sm",
    dot: "bg-amber-400",
  },
  sold: {
    label: "Vendido",
    className: "border-stone-300 bg-stone-100 text-stone-700",
    overlayClassName: "border-white/30 bg-white/15 backdrop-blur-md text-white shadow-sm",
    dot: "bg-stone-400",
  },
};

const isViewMode = (value: string): value is ViewMode => viewModes.includes(value as ViewMode);

const compactCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);

const getStatusConfig = (status: string) =>
  statusConfig[status] || {
    label: status || "Sem status",
    className: "border-border bg-secondary text-secondary-foreground",
    overlayClassName: "border-white/30 bg-white/15 backdrop-blur-md text-white shadow-sm",
    dot: "bg-muted-foreground",
  };

export function PropertyList({ properties, isLoading, onSelect, onAddNew }: PropertyListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!error) return undefined;

    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!user) {
      setError("Não autenticado. Faça login para ver seus imóveis.");
    }
  }, [user]);

  const filteredProperties = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return properties.filter((property) => {
      const searchableText = [
        property.title,
        property.address,
        property.city,
        property.state,
        property.neighborhood,
        property.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch ? searchableText.includes(normalizedSearch) : true;
      const matchesType = filterType ? property.type === filterType : true;
      const matchesStatus = filterStatus ? property.status === filterStatus : true;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filterStatus, filterType, properties, searchTerm]);

  const summary = useMemo(() => {
    const totalValue = properties.reduce((sum, property) => sum + Number(property.value || 0), 0);
    const rentableProperties = properties.filter((property) => property.status !== "sold");
    const occupiedProperties = rentableProperties.filter(
      (property) => property.status === "rented" || property.status === "airbnb"
    );
    const monthlyRent = properties.reduce((sum, property) => sum + Number(property.rental_value || 0), 0);
    const averageValue = properties.length > 0 ? totalValue / properties.length : 0;
    const occupancyRate = rentableProperties.length > 0
      ? (occupiedProperties.length / rentableProperties.length) * 100
      : 0;

    return {
      totalValue,
      averageValue,
      monthlyRent,
      occupancyRate,
      totalProperties: properties.length,
      occupiedProperties: occupiedProperties.length,
      rentableProperties: rentableProperties.length,
    };
  }, [properties]);

  const activeFiltersCount = [searchTerm.trim(), filterType, filterStatus].filter(Boolean).length;
  const maxPropertyValue = Math.max(...filteredProperties.map((property) => Number(property.value || 0)), 1);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType(null);
    setFilterStatus(null);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1540px] space-y-5 pb-8">
        <div className="premium-panel animate-rise rounded-[2.5rem] p-6">
          <div className="h-8 w-48 rounded-full bg-secondary" />
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-3xl bg-secondary/70" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1540px] space-y-5 pb-8">
      {error && (
        <Alert variant="destructive" className="rounded-3xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="premium-gradient animate-rise overflow-hidden rounded-[2.5rem] p-5 text-primary-foreground shadow-[0_34px_90px_-58px_rgba(31,27,24,0.95)] md:p-7">
        <div className="grid gap-7 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="flex min-h-[250px] flex-col justify-between gap-8">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/72">
                <Building className="h-4 w-4" />
                Carteira imobiliária
              </div>
              <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
                Imóveis
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/66">
                Acompanhe valor, ocupação e dados operacionais dos ativos em uma tela mais objetiva.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-white/18 bg-white/12 text-white hover:bg-white/18" onClick={onAddNew}>
                <Plus className="h-4 w-4" />
                Novo imóvel
              </Button>
              <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/16" onClick={() => setViewMode("map")}>
                <MapIcon className="h-4 w-4" />
                Ver mapa
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PortfolioMetric
              icon={WalletCards}
              label="Patrimônio"
              value={compactCurrency(summary.totalValue)}
              detail={`${summary.totalProperties} ativos cadastrados`}
              featured
            />
            <PortfolioMetric
              icon={Home}
              label="Ocupação"
              value={`${summary.occupancyRate.toFixed(1)}%`}
              detail={`${summary.occupiedProperties}/${summary.rentableProperties || 0} ativos locáveis`}
            />
            <PortfolioMetric
              icon={TrendingUp}
              label="Valor médio"
              value={compactCurrency(summary.averageValue)}
              detail="Média por ativo"
            />
            <PortfolioMetric
              icon={WalletCards}
              label="Aluguel cadastrado"
              value={compactCurrency(summary.monthlyRent)}
              detail="Potencial mensal informado"
            />
          </div>
        </div>
      </section>

      <section className="premium-panel dark:premium-panel-dark animate-rise rounded-[2rem] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, endereço, cidade ou bairro"
              className="h-12 rounded-2xl border-white/70 bg-white/75 pl-10 shadow-none dark:border-white/10 dark:bg-white/5"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <Select value={filterType || "all"} onValueChange={(value) => setFilterType(value === "all" ? null : value)}>
              <SelectTrigger className="h-12 rounded-2xl border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
                <Filter className="mr-2 h-4 w-4 text-accent" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="apartment">Apartamento</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="land">Terreno</SelectItem>
                <SelectItem value="rural">Rural</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus || "all"} onValueChange={(value) => setFilterStatus(value === "all" ? null : value)}>
              <SelectTrigger className="h-12 rounded-2xl border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
                <SlidersHorizontal className="mr-2 h-4 w-4 text-accent" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="rented">Alugado</SelectItem>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="maintenance">Em manutenção</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 xl:justify-end">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => {
                if (isViewMode(value)) setViewMode(value);
              }}
              className="rounded-2xl border border-white/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5"
            >
              <ToggleGroupItem value="card" aria-label="Ver em cards" className="rounded-xl">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Ver em lista" className="rounded-xl">
                <LayoutList className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Ver em tabela" className="rounded-xl">
                <TableIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="map" aria-label="Ver no mapa" className="rounded-xl">
                <MapIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="advanced" aria-label="Ver análise avançada" className="rounded-xl">
                <BarChart3 className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-muted-foreground">
        <span>
          Mostrando <strong className="text-foreground">{filteredProperties.length}</strong> de {properties.length} imóveis
        </span>
        {activeFiltersCount > 0 && <span>{activeFiltersCount} filtro(s) aplicado(s)</span>}
      </div>

      {filteredProperties.length > 0 ? (
        <>
          {viewMode === "table" && (
            <div className="premium-panel dark:premium-panel-dark rounded-[2rem] p-4">
              <PropertyTable properties={filteredProperties} onSelect={onSelect} />
            </div>
          )}

          {viewMode === "card" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProperties.map((property) => (
                <PortfolioPropertyCard
                  key={property.id}
                  property={property}
                  maxValue={maxPropertyValue}
                  onSelect={() => onSelect(property.id)}
                />
              ))}
            </div>
          )}

          {viewMode === "list" && (
            <div className="space-y-3">
              {filteredProperties.map((property) => (
                <PortfolioPropertyListItem
                  key={property.id}
                  property={property}
                  onSelect={() => onSelect(property.id)}
                />
              ))}
            </div>
          )}

          {viewMode === "map" && (
            <div className="premium-panel dark:premium-panel-dark h-[640px] overflow-hidden rounded-[2rem] p-3">
              <PropertyMapView properties={filteredProperties} onSelect={onSelect} />
            </div>
          )}

          {viewMode === "advanced" && (
            <div className="premium-panel dark:premium-panel-dark h-[640px] overflow-hidden rounded-[2rem] p-3">
              <AdvancedMapView properties={filteredProperties} onSelect={onSelect} />
            </div>
          )}
        </>
      ) : (
        <div className="premium-panel dark:premium-panel-dark flex flex-col items-center justify-center rounded-[2.5rem] px-6 py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary">
            <Building className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-xl font-semibold">Nenhum imóvel encontrado</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {properties.length === 0
              ? "Cadastre o primeiro ativo para começar a acompanhar patrimônio, ocupação e contratos."
              : "Ajuste os filtros para encontrar o imóvel desejado."}
          </p>
          <Button className="mt-6" onClick={properties.length === 0 ? onAddNew : clearFilters}>
            {properties.length === 0 ? (
              <>
                <Plus className="h-4 w-4" />
                Adicionar imóvel
              </>
            ) : (
              "Limpar filtros"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function PortfolioMetric({
  icon: Icon,
  label,
  value,
  detail,
  featured,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  featured?: boolean;
}) {
  return (
    <div className={cn("rounded-[1.75rem] border p-4", featured ? "border-white/18 bg-white/14" : "border-white/12 bg-white/8")}>
      <div className="mb-5 flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/12">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <p className="text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-2 text-xs text-white/58">{detail}</p>
    </div>
  );
}

function PortfolioPropertyCard({
  property,
  maxValue,
  onSelect,
}: {
  property: Property;
  maxValue: number;
  onSelect: () => void;
}) {
  const status = getStatusConfig(property.status);
  const marketValue = Number(property.value || 0);
  const rentValue = Number(property.rental_value || 0);
  const valueWidth = Math.max((marketValue / maxValue) * 100, 6);
  const monthlyYield = marketValue > 0 && rentValue > 0 ? (rentValue / marketValue) * 100 : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="premium-panel dark:premium-panel-dark group animate-rise overflow-hidden rounded-[2rem] p-0 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#242021_0%,#5a3827_58%,#c4934f_100%)]">
            <Building className="h-12 w-12 text-white/45" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/12 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge className={cn("border font-semibold", status.overlayClassName)}>
            <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", status.dot)} />
            {status.label}
          </Badge>
          <Badge className="border border-white/30 bg-white/15 backdrop-blur-md text-white font-medium shadow-sm">
            {propertyTypeLabels[property.type] || property.type}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="line-clamp-1 text-xs text-white/70">
            {property.city}, {property.state}
          </p>
          <h3 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight text-white">
            {property.title}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Valor de mercado</p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(marketValue)}</p>
          </div>
          <ChevronRight className="mt-3 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-to-r from-[#242021] to-[#c4934f]" style={{ width: `${valueWidth}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <PropertyTinyStat icon={BedDouble} value={property.bedrooms ? String(property.bedrooms) : "-"} label="Quartos" />
          <PropertyTinyStat icon={Bath} value={property.bathrooms ? String(property.bathrooms) : "-"} label="Banhos" />
          <PropertyTinyStat icon={Car} value={property.garage_spots ? String(property.garage_spots) : "-"} label="Vagas" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-3xl border border-white/60 bg-white/55 px-3 py-3 text-sm dark:border-white/10 dark:bg-white/5">
          <span className="text-muted-foreground">Aluguel</span>
          <strong>{rentValue > 0 ? formatCurrency(rentValue) : "Não informado"}</strong>
        </div>

        {monthlyYield !== null && (
          <p className="mt-3 text-xs text-muted-foreground">
            Yield mensal cadastrado: <strong className="text-foreground">{monthlyYield.toFixed(2)}%</strong>
          </p>
        )}
      </div>
    </button>
  );
}

function PortfolioPropertyListItem({ property, onSelect }: { property: Property; onSelect: () => void }) {
  const status = getStatusConfig(property.status);
  const marketValue = Number(property.value || 0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="premium-panel dark:premium-panel-dark group flex w-full flex-col gap-4 rounded-[2rem] p-4 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:flex-row md:items-center"
    >
      <div className="relative h-28 w-full overflow-hidden rounded-3xl bg-secondary md:w-40">
        {property.image_url ? (
          <img src={property.image_url} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#242021,#c4934f)]">
            <Building className="h-8 w-8 text-white/45" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge className={cn("border", status.className)}>{status.label}</Badge>
          <Badge variant="outline">{propertyTypeLabels[property.type] || property.type}</Badge>
        </div>
        <h3 className="truncate text-lg font-semibold">{property.title}</h3>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {property.address}, {property.city}, {property.state}
          </span>
        </div>
      </div>

      <div className="grid gap-3 text-sm md:w-72 md:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Valor</p>
          <p className="font-semibold">{formatCurrency(marketValue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Área</p>
          <p className="font-semibold">{property.area ? `${property.area} m²` : "N/A"}</p>
        </div>
      </div>

      <ChevronRight className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 md:block" />
    </button>
  );
}

function PropertyTinyStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-secondary/60 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <span>{label}</span>
    </div>
  );
}
