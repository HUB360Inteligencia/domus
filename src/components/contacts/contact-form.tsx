import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Loader2, MapPin, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchAddressFromCEP, formatCEP } from '@/utils/cep-lookup';
import { toast } from 'sonner';
import { findDuplicateContacts } from '@/api/contacts';
import {
  Contact,
  ContactFormData,
  ContactKind,
  ContactRoleInput,
  ContactRoleType,
  ROLE_LABELS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  formatDocument,
  formatPhoneInput,
  onlyDigits,
} from '@/types/contact';

interface ContactFormProps {
  initialContact?: Contact | null;
  isSubmitting?: boolean;
  onSubmit: (data: ContactFormData) => Promise<void> | void;
}

const emptyForm = (): ContactFormData => ({
  kind: 'pf',
  display_name: '',
  status: 'active',
  tags: [],
  roles: [],
});

const contactToForm = (c: Contact): ContactFormData => ({
  kind: c.kind,
  display_name: c.display_name,
  legal_name: c.legal_name,
  trade_name: c.trade_name,
  document_type: c.document_type,
  document_number: c.document_number ? formatDocument(c.kind, c.document_number) : c.document_number,
  rg: c.rg,
  state_registration: c.state_registration,
  municipal_registration: c.municipal_registration,
  birth_date: c.birth_date,
  foundation_date: c.foundation_date,
  nationality: c.nationality,
  marital_status: c.marital_status,
  profession: c.profession,
  primary_whatsapp: c.primary_whatsapp ? formatPhoneInput(c.primary_whatsapp) : c.primary_whatsapp,
  primary_phone: c.primary_phone ? formatPhoneInput(c.primary_phone) : c.primary_phone,
  secondary_phone: c.secondary_phone ? formatPhoneInput(c.secondary_phone) : c.secondary_phone,
  primary_email: c.primary_email,
  secondary_email: c.secondary_email,
  website: c.website,
  social_url: c.social_url,
  zip_code: c.zip_code,
  street: c.street,
  number: c.number,
  complement: c.complement,
  neighborhood: c.neighborhood,
  city: c.city,
  state: c.state,
  country: c.country,
  status: c.status,
  notes: c.notes,
  tags: c.tags ?? [],
  roles: (c.roles ?? [])
    .filter((r) => !r.deleted_at)
    .map((r) => ({ role_type: r.role_type, is_primary: r.is_primary, notes: r.notes })),
});

