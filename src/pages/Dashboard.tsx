import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  LayoutDashboard,
  Bed,
  Building,
  Calendar,
  Users,
  TrendingUp,
  LogOut,
  ChevronDown,
  Check,
  X,
  Clock,
  Search,
  Filter,
  CalendarDays,
  Sparkles,
  Plus,
  Mail,
  Images,
  Building2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockReservations, Reservation, rooms, venues } from "@/data/hotelData";
import { cn, formatCOP } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { ImageCarousel } from "@/components/ImageCarousel";
import roomStandard from "@/assets/room-standard.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VenueLayoutIcon, LAYOUT_TYPE_LABELS } from "@/components/VenueLayoutIcon";
import { API_BASE, apiUrl } from "@/config/api";
import ReviewModeration from "@/pages/admin/ReviewModeration";

type CapacityArrangement = {
  id: string;
  venue_id: string;
  name: string;
  capacity: number;
  layout_type: string | null;
  layout_schema: Record<string, unknown> | null;
  sort_order: number;
};

function resolveAssetUrl(url?: string) {
  if (!url) return url;
  return url.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
}

function normalizeVenue(venue: any) {
  const galleryRaw = venue?.gallery;
  const galleryList = Array.isArray(galleryRaw)
    ? galleryRaw
    : typeof galleryRaw === "string"
      ? galleryRaw.split(",").map((x: string) => x.trim()).filter(Boolean)
      : undefined;

  return {
    ...venue,
    image: resolveAssetUrl(venue?.image),
    gallery: galleryList?.map(resolveAssetUrl),
  };
}

function toDbUrl(url?: string) {
  if (!url) return url;
  return url.startsWith(API_BASE) ? url.slice(API_BASE.length) : url;
}

function normalizeRoom(room: any) {
  const galleryRaw = room?.gallery;
  const galleryList = Array.isArray(galleryRaw)
    ? galleryRaw
    : typeof galleryRaw === "string"
      ? galleryRaw.split(",").map((x: string) => x.trim()).filter(Boolean)
      : undefined;

  return {
    ...room,
    image: resolveAssetUrl(room?.image),
    gallery: galleryList?.map(resolveAssetUrl),
  };
}

