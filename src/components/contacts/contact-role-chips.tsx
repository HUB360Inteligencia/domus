import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ContactRole, ROLE_LABELS } from '@/types/contact';

interface ContactRoleChipsProps {
  roles?: ContactRole[] | null;
  className?: string;
  emptyLabel?: string;
  max?: number;
}

export function ContactRoleChips({
  roles,
  className,
  emptyLabel = 'Sem papéis',
  max,
}: ContactRoleChipsProps) {
  const active = (roles ?? []).filter((r) => !r.deleted_at);

  if (!active.length) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  }

  const visible = max ? active.slice(0, max) : active;
  const remaining = max ? active.length - visible.length : 0;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visible.map((role) => (
        <Badge
          key={role.id}
          variant="secondary"
          className="text-xs font-normal"
          aria-label={`Papel: ${ROLE_LABELS[role.role_type]}`}
        >
          {ROLE_LABELS[role.role_type]}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs font-normal">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
