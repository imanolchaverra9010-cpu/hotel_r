import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceRequest, ServiceStatus } from '@/types/hotel';
import { ServiceStatusBadge } from './ServiceStatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UtensilsCrossed, SprayCan, Car, User, MapPin, Clock, FileText } from 'lucide-react';

interface ServiceRequestModalProps {
    request: ServiceRequest | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: ServiceStatus) => Promise<void>;
}

const typeConfig = {
    'room-service': { icon: UtensilsCrossed, label: 'Servicio de Habitación', color: 'bg-orange-500/10 text-orange-500' },
    housekeeping: { icon: SprayCan, label: 'Limpieza / Housekeeping', color: 'bg-blue-500/10 text-blue-500' },
    transport: { icon: Car, label: 'Transporte / Taxi', color: 'bg-purple-500/10 text-purple-500' },
};

export const ServiceRequestModal = ({ request, isOpen, onClose, onUpdateStatus }: ServiceRequestModalProps) => {
    if (!request) return null;

    const config = typeConfig[request.type as keyof typeof typeConfig] || { icon: FileText, label: request.type, color: 'bg-muted text-muted-foreground' };
    const Icon = config.icon;

    const handleStatusChange = async (newStatus: ServiceStatus) => {
        await onUpdateStatus(request.id, newStatus);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden p-0">
                <div className={`h-24 ${config.color.split(' ')[0]} flex items-center px-8 gap-4`}>
                    <div className="bg-background/80 backdrop-blur p-3 rounded-2xl shadow-sm">
                        <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold">{config.label}</DialogTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <ServiceStatusBadge status={request.status} />
                            <span className="text-xs opacity-70 font-medium">#{request.id.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Guest & Room Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Habitación</Label>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <span className="font-bold text-lg">H- {request.roomNumber}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Huésped</Label>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <span className="font-bold text-lg truncate">{request.guestName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Descripción del Pedido</Label>
                        <div className="bg-muted/30 p-4 rounded-2xl border border-muted/50">
                            <p className="text-sm leading-relaxed">{request.details || "Sin detalles adicionales"}</p>
                        </div>
                    </div>

                    {/* Timing */}
                    <div className="flex items-center justify-between text-muted-foreground bg-muted/20 p-3 rounded-xl">
                        <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-4 w-4" />
                            <span>Solicitado el {
                                (request.createdAt && !isNaN(new Date(request.createdAt).getTime()))
                                    ? format(new Date(request.createdAt), 'dd MMMM, HH:mm', { locale: es })
                                    : 'Fecha no disponible'
                            }</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/10 border-t flex sm:justify-between items-center gap-4">
                    <div className="flex gap-2">
                        {request.status === 'pending' && (
                            <Button
                                onClick={() => handleStatusChange('in-progress')}
                                className="bg-primary hover:bg-primary/90 rounded-xl px-6"
                            >
                                Atender Solicitud
                            </Button>
                        )}
                        {request.status === 'in-progress' && (
                            <Button
                                onClick={() => handleStatusChange('completed')}
                                className="bg-success hover:bg-success/90 text-white rounded-xl px-4"
                            >
                                Marcar como Completada
                            </Button>
                        )}
                        {request.status !== 'completed' && request.status !== 'cancelled' && (
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange('cancelled')}
                                className="text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl"
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                    <Button variant="ghost" onClick={onClose} className="rounded-xl">Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
);
