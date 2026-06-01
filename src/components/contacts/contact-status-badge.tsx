import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ContactStatus, STATUS_BADGE_CLASSES, STATUS_LABELS } from '@/types/contact';

interface ContactStatusBadgeProps {
  status: ContactStatus;
  className?: string;
}

export function ContactStatusBadge({ status, className }: ContactStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      aria-label={`Status: ${STATUS_LABELS[status]}`}
      className={cn('font-medium', STATUS_BADGE_CLASSES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
