import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { rooms as staticRooms, Room } from "@/data/hotelData";
import roomSuite from "@/assets/room-suite.jpg";
import { Link } from "react-router-dom";
import { Wifi, Phone, Tv, Coffee, AlarmClock, Plus } from "lucide-react";
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

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/rooms?page=${page}&size=3&available_only=true`);
        if (res.ok) {
          const data = await res.json();
          setRooms((data || []).map(normalizeRoom));
          setHasMore(data.length === 3); // Simple check for next page
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setRooms(staticRooms);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();

    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const displayRooms = rooms.length > 0 ? rooms : (page === 1 ? staticRooms : []);

  const displayRoomTitle = (room: Room) => {
    const type = (room.type || "").toString().replace(/_/g, " ").toUpperCase();
    return type ? `${type} • ${room.number}` : `HABITACIÓN ${room.number}`;
  };

  const displayRoomDescription = (room: Room) => {
    const txt = (room.amenities || "").toString().trim();
    if (!txt) return "";
    return txt;
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-28 md:pt-32 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={roomSuite} alt="Habitaciones" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/75 via-navy-dark/55 to-background" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-gold rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-gold rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur border border-white/15 mb-6">
              <span className="text-sm text-cream font-medium">Descanso • Confort • Elegancia</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-bold text-cream mb-4">
              Nuestras <span className="text-gradient-gold">Habitaciones</span>
            </h1>
            <p className="text-cream/80 max-w-2xl leading-relaxed">
              Cada habitación está diseñada para ofrecerte una experiencia de descanso
              y lujo incomparable.
            </p>
          </div>
        </div>
      </section>

      {/* Rooms Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-10">Cargando habitaciones...</div>
          ) : (
            <>
              <div className="space-y-7">
                {displayRooms.map((room) => (
                  <Card key={room.id} className="rounded-2xl border border-navy-dark/10 shadow-card hover:shadow-elevated transition-all duration-300 max-w-5xl mx-auto lg:h-80">
                    <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] h-full">
                      <div className="relative overflow-hidden rounded-t-2xl lg:rounded-t-none lg:rounded-l-2xl">
                        <img
                          src={room.image || roomSuite}
                          alt={`Habitación ${room.number}`}
                          className="w-full h-56 lg:h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/20 via-transparent to-transparent" />
                      </div>

                      <div className="p-6 lg:p-8 flex flex-col justify-between h-full">
                        <div>
                          <h3 className="text-lg md:text-xl font-serif font-bold text-navy-dark tracking-wide">
                            {displayRoomTitle(room)}
                          </h3>

                          <p className="text-muted-foreground mt-3 leading-relaxed text-sm line-clamp-3 min-h-[3.75rem]">
                            {displayRoomDescription(room)}
                          </p>

                          <div className="mt-5 min-h-[3.5rem]">
                            <p className="text-xs font-semibold text-navy-dark mb-3">Servicios de la habitación</p>
                            <div className="flex flex-wrap items-center gap-4 text-navy-dark/80">
                              <Wifi className="h-4 w-4" />
                              <Phone className="h-4 w-4" />
                              <Tv className="h-4 w-4" />
                              <Coffee className="h-4 w-4" />
                              <AlarmClock className="h-4 w-4" />
                              <Plus className="h-4 w-4" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end">
                          <Button variant="gold" size="default" asChild className="px-8">
                            <Link to={`/habitaciones/${room.id}`}>Ver Detalles</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {displayRooms.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  No hay más habitaciones disponibles.
                </div>
              )}

              {/* Pagination UI */}
              <div className="flex justify-center items-center gap-4 mt-16 animate-fade-in">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Anterior
                </Button>
                <div className="w-24 text-center">
                  <span className="text-sm font-medium text-muted-foreground">Página</span>
                  <p className="text-lg font-bold text-gold">{page}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore || loading}
                >
                  Siguiente
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Amenities */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-foreground text-center mb-12">
            Servicios <span className="text-gold">Incluidos</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              "WiFi de Alta Velocidad",
              "Desayuno Buffet",
              "Gimnasio 24h",
              "Piscina Climatizada",
              "Servicio a Habitación",
              "Spa y Wellness",
              "Parking Privado",
              "Conserjería 24h",
            ].map((amenity) => (
              <div
                key={amenity}
                className="text-center p-4 rounded-lg bg-card shadow-soft"
              >
                <p className="text-sm font-medium text-foreground">{amenity}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
