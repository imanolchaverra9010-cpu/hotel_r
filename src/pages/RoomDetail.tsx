import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Users, Maximize, Check, Star, Wifi, Coffee, Tv, Wind, Lock, Phone } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageGallery } from "@/components/ImageGallery";
import { rooms as staticRooms, Room, venues } from "@/data/hotelData";
import { formatCOP } from "@/lib/utils";
import roomStandard from "@/assets/room-standard.jpg";
import { API_BASE } from "@/config/api";

function resolveAssetUrl(url?: string) {
    if (!url) return url;
    return url.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
}

function normalizeRoom(room: any): Room {
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

const amenityIcons: Record<string, React.ElementType> = {
    "WiFi": Wifi,
    "Café": Coffee,
    "TV": Tv,
    "Aire": Wind,
    "Caja": Lock,
    "Servicio": Phone,
};

const typeTranslations: Record<string, string> = {
    standard: "Estándar",
    deluxe: "Lujo",
    suite: "Suite",
    presidential: "Presidencial",
};

function getAmenityIcon(amenity: string) {
    for (const [key, Icon] of Object.entries(amenityIcons)) {
        if (amenity.toLowerCase().includes(key.toLowerCase())) {
            return Icon;
        }
    }
    return Check;
}

export default function RoomDetail() {
    const { id } = useParams<{ id: string }>();
    const [room, setRoom] = useState<Room | null>(null);
    const [otherRooms, setOtherRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/rooms/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setRoom(normalizeRoom(data));
                } else {
                    // Fallback to static
                    const staticRoom = staticRooms.find((r) => r.id === id);
                    setRoom(staticRoom || null);
                }
            } catch (error) {
                console.error("Error fetching room details:", error);
                const staticRoom = staticRooms.find((r) => r.id === id);
                setRoom(staticRoom || null);
            } finally {
                setLoading(false);
            }
        };

        const fetchOtherRooms = async () => {
            try {
                // Fetch 4 rooms to ensure we have at least 2 after filtering current room
                const res = await fetch(`${API_BASE}/api/rooms?size=4&available_only=true`);
                if (res.ok) {
                    const data = await res.json();
                    const normalized = data.map(normalizeRoom);
                    // Filter out current room (using string comparison for ids)
                    const filtered = normalized
                        .filter((r: Room) => String(r.id) !== String(id))
                        .slice(0, 2);
                    setOtherRooms(filtered);
                } else {
                    // Fallback
                    const staticOthers = staticRooms.filter((r) => r.id !== id).slice(0, 2);
                    setOtherRooms(staticOthers);
                }
            } catch (error) {
                console.error("Error fetching other rooms:", error);
                const staticOthers = staticRooms.filter((r) => r.id !== id).slice(0, 2);
                setOtherRooms(staticOthers);
            }
        };

        if (id) {
            fetchRoom();
            fetchOtherRooms();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="pt-32 pb-20 container mx-auto px-4 text-center">
                    <p className="text-xl text-muted-foreground animate-pulse">Cargando detalles de la habitación...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!room) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="pt-32 pb-20 container mx-auto px-4 text-center">
                    <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Habitación no encontrada</h1>
                    <Button asChild variant="gold">
                        <Link to="/habitaciones">Volver al catálogo</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header />

            {/* Hero Image */}
            <section className="relative h-[60vh] md:h-[70vh]">
                <img
                    src={room.image || roomStandard}
                    alt={`Habitación ${room.number}`}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 via-transparent to-navy-dark/30" />

                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="container mx-auto">
                        <Link
                            to="/habitaciones"
                            className="inline-flex items-center gap-2 text-cream/80 hover:text-gold transition-colors mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Habitaciones
                        </Link>
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                                    ))}
                                </div>
                                <h1 className="text-3xl md:text-5xl font-serif font-bold text-cream">
                                    Habitación {room.number}
                                </h1>
                            </div>
                            <div className="text-right">
                                <p className="text-cream/60 text-sm">Desde</p>
                                <p className="text-3xl md:text-4xl font-bold text-gold">
                                    {formatCOP(room.price_per_night)}
                                    <span className="text-lg font-normal text-cream/60">/noche</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-10">
                            {/* Mini Gallery */}
                            <ImageGallery
                                images={room.gallery}
                                mainImage={room.image || roomStandard}
                                title={`Habitación ${room.number}`}
                            />

                            {/* Description */}
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
                                    Descripción
                                </h2>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    Habitación tipo {typeTranslations[room.type.toLowerCase()] || room.type}. {room.amenities}
                                </p>
                            </div>

                            {/* Room Details */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                <Card className="p-6 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                                        <Users className="h-7 w-7 text-gold" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Capacidad</p>
                                        <p className="text-xl font-semibold text-foreground">
                                            {room.capacity} {room.capacity === 1 ? "Huésped" : "Huéspedes"}
                                        </p>
                                    </div>
                                </Card>
                            </div>

                            {/* Amenities */}
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                                    Comodidades
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {room.amenities.split(",").map((item) => {
                                        const amenity = item.trim();
                                        const Icon = getAmenityIcon(amenity);
                                        return (
                                            <div
                                                key={amenity}
                                                className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
                                            >
                                                <Icon className="h-5 w-5 text-gold flex-shrink-0" />
                                                <span className="text-foreground">{amenity}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Booking Card */}
                        <div className="lg:col-span-1">
                            <Card className="p-6 sticky top-24 shadow-elevated">
                                <h3 className="text-xl font-serif font-bold text-foreground mb-4">
                                    Reservar esta Habitación
                                </h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Precio por noche</span>
                                        <span className="font-semibold text-foreground">{formatCOP(room.price_per_night)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Capacidad máxima</span>
                                        <span className="font-semibold text-foreground">{room.capacity} personas</span>
                                    </div>
                                </div>
                                <Button variant="gold" size="lg" className="w-full" asChild>
                                    <Link to={`/reservar?type=room&id=${room.id}`}>
                                        Reservar Ahora
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Cancelación gratuita hasta 48h antes
                                </p>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Other Rooms */}
            {otherRooms.length > 0 && (
                <section className="py-16 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-8">
                            Otras <span className="text-gold">Habitaciones</span>
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {otherRooms.map((otherRoom) => (
                                <Link
                                    key={otherRoom.id}
                                    to={`/habitaciones/${otherRoom.id}`}
                                    className="group block h-full"
                                >
                                    <Card className="overflow-hidden flex flex-col sm:flex-row h-full hover:shadow-lg transition-shadow">
                                        <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                                            <img
                                                src={otherRoom.image || roomStandard}
                                                alt={`Habitación ${otherRoom.number}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="p-5 flex flex-col justify-center flex-grow">
                                            <h3 className="font-serif font-semibold text-foreground group-hover:text-gold transition-colors">
                                                Habitación {otherRoom.number}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                Tipo {typeTranslations[otherRoom.type?.toLowerCase()] || otherRoom.type}
                                            </p>
                                            <p className="text-gold font-semibold mt-2">
                                                Desde {formatCOP(otherRoom.price_per_night)}/noche
                                            </p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
}


