import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Bed, Bath, Candy, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { GuestHeader } from '@/components/hotel/GuestHeader';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { CatalogItem } from '@/types/hotel';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  towel: Bath,
  cleaning: Sparkles,
  bed: Bed,
  amenities: Candy,
  pillow: Moon,
  blanket: Bed,
};

const Housekeeping = () => {
  const navigate = useNavigate();
  const { guestSession, addServiceRequest, fetchNotifications, catalogs, addNotification } = useHotel();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  if (!guestSession) {
    navigate('/login');
    return null;
  }

  const options = catalogs.housekeeping;

  const toggleOption = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;

    const selectedItems = options
      .filter(opt => selected.includes(opt.id))
      .map(opt => opt.name)
      .join(', ');

    await addServiceRequest({
      reservationId: guestSession.reservation.id,
      roomNumber: guestSession.room.number,
      guestName: `${guestSession.guest.firstName} ${guestSession.guest.lastName}`,
      type: 'housekeeping',
      details: selectedItems + (notes ? ` | Notas: ${notes}` : ''),
      priority: 'low',
    });

    addNotification({
      title: 'Solicitud Recibida',
      message: 'Su solicitud de housekeeping ha sido recibida. Atenderemos su solicitud lo antes posible.',
      type: 'success',
      roomNumber: guestSession.room.number,
    });

    toast({
      title: '¡Solicitud enviada!',
      description: 'Housekeeping atenderá su solicitud pronto.',
    });

    navigate('/guest/services/history');
  };

  return (
    <div className="min-h-screen bg-background">
      <GuestHeader title="Housekeeping" showBack backTo="/guest/dashboard" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <p className="text-muted-foreground">
          Seleccione los servicios que necesita para su habitación
        </p>

        <div className="grid grid-cols-2 gap-4">
          {options.map(option => {
            const isSelected = selected.includes(option.id);
            const Icon = iconMap[option.icon] || Sparkles;

            return (
              <Card
                key={option.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isSelected && 'ring-2 ring-success bg-success/5'
                )}
                onClick={() => toggleOption(option.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-xl transition-colors',
                    isSelected ? 'bg-success text-success-foreground' : 'bg-muted'
                  )}>
                    {isSelected ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{option.name}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Notas adicionales</h3>
          <Textarea
            placeholder="Instrucciones especiales o preferencias..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={selected.length === 0}
          onClick={handleSubmit}
        >
          Enviar Solicitud ({selected.length} seleccionado{selected.length !== 1 ? 's' : ''})
        </Button>
      </main>
    </div>
  );
};

export default Housekeeping;
