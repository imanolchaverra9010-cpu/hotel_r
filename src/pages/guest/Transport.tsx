import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Car, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GuestHeader } from '@/components/hotel/GuestHeader';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { CatalogItem } from '@/types/hotel';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  '1': Plane,
  '2': Car,
  '3': Car,
  '4': MapPin,
};

const Transport = () => {
  const navigate = useNavigate();
  const { guestSession, addServiceRequest, fetchNotifications, catalogs, addNotification } = useHotel();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

  if (!guestSession) {
    navigate('/login');
    return null;
  }

  const options = catalogs.transport;
  const selectedOption = options.find(o => o.id === selected);

  const handleSubmit = async () => {
    if (!selected || !pickupTime) return;

    const option = options.find(o => o.id === selected);
    if (!option) return;

    const details = `${option.name} - Hora: ${pickupTime}${destination ? ` - Destino: ${destination}` : ''}${notes ? ` | Notas: ${notes}` : ''}`;

    await addServiceRequest({
      reservationId: guestSession.reservation.id,
      roomNumber: guestSession.room.number,
      guestName: `${guestSession.guest.firstName} ${guestSession.guest.lastName}`,
      type: 'transport',
      details,
      priority: 'high',
    });

    addNotification({
      title: 'Transporte Confirmado',
      message: `Su ${option.name.toLowerCase()} ha sido reservado para las ${pickupTime}.`,
      type: 'success',
      roomNumber: guestSession.room.number,
    });

    toast({
      title: '¡Transporte reservado!',
      description: 'Recibirá confirmación en sus notificaciones.',
    });

    navigate('/guest/services/history');
  };

  return (
    <div className="min-h-screen bg-background">
      <GuestHeader title="Transporte" showBack backTo="/guest/dashboard" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <p className="text-muted-foreground">
          Seleccione el tipo de transporte que necesita
        </p>

        <div className="grid gap-4">
          {options.map(option => {
            const isSelected = selected === option.id;
            const Icon = iconMap[option.icon] || Car;

            return (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected && 'ring-2 ring-warning bg-warning/5'
                )}
                onClick={() => setSelected(option.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn(
                    'p-3 rounded-xl transition-colors',
                    isSelected ? 'bg-warning text-warning-foreground' : 'bg-muted'
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{option.name}</h4>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selected && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupTime">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Hora de recogida *
                </Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Destino
                </Label>
                <Input
                  id="destination"
                  placeholder="Opcional"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea
                placeholder="Instrucciones especiales, número de pasajeros, equipaje..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>


            <Button
              className="w-full"
              size="lg"
              disabled={!pickupTime}
              onClick={handleSubmit}
            >
              Reservar Transporte
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Transport;
