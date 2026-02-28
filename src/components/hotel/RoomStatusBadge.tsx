import { Badge } from '@/components/ui/badge';
import { RoomStatus } from '@/types/hotel';
import { cn } from '@/lib/utils';

interface RoomStatusBadgeProps {
  status: RoomStatus;
  className?: string;
}

const statusConfig: Record<RoomStatus, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'bg-room-available text-white' },
  occupied: { label: 'Ocupada', className: 'bg-room-occupied text-white' },
  cleaning: { label: 'Limpieza', className: 'bg-room-cleaning text-foreground' },
  maintenance: { label: 'Mantenimiento', className: 'bg-room-maintenance text-white' },
};

export const RoomStatusBadge = ({ status, className }: RoomStatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge className={cn('font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
};
