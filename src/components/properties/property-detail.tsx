import React, { useMemo, useState } from "react";
import { Banknote, ImageIcon, Info, MapPin, Receipt, Ticket, TrendingUp, WalletCards, Activity, Users } from "lucide-react";
import { LinkedContactsSection } from "@/components/contacts/linked-contacts-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Property } from "@/types/property";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PropertyDetailMap } from "./property-detail-map";
import { PropertyFinancialInvestmentSection } from "./PropertyFinancialInvestmentSection";
import { PropertyTransactionsSection } from "./PropertyTransactionsSection";
import { PropertyImageGallery } from "./PropertyImageGallery";
import { PropertyHeroHeader } from "./property-hero-header";
import { PropertyFinancialDetailsCard } from "./PropertyFinancialDetailsCard";
import { PropertyContractSection } from "./PropertyContractSection";
import { PropertyActivitiesSection } from "./PropertyActivitiesSection";
import { PropertyMonthlyYieldCard } from "./PropertyMonthlyYieldCard";
import { cn } from "@/lib/utils";

interface PropertyDetailProps {
  property: Property | null | undefined;
  isLoading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const statusLabels: Record<string, string> = {
  rented: "Alugado",
  available: "Disponível",
  airbnb: "Airbnb",
  maintenance: "Em manutenção",
  sold: "Vendido",
};

const statusStyles: Record<string, string> = {
  rented: "border-[#6f8f74]/25 bg-[#6f8f74]/12 text-[#3f5f45]",
  available: "border-[#4a7c59]/25 bg-[#4a7c59]/12 text-[#2f543a]",
  airbnb: "border-[#c4934f]/30 bg-[#c4934f]/14 text-[#7a5529]",
  maintenance: "border-amber-200 bg-amber-50 text-amber-800",
  sold: "border-stone-300 bg-stone-100 text-stone-700",
};

const formatMoney = (value: number | null | undefined) => {
  if (value === undefined || value === null) return "N/A";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatFeatureLabel = (feature: string) =>
  feature
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getStatusLabel = (status?: string | null) => statusLabels[status || ""] || status || "N/A";

export const PropertyDetail: React.FC<PropertyDetailProps> = ({
  property,
  isLoading,
  onBack,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  const featureItems = useMemo(() => {
    const features = property?.features;

    if (!features) return [];

    if (Array.isArray(features)) {
      return features.filter((feature): feature is string => typeof feature === "string" && feature.trim().length > 0);
    }

    if (typeof features === "string") {
      return features.trim() ? [features] : [];
    }

    if (typeof features === "object") {
      return Object.entries(features as Record<string, unknown>)
        .filter(([, value]) => value === true)
        .map(([key]) => key);
    }

    return [];
  }, [property?.features]);

  const investmentBase = Number(property?.purchase_value || property?.total_investment || 0);
  const marketValue = Number(property?.value || 0);
  const rentValue = Number(property?.rental_value || 0);
  const appreciation = investmentBase > 0 ? ((marketValue - investmentBase) / investmentBase) * 100 : null;
  const monthlyYield = marketValue > 0 && rentValue > 0 ? (rentValue / marketValue) * 100 : null;

  return (
    <div className="space-y-6">
      <PropertyHeroHeader
        property={property}
        isLoading={isLoading}
        onBack={onBack}
        onEdit={onEdit}
        onDelete={onDelete}
        isDeleting={isDeleting}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SnapshotCard
          icon={WalletCards}
          label="Valor de mercado"
          value={formatMoney(property?.value)}
          detail="Referência atual cadastrada"
          featured
        />
        <SnapshotCard
          icon={TrendingUp}
          label="Valorização"
          value={appreciation !== null ? `${appreciation >= 0 ? "+" : ""}${appreciation.toFixed(1)}%` : "N/A"}
          detail={investmentBase > 0 ? `Base: ${formatMoney(investmentBase)}` : "Sem base cadastrada"}
        />
        <SnapshotCard
          icon={Banknote}
          label="Aluguel"
          value={rentValue > 0 ? formatMoney(rentValue) : "N/A"}
          detail={monthlyYield !== null ? `Yield mensal ${monthlyYield.toFixed(2)}%` : "Valor não informado"}
        />
        <SnapshotCard
          icon={MapPin}
          label="Localização"
          value={property?.city || "N/A"}
          detail={[property?.neighborhood, property?.state].filter(Boolean).join(", ") || "Sem complemento"}
        />
      </section>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="premium-panel dark:premium-panel-dark grid h-auto grid-cols-2 gap-1 rounded-[2rem] p-1 md:grid-cols-7">
          <TabsTrigger value="overview" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="inline sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
            <span className="inline sm:hidden">Finan.</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="inline sm:hidden">Trans.</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Atividades</span>
            <span className="inline sm:hidden">Ativ.</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Contratos</span>
            <span className="inline sm:hidden">Contr.</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Contatos</span>
            <span className="inline sm:hidden">Contat.</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <ImageIcon className="h-4 w-4" />
            <span>Fotos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="premium-panel dark:premium-panel-dark h-full min-h-[280px] rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do imóvel</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {isLoading ? (
                  <>
                    {[0, 1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/55 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={cn("border", statusStyles[property?.status || ""] || "border-border bg-secondary text-secondary-foreground")}>
                        {getStatusLabel(property?.status)}
                      </Badge>
                    </div>
                    <PropertyInfoRow label="Área" value={property?.area ? `${property.area} m²` : "N/A"} />
                    <PropertyInfoRow label="Quartos" value={property?.bedrooms ? String(property.bedrooms) : "N/A"} />
                    <PropertyInfoRow label="Banheiros" value={property?.bathrooms ? String(property.bathrooms) : "N/A"} />
                    <PropertyInfoRow label="Vagas" value={property?.garage_spots ? String(property.garage_spots) : "N/A"} />
                    {property?.condo_fee !== undefined && property?.condo_fee !== null && (
                      <PropertyInfoRow label="Condomínio" value={formatMoney(property.condo_fee)} />
                    )}
                    {property?.neighborhood && <PropertyInfoRow label="Bairro" value={property.neighborhood} />}
                  </>
                )}
              </CardContent>
            </Card>

            <div className="h-full min-h-[280px]">
              <PropertyFinancialDetailsCard property={property} isLoading={isLoading} />
            </div>

            <div className="h-full min-h-[280px]">
              <PropertyMonthlyYieldCard property={property} isLoading={isLoading} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="premium-panel dark:premium-panel-dark relative h-full min-h-[280px] overflow-hidden rounded-[2rem]">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/45 via-black/20 to-transparent px-5 pb-8 pt-4">
                <MapPin className="h-4 w-4 text-white drop-shadow" />
                <CardTitle className="text-lg text-white drop-shadow">Localização</CardTitle>
              </div>
              <CardContent className="h-full p-0">
                {isLoading ? (
                  <Skeleton className="h-full min-h-[360px] w-full" />
                ) : property ? (
                  <PropertyDetailMap property={property} />
                ) : (
                  <div className="flex h-full min-h-[360px] items-center justify-center bg-muted">
                    <p className="text-muted-foreground">Propriedade não encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex h-full min-h-[280px] flex-col space-y-5">
              <Card className="premium-panel dark:premium-panel-dark flex-1 rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : property?.description ? (
                    <p className="whitespace-pre-line leading-6 text-muted-foreground">{property.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Nenhuma descrição disponível.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="premium-panel dark:premium-panel-dark flex-1 rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-lg">Características</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {[0, 1, 2, 3, 4, 5].map((item) => (
                        <Skeleton key={item} className="h-8 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : featureItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {featureItems.map((feature) => (
                        <div key={feature} className="flex items-center rounded-2xl bg-secondary/60 px-3 py-2">
                          <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm">{formatFeatureLabel(feature)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Nenhuma característica adicionada.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <PropertyFinancialInvestmentSection property={property} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="transactions">
          <PropertyTransactionsSection property={property} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="activities">
          <PropertyActivitiesSection property={property} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="contracts">
          <PropertyContractSection property={property} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="contacts">
          {property?.id && <LinkedContactsSection entity="property" entityId={property.id} />}
        </TabsContent>

        <TabsContent value="photos">
          <PropertyImageGallery propertyId={property?.id || null} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function SnapshotCard({
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
    <div
      className={cn(
        "animate-rise rounded-[2rem] border p-5",
        featured
          ? "premium-gradient text-primary-foreground shadow-[0_28px_75px_-48px_rgba(80,52,31,0.95)]"
          : "premium-panel dark:premium-panel-dark"
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", featured ? "bg-white/14" : "bg-primary/10 text-primary")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className={cn("text-sm", featured ? "text-white/68" : "text-muted-foreground")}>{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none">{value}</p>
      <p className={cn("mt-2 text-xs", featured ? "text-white/56" : "text-muted-foreground")}>{detail}</p>
    </div>
  );
}

function PropertyInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
