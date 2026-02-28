import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Bell,
  Phone,
  UtensilsCrossed,
  SprayCan,
  Car,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GuestHeader } from '@/components/hotel/GuestHeader';
import { ServiceCard } from '@/components/hotel/ServiceCard';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { guestSession, addNotification, wifiInfo } = useHotel();
  const { toast } = useToast();

  if (!guestSession) {
    navigate('/login');
    return null;
  }

  const { guest, reservation, room } = guestSession;

  const checkOutDate = reservation?.checkOut ? new Date(reservation.checkOut) : null;
  const isDateValid = checkOutDate && !isNaN(checkOutDate.getTime());
  const daysRemaining = isDateValid ? differenceInDays(checkOutDate!, new Date()) : 0;

  const handleCallReception = () => {
    window.location.href = 'tel:3215767080';

    addNotification({
      title: 'Llamada a Recepción',
      message: `El huésped de la habitación ${room.number} solicita asistencia inmediata.`,
      type: 'urgent',
      roomNumber: room.number,
    });

    toast({
      title: 'Marcando a Recepción',
      description: 'Conectando con el número 321 576 7080.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <GuestHeader title="Mi Habitación" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Room Info Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Habitación</p>
                <h2 className="text-5xl font-bold">{room.number}</h2>
                <p className="text-primary-foreground/80 mt-1 capitalize">
                  {room.type === 'standard' ? 'Estándar' : room.type}
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary-foreground/80 text-sm">Check-out</p>
                <p className="text-xl font-semibold">
                  {isDateValid
                    ? format(checkOutDate!, 'dd MMM', { locale: es })
                    : 'No programado'
                  }
                </p>
                <p className="text-primary-foreground/80 text-sm">
                  {daysRemaining > 0
                    ? `${daysRemaining} día${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''}`
                    : 'Último día'
                  }
                </p>
              </div>
            </div>

            {/* WiFi Info - Specific for the floor */}
            {wifiInfo && (
              <div className="mt-4 pt-4 border-t border-primary-foreground/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">Zona WiFi Piso {room.floor}</p>
                  <p className="font-medium text-sm">Red: {wifiInfo.ssid}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">Contraseña</p>
                  <code className="bg-white/10 px-2 py-0.5 rounded text-sm select-all">{wifiInfo.password}</code>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-primary-foreground/20">
              <p className="text-sm text-primary-foreground/80">
                Bienvenido/a, <span className="font-semibold text-primary-foreground">{guest.firstName} {guest.lastName}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2 bg-card hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={handleCallReception}
          >
            <Phone className="h-6 w-6" />
            <span>Llamar a Recepción</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2 bg-card"
            onClick={() => navigate('/guest/chat')}
          >
            <MessageSquare className="h-6 w-6" />
            <span>Chat con Recepción</span>
          </Button>
        </div>

        {/* Services Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Solicitar Servicios</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ServiceCard
              title="Servicio a la Habitación"
              icon={UtensilsCrossed}
              color="secondary"
              onClick={() => navigate('/guest/services/room-service')}
            />
            <ServiceCard
              title="Housekeeping"
              icon={SprayCan}
              color="success"
              onClick={() => navigate('/guest/services/housekeeping')}
            />
            <ServiceCard
              title="Transporte"
              icon={Car}
              color="warning"
              onClick={() => navigate('/guest/services/transport')}
            />
          </div>
        </div>

        {/* More Options */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/guest/notifications')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Notificaciones</h4>
                <p className="text-sm text-muted-foreground">Ver avisos</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/guest/services/history')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-xl">
                <ClipboardList className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-medium">Mis Solicitudes</h4>
                <p className="text-sm text-muted-foreground">Ver historial</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GuestDashboard;
