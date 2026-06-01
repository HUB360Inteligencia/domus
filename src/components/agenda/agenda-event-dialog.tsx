import { FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseCurrencyToNumber } from "@/lib/format";
import { AgendaEventInput, AgendaEventType } from "@/types/agenda";

interface AgendaEventDialogProps {
  open: boolean;
  selectedDate: Date;
  isSubmitting?: boolean;
  propertyOptions: { label: string; value: string }[];
  contractOptions: { label: string; value: string; propertyId?: string | null }[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: AgendaEventInput) => Promise<void>;
}

const initialForm = (date: Date) => ({
  title: "",
  description: "",
  type: "appointment" as AgendaEventType,
  date: format(date, "yyyy-MM-dd"),
  propertyId: "none",
  contractId: "none",
  amount: "",
  reminder: "1440",
});

export function AgendaEventDialog({
  open,
  selectedDate,
  isSubmitting = false,
  propertyOptions,
  contractOptions,
  onOpenChange,
  onSubmit,
}: AgendaEventDialogProps) {
  const [form, setForm] = useState(initialForm(selectedDate));

  useEffect(() => {
    if (open) setForm(initialForm(selectedDate));
  }, [open, selectedDate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedContract = contractOptions.find((contract) => contract.value === form.contractId);
    const selectedPropertyId =
      form.propertyId !== "none" ? form.propertyId : selectedContract?.propertyId || null;
    const amount = form.amount ? parseCurrencyToNumber(form.amount) : null;

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      startsAt: form.date,
      allDay: true,
      propertyId: selectedPropertyId,
      contractId: form.contractId !== "none" ? form.contractId : null,
      amount,
      cashflowDirection: form.type === "receipt" ? "receivable" : form.type === "payment" ? "payable" : null,
      reminderMinutesBefore: form.reminder === "none" ? null : Number(form.reminder),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-white/70 bg-background/95 p-0 shadow-2xl backdrop-blur dark:border-white/10 sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/12 text-accent">
                <CalendarPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Novo evento</DialogTitle>
                <DialogDescription>Registre compromissos, pagamentos, recebimentos e lembretes internos.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="agenda-title">Titulo</Label>
              <Input
                id="agenda-title"
                name="agenda-title"
                autoComplete="off"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
                placeholder="Ex.: Vistoria do apartamento 302"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-type">Tipo</Label>
              <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value as AgendaEventType }))}>
                <SelectTrigger id="agenda-type">
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Compromisso</SelectItem>
                  <SelectItem value="task">Tarefa</SelectItem>
                  <SelectItem value="maintenance">Manutencao</SelectItem>
                  <SelectItem value="inspection">Vistoria</SelectItem>
                  <SelectItem value="receipt">Recebimento</SelectItem>
                  <SelectItem value="payment">Pagamento</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-date">Data</Label>
              <Input
                id="agenda-date"
                name="agenda-date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-property">Imovel</Label>
              <Select value={form.propertyId} onValueChange={(value) => setForm((current) => ({ ...current, propertyId: value }))}>
                <SelectTrigger id="agenda-property">
                  <SelectValue placeholder="Selecionar imovel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vinculo</SelectItem>
                  {propertyOptions.map((property) => (
                    <SelectItem key={property.value} value={property.value}>
                      {property.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-contract">Contrato</Label>
              <Select value={form.contractId} onValueChange={(value) => setForm((current) => ({ ...current, contractId: value }))}>
                <SelectTrigger id="agenda-contract">
                  <SelectValue placeholder="Selecionar contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vinculo</SelectItem>
                  {contractOptions.map((contract) => (
                    <SelectItem key={contract.value} value={contract.value}>
                      {contract.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-amount">Valor</Label>
              <Input
                id="agenda-amount"
                name="agenda-amount"
                inputMode="decimal"
                autoComplete="off"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-reminder">Lembrete Domus</Label>
              <Select value={form.reminder} onValueChange={(value) => setForm((current) => ({ ...current, reminder: value }))}>
                <SelectTrigger id="agenda-reminder">
                  <SelectValue placeholder="Lembrete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem lembrete</SelectItem>
                  <SelectItem value="0">No dia</SelectItem>
                  <SelectItem value="1440">1 dia antes</SelectItem>
                  <SelectItem value="10080">7 dias antes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="agenda-description">Descricao</Label>
              <Textarea
                id="agenda-description"
                name="agenda-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Detalhes, responsavel e observacoes"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/70 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !form.title.trim()}>
              Salvar evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
