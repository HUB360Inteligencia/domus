import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgendaFilters as AgendaFiltersState } from "@/types/agenda";

interface AgendaFiltersProps {
  filters: AgendaFiltersState;
  propertyOptions: { label: string; value: string }[];
  onChange: (filters: AgendaFiltersState) => void;
}

export function AgendaFilters({ filters, propertyOptions, onChange }: AgendaFiltersProps) {
  return (
    <section className="premium-panel dark:premium-panel-dark rounded-2xl p-3 md:p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(140px,1fr))]">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="agenda-search"
            autoComplete="off"
            value={filters.search || ""}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Buscar por evento, imovel, contrato..."
            className="h-11 rounded-xl border-white/70 bg-white/70 pl-9 dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <Select value={filters.type || "all"} onValueChange={(value) => onChange({ ...filters, type: value as AgendaFiltersState["type"] })}>
          <SelectTrigger className="h-11 rounded-xl border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="receipt">Recebimentos</SelectItem>
            <SelectItem value="payment">Pagamentos</SelectItem>
            <SelectItem value="contract">Contratos</SelectItem>
            <SelectItem value="maintenance">Manutencao</SelectItem>
            <SelectItem value="inspection">Vistorias</SelectItem>
            <SelectItem value="task">Tarefas</SelectItem>
            <SelectItem value="appointment">Compromissos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.source || "all"} onValueChange={(value) => onChange({ ...filters, source: value as AgendaFiltersState["source"] })}>
          <SelectTrigger className="h-11 rounded-xl border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="contract">Contratos</SelectItem>
            <SelectItem value="financial">Financeiro</SelectItem>
            <SelectItem value="activity">Tarefas legadas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status || "all"} onValueChange={(value) => onChange({ ...filters, status: value as AgendaFiltersState["status"] })}>
          <SelectTrigger className="h-11 rounded-xl border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="scheduled">Agendado</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
            <SelectItem value="completed">Concluido</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.propertyId || "all"} onValueChange={(value) => onChange({ ...filters, propertyId: value as AgendaFiltersState["propertyId"] })}>
          <SelectTrigger className="h-11 rounded-xl border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
            <SelectValue placeholder="Imovel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os imoveis</SelectItem>
            {propertyOptions.map((property) => (
              <SelectItem key={property.value} value={property.value}>
                {property.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
