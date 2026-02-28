import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  Hotel,
  Bed,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useHotel } from '@/contexts/HotelContext';
import { cn } from '@/lib/utils';

const receptionItems = [
  { title: 'Dashboard', url: '/reception/dashboard', icon: LayoutDashboard },
  { title: 'Habitaciones', url: '/admin/rooms', icon: Bed },
  { title: 'Servicios', url: '/admin/services', icon: Menu },
  { title: 'Mensajes', url: '/reception/messages', icon: MessageSquare },
  { title: 'Solicitudes', url: '/reception/requests', icon: ClipboardList },
  { title: 'Notificaciones', url: '/reception/notifications', icon: Bell },
];

const adminItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Habitaciones', url: '/admin/rooms', icon: Bed },
  { title: 'Servicios', url: '/admin/services', icon: Menu },
  { title: 'Mensajes', url: '/reception/messages', icon: MessageSquare },
  { title: 'Solicitudes', url: '/reception/requests', icon: ClipboardList },
  { title: 'Configuración', url: '/admin/settings', icon: Settings },
];

export const StaffSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { staffSession, logoutStaff, messages, serviceRequests } = useHotel();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isAdmin = staffSession?.user.role === 'admin';
  const items = isAdmin ? adminItems : receptionItems;

  const unreadMessages = messages.filter(m => !m.read && m.sender === 'guest').length;
  const pendingRequests = serviceRequests.filter(r => r.status === 'pending' || r.status === 'in-progress').length;

  const handleLogout = () => {
    logoutStaff();
    navigate('/');
  };

  const getBadge = (url: string) => {
    if (url.includes('messages') && unreadMessages > 0) return unreadMessages;
    if (url.includes('requests') && pendingRequests > 0) return pendingRequests;
    return null;
  };

  return (
    <Sidebar className={cn(collapsed ? 'w-16' : 'w-64')}>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <Hotel className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg">Hotel Paraíso</h2>
              <p className="text-xs text-muted-foreground capitalize">
                {staffSession?.user.role === 'admin' ? 'Administrador' : 'Recepción'}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                const badge = getBadge(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                        {badge && (
                          <span className={cn(
                            'absolute right-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full',
                            collapsed && 'right-0 top-0'
                          )}>
                            {badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{staffSession?.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{staffSession?.user.email}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
