import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Users, Check, Star, Mic, Video, Wifi, Coffee, Music, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageGallery } from "@/components/ImageGallery";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ParallaxSection } from "@/components/ParallaxSection";
import { VenueLayoutIcon } from "@/components/VenueLayoutIcon";
import { venues as staticVenues, Venue } from "@/data/hotelData";
import { formatCOP } from "@/lib/utils";
import { API_BASE } from "@/config/api";

export interface VenueCapacityArrangement {
  id: string;
  venue_id: string;
  name: string;
  capacity: number;
  layout_type: string | null;
  layout_schema: Record<string, unknown> | null;
  sort_order: number;
}

const featureIcons: Record<string, React.ElementType> = {
  "sonido": Mic,
  "video": Video,
  "WiFi": Wifi,
  "café": Coffee,
  "música": Music,
  "catering": Sparkles,
};

function getFeatureIcon(feature: string) {
  for (const [key, Icon] of Object.entries(featureIcons)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) {
      return Icon;
    }
  }
  return Check;
}

function resolveAssetUrl(url?: string) {
  if (!url) return url;
  return url.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
}

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [arrangements, setArrangements] = useState<VenueCapacityArrangement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenue = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/venues/${id}`);
        if (res.ok) {
          const data = await res.json();
          const processed: Venue = {
            ...data,
            features: data.features ? data.features.split(",").map((s: string) => s.trim()) : [],
            gallery: data.gallery ? data.gallery.split(",").map((s: string) => s.trim()).map(resolveAssetUrl) : [],
            image: resolveAssetUrl(data.image),
            pricePerHour: data.price_per_hour
          };
          setVenue(processed);
        } else {
          const staticV = staticVenues.find((v) => v.id === id);
          setVenue(staticV || null);
        }
      } catch (error) {
        console.error("Error fetching venue details:", error);
        const staticV = staticVenues.find((v) => v.id === id);
        setVenue(staticV || null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVenue();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchArrangements = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/venues/${id}/capacity-arrangements`);
        if (res.ok) {
          const data = await res.json();
          setArrangements(data || []);
        }
      } catch {
        setArrangements([]);
      }
    };
    fetchArrangements();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-32 pb-20 container mx-auto px-4 text-center">
          <p className="text-xl text-muted-foreground animate-pulse">Cargando detalles del salón...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-32 pb-20 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Salón no encontrado</h1>
          <Button asChild variant="gold">
            <Link to="/salones">Volver al catálogo</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const otherVenues = staticVenues.filter((v) => v.id !== id).slice(0, 2);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero with Parallax */}
      <ParallaxSection
        backgroundImage={venue.image}
        speed={0.4}
        overlayOpacity={0.5}
        className="h-[50vh] md:h-[65vh] flex items-end"
      >
        <div className="container mx-auto px-4 pb-8 md:pb-14">
          <Link
            to="/salones"
            className="inline-flex items-center gap-2 text-cream/90 hover:text-gold text-sm font-medium transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Salones
          </Link>

          <div className="rounded-2xl border border-gold/20 bg-navy-dark/85 backdrop-blur-lg shadow-xl p-6 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-1" aria-label="5 estrellas">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-gold text-gold drop-shadow-sm" />
                  ))}
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-cream tracking-tight leading-tight">
                  {venue.name}
                </h1>
              </div>
              <div className="flex flex-col items-start sm:items-end sm:min-w-[180px]">
                <span className="text-cream/60 text-xs uppercase tracking-wider font-medium mb-0.5">Desde</span>
                <p className="text-2xl md:text-3xl font-bold text-gold font-sans tabular-nums">
                  {formatCOP(venue.pricePerHour)}
                </p>
                <span className="text-cream/60 text-sm font-medium">/ hora</span>
              </div>
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Image Gallery */}
              <ScrollReveal animation="fade-up">
                <ImageGallery
                  images={venue.gallery}
                  mainImage={venue.image}
                  title={venue.name}
                />
              </ScrollReveal>

              {/* Description */}
              <ScrollReveal animation="fade-up" delay={100}>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
                  Descripción
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {venue.description}
                </p>
              </ScrollReveal>

              {/* Venue Details */}
              <ScrollReveal animation="fade-up" delay={200}>
                <div className="grid sm:grid-cols-1 gap-6">
                  <Card className="p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                      <Users className="h-7 w-7 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacidad Maxima</p>
                      <p className="text-xl font-semibold text-foreground">
                        Hasta {venue.capacity} personas
                      </p>
                    </div>
                  </Card>
                </div>
              </ScrollReveal>

              {/* Capacidad por acomodación y distanciamiento social */}
              <ScrollReveal animation="fade-up" delay={250}>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
                  Capacidad del salón de acuerdo a acomodación de sillas y al distanciamiento social
                </h2>
                {arrangements.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {arrangements.map((arr) => (
                      <Card key={arr.id} className="p-4 flex flex-col items-center text-center">
                        <div className="w-16 h-16 flex items-center justify-center mb-3 text-gold">
                          <VenueLayoutIcon layoutType={arr.layout_type} size={56} />
                        </div>
                        <p className="font-semibold text-foreground text-sm mb-1">{arr.name}</p>
                        <p className="text-gold font-bold text-lg">{arr.capacity} Personas</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Consulta con nosotros las opciones de acomodación (auditorio, mesa de trabajo, mesa de junta, forma de U) y capacidades según distanciamiento.
                  </p>
                )}
              </ScrollReveal>

              {/* Features */}
              <ScrollReveal animation="fade-up" delay={300}>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  Servicios Incluidos
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {venue.features.map((feature, index) => {
                    const Icon = getFeatureIcon(feature);
                    return (
                      <ScrollReveal
                        key={feature}
                        animation="slide-right"
                        delay={index * 50}
                      >
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <Icon className="h-5 w-5 text-gold flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </ScrollReveal>

              {/* Event Types */}
              <ScrollReveal animation="fade-up" delay={400}>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  Ideal Para
                </h2>
                <div className="flex flex-wrap gap-3">
                  {["Bodas", "Conferencias", "Galas", "Reuniones Corporativas", "Celebraciones"].map((event, index) => (
                    <ScrollReveal key={event} animation="scale" delay={index * 50}>
                      <span className="px-4 py-2 rounded-full bg-gold/10 text-gold border border-gold/20 text-sm">
                        {event}
                      </span>
                    </ScrollReveal>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24 shadow-elevated">
                <h3 className="text-xl font-serif font-bold text-foreground mb-4">
                  Reservar este Salón
                </h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio por hora</span>
                    <span className="font-semibold text-foreground">{formatCOP(venue.pricePerHour)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capacidad máxima</span>
                    <span className="font-semibold text-foreground">{venue.capacity} personas</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mínimo reserva</span>
                    <span className="font-semibold text-foreground">4 horas</span>
                  </div>
                </div>
                <Button variant="gold" size="lg" className="w-full" asChild>
                  <Link to={`/reservar?type=venue&id=${venue.id}`}>
                    Solicitar Presupuesto
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Incluye coordinador de eventos
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Other Venues */}
      {otherVenues.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <ScrollReveal animation="fade-up">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-8">
                Otros <span className="text-gold">Salones</span>
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-6">
              {otherVenues.map((otherVenue, index) => (
                <ScrollReveal key={otherVenue.id} animation="fade-up" delay={index * 100}>
                  <Link to={`/salones/${otherVenue.id}`} className="group">
                    <Card className="overflow-hidden flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                        <img
                          src={otherVenue.image}
                          alt={otherVenue.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-5 flex flex-col justify-center">
                        <h3 className="font-serif font-semibold text-foreground group-hover:text-gold transition-colors">
                          {otherVenue.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {otherVenue.description}
                        </p>
                        <p className="text-gold font-semibold mt-2">
                          Desde {formatCOP(otherVenue.pricePerHour)}/hora
                        </p>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
