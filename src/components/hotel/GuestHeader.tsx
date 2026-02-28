import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Home, ClipboardList, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHotel } from '@/contexts/HotelContext';
import { ServiceHistoryPopover } from './ServiceHistoryPopover';
import { NotificationBell } from './NotificationBell';

interface GuestHeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
}

export const GuestHeader = ({ title, showBack = false, backTo = '/guest/dashboard' }: GuestHeaderProps) => {
  const navigate = useNavigate();
  const { logoutGuest } = useHotel();

  const handleLogout = () => {
    logoutGuest();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button variant="ghost" size="icon" asChild>
              <Link to={backTo}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <div className="bg-primary/10 p-2 rounded-xl">
              <Home className="h-5 w-5 text-primary" />
            </div>
          )}
          <h1 className="font-bold text-xl">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ServiceHistoryPopover />
          <Button variant="ghost" size="icon" asChild title="Ver historial completo">
            <Link to="/guest/services/history">
              <History className="h-5 w-5" />
            </Link>
          </Button>
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
