import React, { useMemo, useState } from 'react';
import { AlertTriangle, Handshake, Plus, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import { useOwnershipStakes } from '@/hooks/use-ownership-stakes';
import { useContacts } from '@/hooks/use-contacts';
import { formatCurrency } from '@/lib/format';
import { FULL_SHARE, type StakeTarget } from '@/lib/ownership';

interface OwnershipStakesSectionProps {
  target: StakeTarget;
  /** Valor de referência (mercado do imóvel, VGV do loteamento) para mostrar cada fatia em reais. */
  referenceValue?: number | null;
  /** Texto explicando de onde vem a herança, quando houver. */
  inheritanceNote?: string;
}

const SELF_OPTION = '__self__';

export const OwnershipStakesSection: React.FC<OwnershipStakesSectionProps> = ({
  target,
  referenceValue,
  inheritanceNote,
}) => {
  const { stakes, balance, isLoading, addStake, isAdding, removeStake } = useOwnershipStakes(target);
  const { contacts = [] } = useContacts();

  const [contactId, setContactId] = useState<string>(SELF_OPTION);
  const [percentage, setPercentage] = useState('');

  // Um contato só entra uma vez no mesmo alvo (índice único no banco).
  const availableContacts = useMemo(() => {
    const used = new Set(stakes.map((stake) => stake.contact_id).filter(Boolean));
    return contacts.filter((contact) => !used.has(contact.id));
  }, [contacts, stakes]);

  const hasSelfRow = stakes.some((stake) => stake.is_self);
  const parsedPercentage = Number(String(percentage).replace(',', '.'));
  const isValidPercentage = parsedPercentage > 0 && parsedPercentage <= FULL_SHARE;
  const wouldExceed = balance.total + (isValidPercentage ? parsedPercentage : 0) > FULL_SHARE;

  const handleAdd = async () => {
    if (!isValidPercentage) return;
    try {
      await addStake({
        contactId: contactId === SELF_OPTION ? null : contactId,
        percentage: parsedPercentage,
      });
      setPercentage('');
      setContactId(SELF_OPTION);
    } catch {
      // O hook já notifica o erro.
    }
  };

  const valueOf = (percent: number) =>
    referenceValue ? (Number(referenceValue) * percent) / FULL_SHARE : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Handshake className="h-5 w-5" />
          Sociedade
        </CardTitle>
        <CardDescription>
          {stakes.length === 0
            ? inheritanceNote ||
              'Sem sócios cadastrados: o bem é considerado 100% seu nos relatórios.'
            : 'O percentual daqui alimenta a visão "minha cota" nos painéis.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm text-muted-foreground">Sua participação</span>
                <span className="text-lg font-bold">
                  {balance.selfPercentage.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                  {valueOf(balance.selfPercentage) !== null && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {formatCurrency(valueOf(balance.selfPercentage))}
                    </span>
                  )}
                </span>
              </div>
              <Progress value={Math.min(balance.selfPercentage, 100)} />
              {!hasSelfRow && stakes.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Calculada como 100% menos as participações dos sócios. Cadastre a sua
                  explicitamente se o rateio for diferente.
                </p>
              )}
            </div>

            {balance.isOverAllocated && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>
                  As participações somam{' '}
                  {balance.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%, acima de
                  100%. Corrija antes de usar a visão "minha cota".
                </span>
              </div>
            )}

            {stakes.length > 0 && (
              <div className="space-y-2">
                {stakes.map((stake) => (
                  <div
                    key={stake.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">
                        {stake.is_self ? 'Você' : stake.contact?.display_name ?? 'Sócio removido'}
                      </span>
                      {stake.is_self && <Badge variant="secondary">Própria</Badge>}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">
                          {Number(stake.percentage).toLocaleString('pt-BR', {
                            maximumFractionDigits: 2,
                          })}
                          %
                        </p>
                        {valueOf(Number(stake.percentage)) !== null && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(valueOf(Number(stake.percentage)))}
                          </p>
                        )}
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover participação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Os números da visão "minha cota" mudam na hora.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeStake(stake.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_140px_auto]">
              <div>
                <Label htmlFor="stake_contact">Sócio</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger id="stake_contact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELF_OPTION} disabled={hasSelfRow}>
                      Você (participação própria)
                    </SelectItem>
                    {availableContacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stake_percentage">Percentual</Label>
                <Input
                  id="stake_percentage"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder={balance.remaining > 0 ? String(balance.remaining) : '0'}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleAdd}
                  disabled={!isValidPercentage || isAdding || (contactId === SELF_OPTION && hasSelfRow)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </div>

            {wouldExceed && isValidPercentage && (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Com esse percentual o total passa de 100%.
              </p>
            )}

            {contactId === SELF_OPTION && hasSelfRow && (
              <p className="text-xs text-muted-foreground">
                Já existe uma participação própria. Remova-a para lançar outra.
              </p>
            )}

            {availableContacts.length === 0 && contacts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Todos os contatos já têm participação neste bem.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
