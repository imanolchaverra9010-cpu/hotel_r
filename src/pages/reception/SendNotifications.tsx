import { useState } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/hotel/StaffSidebar';
import { NotificationCard } from '@/components/hotel/NotificationCard';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { NotificationType } from '@/types/hotel';

const SendNotifications = () => {
  const navigate = useNavigate();
  const { staffSession, notifications, rooms, addNotification, reservations } = useHotel();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [roomNumber, setRoomNumber] = useState<string>('all');

  if (!staffSession) { navigate('/login'); return null; }

  const occupiedRooms = rooms.filter(r => r.status === 'occupied');

  const handleSend = async () => {
    if (!title || !message) return;

    let resId: string | undefined = undefined;
    if (roomNumber !== 'all') {
      const activeRes = reservations.find(r => r.roomNumber === roomNumber && r.status === 'checked-in');
      resId = activeRes?.id;
    }

    await addNotification({
      title,
      message,
      type,
      roomNumber: roomNumber === 'all' ? undefined : roomNumber,
      reservationId: resId
    });

    toast({
      title: 'Notificación enviada',
      description: roomNumber === 'all' ? 'Enviada a todos los huéspedes' : `Enviada a habitación ${roomNumber}`
    });
    setTitle(''); setMessage('');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StaffSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center gap-4 mb-6"><SidebarTrigger /><h1 className="text-2xl font-bold">Notificaciones</h1></div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Enviar Notificación</h3>
                <div className="space-y-2"><Label>Destinatario</Label><Select value={roomNumber} onValueChange={setRoomNumber}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los huéspedes</SelectItem>{occupiedRooms.map(r => <SelectItem key={r.id} value={r.number}>Habitación {r.number}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Tipo</Label><Select value={type} onValueChange={(v) => setType(v as NotificationType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info">Información</SelectItem><SelectItem value="warning">Aviso</SelectItem><SelectItem value="success">Éxito</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la notificación" /></div>
                <div className="space-y-2"><Label>Mensaje</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Contenido del mensaje" /></div>
                <Button onClick={handleSend} disabled={!title || !message} className="w-full"><Send className="h-4 w-4 mr-2" />Enviar</Button>
              </CardContent>
            </Card>
            <div>
              <h3 className="font-semibold mb-4">Historial Reciente</h3>
              <div className="space-y-3">{notifications.slice(0, 5).map(n => <NotificationCard key={n.id} notification={n} />)}</div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SendNotifications;
