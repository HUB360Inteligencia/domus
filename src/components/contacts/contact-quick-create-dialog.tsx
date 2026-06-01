import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useContactMutations } from '@/hooks/use-contact-mutations';
import { Contact, ContactKind, ContactRoleType } from '@/types/contact';

interface ContactQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  /** Papel pré-atribuído ao novo contato (ex.: 'tenant' a partir do contrato). */
  presetRole?: ContactRoleType;
  onCreated: (contact: Contact) => void;
}

export function ContactQuickCreateDialog({
  open,
  onOpenChange,
  initialName = '',
  presetRole,
  onCreated,
}: ContactQuickCreateDialogProps) {
  const { createContact, isCreating } = useContactMutations();
  const [kind, setKind] = useState<ContactKind>('pf');
  const [name, setName] = useState(initialName);
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (open) {
      setName(initialName);
      setDocument('');
      setPhone('');
      setEmail('');
      setKind('pf');
    }
  }, [open, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const contact = await createContact({
      kind,
      display_name: name.trim(),
      document_number: document || null,
      primary_phone: phone || null,
      primary_email: email || null,
      status: 'active',
      roles: presetRole ? [{ role_type: presetRole }] : [],
    });
    onCreated(contact);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup
            value={kind}
            onValueChange={(v) => setKind(v as ContactKind)}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pf" id="qc-kind-pf" />
              <Label htmlFor="qc-kind-pf">Pessoa física</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pj" id="qc-kind-pj" />
              <Label htmlFor="qc-kind-pj">Pessoa jurídica</Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="qc-name">{kind === 'pj' ? 'Razão social *' : 'Nome completo *'}</Label>
            <Input id="qc-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qc-doc">{kind === 'pj' ? 'CNPJ' : 'CPF'}</Label>
            <Input id="qc-doc" value={document} onChange={(e) => setDocument(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qc-phone">Telefone</Label>
              <Input id="qc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qc-email">E-mail</Label>
              <Input id="qc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar e selecionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
