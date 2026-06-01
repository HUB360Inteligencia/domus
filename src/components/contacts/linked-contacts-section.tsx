import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Trash2, ExternalLink, Plus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useEntityContacts, useContactLinkMutations } from '@/hooks/use-contact-links';
import { ContactCombobox } from './contact-combobox';
import {
  Contact,
  ContactLinkEntity,
  CONTRACT_LINK_ROLE_LABELS,
  CONTRACT_LINK_ROLE_OPTIONS,
  ContractLinkRole,
  PROPERTY_LINK_ROLE_LABELS,
  PROPERTY_LINK_ROLE_OPTIONS,
  PropertyLinkRole,
} from '@/types/contact';

interface LinkedContactsSectionProps {
  entity: ContactLinkEntity;
  entityId: string;
}

export function LinkedContactsSection({ entity, entityId }: LinkedContactsSectionProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: links = [], isLoading } = useEntityContacts(entity, entityId);
  const { linkProperty, linkContract, unlinkProperty, unlinkContract, isLinking } =
    useContactLinkMutations();

  const canManage = hasPermission('contacts.links.manage');
  const [adding, setAdding] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [role, setRole] = useState<string>(entity === 'property' ? 'owner' : 'tenant');

  const roleOptions = entity === 'property' ? PROPERTY_LINK_ROLE_OPTIONS : CONTRACT_LINK_ROLE_OPTIONS;
  const roleLabel = (value: string) =>
    entity === 'property'
      ? PROPERTY_LINK_ROLE_LABELS[value as PropertyLinkRole]
      : CONTRACT_LINK_ROLE_LABELS[value as ContractLinkRole];

  const handleAdd = async () => {
    if (!contactId) return;
    if (entity === 'property') {
      await linkProperty({ contactId, propertyId: entityId, linkRole: role as PropertyLinkRole });
    } else {
      await linkContract({ contactId, contractId: entityId, linkRole: role as ContractLinkRole });
    }
    setContactId(null);
    setAdding(false);
  };

  const handleRemove = async (linkId: string) => {
    if (entity === 'property') await unlinkProperty(linkId);
    else await unlinkContract(linkId);
  };

  return (
    <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Contatos vinculados
        </CardTitle>
        {canManage && !adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Vincular
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : links.length === 0 && !adding ? (
          <Alert>
            <Link2 className="h-4 w-4" />
            <AlertDescription>
              {entity === 'contract'
                ? 'Este contrato ainda não está vinculado a um contato.'
                : 'Este imóvel ainda não possui contatos vinculados.'}
              {canManage && ' Vincule agora para centralizar os relacionamentos.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {links.map((link) => {
              const contact = (link as { contact?: Contact }).contact;
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/60 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {contact?.trade_name || contact?.display_name || 'Contato'}
                      </span>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {roleLabel(link.link_role)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {contact && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        aria-label="Abrir ficha do contato"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(link.id)}
                        aria-label="Remover vínculo"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {canManage && adding && (
          <div className="space-y-3 rounded-xl border border-border/60 p-3">
            <ContactCombobox
              value={contactId}
              onChange={(id) => setContactId(id)}
              presetRole={entity === 'contract' ? 'tenant' : 'owner'}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue placeholder="Papel" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!contactId || isLinking}>
                  Vincular
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdding(false);
                    setContactId(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
