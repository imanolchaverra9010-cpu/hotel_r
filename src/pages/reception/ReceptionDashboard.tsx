import { Bed, Users, MessageSquare, ClipboardList, Send, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/hotel/StaffSidebar';
import { RoomCard } from '@/components/hotel/RoomCard';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/types/hotel';
import { NotificationBell } from '@/components/hotel/NotificationBell';

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { staffSession, rooms, messages, serviceRequests, reservations, addReservation, updateReservation, updateRoomStatus, testNotification, requestNotificationPermission } = useHotel();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({
    firstName: '',
    lastName: '',
    documentType: 'CC',
    documentNumber: '',
    email: '',
    phone: ''
  });
  const [resForm, setResForm] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  if (!staffSession) { navigate('/login'); return null; }

  const stats = {
    occupied: rooms.filter(r => r.status === 'occupied').length,
    available: rooms.filter(r => r.status === 'available').length,
    unreadMessages: messages.filter(m => !m.read && m.sender === 'guest').length,
    pendingRequests: serviceRequests.filter(r => r.status === 'pending' || r.status === 'in-progress').length,
    activeReservations: reservations.filter(r => r.status === 'checked-in').length,
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
    // Initialize forms with current room data
    setGuestForm({ firstName: '', lastName: '', documentType: 'CC', documentNumber: '', email: '', phone: '' });
    setResForm({
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    });
  };

  const handleUpdate = async () => {
    if (!selectedRoom) return;

    // 1. If status is being changed to 'occupied', we need to assign a guest (Checked-in)
    if (selectedRoom.status === 'occupied' && guestForm.documentNumber) {
      if (!guestForm.firstName || !guestForm.lastName) {
        toast({ title: 'Error', description: 'Por favor complete los nombres del huésped.', variant: 'destructive' });
        return;
      }
      await addReservation({
        guest: guestForm,
        reservation: {
          roomId: selectedRoom.id,
          checkIn: resForm.checkIn,
          checkOut: resForm.checkOut,
          status: 'checked-in',
          totalAmount: selectedRoom.pricePerNight * 1
        }
      });
      toast({ title: 'Éxito', description: `Habitación ${selectedRoom.number} asignada correctamente.` });
    } else {
      // 2. Just update the status
      await updateRoomStatus(selectedRoom.id, selectedRoom.status);
      toast({ title: 'Éxito', description: `Estado de habitación ${selectedRoom.number} actualizado.` });
    }

    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleCheckout = async () => {
    if (!selectedRoom) return;

    // Find active reservation for this room
    const activeRes = reservations.find(r => r.roomId === selectedRoom.id && r.status === 'checked-in');

    if (!activeRes) {
      toast({ title: 'Error', description: 'No se encontró una reserva activa para esta habitación.', variant: 'destructive' });
      return;
    }

    if (confirm(`¿Estás seguro de que deseas realizar el check-out de la habitación ${selectedRoom.number}? Se eliminarán mensajes y solicitudes.`)) {
      await updateReservation(activeRes.id, { status: 'checked-out' });
      toast({ title: 'Check-out completado', description: `La habitación ${selectedRoom.number} ahora está en limpieza.` });
      setIsModalOpen(false);
      setSelectedRoom(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StaffSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  const granted = await requestNotificationPermission();
                  if (granted) testNotification();
                  else toast({ title: 'Notificaciones bloqueadas', description: 'Por favor habilita los permisos en tu navegador.', variant: 'destructive' });
                }}
              >
                Probar Notificaciones
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="bg-room-occupied/10 p-3 rounded-xl"><Bed className="h-5 w-5 text-room-occupied" /></div><div><p className="text-2xl font-bold">{stats.occupied}</p><p className="text-sm text-muted-foreground">Ocupadas</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="bg-room-available/10 p-3 rounded-xl"><Bed className="h-5 w-5 text-room-available" /></div><div><p className="text-2xl font-bold">{stats.available}</p><p className="text-sm text-muted-foreground">Disponibles</p></div></CardContent></Card>
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/reception/messages')}><CardContent className="p-4 flex items-center gap-3"><div className="bg-primary/10 p-3 rounded-xl"><MessageSquare className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.unreadMessages}</p><p className="text-sm text-muted-foreground">Mensajes</p></div></CardContent></Card>
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/reception/requests')}><CardContent className="p-4 flex items-center gap-3"><div className="bg-warning/10 p-3 rounded-xl"><ClipboardList className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.pendingRequests}</p><p className="text-sm text-muted-foreground">Pendientes</p></div></CardContent></Card>
          </div>
          <h2 className="text-lg font-semibold mb-4">Estado de Habitaciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                showPrice={false}
                onClick={() => handleRoomClick(room)}
              />
            ))}
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Gestionar Habitación {selectedRoom?.number}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado de la Habitación</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedRoom?.status}
                    onChange={e => selectedRoom && setSelectedRoom({ ...selectedRoom, status: e.target.value as Room['status'] })}
                  >
                    <option value="available">Disponible</option>
                    <option value="occupied">Ocupada / Check-in</option>
                    <option value="cleaning">Limpieza</option>
                    <option value="maintenance">Mantenimiento</option>
                  </select>
                </div>

                {selectedRoom?.status === 'occupied' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm">Asignar Huésped</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="firstName">Nombre *</Label>
                        <Input id="firstName" value={guestForm.firstName} onChange={e => setGuestForm({ ...guestForm, firstName: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lastName">Apellido *</Label>
                        <Input id="lastName" value={guestForm.lastName} onChange={e => setGuestForm({ ...guestForm, lastName: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="docType">Tipo Doc.</Label>
                        <select
                          id="docType"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={guestForm.documentType}
                          onChange={e => setGuestForm({ ...guestForm, documentType: e.target.value as any })}
                        >
                          <option value="CC">CC</option>
                          <option value="CE">CE</option>
                          <option value="PA">PA</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="docNumber">Documento *</Label>
                        <Input id="docNumber" value={guestForm.documentNumber} onChange={e => setGuestForm({ ...guestForm, documentNumber: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="checkIn">Check-in</Label>
                        <Input id="checkIn" type="date" value={resForm.checkIn} onChange={e => setResForm({ ...resForm, checkIn: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="checkOut">Check-out</Label>
                        <Input id="checkOut" type="date" value={resForm.checkOut} onChange={e => setResForm({ ...resForm, checkOut: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                <div className="flex gap-2">
                  {selectedRoom?.status === 'occupied' && (
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                      onClick={handleCheckout}
                    >
                      Realizar Check-out
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleUpdate}>Actualizar Habitación</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ReceptionDashboard;
