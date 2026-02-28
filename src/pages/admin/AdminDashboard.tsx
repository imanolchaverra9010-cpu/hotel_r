import { Bed, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/hotel/StaffSidebar';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '@/components/hotel/NotificationBell';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { staffSession, rooms, reservations } = useHotel();

  if (!staffSession || staffSession.user.role !== 'admin') { navigate('/login'); return null; }

  const stats = {
    totalRooms: rooms.length,
    occupancyRate: Math.round((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100),
    totalRevenue: reservations.filter(r => r.status === 'checked-in' || r.status === 'checked-out').reduce((sum, r) => sum + r.totalAmount, 0),
    activeGuests: reservations.filter(r => r.status === 'checked-in').length,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StaffSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
            </div>
            <NotificationBell />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="bg-primary/10 p-3 rounded-xl"><Bed className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.totalRooms}</p><p className="text-sm text-muted-foreground">Habitaciones</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="bg-success/10 p-3 rounded-xl"><TrendingUp className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">{stats.occupancyRate}%</p><p className="text-sm text-muted-foreground">Ocupación</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="bg-warning/10 p-3 rounded-xl"><DollarSign className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">${(stats.totalRevenue / 1000).toFixed(0)}k</p><p className="text-sm text-muted-foreground">Ingresos</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="bg-secondary/10 p-3 rounded-xl"><Users className="h-5 w-5 text-secondary" /></div><div><p className="text-2xl font-bold">{stats.activeGuests}</p><p className="text-sm text-muted-foreground">Huéspedes</p></div></div></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle>Resumen</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Panel completo de administración con estadísticas, reportes y configuración del hotel.</p></CardContent></Card>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