const stats = [
  {
    title: "Reservas Totales",
    value: "156",
    change: "+12%",
    icon: Calendar,
  },
  {
    title: "Habitaciones Ocupadas",
    value: "18/24",
    change: "75%",
    icon: Bed,
  },
  {
    title: "Eventos Este Mes",
    value: "8",
    change: "+3",
    icon: Building,
  },
  {
    title: "Ingresos del Mes",
    value: formatCOP(45280),
    change: "+18%",
    icon: TrendingUp,
  },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmada", className: "bg-green-100 text-green-800" },
  "checked-in": { label: "Dentro", className: "bg-blue-100 text-blue-800" },
  "checked-out": { label: "Fuera", className: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800" },
};

const roomStatusConfig: Record<string, { label: string; className: string }> = {
  available: { label: "Disponible", className: "bg-green-100 text-green-800" },
  occupied: { label: "Ocupada", className: "bg-blue-100 text-blue-800" },
  maintenance: { label: "Mantenimiento", className: "bg-yellow-100 text-yellow-800" },
  cleaning: { label: "Limpieza", className: "bg-orange-100 text-orange-800" },
};

export default function Dashboard() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [dbRooms, setDbRooms] = useState<any[]>([]);
  const [dbVenues, setDbVenues] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [restaurantItems, setRestaurantItems] = useState<any[]>([]);
  const [restaurantGalleryImages, setRestaurantGalleryImages] = useState<any[]>([]);
  const [uploadingRestaurantGallery, setUploadingRestaurantGallery] = useState(false);
  const [diningAreas, setDiningAreas] = useState<any[]>([]);
  const [restaurantDialogOpen, setRestaurantDialogOpen] = useState(false);
  const [diningAreaDialogOpen, setDiningAreaDialogOpen] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [editingDiningAreaId, setEditingDiningAreaId] = useState<string | null>(null);
  const [restaurantForm, setRestaurantForm] = useState<{ name: string; category: string; description: string; price: number; image: string; available: boolean }>(
    { name: "", category: "", description: "", price: 0, image: "", available: true },
  );
  const [diningAreaForm, setDiningAreaForm] = useState<{ name: string; description: string; schedule: string; features: string }>(
    { name: "", description: "", schedule: "", features: "" },
  );
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingRoomId, setUploadingRoomId] = useState<string | null>(null);
  const [uploadingVenueId, setUploadingVenueId] = useState<string | null>(null);
  const [creatingVenue, setCreatingVenue] = useState(false);
  const [venueEdits, setVenueEdits] = useState<Record<string, any>>({});
  const [capacityDialogVenueId, setCapacityDialogVenueId] = useState<string | null>(null);
  const [capacityArrangementsList, setCapacityArrangementsList] = useState<CapacityArrangement[]>([]);
  const [newArrangementForm, setNewArrangementForm] = useState<{ name: string; capacity: number; layout_type: string }>({ name: "", capacity: 0, layout_type: "auditorio" });
  const [editingArrangementId, setEditingArrangementId] = useState<string | null>(null);
  const [newVenue, setNewVenue] = useState<{ name: string; price_per_hour: number; capacity: number; size: number; features: string }>(
    { name: "", price_per_hour: 0, capacity: 0, size: 0, features: "" },
  );
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState<{ number: string; floor: number; type: string; capacity: number; price_per_night: number; status: string; amenities: string }>(
    { number: "", floor: 1, type: "standard", capacity: 2, price_per_night: 0, status: "available", amenities: "" },
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeView, setActiveView] = useState<"dashboard" | "calendar" | "rooms" | "venues" | "hero" | "messages" | "gallery" | "restaurant" | "hotelInfo" | "reviews">("dashboard");
  const [hotelInfoForm, setHotelInfoForm] = useState({
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    opening_hours: "",
  });
  const [hotelInfoSaving, setHotelInfoSaving] = useState(false);
  const [heroCarousel, setHeroCarousel] = useState<any[]>([]);
  const [uploadingHero, setUploadingHero] = useState(false);

  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any | null>(null);
  const [reservationForm, setReservationForm] = useState<{ check_in: string; check_out: string; total_amount: number }>({
    check_in: "",
    check_out: "",
    total_amount: 0,
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const resetRoomForm = () => {
    setEditingRoomId(null);
    setNewRoom({ number: "", floor: 1, type: "standard", capacity: 2, price_per_night: 0, status: "available", amenities: "" });
  };

  const resetRestaurantForm = () => {
    setEditingRestaurantId(null);
    setRestaurantForm({ name: "", category: "", description: "", price: 0, image: "", available: true });
  };

  const resetDiningAreaForm = () => {
    setEditingDiningAreaId(null);
    setDiningAreaForm({ name: "", description: "", schedule: "", features: "" });
  };

  const fetchData = async () => {
    try {
      // Parallel fetches for speed
      const [statsRes, resRes, roomsRes, venuesRes, contactRes, galleryRes, restaurantRes, diningAreasRes, restaurantGalleryRes] = await Promise.all([
        fetch(apiUrl("/api/dashboard/stats")),
        fetch(apiUrl("/api/dashboard/reservations")),
        fetch(apiUrl("/api/rooms?available_only=false&page=1&size=200")),
        fetch(apiUrl("/api/venues")),
        fetch(apiUrl("/api/contact")),
        fetch(apiUrl("/api/gallery")),
        fetch(apiUrl("/api/menu")),
        fetch(apiUrl("/api/dining-areas")),
        fetch(apiUrl("/api/restaurant-gallery")),
      ]);

      if (statsRes.ok) setDbStats(await statsRes.json());
      if (resRes.ok) {
        setReservations((await resRes.json()) || []);
      } else {
        const text = await resRes.text();
        console.error("Dashboard reservations fetch error:", resRes.status, text);
        setReservations(mockReservations as any);
      }
      if (roomsRes.ok) {
        const roomsJson = await roomsRes.json();
        setDbRooms((roomsJson || []).map(normalizeRoom));
      }

      if (venuesRes.ok) {
        const venuesJson = await venuesRes.json();
        setDbVenues((venuesJson || []).map(normalizeVenue));
      }

      if (contactRes.ok) {
        setContactMessages((await contactRes.json()) || []);
      }

      if (galleryRes.ok) {
        setGalleryImages(
          ((await galleryRes.json()) || []).map((x: any) => ({
            ...x,
            image_url: resolveAssetUrl(x.image_url),
          }))
        );
      }

      if (restaurantRes.ok) {
        const data = await restaurantRes.json();
        setRestaurantItems((data || []).map((x: any) => ({ ...x, image: resolveAssetUrl(x.image) })));
      }

      if (diningAreasRes.ok) {
        const data = await diningAreasRes.json();
        setDiningAreas((data || []).map((x: any) => ({ ...x, image: resolveAssetUrl(x.image) })));
      }
      if (restaurantGalleryRes.ok) {
        const data = await restaurantGalleryRes.json();
        setRestaurantGalleryImages((data || []).map((x: any) => ({ ...x, image_url: resolveAssetUrl(x.image_url) })));
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("No se pudo conectar con el backend. Usando datos de ejemplo.");
      setReservations(mockReservations as any);
    } finally {
      setLoading(false);
    }
  };

  const openCreateRestaurantItem = () => {
    resetRestaurantForm();
    setRestaurantDialogOpen(true);
  };

  const openEditRestaurantItem = (item: any) => {
    setEditingRestaurantId(item.id);
    setRestaurantForm({
      name: (item.name || "").toString(),
      category: (item.category || "").toString(),
      description: (item.description || "").toString(),
      price: Number(item.price) || 0,
      image: (item.image || "").toString(),
      available: Boolean(item.available),
    });
    setRestaurantDialogOpen(true);
  };

  const saveRestaurantItem = async () => {
    const name = (restaurantForm.name || "").trim();
    const price = Number(restaurantForm.price);
    if (!name) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("El precio debe ser un número válido");
      return;
    }

    const payload = {
      name,
      category: restaurantForm.category || null,
      description: restaurantForm.description || null,
      price,
      image: restaurantForm.image || null,
      available: Boolean(restaurantForm.available),
    };

    try {
      const isEdit = Boolean(editingRestaurantId);
      const url = isEdit ? `${API_BASE}/api/menu/${editingRestaurantId}` : `${API_BASE}/api/menu`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const saved = await res.json();
      saved.image = resolveAssetUrl(saved.image);
      setRestaurantItems((prev) => (isEdit ? prev.map((x: any) => (x.id === saved.id ? saved : x)) : [saved, ...prev]));
      toast.success(isEdit ? "Item actualizado" : "Item creado");
      setRestaurantDialogOpen(false);
      resetRestaurantForm();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar el item");
    }
  };

  const deleteRestaurantItem = async (id: string) => {
    const ok = window.confirm("¿Eliminar este item del restaurante?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setRestaurantItems((prev) => prev.filter((x: any) => x.id !== id));
      toast.success("Item eliminado");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar el item");
    }
  };

  const uploadRestaurantImage = async (itemId: string, source: File | string) => {
    try {
      let res;

      // Si source es string, es una URL
      if (typeof source === 'string') {
        res = await fetch(`${API_BASE}/api/menu/${itemId}/image?url=${encodeURIComponent(source)}`, {
          method: "POST",
        });
      }
      // Si no, es un archivo
      else {
        const form = new FormData();
        form.append("image", source);

        res = await fetch(`${API_BASE}/api/menu/${itemId}/image`, {
          method: "POST",
          body: form,
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const updated = await res.json();
      updated.image = resolveAssetUrl(updated.image);
      setRestaurantItems((prev) => prev.map((x: any) => (x.id === itemId ? updated : x)));
      toast.success("Imagen actualizada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo subir la imagen");
    }
  };

  const uploadRestaurantGalleryImages = async (files: FileList) => {
    setUploadingRestaurantGallery(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("images", f));
      const res = await fetch(`${API_BASE}/api/restaurant-gallery`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRestaurantGalleryImages((data || []).map((x: any) => ({ ...x, image_url: resolveAssetUrl(x.image_url) })));
      toast.success("Imágenes subidas a la galería del restaurante");
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron subir las imágenes");
    } finally {
      setUploadingRestaurantGallery(false);
    }
  };

  const deleteRestaurantGalleryImage = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/restaurant-gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setRestaurantGalleryImages((prev) => prev.filter((x: any) => x.id !== id));
      toast.success("Imagen eliminada de la galería");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la imagen");
    }
  };

  const openCreateDiningArea = () => {
    resetDiningAreaForm();
    setDiningAreaDialogOpen(true);
  };

  const openEditDiningArea = (area: any) => {
    setEditingDiningAreaId(area.id);
    setDiningAreaForm({
      name: area.name || "",
      description: area.description || "",
      schedule: area.schedule || "",
      features: area.features || "",
    });
    setDiningAreaDialogOpen(true);
  };

  const saveDiningArea = async () => {
    const name = (diningAreaForm.name || "").trim();
    if (!name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const payload = {
      name,
      description: diningAreaForm.description || null,
      schedule: diningAreaForm.schedule || null,
      features: diningAreaForm.features || null,
    };

    try {
      const isEdit = Boolean(editingDiningAreaId);
      const url = isEdit ? `${API_BASE}/api/dining-areas/${editingDiningAreaId}` : `${API_BASE}/api/dining-areas`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const saved = await res.json();
      saved.image = resolveAssetUrl(saved.image);
      setDiningAreas((prev) => (isEdit ? prev.map((x: any) => (x.id === saved.id ? saved : x)) : [saved, ...prev]));
      toast.success(isEdit ? "Área actualizada" : "Área creada");
      setDiningAreaDialogOpen(false);
      resetDiningAreaForm();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar el área");
    }
  };

  const deleteDiningArea = async (id: string) => {
    if (!confirm("¿Eliminar este área?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/dining-areas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setDiningAreas((prev) => prev.filter((x: any) => x.id !== id));
      toast.success("Área eliminada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar el área");
    }
  };

  const uploadDiningAreaImage = async (areaId: string, source: File | string) => {
    try {
      let res;

      // Si source es string, es una URL
      if (typeof source === 'string') {
        res = await fetch(`${API_BASE}/api/dining-areas/${areaId}/image?url=${encodeURIComponent(source)}`, {
          method: "POST",
        });
      }
      // Si no, es un archivo
      else {
        const form = new FormData();
        form.append("image", source);

        res = await fetch(`${API_BASE}/api/dining-areas/${areaId}/image`, {
          method: "POST",
          body: form,
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const updated = await res.json();
      updated.image = resolveAssetUrl(updated.image);
      setDiningAreas((prev) => prev.map((x: any) => (x.id === areaId ? updated : x)));
      toast.success("Imagen actualizada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo subir la imagen");
    }
  };

  const toggleRestaurantAvailability = async (item: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !Boolean(item.available) }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const updated = await res.json();
      updated.image = resolveAssetUrl(updated.image);
      setRestaurantItems((prev) => prev.map((x: any) => (x.id === updated.id ? updated : x)));
      toast.success("Disponibilidad actualizada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar");
    }
  };

  const updateAnyReservationStatus = async (resv: any, status: string) => {
    const basePath = resv?.type === "venue" ? "venue-reservations" : "reservations";
    try {
      const res = await fetch(`${API_BASE}/api/${basePath}/${resv.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setReservations((prev) => prev.map((r: any) => (r.id === resv.id ? { ...r, status } : r)));
        toast.success(`Reserva ${resv.id} actualizada a ${statusConfig[status]?.label || status}`);
        fetchData();
      } else {
        const text = await res.text();
        console.error("Reservation status error:", res.status, text);
        toast.error("No se pudo actualizar la reserva");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al servidor");
    }
  };

  const openEditReservation = (res: any) => {
    const checkIn = res.check_in || res.checkIn;
    const checkOut = res.check_out || res.checkOut;

    const toInputDate = (v: any) => {
      if (!v) return "";
      try {
        return format(new Date(v), "yyyy-MM-dd");
      } catch {
        return "";
      }
    };

    setEditingReservation(res);
    setReservationForm({
      check_in: toInputDate(checkIn),
      check_out: toInputDate(checkOut),
      total_amount: Number(res.total_amount || res.totalPrice || 0),
    });
    setReservationDialogOpen(true);
  };

  const saveReservationEdits = async () => {
    if (!editingReservation?.id) return;
    const id = editingReservation.id;

    if (!reservationForm.check_in || !reservationForm.check_out) {
      toast.error("Selecciona fechas de entrada y salida");
      return;
    }
    const total = Number(reservationForm.total_amount);
    if (!Number.isFinite(total) || total < 0) {
      toast.error("El total debe ser un número válido");
      return;
    }

    try {
      const basePath = editingReservation?.type === "venue" ? "venue-reservations" : "reservations";
      const res = await fetch(`${API_BASE}/api/${basePath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_in: reservationForm.check_in,
          check_out: reservationForm.check_out,
          total_amount: total,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const updated = await res.json();
      setReservations((prev) => prev.map((r: any) => (r.id === id ? { ...r, ...updated } : r)));
      toast.success("Reserva actualizada");
      setReservationDialogOpen(false);
      setEditingReservation(null);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar la reserva");
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm("¿Eliminar esta reserva?")) return;
    try {
      const basePath = editingReservation?.type === "venue" ? "venue-reservations" : "reservations";
      const res = await fetch(`${API_BASE}/api/${basePath}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setReservations((prev) => prev.filter((r: any) => r.id !== id));
      toast.success("Reserva eliminada");
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la reserva");
    }
  };

  const deleteAnyReservation = async (resv: any) => {
    if (!confirm("¿Eliminar esta reserva?")) return;
    const basePath = resv?.type === "venue" ? "venue-reservations" : "reservations";
    try {
      const res = await fetch(`${API_BASE}/api/${basePath}/${resv.id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setReservations((prev) => prev.filter((r: any) => r.id !== resv.id));
      toast.success("Reserva eliminada");
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la reserva");
    }
  };

  const uploadGalleryImages = async (files: FileList) => {
    setUploadingGallery(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("images", f));

      const res = await fetch(`${API_BASE}/api/gallery`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      setGalleryImages((data || []).map((x: any) => ({ ...x, image_url: resolveAssetUrl(x.image_url) })));
      toast.success("Imágenes subidas a la galería");
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron subir las imágenes");
    } finally {
      setUploadingGallery(false);
    }
  };

  const deleteGalleryImage = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setGalleryImages((prev) => prev.filter((x: any) => x.id !== id));
      toast.success("Imagen eliminada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la imagen");
    }
  };

  const fetchContactMessage = async (id: string) => {
    setContactLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact/${id}`);
      if (!res.ok) throw new Error(await res.text());
      setSelectedContact(await res.json());
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar el mensaje");
    } finally {
      setContactLoading(false);
    }
  };

  const createVenue = async () => {
    if (!newVenue.name.trim()) {
      toast.error("El nombre del salón es obligatorio");
      return;
    }

    setCreatingVenue(true);
    try {
      const res = await fetch(`${API_BASE}/api/venues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVenue.name.trim(),
          price_per_hour: Number(newVenue.price_per_hour) || 0,
          capacity: Number(newVenue.capacity) || 0,
          size: Number(newVenue.size) || 0,
          features: newVenue.features,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const created = normalizeVenue(await res.json());
      setDbVenues((prev) => [created, ...prev]);
      toast.success("Salón creado");
      setNewVenue({ name: "", price_per_hour: 0, capacity: 0, size: 0, features: "" });
    } catch (e) {
      console.error(e);
      toast.error("No se pudo crear el salón");
    } finally {
      setCreatingVenue(false);
    }
  };

  const updateVenue = async (venueId: string, payload: any) => {
    setUploadingVenueId(venueId);
    try {
      const res = await fetch(`${API_BASE}/api/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const updated = normalizeVenue(await res.json());
      setDbVenues((prev) => prev.map((v: any) => (v.id === venueId ? updated : v)));
      toast.success("Salón actualizado");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar el salón");
    } finally {
      setUploadingVenueId(null);
    }
  };

  const deleteVenue = async (venueId: string) => {
    setUploadingVenueId(venueId);
    try {
      const res = await fetch(`${API_BASE}/api/venues/${venueId}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setDbVenues((prev) => prev.filter((v: any) => v.id !== venueId));
      toast.success("Salón eliminado");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar el salón");
    } finally {
      setUploadingVenueId(null);
    }
  };

  const createRoom = async () => {
    const number = (newRoom.number || "").trim();
    const floor = Number(newRoom.floor);
    const capacity = Number(newRoom.capacity);
    const price = Number(newRoom.price_per_night);
    const type = (newRoom.type || "").trim().toLowerCase();
    const status = (newRoom.status || "available").trim().toLowerCase();

    if (!number) {
      toast.error("El número de habitación es obligatorio");
      return;
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      toast.error("La capacidad debe ser un número válido (>= 1)");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("El precio por noche debe ser un número válido (>= 0)");
      return;
    }
    if (!type) {
      toast.error("El tipo de habitación es obligatorio");
      return;
    }

    setCreatingRoom(true);
    try {
      const res = await fetch(`${API_BASE}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number,
          floor,
          type,
          status,
          price_per_night: price,
          capacity,
          amenities: newRoom.amenities,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const created = normalizeRoom(await res.json());
      setDbRooms((prev) => [created, ...prev]);
      toast.success("Habitación creada");
      setRoomDialogOpen(false);
      setNewRoom({ number: "", floor: 1, type: "standard", capacity: 2, price_per_night: 0, status: "available", amenities: "" });
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo crear la habitación");
    } finally {
      setCreatingRoom(false);
    }
  };

  const updateRoom = async (roomId: string) => {
    const number = (newRoom.number || "").trim();
    const floor = Number(newRoom.floor);
    const capacity = Number(newRoom.capacity);
    const price = Number(newRoom.price_per_night);
    const type = (newRoom.type || "").trim().toLowerCase();
    const status = (newRoom.status || "available").trim().toLowerCase();

    if (!number) {
      toast.error("El número de habitación es obligatorio");
      return;
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      toast.error("La capacidad debe ser un número válido (>= 1)");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("El precio por noche debe ser un número válido (>= 0)");
      return;
    }
    if (!type) {
      toast.error("El tipo de habitación es obligatorio");
      return;
    }

    setCreatingRoom(true);
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number,
          floor,
          type,
          status,
          price_per_night: price,
          capacity,
          amenities: newRoom.amenities,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const updated = normalizeRoom(await res.json());
      setDbRooms((prev) => prev.map((r: any) => (r.id === roomId ? updated : r)));
      toast.success("Habitación actualizada");
      setRoomDialogOpen(false);
      setEditingRoomId(null);
      setNewRoom({ number: "", floor: 1, type: "standard", capacity: 2, price_per_night: 0, status: "available", amenities: "" });
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar la habitación");
    } finally {
      setCreatingRoom(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    setUploadingRoomId(roomId);
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setDbRooms((prev) => prev.filter((r: any) => r.id !== roomId));
      toast.success("Habitación eliminada");
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la habitación");
    } finally {
      setUploadingRoomId(null);
    }
  };

  const uploadVenueImage = async (venueId: string, source: File | string) => {
    setUploadingVenueId(venueId);
    try {
      let res;

      // Si source es string, es una URL
      if (typeof source === 'string') {
        res = await fetch(`${API_BASE}/api/venues/${venueId}/image?url=${encodeURIComponent(source)}`, {
          method: "POST",
        });
      }
      // Si no, es un archivo
      else {
        const form = new FormData();
        form.append("image", source);

        res = await fetch(`${API_BASE}/api/venues/${venueId}/image`, {
          method: "POST",
          body: form,
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const updated = normalizeVenue(await res.json());
      setDbVenues((prev) => prev.map((v: any) => (v.id === venueId ? updated : v)));
      toast.success("Imagen principal actualizada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploadingVenueId(null);
    }
  };

  const deleteVenueImage = async (venueId: string) => {
    setUploadingVenueId(venueId);
    try {
      const res = await fetch(`${API_BASE}/api/venues/${venueId}/image`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const updated = normalizeVenue(await res.json());
      setDbVenues((prev) => prev.map((v: any) => (v.id === venueId ? updated : v)));
      toast.success("Imagen principal eliminada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la imagen");
    } finally {
      setUploadingVenueId(null);
    }
  };

  const uploadVenueGallery = async (venueId: string, files: FileList) => {
    setUploadingVenueId(venueId);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("images", f));

      const res = await fetch(`${API_BASE}/api/venues/${venueId}/gallery`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const updated = normalizeVenue(await res.json());
      setDbVenues((prev) => prev.map((v: any) => (v.id === venueId ? updated : v)));
      toast.success("Galería actualizada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo subir la galería");
    } finally {
      setUploadingVenueId(null);
    }
  };

  const deleteVenueGalleryImage = async (venueId: string, imageUrl: string) => {
    setUploadingVenueId(venueId);
    try {
      const dbUrl = toDbUrl(imageUrl);
      const res = await fetch(`${API_BASE}/api/venues/${venueId}/gallery?image_url=${encodeURIComponent(dbUrl || "")}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const updated = normalizeVenue(await res.json());
      setDbVenues((prev) => prev.map((v: any) => (v.id === venueId ? updated : v)));
      toast.success("Imagen eliminada de la galería");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la imagen");
    } finally {
      setUploadingVenueId(null);
    }
  };

  const fetchCapacityArrangements = async (venueId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/venues/${venueId}/capacity-arrangements`);
      if (res.ok) {
        const data = await res.json();
        setCapacityArrangementsList(data || []);
      } else {
        console.error(`Failed to fetch capacity arrangements for venue ${venueId}:`, res.status, res.statusText);
        setCapacityArrangementsList([]);
      }
    } catch (e) {
      console.error(`Error fetching capacity arrangements for venue ${venueId}:`, e);
      setCapacityArrangementsList([]);
    }
  };

  const openCapacityDialog = (venueId: string) => {
    setCapacityDialogVenueId(venueId);
    setNewArrangementForm({ name: "", capacity: 0, layout_type: "auditorio" });
    setEditingArrangementId(null);
    fetchCapacityArrangements(venueId);
  };

  const createCapacityArrangement = async () => {
    if (!capacityDialogVenueId) return;
    const { name, capacity, layout_type } = newArrangementForm;
    if (!name.trim() || capacity <= 0) {
      toast.error("Nombre y capacidad son obligatorios.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/venues/${capacityDialogVenueId}/capacity-arrangements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), capacity, layout_type: layout_type || null, sort_order: capacityArrangementsList.length }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setCapacityArrangementsList((prev) => [...prev, created]);
      setNewArrangementForm({ name: "", capacity: 0, layout_type: "auditorio" });
      toast.success("Acomodación agregada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo crear la acomodación");
    }
  };

  const updateCapacityArrangement = async (arrId: string, payload: { name?: string; capacity?: number; layout_type?: string | null }) => {
    if (!capacityDialogVenueId) return;
    try {
      const res = await fetch(`${API_BASE}/api/venues/${capacityDialogVenueId}/capacity-arrangements/${arrId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setCapacityArrangementsList((prev) => prev.map((a) => (a.id === arrId ? updated : a)));
      setEditingArrangementId(null);
      toast.success("Acomodación actualizada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar");
    }
  };

  const deleteCapacityArrangement = async (arrId: string) => {
    if (!capacityDialogVenueId) return;
    try {
      const res = await fetch(`${API_BASE}/api/venues/${capacityDialogVenueId}/capacity-arrangements/${arrId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setCapacityArrangementsList((prev) => prev.filter((a) => a.id !== arrId));
      toast.success("Acomodación eliminada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar");
    }
  };

  const fetchHotelInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hotel-info`);
      if (res.ok) {
        const data = await res.json();
        setHotelInfoForm({
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          whatsapp: data.whatsapp ?? "",
          facebook_url: data.facebook_url ?? "",
          instagram_url: data.instagram_url ?? "",
          twitter_url: data.twitter_url ?? "",
          opening_hours: data.opening_hours ?? "",
        });
      }
    } catch {
      // keep form as is
    }
  };

  const saveHotelInfo = async () => {
    setHotelInfoSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/hotel-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotelInfoForm),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Información del hotel actualizada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar");
    } finally {
      setHotelInfoSaving(false);
    }
  };

  useEffect(() => {
    if (activeView === "hotelInfo") fetchHotelInfo();
  }, [activeView]);

  const fetchHeroCarousel = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hero-carousel`);
      if (res.ok) {
        const data = await res.json();
        setHeroCarousel((data || []).map((x: any) => ({
          ...x,
          image_url: resolveAssetUrl(x.image_url),
        })));
      }
    } catch (e) {
      // ignore
    }
  };

  const uploadRoomImage = async (roomId: string, source: File | string) => {
    setUploadingRoomId(roomId);
    try {
      let res;

      // Si source es string, es una URL
      if (typeof source === 'string') {
        res = await fetch(`${API_BASE}/api/rooms/${roomId}/image?url=${encodeURIComponent(source)}`, {
          method: "POST",
        });
      }
      // Si no, es un archivo
      else {
        const form = new FormData();
        form.append("image", source);

        res = await fetch(`${API_BASE}/api/rooms/${roomId}/image`, {
          method: "POST",
          body: form,
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const updated = normalizeRoom(await res.json());
      setDbRooms((prev) => prev.map((r: any) => (r.id === roomId ? updated : r)));
      toast.success(`Imagen principal actualizada (Habitación ${roomId})`);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploadingRoomId(null);
    }
  };

  const deleteRoomImage = async (roomId: string) => {
    setUploadingRoomId(roomId);
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}/image`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const updated = normalizeRoom(await res.json());
      setDbRooms((prev) => prev.map((r: any) => (r.id === roomId ? updated : r)));
      toast.success(`Imagen principal eliminada (Habitación ${roomId})`);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la imagen principal");
    } finally {
      setUploadingRoomId(null);
    }
  };

  const deleteRoomGalleryImage = async (roomId: string, imageUrl: string) => {
    setUploadingRoomId(roomId);
    try {
      const dbUrl = toDbUrl(imageUrl);
      const res = await fetch(
        `${API_BASE}/api/rooms/${roomId}/gallery?image_url=${encodeURIComponent(dbUrl || "")}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const updated = normalizeRoom(await res.json());
      setDbRooms((prev) => prev.map((r: any) => (r.id === roomId ? updated : r)));
      toast.success("Imagen eliminada de la galería");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la imagen de la galería");
    } finally {
      setUploadingRoomId(null);
    }
  };

  const uploadRoomGallery = async (roomId: string, files: FileList) => {
    setUploadingRoomId(roomId);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("images", f));

      const res = await fetch(`${API_BASE}/api/rooms/${roomId}/gallery`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const updated = normalizeRoom(await res.json());
      setDbRooms((prev) => prev.map((r: any) => (r.id === roomId ? updated : r)));
      toast.success(`Galería actualizada (Habitación ${roomId})`);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo subir la galería");
    } finally {
      setUploadingRoomId(null);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHeroCarousel();
  }, []);

  const uploadHeroImages = async (files: FileList) => {
    setUploadingHero(true);
    try {
      const remaining = Math.max(0, 6 - heroCarousel.length);
      if (files.length > remaining) {
        toast.error(`Solo puedes subir ${remaining} imagen(es) más al carrusel.`);
        return;
      }

      const form = new FormData();
      Array.from(files).forEach((f) => form.append("images", f));

      const res = await fetch(`${API_BASE}/api/hero-carousel`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      setHeroCarousel((data || []).map((x: any) => ({
        ...x,
        image_url: resolveAssetUrl(x.image_url),
      })));
      toast.success("Carrusel actualizado");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo subir al carrusel");
    } finally {
      setUploadingHero(false);
    }
  };

  const deleteHeroImage = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/hero-carousel/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setHeroCarousel((prev) => prev.filter((x: any) => x.id !== id));
      toast.success("Imagen eliminada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar la imagen");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Sesión cerrada");
  };

  const normalizedReservations = reservations.map((res: any) => ({
    ...res,
    guest_name: res.guest_name || res.guestName || "",
    email: res.email || "",
    item_id: res.item_id || res.room_id || res.itemId,
    item_name: res.item_name || (res.item_id || res.room_id ? `Habitación ${res.item_id || res.room_id}` : ""),
    check_in: res.check_in || res.checkIn,
    check_out: res.check_out || res.checkOut,
    total_amount: Number(res.total_amount ?? res.totalPrice ?? 0),
  }));

  const mappedReservations = normalizedReservations.map((res: any) => ({
    ...res,
    type: res.type || "room",
    itemId: res.item_id,
    itemName: res.item_name,
    checkIn: res.check_in,
    checkOut: res.check_out,
    totalPrice: res.total_amount,
    guestName: res.guest_name || "Huésped",
  }));

  const filteredReservations = normalizedReservations.filter((res: any) => {
    const guestName = res.guest_name || "";
    const matchesSearch =
      guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || res.status === statusFilter;
    const matchesType = typeFilter === "all" || res.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const updateReservationStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setReservations((prev) =>
          prev.map((r: any) => (r.id === id ? { ...r, status } : r))
        );
        toast.success(`Reserva ${id} actualizada a ${statusConfig[status]?.label || status}`);
        fetchData();
      } else {
        toast.error("No se pudo actualizar la reserva");
      }
    } catch (error) {
      toast.error("Error de conexión al servidor");
    }
  };

  const updateRoomStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setDbRooms((prev) =>
          prev.map((r: any) => (r.id === id ? { ...r, status } : r))
        );
        toast.success(`Habitación ${id} actualizada a ${status}`);
        fetchData(); // Refresh all to sync stats
      } else {
        toast.error("No se pudo actualizar la habitación");
      }
    } catch (error) {
      toast.error("Error de conexión al servidor");
    }
  };

  const dashboardStats = [
    {
      title: "Reservas Totales",
      value: dbStats?.total_reservations || "0",
      change: "+12%", // Static for demo
      icon: Calendar,
    },
    {
      title: "Habitaciones Ocupadas",
      value: dbStats ? `${dbStats.occupied_rooms}/${dbStats.total_rooms || 0}` : "0/0",
      change: (dbStats && dbStats.total_rooms > 0) ? `${Math.round((dbStats.occupied_rooms / dbStats.total_rooms) * 100)}%` : "0%",
      icon: Bed,
    },
    {
      title: "Eventos Este Mes",
      value: dbStats?.upcoming_events || "0",
      change: "+0",
      icon: Building,
    },
    {
      title: "Ingresos Totales",
      value: formatCOP(dbStats?.revenue || 0),
      change: "+18%",
      icon: TrendingUp,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse font-serif">Preparando Panel de Administración...</p>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-serif font-bold mb-4">Acceso Denegado</h2>
          <p className="text-muted-foreground mb-6">Debes iniciar sesión para ver este panel.</p>
          <Button asChild variant="gold" className="w-full">
            <Link to="/login">Ir al Login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex relative">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-dark text-cream flex-shrink-0 hidden lg:flex flex-col relative z-20 shadow-xl">
        <div className="p-6 border-b border-cream/10">
          <Link to="/" className="text-xl font-serif font-bold">
            Hotel Los <span className="text-gold">Robles</span>
          </Link>
          <p className="text-xs text-cream/50 mt-1">Panel de Administración</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveView("dashboard")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "dashboard"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                Panel Principal
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("restaurant")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "restaurant"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Users className="h-5 w-5" />
                Restaurante
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("hero")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "hero"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Sparkles className="h-5 w-5" />
                Carrusel Inicio
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("dashboard")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "dashboard" && "hidden", // We can hide it or use it as Reservas
                  "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Calendar className="h-5 w-5" />
                Reservas
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("calendar")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "calendar"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <CalendarDays className="h-5 w-5" />
                Calendario
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("rooms")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "rooms"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Bed className="h-5 w-5" />
                Habitaciones
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("venues")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "venues"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Building className="h-5 w-5" />
                Salones
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("messages")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "messages"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Mail className="h-5 w-5" />
                Mensajes
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("reviews")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "reviews"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Star className="h-5 w-5" />
                Reseñas
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("gallery")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "gallery"
                    ? "bg-gold text-navy-dark"
                    : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Images className="h-5 w-5" />
                Galería
              </button>
            </li>
            <li className="pt-4 mt-4 border-t border-cream/10">
              <p className="px-4 text-[10px] uppercase tracking-widest text-cream/40 font-bold mb-2">Administración</p>
              <button
                onClick={() => setActiveView("hotelInfo")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeView === "hotelInfo" ? "bg-gold text-navy-dark" : "text-cream/70 hover:bg-cream/10"
                )}
              >
                <Building2 className="h-5 w-5" />
                Información del hotel
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-cream/70 hover:bg-cream/10 text-left"
              >
                <Users className="h-5 w-5" />
                Clientes
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-cream/10">
          <div className="mb-3 px-4 py-2 bg-cream/5 rounded-lg">
            <p className="text-xs text-cream/50">Sesión activa</p>
            <p className="text-sm text-cream font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gold capitalize">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-cream/70 hover:text-cream hover:bg-cream/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-muted/10 p-0 m-0">
        {/* Header */}
        <header className="bg-card shadow-soft">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                {activeView === "dashboard"
                  ? "Panel Principal"
                  : activeView === "calendar"
                    ? "Calendario de Disponibilidad"
                    : activeView === "messages"
                      ? "Mensajes de Contacto"
                      : activeView === "gallery"
                        ? "Galería"
                        : activeView === "rooms"
                          ? "Gestión de Habitaciones"
                          : activeView === "venues"
                            ? "Gestión de Salones"
                            : activeView === "restaurant"
                              ? "Restaurante"
                              : activeView === "hotelInfo"
                                ? "Información del hotel"
                                : activeView === "reviews"
                                  ? "Moderación de reseñas"
                                  : "Carrusel de Inicio"}
              </h1>
              <p className="text-sm text-muted-foreground">Bienvenido, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="gold" asChild>
                <Link to="/reservar">Nueva Reserva</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {activeView === "reviews" ? (
            <ReviewModeration skipHeader />
          ) : activeView === "hotelInfo" ? (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-2xl text-navy-dark">Información del hotel</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Teléfono, correo, dirección y redes sociales. Se muestran en el pie de página y en Contacto.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={hotelInfoForm.phone}
                      onChange={(e) => setHotelInfoForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="310 437 4492"
                    />
                  </div>
                  <div>
                    <Label>Correo electrónico</Label>
                    <Input
                      type="email"
                      value={hotelInfoForm.email}
                      onChange={(e) => setHotelInfoForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="hotel@ejemplo.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      value={hotelInfoForm.address}
                      onChange={(e) => setHotelInfoForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Hotel Los Robles, Cl. 28 #314, Quibdó, Chocó"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp (número con código país)</Label>
                    <Input
                      value={hotelInfoForm.whatsapp}
                      onChange={(e) => setHotelInfoForm((p) => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="+573104374492"
                    />
                  </div>
                  <div>
                    <Label>Horario de atención</Label>
                    <Input
                      value={hotelInfoForm.opening_hours}
                      onChange={(e) => setHotelInfoForm((p) => ({ ...p, opening_hours: e.target.value }))}
                      placeholder="24 horas, 7 días a la semana"
                    />
                  </div>
                  <div>
                    <Label>Facebook (URL completa)</Label>
                    <Input
                      value={hotelInfoForm.facebook_url}
                      onChange={(e) => setHotelInfoForm((p) => ({ ...p, facebook_url: e.target.value }))}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <Label>Instagram (URL completa)</Label>
                    <Input
                      value={hotelInfoForm.instagram_url}
                      onChange={(e) => setHotelInfoForm((p) => ({ ...p, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <Label>Twitter / X (URL completa)</Label>
                    <Input
                      value={hotelInfoForm.twitter_url}
                      onChange={(e) => setHotelInfoForm((p) => ({ ...p, twitter_url: e.target.value }))}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                </div>
                <Button variant="gold" onClick={saveHotelInfo} disabled={hotelInfoSaving}>
                  {hotelInfoSaving ? "Guardando..." : "Guardar información"}
                </Button>
              </CardContent>
            </Card>
          ) : activeView === "restaurant" ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-2xl text-navy-dark">Restaurante</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Administra todos los productos del restaurante (room-service).</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="gold" onClick={openCreateRestaurantItem}>
                      + Añadir item
                    </Button>
                    <Button variant="gold" onClick={openCreateDiningArea}>
                      + Añadir área
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Dialog
                  open={restaurantDialogOpen}
                  onOpenChange={(open) => {
                    setRestaurantDialogOpen(open);
                    if (!open) resetRestaurantForm();
                  }}
                >
                  <DialogContent className="max-w-2xl">
                    <div className="space-y-4">
                      <DialogHeader>
                        <DialogTitle>{editingRestaurantId ? "Editar item" : "Nuevo item"}</DialogTitle>
                        <DialogDescription>Completa los detalles del item del menú.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input value={restaurantForm.name} onChange={(e) => setRestaurantForm((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoría</Label>
                          <Input value={restaurantForm.category} onChange={(e) => setRestaurantForm((p) => ({ ...p, category: e.target.value }))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Descripción</Label>
                          <Textarea rows={4} value={restaurantForm.description} onChange={(e) => setRestaurantForm((p) => ({ ...p, description: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio</Label>
                          <Input type="number" min={0} step={100} value={restaurantForm.price} onChange={(e) => setRestaurantForm((p) => ({ ...p, price: Number(e.target.value) }))} />
                          <div className="text-xs text-muted-foreground">Vista previa: <span className="font-medium">{formatCOP(Number(restaurantForm.price) || 0)}</span></div>
                        </div>
                        <div className="space-y-2">
                          <Label>Imagen URL</Label>
                          <Input value={restaurantForm.image} onChange={(e) => setRestaurantForm((p) => ({ ...p, image: e.target.value }))} placeholder="URL de la imagen" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Disponible</Label>
                          <Select
                            value={restaurantForm.available ? "true" : "false"}
                            onValueChange={(v) => setRestaurantForm((p) => ({ ...p, available: v === "true" }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Sí</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setRestaurantDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="button" variant="gold" onClick={saveRestaurantItem}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold text-navy-dark">Nombre</TableHead>
                      <TableHead className="font-bold text-navy-dark">Categoría</TableHead>
                      <TableHead className="font-bold text-navy-dark">Precio</TableHead>
                      <TableHead className="font-bold text-navy-dark">Disponible</TableHead>
                      <TableHead className="font-bold text-navy-dark text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurantItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.category || "-"}</TableCell>
                        <TableCell className="font-semibold">{formatCOP(Number(item.price) || 0)}</TableCell>
                        <TableCell>
                          <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {item.available ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Acciones
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditRestaurantItem(item)}>
                                <CalendarDays className="h-4 w-4 mr-2 text-navy-dark" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleRestaurantAvailability(item)}>
                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                Cambiar disponible
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteRestaurantItem(item.id)}>
                                <X className="h-4 w-4 mr-2 text-red-600" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {restaurantItems.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">No hay items de restaurante aún.</div>
                )}

                <div className="my-8 border-t border-muted/20" />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif font-bold text-navy-dark">Galería del restaurante</h3>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingRestaurantGallery}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files?.length) {
                          uploadRestaurantGalleryImages(files);
                          e.target.value = "";
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        {uploadingRestaurantGallery ? "Subiendo…" : "Subir imágenes"}
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Estas imágenes se muestran en la sección galería de la página Restaurante.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {restaurantGalleryImages.map((img: any) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-muted/50 aspect-square">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRestaurantGalleryImage(img.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {restaurantGalleryImages.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">Aún no hay imágenes en la galería. Sube algunas para que aparezcan en la página Restaurante.</p>
                )}

                <div className="my-8 border-t border-muted/20" />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif font-bold text-navy-dark">Áreas de Comedor</h3>
                </div>

                <Dialog
                  open={diningAreaDialogOpen}
                  onOpenChange={(open) => {
                    setDiningAreaDialogOpen(open);
                    if (!open) resetDiningAreaForm();
                  }}
                >
                  <DialogContent className="max-w-2xl">
                    <div className="space-y-4">
                      <DialogHeader>
                        <DialogTitle>{editingDiningAreaId ? "Editar área" : "Nueva área"}</DialogTitle>
                        <DialogDescription>Configura las áreas de comedor disponibles.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input value={diningAreaForm.name} onChange={(e) => setDiningAreaForm((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Horario</Label>
                          <Input value={diningAreaForm.schedule} onChange={(e) => setDiningAreaForm((p) => ({ ...p, schedule: e.target.value }))} placeholder="Ej: 13:00 - 23:00" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Descripción</Label>
                          <Textarea rows={3} value={diningAreaForm.description} onChange={(e) => setDiningAreaForm((p) => ({ ...p, description: e.target.value }))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Características (separadas por coma)</Label>
                          <Input value={diningAreaForm.features} onChange={(e) => setDiningAreaForm((p) => ({ ...p, features: e.target.value }))} placeholder="Ej: Vista al mar, Aire acondicionado, Música en vivo" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDiningAreaDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="button" variant="gold" onClick={saveDiningArea}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold text-navy-dark">Nombre</TableHead>
                      <TableHead className="font-bold text-navy-dark">Horario</TableHead>
                      <TableHead className="font-bold text-navy-dark">Características</TableHead>
                      <TableHead className="font-bold text-navy-dark">Imagen</TableHead>
                      <TableHead className="font-bold text-navy-dark text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diningAreas.map((area: any) => (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">{area.name}</TableCell>
                        <TableCell className="text-muted-foreground">{area.schedule || "-"}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{area.features || "-"}</TableCell>
                        <TableCell>
                          {area.image ? (
                            <img src={area.image} alt={area.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin imagen</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDiningArea(area)}>
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                            <div className="relative inline-block">
                              <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer w-9 h-9"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) uploadDiningAreaImage(area.id, f);
                                }}
                              />
                              <Button variant="ghost" size="sm">
                                <Images className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => deleteDiningArea(area.id)}>
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {diningAreas.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">No hay áreas de comedor registradas.</div>
                )}
              </CardContent>
            </Card>
          ) : activeView === "calendar" ? (
            <AvailabilityCalendar reservations={mappedReservations} />
          ) : activeView === "gallery" ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-2xl text-navy-dark">Galería</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Administra las imágenes que se muestran en la página /galeria.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingGallery}
                      onChange={(e) => {
                        const fl = e.target.files;
                        if (fl && fl.length) uploadGalleryImages(fl);
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  {galleryImages.length} imagen(es)
                </div>

                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((img: any) => (
                      <div key={img.id} className="rounded-lg border overflow-hidden bg-card">
                        <img src={img.image_url} className="w-full h-32 object-cover" />
                        <div className="p-3 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground truncate">{img.id}</span>
                          <Button variant="outline" size="sm" disabled={uploadingGallery} onClick={() => deleteGalleryImage(img.id)}>
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No hay imágenes cargadas aún.</div>
                )}
              </CardContent>
            </Card>
          ) : activeView === "messages" ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-2xl text-navy-dark">Mensajes de Contacto</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Mensajes enviados desde el formulario de contacto.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, email o asunto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-80 border-navy-dark/10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold text-navy-dark">Fecha</TableHead>
                      <TableHead className="font-bold text-navy-dark">Nombre</TableHead>
                      <TableHead className="font-bold text-navy-dark">Email</TableHead>
                      <TableHead className="font-bold text-navy-dark">WhatsApp</TableHead>
                      <TableHead className="font-bold text-navy-dark">Asunto</TableHead>
                      <TableHead className="font-bold text-navy-dark text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contactMessages
                      .filter((m: any) => {
                        const q = searchQuery.toLowerCase();
                        const hay = `${m?.name || ""} ${m?.email || ""} ${m?.subject || ""}`.toLowerCase();
                        return hay.includes(q);
                      })
                      .map((m: any) => (
                        <TableRow key={m.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="text-sm">
                            {m.created_at ? format(new Date(m.created_at), "PPp", { locale: es }) : "-"}
                          </TableCell>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                          <TableCell className="text-sm">{m.whatsapp || "-"}</TableCell>
                          <TableCell className="text-sm">{m.subject}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="gold"
                              size="sm"
                              disabled={contactLoading}
                              onClick={() => fetchContactMessage(m.id)}
                            >
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>

                {contactMessages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay mensajes todavía.
                  </div>
                )}

                <Dialog open={!!selectedContact} onOpenChange={(v) => !v && setSelectedContact(null)}>
                  <DialogContent className="max-w-2xl">
                    {selectedContact && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {selectedContact.created_at ? format(new Date(selectedContact.created_at), "PPp", { locale: es }) : ""}
                          </div>
                          <DialogHeader>
                            <DialogTitle className="text-xl font-serif font-bold text-navy-dark mt-1">
                              {selectedContact.subject}
                            </DialogTitle>
                            <DialogDescription>Detalles del mensaje de contacto.</DialogDescription>
                          </DialogHeader>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">Nombre</div>
                            <div className="font-medium">{selectedContact.name}</div>
                          </div>
                          <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div className="font-medium">{selectedContact.email}</div>
                          </div>
                          <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">WhatsApp</div>
                            <div className="font-medium">{selectedContact.whatsapp || "-"}</div>
                          </div>
                        </div>

                        <div className="rounded-lg border p-4 bg-muted/20 whitespace-pre-wrap">
                          {selectedContact.message}
                        </div>

                        <div className="flex justify-end">
                          <Button type="button" variant="outline" onClick={() => setSelectedContact(null)}>
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : activeView === "hero" ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-2xl text-navy-dark">Carrusel del Inicio</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Sube y administra las imágenes que aparecen en el hero del inicio (máx 6).</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingHero || heroCarousel.length >= 6}
                      onChange={(e) => {
                        const fl = e.target.files;
                        if (fl && fl.length) uploadHeroImages(fl);
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  {heroCarousel.length}/6 imágenes
                </div>

                {heroCarousel.length > 0 ? (
                  <div className="w-full">
                    <ImageCarousel
                      images={heroCarousel.map((x: any) => x.image_url)}
                      className="h-64"
                      rounded={true}
                      autoplayMs={5000}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No hay imágenes cargadas aún. Se usará el carrusel por defecto.</div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {heroCarousel.map((img: any) => (
                    <div key={img.id} className="rounded-lg border overflow-hidden bg-card">
                      <img src={img.image_url} className="w-full h-32 object-cover" />
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate">{img.id}</span>
                        <Button variant="outline" size="sm" onClick={() => deleteHeroImage(img.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : activeView === "venues" ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-2xl text-navy-dark">Gestión de Salones</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Administra los salones, precios e imágenes.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar salón..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64 border-navy-dark/10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 rounded-lg border bg-card p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <Input
                      placeholder="Nombre"
                      value={newVenue.name}
                      onChange={(e) => setNewVenue((p) => ({ ...p, name: e.target.value }))}
                      disabled={creatingVenue}
                    />
                    <Input
                      type="number"
                      placeholder="Precio/Hora"
                      value={newVenue.price_per_hour}
                      onChange={(e) => setNewVenue((p) => ({ ...p, price_per_hour: Number(e.target.value) }))}
                      disabled={creatingVenue}
                    />
                    <Input
                      type="number"
                      placeholder="Capacidad"
                      value={newVenue.capacity}
                      onChange={(e) => setNewVenue((p) => ({ ...p, capacity: Number(e.target.value) }))}
                      disabled={creatingVenue}
                    />
                    <Input
                      type="number"
                      placeholder="Tamaño (m²)"
                      value={newVenue.size}
                      onChange={(e) => setNewVenue((p) => ({ ...p, size: Number(e.target.value) }))}
                      disabled={creatingVenue}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Features (coma separadas)"
                        value={newVenue.features}
                        onChange={(e) => setNewVenue((p) => ({ ...p, features: e.target.value }))}
                        disabled={creatingVenue}
                      />
                      <Button
                        type="button"
                        variant="gold"
                        disabled={creatingVenue}
                        onClick={createVenue}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold text-navy-dark">Nombre</TableHead>
                      <TableHead className="font-bold text-navy-dark">Precio/Hora</TableHead>
                      <TableHead className="font-bold text-navy-dark">Capacidad</TableHead>
                      <TableHead className="font-bold text-navy-dark">Tamaño</TableHead>
                      <TableHead className="font-bold text-navy-dark">Features</TableHead>
                      <TableHead className="font-bold text-navy-dark">Imágenes</TableHead>
                      <TableHead className="font-bold text-navy-dark text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbVenues
                      .filter((v: any) => v.name?.toLowerCase?.().includes(searchQuery.toLowerCase()))
                      .map((venue: any) => {
                        const edits = venueEdits[venue.id] || {};
                        const galleryCount = Array.isArray(venue.gallery) ? venue.gallery.length : 0;
                        const mainCount = venue.image ? 1 : 0;
                        const totalPhotos = mainCount + galleryCount;
                        const remainingSlots = Math.max(0, 6 - totalPhotos);
                        const galleryFull = remainingSlots === 0;

                        return (
                          <TableRow key={venue.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="font-medium">
                              <Input
                                value={edits.name ?? venue.name ?? ""}
                                onChange={(e) =>
                                  setVenueEdits((prev) => ({
                                    ...prev,
                                    [venue.id]: { ...edits, name: e.target.value },
                                  }))
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={edits.price_per_hour ?? venue.price_per_hour ?? ""}
                                onChange={(e) =>
                                  setVenueEdits((prev) => ({
                                    ...prev,
                                    [venue.id]: { ...edits, price_per_hour: Number(e.target.value) },
                                  }))
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={edits.capacity ?? venue.capacity ?? ""}
                                onChange={(e) =>
                                  setVenueEdits((prev) => ({
                                    ...prev,
                                    [venue.id]: { ...edits, capacity: Number(e.target.value) },
                                  }))
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={edits.size ?? venue.size ?? ""}
                                onChange={(e) =>
                                  setVenueEdits((prev) => ({
                                    ...prev,
                                    [venue.id]: { ...edits, size: Number(e.target.value) },
                                  }))
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={edits.features ?? venue.features ?? ""}
                                onChange={(e) =>
                                  setVenueEdits((prev) => ({
                                    ...prev,
                                    [venue.id]: { ...edits, features: e.target.value },
                                  }))
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={venue.image || roomStandard}
                                  alt={venue.name}
                                  className="w-12 h-10 rounded object-cover"
                                />
                                <div className="flex flex-col gap-2">
                                  <div className="text-xs text-muted-foreground">{totalPhotos}/6 fotos</div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={uploadingVenueId === venue.id || !venue.image}
                                      onClick={() => deleteVenueImage(venue.id)}
                                    >
                                      Quitar principal
                                    </Button>
                                  </div>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingVenueId === venue.id}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) uploadVenueImage(venue.id, f);
                                    }}
                                  />
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    disabled={uploadingVenueId === venue.id || galleryFull}
                                    onChange={(e) => {
                                      const fl = e.target.files;
                                      if (!fl || !fl.length) return;
                                      if (fl.length > remainingSlots) {
                                        toast.error(`Solo puedes subir ${remainingSlots} foto(s) más (máx 6 por salón).`);
                                        return;
                                      }
                                      uploadVenueGallery(venue.id, fl);
                                    }}
                                  />
                                  {Array.isArray(venue.gallery) && venue.gallery.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {venue.gallery.map((g: string) => (
                                        <button
                                          type="button"
                                          key={g}
                                          className="relative"
                                          disabled={uploadingVenueId === venue.id}
                                          onClick={() => deleteVenueGalleryImage(venue.id, g)}
                                          title="Eliminar"
                                        >
                                          <img src={g} className="w-10 h-10 rounded object-cover border" />
                                          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">×</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 flex-wrap">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openCapacityDialog(venue.id)}
                                  title="Capacidades por acomodación"
                                >
                                  Capacidades
                                </Button>
                                <Button
                                  type="button"
                                  variant="gold"
                                  size="sm"
                                  disabled={uploadingVenueId === venue.id}
                                  onClick={() => {
                                    const payload = venueEdits[venue.id];
                                    if (!payload) return;
                                    updateVenue(venue.id, payload);
                                    setVenueEdits((prev) => {
                                      const next = { ...prev };
                                      delete next[venue.id];
                                      return next;
                                    });
                                  }}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={uploadingVenueId === venue.id}
                                  onClick={() => {
                                    setVenueEdits((prev) => {
                                      const next = { ...prev };
                                      delete next[venue.id];
                                      return next;
                                    });
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={uploadingVenueId === venue.id}
                                  onClick={() => deleteVenue(venue.id)}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : activeView === "rooms" ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-2xl text-navy-dark">Gestión de Habitaciones</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Administra el inventario y estado de las habitaciones en tiempo real.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar habitación..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64 border-navy-dark/10"
                      />
                    </div>
                    <Button
                      variant="gold"
                      className="shadow-lg shadow-gold/20"
                      onClick={() => setRoomDialogOpen(true)}
                    >
                      + Añadir Habitación
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Dialog
                  open={roomDialogOpen}
                  onOpenChange={(open) => {
                    setRoomDialogOpen(open);
                    if (!open) resetRoomForm();
                  }}
                >
                  <DialogContent className="max-w-2xl">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <DialogHeader>
                          <DialogTitle>{editingRoomId ? "Editar habitación" : "Nueva habitación"}</DialogTitle>
                          <DialogDescription>
                            Completa la información básica, tarifas y estado. Puedes subir imágenes después de guardar.
                          </DialogDescription>
                        </DialogHeader>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Número de habitación</Label>
                          <Input
                            placeholder="Ej: 101"
                            value={newRoom.number}
                            onChange={(e) => setNewRoom((p) => ({ ...p, number: e.target.value }))}
                            disabled={creatingRoom}
                          />
                          {!newRoom.number.trim() && (
                            <div className="text-xs text-red-600">El número es obligatorio.</div>
                          )}
                        </div>



                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={newRoom.type}
                            onValueChange={(v) => setNewRoom((p) => ({ ...p, type: v }))}
                            disabled={creatingRoom}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Estándar</SelectItem>
                              <SelectItem value="deluxe">Deluxe</SelectItem>
                              <SelectItem value="suite">Suite</SelectItem>
                              <SelectItem value="presidential">Presidencial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Select
                            value={newRoom.status}
                            onValueChange={(v) => setNewRoom((p) => ({ ...p, status: v }))}
                            disabled={creatingRoom}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Disponible</SelectItem>
                              <SelectItem value="occupied">Ocupada</SelectItem>
                              <SelectItem value="cleaning">Limpieza</SelectItem>
                              <SelectItem value="maintenance">Mantenimiento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Card className="shadow-none border">
                        <CardHeader className="py-4">
                          <CardTitle className="text-base">Tarifa y capacidad</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Capacidad (personas)</Label>
                            <Input
                              type="number"
                              placeholder="2"
                              value={newRoom.capacity}
                              onChange={(e) => setNewRoom((p) => ({ ...p, capacity: Number(e.target.value) }))}
                              min={1}
                              step={1}
                              disabled={creatingRoom}
                            />
                            {Number(newRoom.capacity) < 1 && (
                              <div className="text-xs text-red-600">Debe ser mayor o igual a 1.</div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Precio por noche (COP)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newRoom.price_per_night}
                              onChange={(e) => setNewRoom((p) => ({ ...p, price_per_night: Number(e.target.value) }))}
                              min={0}
                              step={1000}
                              disabled={creatingRoom}
                            />
                            <div className="text-xs text-muted-foreground">
                              Vista previa: <span className="font-medium">{formatCOP(Number(newRoom.price_per_night) || 0)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <Label>Descripción / amenities</Label>
                        <Textarea
                          placeholder="Ej: WiFi, TV, Aire acondicionado, Caja fuerte..."
                          value={newRoom.amenities}
                          onChange={(e) => setNewRoom((p) => ({ ...p, amenities: e.target.value }))}
                          disabled={creatingRoom}
                          rows={4}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setRoomDialogOpen(false);
                            resetRoomForm();
                          }}
                          disabled={creatingRoom}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="gold"
                          onClick={() => (editingRoomId ? updateRoom(editingRoomId) : createRoom())}
                          disabled={
                            creatingRoom ||
                            !newRoom.number.trim() ||
                            !Number.isFinite(Number(newRoom.floor)) ||
                            Number(newRoom.floor) < 1 ||
                            !Number.isFinite(Number(newRoom.capacity)) ||
                            Number(newRoom.capacity) < 1 ||
                            !Number.isFinite(Number(newRoom.price_per_night)) ||
                            Number(newRoom.price_per_night) < 0 ||
                            !newRoom.type ||
                            !newRoom.status
                          }
                        >
                          {editingRoomId ? "Guardar cambios" : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold text-navy-dark">Número</TableHead>
                      <TableHead className="font-bold text-navy-dark">Tipo</TableHead>
                      <TableHead className="font-bold text-navy-dark">Capacidad</TableHead>
                      <TableHead className="font-bold text-navy-dark">Precio</TableHead>
                      <TableHead className="font-bold text-navy-dark">Imágenes</TableHead>
                      <TableHead className="font-bold text-navy-dark">Estado</TableHead>
                      <TableHead className="font-bold text-navy-dark text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbRooms.filter((r: any) => r.number.includes(searchQuery) || r.type.toLowerCase().includes(searchQuery.toLowerCase())).map((room) => (
                      (() => {
                        const galleryCount = Array.isArray(room.gallery) ? room.gallery.length : 0;
                        const mainCount = room.image ? 1 : 0;
                        const totalPhotos = mainCount + galleryCount;
                        const remainingSlots = Math.max(0, 6 - totalPhotos);
                        const galleryFull = remainingSlots === 0;

                        return (
                          <TableRow key={room.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="font-bold text-lg">{room.number}</TableCell>

                            <TableCell className="capitalize">{room.type}</TableCell>
                            <TableCell>{room.capacity} personas</TableCell>
                            <TableCell className="font-semibold">{formatCOP(room.price_per_night)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={room.image || roomStandard}
                                  alt={`Habitación ${room.number}`}
                                  className="w-12 h-10 rounded object-cover"
                                />
                                <div className="flex flex-col gap-2">
                                  <div className="text-xs text-muted-foreground">
                                    {totalPhotos}/6 fotos
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={uploadingRoomId === room.id || !room.image}
                                      onClick={() => deleteRoomImage(room.id)}
                                    >
                                      Quitar principal
                                    </Button>
                                  </div>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingRoomId === room.id}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) uploadRoomImage(room.id, f);
                                    }}
                                  />
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    disabled={uploadingRoomId === room.id || galleryFull}
                                    onChange={(e) => {
                                      const fl = e.target.files;
                                      if (!fl || !fl.length) return;
                                      if (fl.length > remainingSlots) {
                                        toast.error(`Solo puedes subir ${remainingSlots} foto(s) más (máx 6 por habitación).`);
                                        return;
                                      }
                                      uploadRoomGallery(room.id, fl);
                                    }}
                                  />
                                  {Array.isArray(room.gallery) && room.gallery.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {room.gallery.map((g: string) => (
                                        <button
                                          type="button"
                                          key={g}
                                          className="relative"
                                          disabled={uploadingRoomId === room.id}
                                          onClick={() => deleteRoomGalleryImage(room.id, g)}
                                          title="Eliminar"
                                        >
                                          <img src={g} className="w-10 h-10 rounded object-cover border" />
                                          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">×</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={roomStatusConfig[room.status]?.className}>
                                {roomStatusConfig[room.status]?.label || room.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Cambiar Estado
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingRoomId(room.id);
                                      setNewRoom({
                                        number: room.number || "",
                                        floor: 1,
                                        type: (room.type || "standard").toString(),
                                        capacity: Number(room.capacity) || 1,
                                        price_per_night: Number(room.price_per_night) || 0,
                                        status: (room.status || "available").toString(),
                                        amenities: (room.amenities || "").toString(),
                                      });
                                      setRoomDialogOpen(true);
                                    }}
                                  >
                                    <CalendarDays className="h-4 w-4 mr-2 text-navy-dark" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateRoomStatus(room.id, "available")}>
                                    <Check className="h-4 w-4 mr-2 text-green-600" />
                                    Marcar Disponible
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateRoomStatus(room.id, "occupied")}>
                                    <Bed className="h-4 w-4 mr-2 text-blue-600" />
                                    Marcar Ocupada
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateRoomStatus(room.id, "cleaning")}>
                                    <Sparkles className="h-4 w-4 mr-2 text-orange-600" />
                                    En Limpieza
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateRoomStatus(room.id, "maintenance")}>
                                    <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                                    Mantenimiento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const ok = window.confirm(`¿Eliminar la habitación ${room.number}?`);
                                      if (ok) deleteRoom(room.id);
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-2 text-red-600" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })()
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat) => (
                  <Card key={stat.title} className="shadow-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {stat.value}
                          </p>
                          <p className="text-sm text-gold mt-1">{stat.change}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                          <stat.icon className="h-6 w-6 text-navy-dark" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Reservations Table */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="font-serif">Reservas Recientes</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar reserva..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 w-64"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="confirmed">Confirmada</SelectItem>
                          <SelectItem value="checked-in">Dentro</SelectItem>
                          <SelectItem value="checked-out">Fuera</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="room">Habitación</SelectItem>
                          <SelectItem value="venue">Salón</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Dialog
                    open={reservationDialogOpen}
                    onOpenChange={(open) => {
                      setReservationDialogOpen(open);
                      if (!open) setEditingReservation(null);
                    }}
                  >
                    <DialogContent className="max-w-xl">
                      <div className="space-y-4">
                        <DialogHeader>
                          <DialogTitle>Editar reserva</DialogTitle>
                          <DialogDescription>Modifica los detalles de la reserva seleccionada.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Check-in</Label>
                            <Input
                              type="date"
                              value={reservationForm.check_in}
                              onChange={(e) => setReservationForm((p) => ({ ...p, check_in: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Check-out</Label>
                            <Input
                              type="date"
                              value={reservationForm.check_out}
                              onChange={(e) => setReservationForm((p) => ({ ...p, check_out: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Total (COP)</Label>
                            <Input
                              type="number"
                              min={0}
                              step={1000}
                              value={reservationForm.total_amount}
                              onChange={(e) => setReservationForm((p) => ({ ...p, total_amount: Number(e.target.value) }))}
                            />
                            <div className="text-xs text-muted-foreground">
                              Vista previa: <span className="font-medium">{formatCOP(Number(reservationForm.total_amount) || 0)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setReservationDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="button" variant="gold" onClick={saveReservationEdits}>
                            Guardar cambios
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Espacio</TableHead>
                        <TableHead>Fechas</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReservations.map((res: any) => (
                        <TableRow key={res.id}>
                          <TableCell className="font-mono text-sm">{res.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{res.guest_name || `Cliente ID: ${res.guest_id}`}</p>
                              <p className="text-xs text-muted-foreground">{res.email || "S/D"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {res.type === "venue" ? "Salón" : "Habitación"}
                            </Badge>
                          </TableCell>
                          <TableCell>{res.item_name || `Habitación ${res.item_id}`}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(res.check_in), "d MMM", { locale: es })}</p>
                              <p className="text-muted-foreground">
                                {format(new Date(res.check_out), "d MMM", { locale: es })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{formatCOP(res.total_amount)}</TableCell>
                          <TableCell>
                            <Badge className={statusConfig[res.status as keyof typeof statusConfig]?.className}>
                              {statusConfig[res.status as keyof typeof statusConfig]?.label || res.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Acciones
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditReservation(res)}>
                                  <CalendarDays className="h-4 w-4 mr-2 text-navy-dark" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateAnyReservationStatus(res, "confirmed")}
                                >
                                  <Check className="h-4 w-4 mr-2 text-green-600" />
                                  Confirmar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAnyReservationStatus(res, "checked-in")}>
                                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                                  Check-in
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAnyReservationStatus(res, "checked-out")}>
                                  <Clock className="h-4 w-4 mr-2 text-gray-600" />
                                  Check-out
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateAnyReservationStatus(res, "cancelled")}
                                >
                                  <X className="h-4 w-4 mr-2 text-red-600" />
                                  Cancelar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteAnyReservation(res)}>
                                  <X className="h-4 w-4 mr-2 text-red-700" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredReservations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No se encontraron reservas con los filtros seleccionados.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-serif">Habitaciones del Sistema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4 text-sm text-muted-foreground animate-pulse">Cargando habitaciones...</div>
                    ) : (
                      <div className="space-y-4">
                        {dbRooms.slice(0, 5).map((room) => (
                          <div key={room.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <img src={room.image || "/assets/room-standard.jpg"} alt={`Habitación ${room.number}`} className="w-16 h-12 rounded object-cover" />
                              <div>
                                <p className="font-medium text-sm">Habitación {room.number}</p>
                                <p className="text-xs text-muted-foreground">{formatCOP(room.price_per_night)}/noche</p>
                              </div>
                            </div>
                            <Badge className={cn(
                              room.status === "available" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            )}>
                              {room.status === "available" ? "Disponible" : room.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Dialog: Capacidades por acomodación (esquema) */}
          <Dialog open={!!capacityDialogVenueId} onOpenChange={(open) => !open && setCapacityDialogVenueId(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif font-bold text-navy-dark">
                  Capacidad según acomodación y distanciamiento social
                </DialogTitle>
                <DialogDescription>
                  {capacityDialogVenueId && dbVenues.find((v: any) => v.id === capacityDialogVenueId)?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="rounded-lg border p-4 bg-muted/20">
                  <p className="text-sm font-medium text-foreground mb-2">Agregar acomodación</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <Input
                      placeholder="Nombre (ej. Auditorio)"
                      value={newArrangementForm.name}
                      onChange={(e) => setNewArrangementForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Capacidad"
                      min={1}
                      value={newArrangementForm.capacity || ""}
                      onChange={(e) => setNewArrangementForm((p) => ({ ...p, capacity: Number(e.target.value) || 0 }))}
                    />
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={newArrangementForm.layout_type}
                      onChange={(e) => setNewArrangementForm((p) => ({ ...p, layout_type: e.target.value }))}
                    >
                      {Object.entries(LAYOUT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <Button type="button" variant="gold" size="sm" onClick={createCapacityArrangement}>
                      Agregar
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Acomodaciones configuradas</p>
                  {capacityArrangementsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no hay acomodaciones. Agrega una arriba.</p>
                  ) : (
                    <ul className="space-y-2">
                      {capacityArrangementsList.map((arr) => (
                        <li key={arr.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                          <div className="w-12 h-12 flex items-center justify-center text-gold shrink-0">
                            <VenueLayoutIcon layoutType={arr.layout_type} size={40} />
                          </div>
                          <div className="flex-1 min-w-0">
                            {editingArrangementId === arr.id ? (
                              <div className="flex flex-wrap gap-2 items-center">
                                <Input
                                  className="w-32"
                                  value={arr.name}
                                  onChange={(e) => setCapacityArrangementsList((prev) => prev.map((a) => (a.id === arr.id ? { ...a, name: e.target.value } : a)))}
                                />
                                <Input
                                  type="number"
                                  className="w-20"
                                  min={1}
                                  value={arr.capacity}
                                  onChange={(e) => setCapacityArrangementsList((prev) => prev.map((a) => (a.id === arr.id ? { ...a, capacity: Number(e.target.value) || 0 } : a)))}
                                />
                                <select
                                  className="flex h-9 rounded-md border border-input bg-background px-2 text-sm w-36"
                                  value={arr.layout_type || "auditorio"}
                                  onChange={(e) => setCapacityArrangementsList((prev) => prev.map((a) => (a.id === arr.id ? { ...a, layout_type: e.target.value } : a)))}
                                >
                                  {Object.entries(LAYOUT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                  ))}
                                </select>
                                <Button size="sm" onClick={() => updateCapacityArrangement(arr.id, { name: arr.name, capacity: arr.capacity, layout_type: arr.layout_type })}>
                                  Guardar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingArrangementId(null)}>Cancelar</Button>
                              </div>
                            ) : (
                              <>
                                <p className="font-medium text-foreground">{arr.name}</p>
                                <p className="text-sm text-gold font-semibold">{arr.capacity} Personas</p>
                              </>
                            )}
                          </div>
                          {editingArrangementId !== arr.id && (
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => setEditingArrangementId(arr.id)}>Editar</Button>
                              <Button variant="outline" size="sm" onClick={() => deleteCapacityArrangement(arr.id)}>Eliminar</Button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main >
    </div >
  );
}
