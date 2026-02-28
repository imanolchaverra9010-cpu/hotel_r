import { Badge } from '@/components/ui/badge';
import { ServiceStatus } from '@/types/hotel';
import { cn } from '@/lib/utils';

interface ServiceStatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

const statusConfig: Record<ServiceStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-warning text-warning-foreground' },
  'in-progress': { label: 'En Proceso', className: 'bg-primary text-primary-foreground' },
  completed: { label: 'Completado', className: 'bg-success text-success-foreground' },
  cancelled: { label: 'Cancelado', className: 'bg-destructive text-destructive-foreground' },
};

export const ServiceStatusBadge = ({ status, className }: ServiceStatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <Badge className={cn('font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
};