export function ContactForm({ initialContact, isSubmitting, onSubmit }: ContactFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ContactFormData>(
    initialContact ? contactToForm(initialContact) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Contact[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFound, setCepFound] = useState(false);
  const lastCepRef = useRef<string>('');

  useEffect(() => {
    if (initialContact) setForm(contactToForm(initialContact));
  }, [initialContact]);

  const isPj = form.kind === 'pj';

  const set = <K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Alterna PF/PJ: reaplica a máscara do documento já digitado.
  const setKind = (kind: ContactKind) =>
    setForm((prev) => ({
      ...prev,
      kind,
      document_number: prev.document_number
        ? formatDocument(kind, prev.document_number)
        : prev.document_number,
    }));

  const setDocument = (value: string) => set('document_number', formatDocument(form.kind, value));
  const setPhone = (key: 'primary_whatsapp' | 'primary_phone' | 'secondary_phone', value: string) =>
    set(key, formatPhoneInput(value));

  // Busca de CEP automática (ViaCEP) assim que houver 8 dígitos.
  const handleCepChange = (value: string) => {
    const masked = formatCEP(value);
    set('zip_code', masked);
    setCepFound(false);
    const digits = onlyDigits(masked);
    if (digits.length === 8 && digits !== lastCepRef.current) {
      lastCepRef.current = digits;
      void lookupCep(digits);
    } else if (digits.length < 8) {
      lastCepRef.current = '';
    }
  };

  const lookupCep = async (digits: string) => {
    setCepLoading(true);
    try {
      const addr = await fetchAddressFromCEP(digits);
      if (!addr.erro) {
        setForm((prev) => ({
          ...prev,
          street: addr.logradouro || prev.street,
          neighborhood: addr.bairro || prev.neighborhood,
          city: addr.localidade || prev.city,
          state: addr.uf || prev.state,
        }));
        setCepFound(true);
      }
    } catch {
      toast.error('Não foi possível buscar o CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const selectedRoles = useMemo(() => form.roles.map((r) => r.role_type), [form.roles]);

  const toggleRole = (roleType: ContactRoleType) => {
    setForm((prev) => {
      const exists = prev.roles.some((r) => r.role_type === roleType);
      const roles: ContactRoleInput[] = exists
        ? prev.roles.filter((r) => r.role_type !== roleType)
        : [...prev.roles, { role_type: roleType }];
      return { ...prev, roles };
    });
  };

  const setRoleNote = (roleType: ContactRoleType, notes: string) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.role_type === roleType ? { ...r, notes } : r)),
    }));
  };

  // Deduplicação: avisa, não bloqueia (debounce)
  useEffect(() => {
    const handler = setTimeout(async () => {
      const results = await findDuplicateContacts({
        documentNumber: form.document_number,
        email: form.primary_email,
        phone: form.primary_phone || form.primary_whatsapp,
        excludeId: initialContact?.id,
      });
      setDuplicates(results);
    }, 600);
    return () => clearTimeout(handler);
  }, [form.document_number, form.primary_email, form.primary_phone, form.primary_whatsapp, initialContact?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.display_name.trim()) {
      setError(isPj ? 'Informe a razão social.' : 'Informe o nome completo.');
      return;
    }
    setError(null);
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo de pessoa */}
      <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
        <CardHeader>
          <CardTitle className="text-lg">Tipo de contato</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={form.kind}
            onValueChange={(v) => setKind(v as ContactKind)}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pf" id="kind-pf" />
              <Label htmlFor="kind-pf">Pessoa física</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pj" id="kind-pj" />
              <Label htmlFor="kind-pj">Pessoa jurídica</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {duplicates.length > 0 && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Possível duplicidade</AlertTitle>
          <AlertDescription>
            Já {duplicates.length === 1 ? 'existe' : 'existem'} {duplicates.length}{' '}
            contato(s) com CPF/CNPJ, e-mail ou telefone semelhante:{' '}
            {duplicates.map((d, i) => (
              <span key={d.id}>
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-amber-700"
                  onClick={() => navigate(`/contacts/${d.id}`)}
                >
                  {d.display_name}
                </button>
                {i < duplicates.length - 1 ? ', ' : ''}
              </span>
            ))}
            . Você pode revisar e continuar mesmo assim.
          </AlertDescription>
        </Alert>
      )}

      {/* Dados básicos */}
      <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
        <CardHeader>
          <CardTitle className="text-lg">Dados básicos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="display_name">{isPj ? 'Razão social *' : 'Nome completo *'}</Label>
            <Input
              id="display_name"
              value={form.display_name}
              onChange={(e) => set('display_name', e.target.value)}
              placeholder={isPj ? 'Empresa LTDA' : 'João da Silva'}
            />
          </div>

          {isPj && (
            <div className="space-y-2">
              <Label htmlFor="trade_name">Nome fantasia</Label>
              <Input
                id="trade_name"
                value={form.trade_name ?? ''}
                onChange={(e) => set('trade_name', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="document_number">{isPj ? 'CNPJ' : 'CPF'}</Label>
            <Input
              id="document_number"
              value={form.document_number ?? ''}
              onChange={(e) => setDocument(e.target.value)}
              inputMode="numeric"
              placeholder={isPj ? '00.000.000/0000-00' : '000.000.000-00'}
            />
          </div>

          {!isPj && (
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input id="rg" value={form.rg ?? ''} onChange={(e) => set('rg', e.target.value)} />
            </div>
          )}

          {isPj && (
            <>
              <div className="space-y-2">
                <Label htmlFor="state_registration">Inscrição estadual</Label>
                <Input
                  id="state_registration"
                  value={form.state_registration ?? ''}
                  onChange={(e) => set('state_registration', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipal_registration">Inscrição municipal</Label>
                <Input
                  id="municipal_registration"
                  value={form.municipal_registration ?? ''}
                  onChange={(e) => set('municipal_registration', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="date_field">{isPj ? 'Data de fundação' : 'Data de nascimento'}</Label>
            <Input
              id="date_field"
              type="date"
              value={(isPj ? form.foundation_date : form.birth_date) ?? ''}
              onChange={(e) =>
                set(isPj ? 'foundation_date' : 'birth_date', e.target.value || null)
              }
            />
          </div>

          {!isPj && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Input
                  id="nationality"
                  value={form.nationality ?? ''}
                  onChange={(e) => set('nationality', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marital_status">Estado civil</Label>
                <Input
                  id="marital_status"
                  value={form.marital_status ?? ''}
                  onChange={(e) => set('marital_status', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profession">Profissão</Label>
                <Input
                  id="profession"
                  value={form.profession ?? ''}
                  onChange={(e) => set('profession', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v as ContactFormData['status'])}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Observações gerais</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
        <CardHeader>
          <CardTitle className="text-lg">Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary_whatsapp">WhatsApp principal</Label>
            <Input
              id="primary_whatsapp"
              value={form.primary_whatsapp ?? ''}
              onChange={(e) => setPhone('primary_whatsapp', e.target.value)}
              inputMode="numeric"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primary_phone">Telefone principal</Label>
            <Input
              id="primary_phone"
              value={form.primary_phone ?? ''}
              onChange={(e) => setPhone('primary_phone', e.target.value)}
              inputMode="numeric"
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_phone">Telefone secundário</Label>
            <Input
              id="secondary_phone"
              value={form.secondary_phone ?? ''}
              onChange={(e) => setPhone('secondary_phone', e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primary_email">E-mail principal</Label>
            <Input
              id="primary_email"
              type="email"
              value={form.primary_email ?? ''}
              onChange={(e) => set('primary_email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_email">E-mail secundário</Label>
            <Input
              id="secondary_email"
              type="email"
              value={form.secondary_email ?? ''}
              onChange={(e) => set('secondary_email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Site</Label>
            <Input
              id="website"
              value={form.website ?? ''}
              onChange={(e) => set('website', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social_url">Instagram / rede social</Label>
            <Input
              id="social_url"
              value={form.social_url ?? ''}
              onChange={(e) => set('social_url', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
        <CardHeader>
          <CardTitle className="text-lg">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP</Label>
            <div className="relative">
              <Input
                id="zip_code"
                value={form.zip_code ?? ''}
                onChange={(e) => handleCepChange(e.target.value)}
                inputMode="numeric"
                maxLength={9}
                placeholder="00000-000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {cepLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : cepFound ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              O endereço é preenchido automaticamente ao digitar o CEP.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Rua</Label>
            <Input id="street" value={form.street ?? ''} onChange={(e) => set('street', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input id="number" value={form.number ?? ''} onChange={(e) => set('number', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={form.complement ?? ''}
              onChange={(e) => set('complement', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={form.neighborhood ?? ''}
              onChange={(e) => set('neighborhood', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input id="state" value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input id="country" value={form.country ?? ''} onChange={(e) => set('country', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Papéis */}
      <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
        <CardHeader>
          <CardTitle className="text-lg">Papéis do contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Papéis atribuídos</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ROLE_OPTIONS.map((option) => {
                const checked = selectedRoles.includes(option.value);
                return (
                  <label
                    key={option.value}
                    htmlFor={`role-${option.value}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <Checkbox
                      id={`role-${option.value}`}
                      checked={checked}
                      onCheckedChange={() => toggleRole(option.value)}
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </div>

          {form.roles.map((role) => (
            <div key={role.role_type} className="space-y-2 rounded-xl border border-border/60 p-3">
              <Label htmlFor={`role-note-${role.role_type}`} className="text-sm font-medium">
                Observação como {ROLE_LABELS[role.role_type]}
              </Label>
              <Textarea
                id={`role-note-${role.role_type}`}
                value={role.notes ?? ''}
                onChange={(e) => setRoleNote(role.role_type, e.target.value)}
                rows={2}
                placeholder="Ex.: contrato ativo no imóvel X"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate('/contacts')}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {initialContact ? 'Salvar alterações' : 'Criar contato'}
        </Button>
      </div>
    </form>
  );
}
