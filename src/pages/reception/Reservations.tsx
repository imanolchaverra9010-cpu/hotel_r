import { useState } from 'react';
import { Plus, Search, Calendar as CalendarIcon, MessageSquare, ClipboardList, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/hotel/StaffSidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusColors = { confirmed: 'bg-primary', 'checked-in': 'bg-success', 'checked-out': 'bg-muted', cancelled: 'bg-destructive' };
const statusLabels = { confirmed: 'Confirmada', 'checked-in': 'Hospedado', 'checked-out': 'Finalizada', cancelled: 'Cancelada' };

const safeFormatDate = (dateStr: string, formatStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    return format(date, formatStr, { locale: es });
  } catch (e) {
    return '---';
  }
};

const Reservations = () => {
  const navigate = useNavigate();
  const { staffSession, reservations, guests, rooms, updateReservation, updateRoomStatus, deleteReservation, messages, serviceRequests } = useHotel();
  const [search, setSearch] = useState('');
  const [viewingRequests, setViewingRequests] = useState<string | null>(null);
  const [viewingMessages, setViewingMessages] = useState<string | null>(null);

  if (!staffSession) { navigate('/login'); return null; }

  const filteredReservations = reservations.filter(r => {
    const guest = guests.find(g => g.id === r.guestId);
    const room = rooms.find(rm => rm.id === r.roomId);
    const searchLower = search.toLowerCase();
    return guest?.firstName.toLowerCase().includes(searchLower) || guest?.lastName.toLowerCase().includes(searchLower) || room?.number.includes(search);
  });

  const handleCheckIn = async (id: string, roomId: string) => {
    await updateReservation(id, { status: 'checked-in' });
    await updateRoomStatus(roomId, 'occupied');
  };

  const handleCheckOut = async (id: string, roomId: string) => {
    await updateReservation(id, { status: 'checked-out' });
    await updateRoomStatus(roomId, 'cleaning');
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer y borrará todos los mensajes y solicitudes asociados.')) {
      await deleteReservation(id);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StaffSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4"><SidebarTrigger /><h1 className="text-2xl font-bold">Reservas</h1></div>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva Reserva</Button>
          </div>
          <div className="mb-4"><Input placeholder="Buscar por huésped o habitación..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /></div>
          <div className="space-y-4">
            {filteredReservations.map(reservation => {
              const guest = guests.find(g => g.id === reservation.guestId);
              const room = rooms.find(r => r.id === reservation.roomId);
              return (
                <Card key={reservation.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl"><CalendarIcon className="h-5 w-5 text-primary" /></div>
                      <div>
                        <h4 className="font-semibold">{guest?.firstName} {guest?.lastName}</h4>
                        <p className="text-sm text-muted-foreground">Hab. {room?.number} • {safeFormatDate(reservation.checkIn, 'dd MMM')} - {safeFormatDate(reservation.checkOut, 'dd MMM')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${statusColors[reservation.status]} text-white`}>{statusLabels[reservation.status]}</Badge>
                      {reservation.status === 'confirmed' && <Button size="sm" onClick={() => handleCheckIn(reservation.id, reservation.roomId)}>Check-in</Button>}
                      {reservation.status === 'checked-in' && <Button size="sm" variant="outline" onClick={() => handleCheckOut(reservation.id, reservation.roomId)}>Check-out</Button>}
                      {(reservation.status === 'checked-out' || reservation.status === 'cancelled') && (
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" title="Ver Solicitudes" onClick={() => setViewingRequests(reservation.id)}>
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Ver Mensajes" onClick={() => setViewingMessages(reservation.id)}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Eliminar" onClick={() => handleDelete(reservation.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* History Modals */}
          <Dialog open={!!viewingRequests} onOpenChange={() => setViewingRequests(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Historial de Solicitudes</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                {serviceRequests.filter(s => s.reservationId === viewingRequests).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay solicitudes para esta reserva.</p>
                ) : (
                  serviceRequests.filter(s => s.reservationId === viewingRequests).map(req => (
                    <Card key={req.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold capitalize">{req.type}</span>
                          <Badge variant="outline">{req.status}</Badge>
                        </div>
                        <p className="text-sm">{req.details}</p>
                        <p className="text-xs text-muted-foreground mt-2">{safeFormatDate(req.createdAt, 'PPp')}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!viewingMessages} onOpenChange={() => setViewingMessages(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Historial de Chat</DialogTitle></DialogHeader>
              <div className="space-y-3 py-4">
                {messages.filter(m => m.reservationId === viewingMessages).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay mensajes para esta reserva.</p>
                ) : (
                  messages.filter(m => m.reservationId === viewingMessages).map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'guest' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.sender === 'guest' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] opacity-70 mt-1">{safeFormatDate(msg.timestamp, 'p')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reservations;
