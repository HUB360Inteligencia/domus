import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, History as HistoryIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useContactInteractions } from '@/hooks/use-contact-interactions';
import {
  INTERACTION_TYPE_LABELS,
  INTERACTION_TYPE_OPTIONS,
  InteractionType,
} from '@/types/contact';

interface ContactHistoryTabProps {
  contactId: string;
}

export function ContactHistoryTab({ contactId }: ContactHistoryTabProps) {
  const { hasPermission } = useAuth();
  const { interactions, isLoading, createInteraction, isCreating, deleteInteraction } =
    useContactInteractions(contactId);

  const canManage = hasPermission('contacts.interactions.manage');
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<InteractionType>('note');
  const [description, setDescription] = useState('');
  const [nextAction, setNextAction] = useState('');

  const handleCreate = async () => {
    if (!description.trim()) return;
    await createInteraction({
      contactId,
      type,
      description: description.trim(),
      nextAction: nextAction.trim() || null,
    });
    setDescription('');
    setNextAction('');
    setType('note');
    setAdding(false);
  };

  return (
    <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HistoryIcon className="h-5 w-5" />
          Histórico de interações
        </CardTitle>
        {canManage && !adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage && adding && (
          <div className="space-y-3 rounded-xl border border-border/60 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERACTION_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="next-action">Próxima ação (opcional)</Label>
                <Input
                  id="next-action"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interaction-desc">Descrição</Label>
              <Textarea
                id="interaction-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!description.trim() || isCreating}>
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma interação registrada.</p>
        ) : (
          <ol className="space-y-3 border-l border-border/60 pl-4">
            {interactions.map((it) => (
              <li key={it.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {INTERACTION_TYPE_LABELS[it.interaction_type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(it.interaction_date), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{it.description}</p>
                    {it.next_action && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Próxima ação: {it.next_action}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteInteraction(it.id)}
                      aria-label="Remover interação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
