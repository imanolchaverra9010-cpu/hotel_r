import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick?: () => void;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
  className?: string;
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary hover:bg-primary/20',
  secondary: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  accent: 'bg-accent/10 text-accent-foreground hover:bg-accent/20',
  success: 'bg-success/10 text-success hover:bg-success/20',
  warning: 'bg-warning/10 text-warning hover:bg-warning/20',
};

const iconBgClasses = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
};

export const ServiceCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  color = 'primary',
  className,
}: ServiceCardProps) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-0',
        colorClasses[color],
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
        <div className={cn('p-4 rounded-2xl', iconBgClasses[color])}>
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && (
          <p className="text-sm opacity-80">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
