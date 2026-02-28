import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { GuestHeader } from '@/components/hotel/GuestHeader';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { CatalogItem } from '@/types/hotel';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const RoomService = () => {
  const navigate = useNavigate();
  const { guestSession, addServiceRequest, fetchNotifications, catalogs, addNotification } = useHotel();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');

  if (!guestSession) {
    navigate('/login');
    return null;
  }

  const menu = catalogs.roomService;
  const categories = [...new Set(menu.map(item => item.category))];

  const addToCart = (item: CatalogItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const getItemQuantity = (id: string) => {
    return cart.find(i => i.id === id)?.quantity || 0;
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;

    const orderDetails = cart
      .map(item => `${item.quantity}x ${item.name}`)
      .join(', ');

    await addServiceRequest({
      reservationId: guestSession.reservation.id,
      roomNumber: guestSession.room.number,
      guestName: `${guestSession.guest.firstName} ${guestSession.guest.lastName}`,
      type: 'room-service',
      details: orderDetails + (notes ? ` | Notas: ${notes}` : ''),
      priority: 'medium',
    });

    addNotification({
      title: 'Pedido Recibido',
      message: `Su pedido de servicio a la habitación ha sido recibido. Total: $${total.toLocaleString()}`,
      type: 'success',
      roomNumber: guestSession.room.number,
    });

    toast({
      title: '¡Pedido enviado!',
      description: 'Su pedido será entregado en aproximadamente 30-45 minutos.',
    });

    navigate('/guest/services/history');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <GuestHeader title="Servicio a la Habitación" showBack backTo="/guest/dashboard" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3">{category}</h3>
            <div className="space-y-3">
              {menu
                .filter(item => item.category === category)
                .map(item => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="font-bold text-primary mt-1">
                              ${item.price.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {quantity > 0 ? (
                              <>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">{quantity}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={() => addToCart(item)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addToCart(item)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Agregar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}

        <div>
          <h3 className="text-lg font-semibold mb-3">Notas adicionales</h3>
          <Textarea
            placeholder="Instrucciones especiales, alergias, preferencias..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </main>

      {/* Fixed Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{cart.reduce((sum, i) => sum + i.quantity, 0)} items</p>
                <p className="text-lg font-bold text-primary">${total.toLocaleString()}</p>
              </div>
            </div>
            <Button onClick={handleSubmit} size="lg">
              Enviar Pedido
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomService;
