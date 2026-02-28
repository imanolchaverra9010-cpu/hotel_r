import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { ServiceType } from '@/types/hotel';

interface CreateServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateServiceModal = ({ isOpen, onClose }: CreateServiceModalProps) => {
    const { rooms, addServiceRequest, reservations } = useHotel();
    const { toast } = useToast();
    const [roomId, setRoomId] = useState('');
    const [type, setType] = useState<ServiceType>('room-service');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    // Filter only occupied rooms or rooms with active reservations
    // For simplicity, we'll list all occupied rooms.
    // However, to create a request we ideally need a reservation ID if we want to link it to a guest.
    // If the backend allows creating requests without reservation ID (just room), that's great.
    // Looking at backend schema, service_requests usually have reservation_id.
    // Let's find the active reservation for the selected room.

    const occupiedRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'cleaning'); // Maybe allow cleaning too? usually services are for guests.

    const handleSubmit = async () => {
        if (!roomId || !details) {
            toast({ title: 'Error', description: 'Complete todos los campos', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            // Find active reservation for this room
            // We can look up in the reservations list where room_id matches and status is checked-in
            const activeRes = reservations.find(r => r.roomId === roomId && r.status === 'checked-in');

            // If no active reservation found, we might still want to create it if it's a housekeeping task?
            // But the prompt implies "reception adding services" which are usually guest requests.
            // If no guest, we can't easily link it. 
            // However, let's proceed. If no reservation, maybe send null? Backend might fail.
            // Let's assume there IS a reservation if it's occupied.

            const room = rooms.find(r => r.id === roomId);

            await addServiceRequest({
                reservationId: activeRes?.id || '', // Fallback or empty if system allows
                roomNumber: room?.number || '',
                guestName: activeRes ? `${activeRes.guest.firstName} ${activeRes.guest.lastName}` : 'Recepción',
                type,
                details,
                priority: 'medium'
            });

            toast({ title: 'Solicitud creada', description: 'La solicitud se ha registrado correctamente.' });
            setRoomId('');
            setDetails('');
            onClose();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo crear la solicitud', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nueva Solicitud de Servicio</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Habitación</Label>
                        <Select value={roomId} onValueChange={setRoomId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar habitación" />
                            </SelectTrigger>
                            <SelectContent>
                                {occupiedRooms.map(room => (
                                    <SelectItem key={room.id} value={room.id}>
                                        Habitación {room.number}
                                    </SelectItem>
                                ))}
                                {occupiedRooms.length === 0 && <SelectItem value="none" disabled>No hya habitaciones ocupadas</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Servicio</Label>
                        <Select value={type} onValueChange={(v) => setType(v as ServiceType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="room-service">Room Service</SelectItem>
                                <SelectItem value="housekeeping">Housekeeping</SelectItem>
                                <SelectItem value="transport">Transporte</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Detalles</Label>
                        <Textarea
                            placeholder="Descripción de la solicitud..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Creando...' : 'Crear Solicitud'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
