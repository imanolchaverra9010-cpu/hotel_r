import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification as AppNotification } from '@/types/hotel';
import { useHotel } from '@/contexts/HotelContext';
import { useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationModalProps {
    notification: AppNotification | null;
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationModal = ({ notification, isOpen, onClose }: NotificationModalProps) => {
    const { markNotificationRead } = useHotel();

    useEffect(() => {
        if (isOpen && notification && !notification.read) {
            markNotificationRead(notification.id);
        }
    }, [isOpen, notification, markNotificationRead]);

    if (!notification) return null;

    const getIcon = () => {
        switch (notification.type) {
            case 'warning': return <AlertTriangle className="h-6 w-6 text-warning" />;
            case 'success': return <CheckCircle className="h-6 w-6 text-success" />;
            case 'urgent': return <Bell className="h-6 w-6 text-destructive animate-bounce" />;
            default: return <Info className="h-6 w-6 text-primary" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        {getIcon()}
                        <DialogTitle className="text-xl">{notification.title}</DialogTitle>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">{notification.type}</Badge>
                        {notification.roomNumber && <Badge variant="secondary">Hab. {notification.roomNumber}</Badge>}
                    </div>
                </DialogHeader>
                <div className="py-6">
                    <p className="text-foreground leading-relaxed">
                        {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                        {new Date(notification.createdAt).toLocaleString()}
                    </p>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
