import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Building2, FileSignature, Loader2, Search, UserRound } from "lucide-react";

import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  kind: "property" | "contract" | "contact";
  title: string;
  subtitle: string;
  href: string;
};

const KIND_META = {
  property: { label: "Imóveis", icon: Building2 },
  contract: { label: "Locações", icon: FileSignature },
  contact: { label: "Contatos", icon: UserRound },
} as const;

// Remove caracteres com significado especial no filtro `or` do PostgREST
const sanitizeTerm = (term: string) => term.replace(/[%,()*\\:"']/g, " ").replace(/\s+/g, " ").trim();

async function searchEverything(rawTerm: string): Promise<SearchResult[]> {
  const term = sanitizeTerm(rawTerm);
  if (term.length < 2) return [];
  const like = `%${term}%`;

  const [properties, contracts, contacts] = await Promise.all([
    supabase
      .from("properties")
      .select("id,title,address,neighborhood,city")
      .or(`title.ilike.${like},address.ilike.${like},neighborhood.ilike.${like},city.ilike.${like}`)
      .limit(5),
    supabase
      .from("contracts")
      .select("id,title,tenant_name,status")
      .or(`title.ilike.${like},tenant_name.ilike.${like}`)
      .limit(5),
    supabase
      .from("contacts")
      .select("id,display_name,document_number,primary_email")
      .is("deleted_at", null)
      .or(`display_name.ilike.${like},document_number.ilike.${like},primary_email.ilike.${like}`)
      .limit(5),
  ]);

  const results: SearchResult[] = [];

  (properties.data || []).forEach((property) => {
    results.push({
      id: property.id,
      kind: "property",
      title: property.title,
      subtitle: [property.address, property.neighborhood, property.city].filter(Boolean).join(" · "),
      href: `/properties/${property.id}`,
    });
  });

  (contracts.data || []).forEach((contract) => {
    results.push({
      id: contract.id,
      kind: "contract",
      title: contract.title,
      subtitle: contract.tenant_name ? `Locatário: ${contract.tenant_name}` : "Contrato de locação",
      href: `/contracts/${contract.id}`,
    });
  });

  // Tabela de contatos pode não existir em bancos sem a migration: ignora o erro
  (contacts.error ? [] : contacts.data || []).forEach((contact) => {
    results.push({
      id: contact.id,
      kind: "contact",
      title: contact.display_name,
      subtitle: contact.document_number || contact.primary_email || "Contato",
      href: `/contacts/${contact.id}`,
    });
  });

  return results;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedTerm(term.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [term]);

  // Ctrl/⌘ + K foca a busca
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const enabled = sanitizeTerm(debouncedTerm).length >= 2;
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["global-search", debouncedTerm],
    queryFn: () => searchEverything(debouncedTerm),
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => setActiveIndex(0), [results]);

  const grouped = useMemo(() => {
    return (["property", "contract", "contact"] as const)
      .map((kind) => ({ kind, items: results.filter((result) => result.kind === kind) }))
      .filter((group) => group.items.length > 0);
  }, [results]);

  const goTo = (result: SearchResult) => {
    setOpen(false);
    setTerm("");
    inputRef.current?.blur();
    navigate(result.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      goTo(results[activeIndex]);
    }
  };

  const showPanel = open && term.trim().length > 0;
  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative min-w-[180px] flex-1">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        name="global-search"
        autoComplete="off"
        value={term}
        onChange={(event) => {
          setTerm(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar imóveis, contratos, contatos…"
        aria-label="Busca global"
        aria-expanded={showPanel}
        className="h-11 rounded-2xl border-white/70 bg-white/75 pl-10 pr-16 shadow-none dark:border-white/10 dark:bg-white/5"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:block">
        Ctrl K
      </kbd>

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-3xl border border-border bg-popover text-popover-foreground shadow-[0_24px_70px_-30px_rgba(31,27,24,0.6)]">
          {!enabled ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Digite pelo menos 2 caracteres.</p>
          ) : isFetching && results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nada encontrado para “{debouncedTerm}”.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
              {grouped.map((group) => {
                const { label, icon: Icon } = KIND_META[group.kind];
                return (
                  <div key={group.kind} className="py-1">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    {group.items.map((result) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      return (
                        <button
                          key={`${result.kind}-${result.id}`}
                          type="button"
                          role="option"
                          aria-selected={index === activeIndex}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => goTo(result)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors",
                            index === activeIndex ? "bg-muted" : "hover:bg-muted/60"
                          )}
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-white/10">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{result.title}</span>
                            {result.subtitle && (
                              <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
