import React, { useState } from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Car,
  ClipboardCheck,
  Edit,
  FileSignature,
  MapPin,
  Receipt,
  Ruler,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Property } from "@/types/property";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionForm } from "@/components/finances/transaction-form";
import { ActivityForm } from "@/components/activities/activity-form";
import { PropertyValuationManager } from "./PropertyValuationManager";
import { ContractForm } from "@/components/contracts/contract-form";
import { useFinancialCategories } from "@/hooks/use-financial-categories";
import { TransactionFormData, useFinancialTransactions } from "@/hooks/use-financial-transactions";
import { useActivityMutations } from "@/hooks/use-activity-mutations";
import { useContractMutations } from "@/hooks/use-contract-mutations";
import { useProperties } from "@/hooks/use-properties";
import { ActivityFormData } from "@/types/activity";
import { ContractFormData } from "@/types/contract";
import { formatCurrency } from "@/utils/currency";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PropertyHeroHeaderProps {
  property: Property | null | undefined;
  isLoading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

type DetailModal = "transaction" | "activity" | "valuation" | "contract" | null;

const propertyTypeLabels: Record<string, string> = {
  apartment: "Apartamento",
  house: "Casa",
  commercial: "Comercial",
  land: "Terreno",
  rural: "Rural",
};

const statusConfig: Record<string, { label: string; dot: string }> = {
  rented:      { label: "Alugado",        dot: "bg-[#6f8f74]" },
  available:   { label: "Disponível",      dot: "bg-[#4a7c59]" },
  airbnb:      { label: "Airbnb",          dot: "bg-[#c4934f]" },
  maintenance: { label: "Em manutenção",  dot: "bg-amber-400" },
  sold:        { label: "Vendido",         dot: "bg-stone-400" },
};

const GLASS = "border border-white/30 bg-white/15 backdrop-blur-md text-white shadow-sm font-semibold";

const getStatusConfig = (status?: string | null) =>
  statusConfig[status || ""] || { label: status || "Sem status", dot: "bg-white/60" };

const getTypeLabel = (type?: string | null) => propertyTypeLabels[type || ""] || type || "N/A";

export const PropertyHeroHeader: React.FC<PropertyHeroHeaderProps> = ({
  property,
  isLoading,
  onBack,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const [activeModal, setActiveModal] = useState<DetailModal>(null);
  const { user } = useAuth();
  // Viewers have read-only access; RLS also blocks writes server-side.
  const canWrite = user?.role !== "viewer";
  const { categoryOptions } = useFinancialCategories();
  const { createTransaction, isCreating: isCreatingTransaction } = useFinancialTransactions();
  const { createActivity, isCreating: isCreatingActivity } = useActivityMutations();
  const { createContract, isCreatingContract } = useContractMutations();
  const { properties } = useProperties();

  const propertyOptions = properties.map((item) => ({
    value: item.id,
    label: item.title,
  }));

  const handleTransactionSubmit = async (data: TransactionFormData) => {
    try {
      await createTransaction({
        ...data,
        property_id: property?.id || null,
      });
      setActiveModal(null);
      toast.success("Transação criada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar transação.");
    }
  };

  const handleActivitySubmit = async (data: ActivityFormData) => {
    try {
      await createActivity({
        ...data,
        property_id: property?.id || null,
      });
      setActiveModal(null);
      toast.success("Atividade criada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar atividade.");
    }
  };

  const handleContractSubmit = async (data: ContractFormData) => {
    try {
      await createContract({
        ...data,
        property_id: property?.id || "",
      });
      setActiveModal(null);
      toast.success("Contrato criado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar contrato.");
    }
  };

  if (isLoading) {
    return (
      <div className="premium-panel animate-rise overflow-hidden rounded-[2.5rem] p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <Skeleton className="h-[340px] rounded-[2rem]" />
          <div className="space-y-4">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-24 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const status = getStatusConfig(property?.status);
  const marketValue = Number(property?.value || 0);
  const rentValue = Number(property?.rental_value || 0);
  const monthlyYield = marketValue > 0 && rentValue > 0 ? (rentValue / marketValue) * 100 : null;
  const location = [property?.address, property?.neighborhood, property?.city, property?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <section className="premium-gradient animate-rise overflow-hidden rounded-[2.5rem] p-4 text-primary-foreground shadow-[0_34px_90px_-58px_rgba(31,27,24,0.95)] md:p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-secondary">
            {property?.image_url ? (
              <img src={property.image_url} alt={property.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#242021_0%,#5a3827_55%,#c4934f_100%)]">
                <Building2 className="h-24 w-24 text-white/28" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-black/18" />

            <div className="relative z-10 flex h-full min-h-[360px] flex-col justify-between p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="border border-white/30 bg-white/15 backdrop-blur-md text-white hover:bg-white/25 shadow-sm"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                {canWrite && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="border border-white/30 bg-white/15 backdrop-blur-md text-white hover:bg-white/25 shadow-sm font-semibold"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="border border-white/30 bg-white/15 backdrop-blur-md text-white hover:bg-red-500/40 shadow-sm font-semibold"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir imóvel</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação remove o imóvel da carteira. Ela não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={onDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                )}
              </div>

              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn(GLASS)}>
                    <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", status.dot)} />
                    {status.label}
                  </Badge>
                  <Badge variant="outline" className={GLASS}>
                    {getTypeLabel(property?.type)}
                  </Badge>
                  {property?.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className={GLASS}>
                      {tag}
                    </Badge>
                  ))}
                </div>

                <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
                  {property?.title}
                </h1>
                <div className="mt-4 flex max-w-3xl items-center gap-2 text-sm text-white/78">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-2">{location || "Localização não informada"}</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <HeroFact icon={Ruler}    label="Área"       value={property?.area         ? `${property.area} m²`          : "N/A"} />
                  <HeroFact icon={BedDouble} label="Quartos"    value={property?.bedrooms     ? String(property.bedrooms)      : "N/A"} />
                  <HeroFact icon={Bath}      label="Banheiros"  value={property?.bathrooms    ? String(property.bathrooms)     : "N/A"} />
                  <HeroFact icon={Car}       label="Vagas"      value={property?.garage_spots ? String(property.garage_spots)  : "N/A"} />
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[2rem] border border-white/14 bg-white/10 p-5">
              <p className="text-sm text-white/58">Valor de mercado</p>
              <p className="mt-2 text-4xl font-semibold leading-none">{formatCurrency(marketValue)}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SideMetric label="Aluguel informado" value={rentValue > 0 ? formatCurrency(rentValue) : "Não informado"} />
                <SideMetric label="Yield mensal" value={monthlyYield !== null ? `${monthlyYield.toFixed(2)}%` : "N/A"} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/14 bg-white/10 p-4">
              <p className="mb-3 text-xs font-semibold uppercase text-white/48">Ações rápidas</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <QuickAction icon={Receipt} label="Transação" onClick={() => setActiveModal("transaction")} />
                <QuickAction icon={ClipboardCheck} label="Atividade" onClick={() => setActiveModal("activity")} />
                <QuickAction icon={TrendingUp} label="Avaliação" onClick={() => setActiveModal("valuation")} />
                <QuickAction icon={FileSignature} label="Contrato" onClick={() => setActiveModal("contract")} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/14 bg-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-white/48">Cadastro</p>
                  <p className="mt-1 text-sm text-white/72">
                    Criado em {property?.created_at ? new Date(property.created_at).toLocaleDateString("pt-BR") : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Dialog open={activeModal === "transaction"} onOpenChange={(open) => setActiveModal(open ? "transaction" : null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar transação financeira</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleTransactionSubmit}
            onCancel={() => setActiveModal(null)}
            isSubmitting={isCreatingTransaction}
            properties={propertyOptions}
            categories={categoryOptions}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "activity"} onOpenChange={(open) => setActiveModal(open ? "activity" : null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar atividade</DialogTitle>
          </DialogHeader>
          <ActivityForm
            onSubmit={handleActivitySubmit}
            onCancel={() => setActiveModal(null)}
            isSubmitting={isCreatingActivity}
            initialData={{ property_id: property?.id || "" }}
            propertyOptions={propertyOptions}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "valuation"} onOpenChange={(open) => setActiveModal(open ? "valuation" : null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar avaliações de mercado</DialogTitle>
          </DialogHeader>
          <PropertyValuationManager property={property} onSuccess={() => setActiveModal(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "contract"} onOpenChange={(open) => setActiveModal(open ? "contract" : null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar novo contrato</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <ContractForm
              initialData={{ property_id: property?.id || "" }}
              onSubmit={handleContractSubmit}
              onCancel={() => setActiveModal(null)}
              isLoading={isCreatingContract}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

function HeroFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 backdrop-blur-md px-3 py-2 text-white shadow-sm">
      <Icon className="h-4 w-4 text-white/80" />
      <span className="text-xs text-white/70">{label}</span>
      <strong className="text-sm font-semibold">{value}</strong>
    </div>
  );
}

function SideMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/12 bg-white/8 p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="justify-start border border-white/12 bg-white/8 text-white hover:bg-white/14"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
