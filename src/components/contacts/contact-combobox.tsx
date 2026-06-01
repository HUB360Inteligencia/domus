import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useContactQueries } from '@/hooks/use-contact-queries';
import { ContactQuickCreateDialog } from './contact-quick-create-dialog';
import { Contact, ContactRoleType, KIND_LABELS } from '@/types/contact';

interface ContactComboboxProps {
  value?: string | null;
  onChange: (contactId: string | null, contact?: Contact) => void;
  /** Papel pré-atribuído ao criar um novo contato pelo fluxo rápido. */
  presetRole?: ContactRoleType;
  allowCreate?: boolean;
  placeholder?: string;
  className?: string;
}

export function ContactCombobox({
  value,
  onChange,
  presetRole,
  allowCreate = true,
  placeholder = 'Selecionar contato...',
  className,
}: ContactComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);

  const { contacts } = useContactQueries(search ? { search } : {});

  const selected = useMemo(
    () => contacts.find((c) => c.id === value),
    [contacts, value],
  );

  const handleSelect = (contact: Contact) => {
    onChange(contact.id, contact);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between font-normal', className)}
          >
            {selected ? (
              <span className="truncate">{selected.trade_name || selected.display_name}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nome, CPF/CNPJ..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
              <CommandGroup>
                {contacts.slice(0, 20).map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.id}
                    onSelect={() => handleSelect(contact)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === contact.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{contact.trade_name || contact.display_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {KIND_LABELS[contact.kind]}
                        {contact.document_number ? ` · ${contact.document_number}` : ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {value && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={() => { onChange(null); setOpen(false); }}>
                      Limpar seleção
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
              {allowCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setQuickOpen(true);
                        setOpen(false);
                      }}
                    >
                      {search ? (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar contato "{search}"
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Novo contato
                        </>
                      )}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {allowCreate && (
        <ContactQuickCreateDialog
          open={quickOpen}
          onOpenChange={setQuickOpen}
          initialName={search}
          presetRole={presetRole}
          onCreated={(contact) => onChange(contact.id, contact)}
        />
      )}
    </>
  );
}
