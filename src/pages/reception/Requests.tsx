import { UtensilsCrossed, SprayCan, Car, ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/hotel/StaffSidebar';
import { ServiceStatusBadge } from '@/components/hotel/ServiceStatusBadge';
import { ServiceRequestModal } from '@/components/hotel/ServiceRequestModal';
import { CreateServiceModal } from '@/components/hotel/CreateServiceModal';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { ServiceType, ServiceStatus, ServiceRequest } from '@/types/hotel';
import { LucideIcon } from 'lucide-react';

const typeConfig: Record<ServiceType, { icon: LucideIcon; label: string }> = {
  'room-service': { icon: UtensilsCrossed, label: 'Servicio Habitación' },
  housekeeping: { icon: SprayCan, label: 'Housekeeping' },
  transport: { icon: Car, label: 'Transporte' },
};

const safeFormatDate = (dateStr: string, formatStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Fecha inv.';
    return format(date, formatStr, { locale: es });
  } catch (e) {
    return 'Fecha inv.';
  }
};

const Requests = () => {
  const navigate = useNavigate();
  const { staffSession, serviceRequests, updateServiceRequestStatus } = useHotel();
  const [filter, setFilter] = useState<ServiceStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!staffSession) { navigate('/login'); return null; }

  const filtered = filter === 'all' ? serviceRequests : serviceRequests.filter(r => r.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenModal = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StaffSidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Solicitudes</h1>
                <p className="text-muted-foreground text-sm">Gestiona los pedidos y servicios de los huéspedes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
              <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
              <Select value={filter} onValueChange={(v) => setFilter(v as ServiceStatus | 'all')}>
                <SelectTrigger className="w-44 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary h-10 px-4 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all">Todas las solicitudes</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="in-progress">En Proceso</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </header>

          <div className="grid gap-4">
            {sorted.map(request => {
              const config = typeConfig[request.type] || { icon: ClipboardList, label: request.type };
              const Icon = config.icon || ClipboardList;
              return (
                <Card
                  key={request.id}
                  className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-muted/40 cursor-pointer overflow-hidden"
                  onClick={() => handleOpenModal(request)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center p-5 gap-6">
                      <div className="h-14 w-14 bg-muted flex items-center justify-center rounded-2xl group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-lg">Habitación {request.roomNumber}</h4>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          <span className="text-sm font-medium text-muted-foreground">{request.guestName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground/80 line-clamp-1">
                            {config.label}: <span className="text-muted-foreground font-normal italic">{request.details || "Sin descripción"}</span>
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium uppercase tracking-wider">
                          {safeFormatDate(request.createdAt, 'dd MMM, HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 pr-4">
                        <ServiceStatusBadge status={request.status} />
                        <div className="h-10 w-10 rounded-full border border-muted flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {sorted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50 space-y-4">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                  <ClipboardList className="h-10 w-10" />
                </div>
                <p className="font-medium text-lg">No se encontraron solicitudes</p>
              </div>
            )}
          </div>

          <ServiceRequestModal
            request={selectedRequest}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onUpdateStatus={updateServiceRequestStatus}
          />
          <CreateServiceModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Requests;
