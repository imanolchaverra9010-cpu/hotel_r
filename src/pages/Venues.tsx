import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VenueCard } from "@/components/VenueCard";
import { venues as staticVenues, Venue } from "@/data/hotelData";
import salonGrand from "@/assets/salon-grand.jpg";
import { API_BASE } from "@/config/api";

function resolveAssetUrl(url?: string) {
  if (!url) return url;
  return url.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
}

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/venues`);
        if (res.ok) {
          const ct = (res.headers.get("content-type") || "").toLowerCase();
          if (!ct.includes("application/json")) {
            const text = await res.text();
            throw new Error(`Respuesta no-JSON (${ct || "sin content-type"}): ${text.slice(0, 200)}`);
          }
          const data = await res.json();
          const processed = data.map((v: any) => ({
            ...v,
            image: resolveAssetUrl(v.image),
            features: v.features ? v.features.split(",").map((s: string) => s.trim()) : [],
            gallery: v.gallery ? v.gallery.split(",").map((s: string) => s.trim()).map(resolveAssetUrl) : [],
            pricePerHour: v.price_per_hour,
          }));
          setVenues(processed);
        }
      } catch (error) {
        console.error("Error fetching venues:", error);
        setVenues(staticVenues);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  const displayVenues = venues.length > 0 ? venues : (loading ? [] : staticVenues);
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-28 md:pt-32 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={salonGrand} alt="Salones" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/75 via-navy-dark/55 to-background" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-gold rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-gold rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur border border-white/15 mb-6">
              <span className="text-sm text-cream font-medium">Eventos • Bodas • Corporativo</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-bold text-cream mb-4">
              Salones para <span className="text-gradient-gold">Eventos</span>
            </h1>
            <p className="text-cream/80 max-w-2xl leading-relaxed">
              Espacios versátiles, elegantes y totalmente equipados para hacer de tu evento
              una experiencia inolvidable.
            </p>
          </div>
        </div>
      </section>

      {/* Venues Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-10">Cargando salones...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {displayVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
          {!loading && displayVenues.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No hay salones disponibles en este momento.
            </div>
          )}
        </div>
      </section>

      {/* Event Types */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-foreground text-center mb-12">
            Tipos de <span className="text-gold">Eventos</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              "Bodas",
              "Conferencias",
              "Galas Corporativas",
              "Reuniones de Negocios",
              "Cenas Privadas",
              "Lanzamientos de Producto",
              "Seminarios",
              "Celebraciones Familiares",
            ].map((eventType) => (
              <div
                key={eventType}
                className="text-center p-4 rounded-lg bg-card shadow-soft"
              >
                <p className="text-sm font-medium text-foreground">{eventType}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
