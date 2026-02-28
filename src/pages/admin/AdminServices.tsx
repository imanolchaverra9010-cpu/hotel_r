import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, UtensilsCrossed, SprayCan, Car, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/hotel/StaffSidebar';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CatalogItem, ServiceType } from '@/types/hotel';
import { API_BASE_URL } from '@/config/apiConfig';

const AdminServices = () => {
    const navigate = useNavigate();
    const { staffSession } = useHotel();
    const { toast } = useToast();
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
    const [filter, setFilter] = useState<ServiceType | 'all'>('all');

    const defaultItem = {
        type: 'room-service' as ServiceType,
        category: 'food',
        name: '',
        description: '',
        price: 0,
        icon: '1',
        available: true
    };

    const [formData, setFormData] = useState(defaultItem);

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const res = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/catalog`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch catalog', error);
        }
    };

    if (!staffSession || (staffSession.user.role !== 'admin' && staffSession.user.role !== 'reception')) {
        navigate('/staff/login');
        return null;
    }

    const openCreateDialog = () => {
        setEditingItem(null);
        setFormData(defaultItem);
        setDialogOpen(true);
    };

    const openEditDialog = (item: CatalogItem) => {
        setEditingItem(item);
        setFormData({
            type: item.type,
            category: item.category,
            name: item.name,
            description: item.description,
            price: item.price,
            icon: item.icon,
            available: item.available
        });
        setDialogOpen(true);
    };

    const openDeleteDialog = (item: CatalogItem) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
            return;
        }

        try {
            const url = editingItem
                ? `${API_BASE_URL.replace('/guest', '')}/staff/catalog/${editingItem.id}`
                : `${API_BASE_URL.replace('/guest', '')}/staff/catalog`;

            const method = editingItem ? 'PUT' : 'POST';

            // Ensure price is 0 for transport if not provided or hidden
            const finalData = { ...formData };
            if (finalData.type === 'transport') {
                finalData.price = 0;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
            });

            if (res.ok) {
                toast({ title: 'Éxito', description: `Servicio ${editingItem ? 'actualizado' : 'creado'} correctamente` });
                fetchCatalog();
                setDialogOpen(false);
            } else {
                toast({ title: 'Error', description: 'Error al guardar el servicio', variant: 'destructive' });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' });
        }
    };

    const handleDelete = async () => {
        if (itemToDelete) {
            try {
                const res = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/catalog/${itemToDelete.id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    toast({ title: 'Servicio eliminado', description: `Servicio ${itemToDelete.name} eliminado` });
                    fetchCatalog();
                }
            } catch (error) {
                toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
            }
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const filteredItems = filter === 'all' ? items : items.filter(i => i.type === filter);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'room-service': return <UtensilsCrossed className="h-5 w-5" />;
            case 'housekeeping': return <SprayCan className="h-5 w-5" />;
            case 'transport': return <Car className="h-5 w-5" />;
            default: return <ChevronRight className="h-5 w-5" />;
        }
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <StaffSidebar />
                <main className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <h1 className="text-2xl font-bold">Gestión de Servicios</h1>
                        </div>
                        <div className="flex gap-3">
                            <Select value={filter} onValueChange={(v) => setFilter(v as ServiceType | 'all')}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filtrar por tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="room-service">Room Service</SelectItem>
                                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                                    <SelectItem value="transport">Transporte</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={openCreateDialog}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Servicio
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map(item => (
                            <Card key={item.id} className="relative group overflow-hidden">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => openDeleteDialog(item)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardContent className="p-0">
                                    <div className="flex items-center p-4 gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.type === 'room-service' ? 'bg-orange-100 text-orange-600' :
                                                item.type === 'housekeeping' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-purple-100 text-purple-600'
                                            }`}>
                                            {getTypeIcon(item.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate">{item.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                            {item.type !== 'transport' && (
                                                <p className="font-bold text-sm mt-1">${item.price.toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingItem ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ServiceType })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="room-service">Room Service</SelectItem>
                                            <SelectItem value="housekeeping">Housekeeping</SelectItem>
                                            <SelectItem value="transport">Transporte</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descripción</Label>
                                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                {formData.type !== 'transport' && (
                                    <div className="space-y-2">
                                        <Label>Precio ($)</Label>
                                        <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSave}>Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default AdminServices;
