import { Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Notification, NotificationType } from '@/types/hotel';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationCardProps {
  notification: Notification;
  onClick?: () => void;
}

const typeConfig: Record<NotificationType, { icon: typeof Bell; className: string }> = {
  info: { icon: Info, className: 'bg-primary/10 text-primary' },
  warning: { icon: AlertTriangle, className: 'bg-warning/10 text-warning' },
  success: { icon: CheckCircle, className: 'bg-success/10 text-success' },
  urgent: { icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
};

export const NotificationCard = ({ notification, onClick }: NotificationCardProps) => {
  const config = typeConfig[notification.type];
  const Icon = config.icon;
  
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        !notification.read && 'border-l-4 border-l-primary bg-primary/5'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4">
        <div className={cn('p-2 rounded-full h-fit', config.className)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn('font-semibold', !notification.read && 'text-primary')}>
              {notification.title}
            </h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(notification.createdAt), 'dd MMM, HH:mm', { locale: es })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
