import { useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    ArrowLeft,
    Clock,
    UtensilsCrossed,
    Sparkles,
    Car,
    History,
    Calendar,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useHotel } from '@/contexts/HotelContext';
import { ServiceType } from '@/types/hotel';
import { ServiceStatusBadge } from '@/components/hotel/ServiceStatusBadge';
import { GuestHeader } from '@/components/hotel/GuestHeader';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

const typeConfig: Record<ServiceType, { icon: LucideIcon; label: string; color: string; description: string }> = {
    'room-service': {
        icon: UtensilsCrossed,
        label: 'Servicio a la Habitación',
        color: 'bg-orange-500/10 text-orange-600',
        description: 'Pedidos de comida y bebidas'
    },
    housekeeping: {
        icon: Sparkles,
        label: 'Housekeeping',
        color: 'bg-blue-500/10 text-blue-600',
        description: 'Limpieza y suministros'
    },
    transport: {
        icon: Car,
        label: 'Transporte',
        color: 'bg-emerald-500/10 text-emerald-600',
        description: 'Traslados y movilidad'
    },
};

const ServiceHistory = () => {
    const navigate = useNavigate();
    const { guestSession, serviceRequests, cancelServiceRequest } = useHotel();
    const [searchTerm, setSearchTerm] = useState('');

    if (!guestSession) return null;

    const guestRequests = serviceRequests
        .filter(r => r.roomNumber === guestSession.room.number)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter(r =>
            r.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.type.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleCancel = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) {
            await cancelServiceRequest(id);
        }
    };

    const activeRequestsCount = guestRequests.filter(r => r.status === 'pending' || r.status === 'in-progress').length;

    return (
        <div className="min-h-screen bg-slate-50/50">
            <GuestHeader title="Mi Historial de Servicios" showBack backTo="/guest/dashboard" />

            <main className="container max-w-4xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/guest/dashboard')}
                            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Panel
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <History className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Historial de Servicios</h1>
                                <p className="text-muted-foreground text-sm">Gestiona y revisa todas tus solicitudes actuales y pasadas</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar solicitudes..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {guestRequests.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <ClipboardList className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No se encontraron solicitudes</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                {searchTerm
                                    ? 'No hay resultados para tu búsqueda. Intenta con otros términos.'
                                    : 'Aún no has realizado ninguna solicitud de servicio durante tu estadía.'}
                            </p>
                            {!searchTerm && (
                                <Button
                                    onClick={() => navigate('/guest/dashboard')}
                                    className="mt-6"
                                >
                                    Realizar mi primera solicitud
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {guestRequests.map((request) => {
                            const config = typeConfig[request.type as ServiceType];
                            const Icon = config?.icon || ClipboardList;

                            return (
                                <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4">
                                        <div className={cn("p-3 rounded-2xl shrink-0 w-fit", config?.color || "bg-muted")}>
                                            <Icon className="h-6 w-6" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                                <h3 className="font-bold text-lg leading-none">
                                                    {config?.label || request.type}
                                                </h3>
                                                <ServiceStatusBadge status={request.status} />
                                            </div>
                                            <p className="text-muted-foreground text-sm mb-3">
                                                {request.details}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(request.createdAt), 'EEEE d \'de\' MMMM', { locale: es })}
                                                </div>
                                                <div className="flex items-center gap-1.5 border-l pl-4">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {format(new Date(request.createdAt), 'HH:mm \'hs\'', { locale: es })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 pt-4 sm:pt-0 border-t sm:border-0">
                                            {request.status === 'pending' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                                                    onClick={() => handleCancel(request.id)}
                                                >
                                                    Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ServiceHistory;
