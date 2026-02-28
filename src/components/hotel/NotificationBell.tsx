import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useHotel } from '@/contexts/HotelContext';
import { useState } from 'react';
import { Notification as AppNotification } from '@/types/hotel';
import { NotificationModal } from './NotificationModal';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
    const { notifications, unreadNotificationsCount } = useHotel();
    const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleNotificationClick = (n: AppNotification) => {
        setSelectedNotification(n);
        setIsModalOpen(true);
    };

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                        {unreadNotificationsCount > 0 && (
                            <Badge
                                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground border-2 border-background text-[10px] font-bold"
                                variant="default"
                            >
                                {unreadNotificationsCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Notificaciones</h3>
                        {unreadNotificationsCount > 0 && (
                            <Badge variant="secondary" className="text-[10px]">{unreadNotificationsCount} nuevas</Badge>
                        )}
                    </div>
                    <ScrollArea className="h-80">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No hay notificaciones
                            </div>
                        ) : (
                            <div className="grid">
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={cn(
                                            "flex flex-col gap-1 p-4 text-left text-sm hover:bg-muted/50 transition-colors border-b last:border-0 relative",
                                            !n.read && "bg-primary/[0.03]"
                                        )}
                                    >
                                        {!n.read && (
                                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                                        )}
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn("font-medium", !n.read ? "text-primary" : "text-foreground")}>
                                                {n.title}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {n.message}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            <NotificationModal
                notification={selectedNotification}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};
