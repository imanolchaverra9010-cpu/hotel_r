import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/hotel/StaffSidebar';
import { RoomCard } from '@/components/hotel/RoomCard';
import { RoomStatusBadge } from '@/components/hotel/RoomStatusBadge';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Room, RoomType, RoomStatus } from '@/types/hotel';

const typeLabels: Record<RoomType, string> = { standard: 'Estándar', deluxe: 'Deluxe', suite: 'Suite', presidential: 'Presidencial' };
const statusLabels: Record<RoomStatus, string> = { available: 'Disponible', occupied: 'Ocupada', cleaning: 'Limpieza', maintenance: 'Mantenimiento' };

const defaultRoom: Omit<Room, 'id'> = {
    number: '',
    floor: 1,
    type: 'standard',
    status: 'available',
    pricePerNight: 0,
    capacity: 1,
    amenities: ['WiFi', 'TV', 'AC'],
};

const AdminRooms = () => {
    const navigate = useNavigate();
    const { staffSession, rooms, addRoom, updateRoom, deleteRoom } = useHotel();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
    const [formData, setFormData] = useState<Omit<Room, 'id'>>(defaultRoom);
    const [amenityInput, setAmenityInput] = useState('');

    if (!staffSession || (staffSession.user.role !== 'admin' && staffSession.user.role !== 'reception')) { navigate('/staff/login'); return null; }

    const openCreateDialog = () => {
        setEditingRoom(null);
        setFormData(defaultRoom);
        setDialogOpen(true);
    };

    const openEditDialog = (room: Room) => {
        setEditingRoom(room);
        setFormData({ number: room.number, floor: room.floor, type: room.type, status: room.status, pricePerNight: room.pricePerNight, capacity: room.capacity, amenities: [...room.amenities] });
        setDialogOpen(true);
    };

    const openDeleteDialog = (room: Room) => {
        setRoomToDelete(room);
        setDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.number) { toast({ title: 'Error', description: 'El número de habitación es requerido', variant: 'destructive' }); return; }
        if (editingRoom) {
            await updateRoom(editingRoom.id, formData);
            toast({ title: 'Habitación actualizada', description: `Habitación ${formData.number} actualizada correctamente` });
        } else {
            await addRoom(formData);
            toast({ title: 'Habitación creada', description: `Habitación ${formData.number} creada correctamente` });
        }
        setDialogOpen(false);
    };

    const handleDelete = async () => {
        if (roomToDelete) {
            await deleteRoom(roomToDelete.id);
            toast({ title: 'Habitación eliminada', description: `Habitación ${roomToDelete.number} eliminada` });
        }
        setDeleteDialogOpen(false);
        setRoomToDelete(null);
    };

    const addAmenity = () => {
        if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
            setFormData({ ...formData, amenities: [...formData.amenities, amenityInput.trim()] });
            setAmenityInput('');
        }
    };

    const removeAmenity = (amenity: string) => {
        setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <StaffSidebar />
                <main className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4"><SidebarTrigger /><h1 className="text-2xl font-bold">Gestión de Habitaciones</h1></div>
                        <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Nueva Habitación</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map(room => (
                            <Card key={room.id} className="relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEditDialog(room)}><Pencil className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => openDeleteDialog(room)} disabled={room.status === 'occupied'}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                <RoomCard room={room} />
                            </Card>
                        ))}
                    </div>

                    {/* Create/Edit Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader><DialogTitle>{editingRoom ? 'Editar Habitación' : 'Nueva Habitación'}</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Número *</Label>
                                        <Input value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} placeholder="101" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Piso</Label>
                                        <Input type="number" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as RoomType })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as RoomStatus })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Amenidades</Label>
                                    <div className="flex gap-2">
                                        <Input value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)} placeholder="Agregar amenidad" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())} />
                                        <Button type="button" variant="secondary" onClick={addAmenity}>+</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.amenities.map(a => (
                                            <span key={a} className="bg-muted px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                                {a}<button type="button" onClick={() => removeAmenity(a)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSave}>{editingRoom ? 'Guardar Cambios' : 'Crear Habitación'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar habitación {roomToDelete?.number}?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente la habitación del sistema.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default AdminRooms;