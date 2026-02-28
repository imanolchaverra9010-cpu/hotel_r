import { ClipboardList, Clock, UtensilsCrossed, Sparkles, Bed, Bath, Candy, Moon, Car, Plane, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useHotel } from '@/contexts/HotelContext';
import { ServiceType } from '@/types/hotel';
import { ServiceStatusBadge } from './ServiceStatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

const typeConfig: Record<ServiceType, { icon: LucideIcon; label: string; color: string }> = {
    'room-service': { icon: UtensilsCrossed, label: 'Servicio a la Habitación', color: 'bg-secondary/10 text-secondary' },
    housekeeping: { icon: Sparkles, label: 'Housekeeping', color: 'bg-success/10 text-success' },
    transport: { icon: Car, label: 'Transporte', color: 'bg-warning/10 text-warning' },
};

export const ServiceHistoryPopover = () => {
    const { guestSession, serviceRequests, cancelServiceRequest } = useHotel();

    if (!guestSession) return null;

    const guestRequests = serviceRequests
        .filter(r => r.roomNumber === guestSession.room.number)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleCancel = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) {
            await cancelServiceRequest(id);
        }
    };

    const activeRequestsCount = guestRequests.filter(r => r.status === 'pending' || r.status === 'in-progress').length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <ClipboardList className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    {activeRequestsCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-secondary text-secondary-foreground border-2 border-background text-[10px] font-bold"
                            variant="default"
                        >
                            {activeRequestsCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Mis Solicitudes</h3>
                    {activeRequestsCount > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{activeRequestsCount} activas</Badge>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {guestRequests.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No hay solicitudes registradas
                        </div>
                    ) : (
                        <div className="grid">
                            {guestRequests.map((request) => {
                                const config = typeConfig[request.type];
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={request.id}
                                        className="flex flex-col gap-2 p-4 border-b last:border-0 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn("p-2 rounded-lg", config.color)}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="font-medium text-sm truncate">
                                                        {config.label}
                                                    </span>
                                                    <ServiceStatusBadge status={request.status} />
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {request.details}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(request.createdAt), 'dd MMM, HH:mm', { locale: es })}
                                                    </div>
                                                    {request.status === 'pending' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => handleCancel(e, request.id)}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
