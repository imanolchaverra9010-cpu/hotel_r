import { useNavigate } from 'react-router-dom';
import { GuestHeader } from '@/components/hotel/GuestHeader';
import { NotificationCard } from '@/components/hotel/NotificationCard';
import { useHotel } from '@/contexts/HotelContext';

const GuestNotifications = () => {
  const navigate = useNavigate();
  const { guestSession, notifications, markNotificationRead } = useHotel();

  if (!guestSession) {
    navigate('/login');
    return null;
  }

  const guestNotifications = notifications.filter(
    n => n.reservationId === guestSession.reservation.id
  );

  const handleNotificationClick = async (id: string) => {
    await markNotificationRead(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <GuestHeader title="Notificaciones" showBack />

      <main className="container mx-auto px-4 py-6 space-y-4">
        {guestNotifications.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No hay notificaciones</p>
          </div>
        ) : (
          guestNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification.id)}
            />
          ))
        )}
      </main>
    </div>
  );
};

export default GuestNotifications;
