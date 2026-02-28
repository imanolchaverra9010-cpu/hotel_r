import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Bed, Building, Award, UtensilsCrossed, Sparkles, Clock, ChevronDown, CheckCircle2, Users, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoomCard } from "@/components/RoomCard";
import { ImageCarousel } from "@/components/ImageCarousel";
import { rooms as staticRooms, venues as staticVenues, Venue, Room } from "@/data/hotelData";
import { diningAreas, signatureDishes } from "@/data/restaurantData";
import heroImage from "@/assets/hero-hotel.jpg";
import roomDeluxe from "@/assets/room-deluxe.jpg";
import roomSuite from "@/assets/room-suite.jpg";
import salonGrand from "@/assets/salon-grand.jpg";
import roomStandard from "@/assets/room-standard.jpg";
import ctaBg from "@/assets/salon-grand.jpg";
import { formatCOP } from "@/lib/utils";
import { API_BASE } from "@/config/api";
import { VenueLayoutIcon } from "@/components/VenueLayoutIcon";

interface VenueCapacityArrangement {
  id: string;
  venue_id: string;
  name: string;
  capacity: number;
  layout_type: string | null;
  sort_order: number;
}

function resolveAssetUrl(url?: string) {
  if (!url) return url;
  return url.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
}

const roomTypeTranslations: Record<string, string> = {
  standard: "Estándar",
  deluxe: "Lujo",
  suite: "Suite",
  presidential: "Presidencial",
};

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

const features = [
  {
    icon: Bed,
    title: "Habitaciones de Lujo",
    description: "Espacios diseñados para el máximo confort con vistas panorámicas",
    link: "/habitaciones",
  },
  {
    icon: Building,
    title: "Salones Exclusivos",
    description: "Salones perfectos para bodas, conferencias y celebraciones",
    link: "/salones",
  },
  {
    icon: UtensilsCrossed,
    title: "Gastronomía Local",
    description: "Platos locales y técnicas vanguardistas",
    link: "/restaurante",
  },
  {
    icon: Award,
    title: "Servicio 5 Estrellas",
    description: "Atención personalizada las 24 horas del día",
    link: "/contacto",
  },
];

const stats = [
  { value: "5", label: "Estrellas" },
  { value: "70+", label: "Habitaciones" },
  { value: "40", label: "Años de Excelencia" },
  { value: "98%", label: "Satisfacción" },
];

interface DiningAreaApi {
  id: string;
  name: string;
  description?: string;
  image?: string;
  schedule?: string;
  features?: string[];
}

interface MenuItemApi {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
}

interface WebReviewApi {
  id: string;
  guest_name: string;
  rating: number;
  comment: string;
}

export default function Index() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [apiRooms, setApiRooms] = useState<Room[]>([]);
  const [apiDiningAreas, setApiDiningAreas] = useState<DiningAreaApi[]>([]);
  const [apiMenuItems, setApiMenuItems] = useState<MenuItemApi[]>([]);
  const [apiReviews, setApiReviews] = useState<WebReviewApi[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [venueArrangements, setVenueArrangements] = useState<Record<string, VenueCapacityArrangement[]>>({});
  const roomsCarouselRef = useRef<HTMLDivElement | null>(null);

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
            features: v.features ? v.features.split(",").map((s: string) => s.trim()) : [],
            gallery: Array.isArray(v.gallery)
              ? v.gallery
              : typeof v.gallery === "string"
                ? v.gallery.split(",").map((s: string) => s.trim()).filter(Boolean)
                : [],
            image: resolveAssetUrl(v.image),
            pricePerHour: v.price_per_hour,
          }));
          setVenues(processed);
        }
      } catch (error) {
        console.error("Error fetching venues for home:", error);
      } finally {
        setLoadingVenues(false);
      }
    };
    fetchVenues();
  }, []);

  useEffect(() => {
    if (venues.length === 0) return;
    const fetchAll = async () => {
      const next: Record<string, VenueCapacityArrangement[]> = {};
      await Promise.all(
        venues.map(async (v) => {
          try {
            const res = await fetch(`${API_BASE}/api/venues/${v.id}/capacity-arrangements`);
            if (res.ok) {
              const data = await res.json();
              next[v.id] = (data || []).map((a: any) => ({
                id: a.id,
                venue_id: a.venue_id,
                name: a.name,
                capacity: a.capacity,
                layout_type: a.layout_type,
                sort_order: a.sort_order ?? 0,
              }));
            } else {
              next[v.id] = [];
            }
          } catch {
            next[v.id] = [];
          }
        })
      );
      setVenueArrangements(next);
    };
    fetchAll();
  }, [venues]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/rooms?available_only=true&page=1&size=4`);
        if (res.ok) {
          const ct = (res.headers.get("content-type") || "").toLowerCase();
          if (!ct.includes("application/json")) {
            const text = await res.text();
            throw new Error(`Respuesta no-JSON (${ct || "sin content-type"}): ${text.slice(0, 200)}`);
          }
          const data = await res.json();
          setApiRooms((data || []).map(normalizeRoom));
        }
      } catch (e) {
        // ignore
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hero-carousel`);
        if (res.ok) {
          const ct = (res.headers.get("content-type") || "").toLowerCase();
          if (!ct.includes("application/json")) {
            const text = await res.text();
            throw new Error(`Respuesta no-JSON (${ct || "sin content-type"}): ${text.slice(0, 200)}`);
          }
          const data = await res.json();
          const urls = (data || [])
            .map((x: any) => x.image_url)
            .filter(Boolean)
            .map((u: string) => (u.startsWith("/uploads/") ? `${API_BASE}${u}` : u));
          setHeroImages(urls);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchHero();
  }, []);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const [areasRes, menuRes] = await Promise.all([
          fetch(`${API_BASE}/api/dining-areas`, { cache: "no-store" }),
          fetch(`${API_BASE}/api/menu`, { cache: "no-store" }),
        ]);
        if (areasRes.ok) {
          const data = await areasRes.json();
          setApiDiningAreas((data || []).map((x: any) => ({
            ...x,
            image: resolveAssetUrl(x.image),
          })));
        }
        if (menuRes.ok) {
          const data = await menuRes.json();
          setApiMenuItems((data || []).map((x: any) => ({
            ...x,
            image: resolveAssetUrl(x.image),
          })));
        }
      } catch (e) {
        console.error("Error fetching restaurant for home:", e);
      }
    };
    fetchRestaurant();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/reviews?approved_only=true&limit=6`);
        const data = res.ok ? await res.json() : [];
        setApiReviews(Array.isArray(data) ? data : []);
      } catch {
        setApiReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [API_BASE]);

  const featuredVenue = venues.length > 0 ? venues[0] : staticVenues[0];
  const displayDiningArea = apiDiningAreas.length > 0 ? apiDiningAreas[0] : diningAreas[0];

  const isCategory = (item: { category?: string }, ...cats: string[]) => {
    const c = (item.category || "").toLowerCase();
    return cats.some((cat) => c.includes(cat));
  };
  const fromApi = apiMenuItems.length > 0;
  const entrantesIndex = fromApi
    ? apiMenuItems.filter((d) => isCategory(d, "entrante", "entrada")).slice(0, 2)
    : signatureDishes.filter((d) => d.category === "entrante").slice(0, 2);
  const principalesIndex = fromApi
    ? apiMenuItems.filter((d) => isCategory(d, "principal", "plato fuerte", "fuerte")).slice(0, 2)
    : signatureDishes.filter((d) => d.category === "principal").slice(0, 2);
  const postresIndex = fromApi
    ? apiMenuItems.filter((d) => isCategory(d, "postre")).slice(0, 2)
    : signatureDishes.filter((d) => d.category === "postre").slice(0, 2);
  const menuSections = [
    { title: "Entrantes", items: entrantesIndex },
    { title: "Principales", items: principalesIndex },
    { title: "Postres", items: postresIndex },
  ].filter((s) => s.items.length > 0);
  const displayRooms = (apiRooms.length ? apiRooms : staticRooms).slice(0, 4);

  useEffect(() => {
    const el = roomsCarouselRef.current;
    if (!el) return;
    if (displayRooms.length <= 1) return;

    const tick = () => {
      const amount = Math.max(320, Math.floor(el.clientWidth * 0.95));
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: amount, behavior: "smooth" });
      }
    };

    const t = window.setInterval(tick, 7000);
    return () => window.clearInterval(t);
  }, [displayRooms.length]);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section - Modern Fullscreen */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageCarousel
            images={heroImages.length ? heroImages : [heroImage, roomDeluxe, roomSuite, salonGrand]}
            className="h-full"
            imageClassName="scale-105"
            rounded={false}
            autoplayMs={6000}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/40 via-navy-dark/20 to-navy-dark/50" />
        </div>

        {/* Animated Particles Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gold/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 backdrop-blur-sm mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm text-gold font-medium">Hotel de Lujo 5 Estrellas</span>
          </div>

          <div className="flex items-center justify-center gap-1 mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-gold text-gold" />
            ))}
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-cream mb-6 leading-tight animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            Donde el <span className="text-gradient-gold">Lujo</span>
            <br />se encuentra con la <span className="text-gradient-gold">Elegancia</span>
          </h1>

          <p
            className="text-lg md:text-xl text-cream/80 mb-12 max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            Bienvenido a Hotel Los Robles, donde cada detalle está pensado para ofrecerte
            una experiencia incomparable en el corazón de la ciudad.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
            style={{ animationDelay: "400ms" }}
          >
            <Button variant="heroGold" size="xl" asChild>
              <Link to="/reservar">
                Reservar Estancia
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero" size="xl" asChild>
              <Link to="/habitaciones">Explorar Habitaciones</Link>
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-cream/60" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-4xl md:text-5xl font-serif font-bold text-gold mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Modern Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Una Experiencia <span className="text-gold">Incomparable</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre todo lo que Hotel Los Robles tiene para ofrecerte
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Link
                key={feature.title}
                to={feature.link}
                className="group"
              >
                <Card
                  className="relative p-8 h-full overflow-hidden transition-all duration-500 hover:shadow-elevated hover:-translate-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150" />

                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <feature.icon className="h-8 w-8 text-navy-dark" />
                    </div>
                    <h3 className="text-xl font-serif font-semibold text-foreground mb-3 group-hover:text-gold transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                    <div className="flex items-center gap-2 mt-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Explorar</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Section - Modern Layout */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-gold text-sm font-medium uppercase tracking-wider mb-2">Alojamiento</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Nuestras <span className="text-gold">Habitaciones</span>
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/habitaciones">
                Ver Todas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="relative">
            <div
              ref={roomsCarouselRef}
              className="flex gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {displayRooms.map((room, index) => (
                <div
                  key={room.id}
                  className="snap-start shrink-0 w-full animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="grid lg:grid-cols-12 gap-0 rounded-3xl overflow-hidden shadow-elevated bg-card group">
                    {/* Image Side */}
                    <div className="lg:col-span-7 relative h-[320px] sm:h-[380px] lg:h-[520px] overflow-hidden">
                      <img
                      loading="lazy"
                      decoding="async"
                      src={room.image || room.gallery?.[0] || roomStandard}
                        alt={`Habitación ${room.number}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/60 to-transparent" />
                      <div className="absolute bottom-8 left-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/90 text-navy-dark font-bold text-sm mb-4">
                          <Sparkles className="h-4 w-4" />
                          Destacado
                        </div>
                        <h3 className="text-4xl font-serif font-bold text-cream underline decoration-gold/50 underline-offset-8">
                          Habitación {room.number}
                        </h3>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-center bg-card">
                      <p className="text-gold font-serif italic text-xl mb-6">
                        Tipo: {roomTypeTranslations[room.type?.toLowerCase?.() || ""] || room.type} • Capacidad: {room.capacity}
                      </p>
                      <h4 className="text-2xl font-bold text-foreground mb-4">Una Estancia que Mereces</h4>
                      <p className="text-muted-foreground leading-relaxed mb-8">
                        {room.amenities}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-10">
                        {(room.amenities || "")
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean)
                          .slice(0, 4)
                          .map((feature) => (
                            <div key={feature} className="flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground/80">{feature}</span>
                            </div>
                          ))}
                      </div>

                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <p className="text-sm text-muted-foreground">Desde</p>
                          <p className="text-3xl font-bold text-gold">{formatCOP(room.price_per_night)}<span className="text-base font-normal text-muted-foreground">/noche</span></p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <Button variant="gold" size="lg" className="px-8 shadow-gold/20 shadow-lg" asChild>
                          <Link to={`/habitaciones/${room.id}`}>
                            Ver Detalles de la Habitación
                          </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                          <Link to={`/reservar?type=room&id=${room.id}`}>
                            Reservar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Preview - datos desde API con fallback a estáticos */}
      <section className="py-24 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-gold text-sm font-medium uppercase tracking-wider mb-2">Gastronomía</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                Cocina de <span className="text-gold">Autor</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {displayDiningArea?.description
                  ? displayDiningArea.description
                  : "Nuestro restaurante Le Grand ofrece una experiencia gastronómica única donde la tradición mediterránea se fusiona con técnicas contemporáneas. Dirigido por el chef estrella Michelin Carlos Mendoza."}
              </p>

              <div className="space-y-6 mb-8">
                {menuSections.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">{section.title}</h4>
                    <div className="space-y-2">
                      {section.items.map((dish) => (
                        <div
                          key={dish.id}
                          className="flex justify-between items-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <p className="font-medium text-foreground">{dish.name}</p>
                            <p className="text-sm text-muted-foreground">{dish.description ?? ""}</p>
                          </div>
                          <span className="text-gold font-semibold ml-4">{formatCOP(dish.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="gold" size="lg" asChild>
                <Link to="/restaurante">
                  Ver Menú Completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-elevated">
                <img
                      loading="lazy"
                      decoding="async"
                      src={displayDiningArea?.image ?? diningAreas[0].image}
                  alt={displayDiningArea?.name ?? "Restaurante"}
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-cream font-serif text-xl">{displayDiningArea?.name ?? diningAreas[0].name}</p>
                  <div className="flex items-center gap-2 text-cream/80 text-sm mt-1">
                    <Clock className="h-4 w-4" />
                    {displayDiningArea?.schedule ?? diningAreas[0].schedule}
                  </div>
                </div>
              </div>

              {/* Floating Card */}
              <Card className="absolute -bottom-6 -left-6 p-4 shadow-elevated animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">Estrella Michelin</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Venue Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-gold text-sm font-medium uppercase tracking-wider mb-2">Eventos Exclusivos</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Nuestros <span className="text-gold">Salones</span>
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/salones">
                Ver Todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredVenue && (
            <div className="grid lg:grid-cols-12 gap-0 rounded-3xl overflow-hidden shadow-elevated bg-card group">
              {/* Image Side */}
              <div className="lg:col-span-7 relative h-[400px] lg:h-[600px] overflow-hidden">
                <img
                      loading="lazy"
                      decoding="async"
                      src={featuredVenue.image}
                  alt={featuredVenue.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/60 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/90 text-navy-dark font-bold text-sm mb-4">
                    <Sparkles className="h-4 w-4" />
                    Destacado
                  </div>
                  <h3 className="text-4xl font-serif font-bold text-cream underline decoration-gold/50 underline-offset-8">
                    {featuredVenue.name}
                  </h3>
                </div>
              </div>

              {/* Content Side */}
              <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-center bg-card">
                <p className="text-gold font-serif italic text-xl mb-2">
                  Capacidad: {featuredVenue.capacity} paxs
                </p>
                {(venueArrangements[featuredVenue.id]?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {venueArrangements[featuredVenue.id].map((arr) => (
                      <div
                        key={arr.id}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border/50"
                      >
                        <span className="text-gold flex items-center justify-center w-8 h-8 shrink-0">
                          <VenueLayoutIcon layoutType={arr.layout_type} size={28} />
                        </span>
                        <span className="text-sm font-medium text-foreground">{arr.name}</span>
                        <span className="text-gold font-semibold text-sm">{arr.capacity} pers.</span>
                      </div>
                    ))}
                  </div>
                )}
                <h4 className="text-2xl font-bold text-foreground mb-4">La Elegancia que tu Evento Merece</h4>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {featuredVenue.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  {featuredVenue.features.slice(0, 4).map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button variant="gold" size="lg" className="px-8 shadow-gold/20 shadow-lg" asChild>
                    <Link to={`/salones/${featuredVenue.id}`}>
                      Ver Detalles del Salón
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/reservar?type=venue">
                      Cotizar Evento
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Modern Design */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-gold text-sm font-medium uppercase tracking-wider mb-2">Confianza</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Opiniones de <span className="text-gold">Huespedes</span>
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/resenas">Ver Todas</Link>
            </Button>
          </div>
          {reviewsLoading ? (
            <Card className="p-6 text-muted-foreground">Cargando reseñas...</Card>
          ) : apiReviews.length === 0 ? (
            <Card className="p-6 text-muted-foreground">
              Aún no hay reseñas publicadas. Las reseñas que apruebes en el panel de administración se mostrarán aquí.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {apiReviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-foreground">{review.guest_name}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={`${review.id}-${i}`}
                          className={`h-4 w-4 ${i < review.rating ? "text-gold fill-gold" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{review.comment}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async" src={ctaBg} alt="Reserva" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/80 via-navy-dark/60 to-navy-dark/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 mb-8">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm text-gold font-medium">Reserva Exclusiva</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-serif font-bold text-cream mb-6">
            ¿Listo para una Experiencia
            <br />
            <span className="text-gold">Inolvidable</span>?
          </h2>
          <p className="text-cream/70 max-w-2xl mx-auto mb-10 text-lg">
            Reserva ahora y descubre por qué Hotel Los Robles es sinónimo de excelencia
            en hospitalidad desde hace más de 15 años.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="heroGold" size="xl" asChild>
              <Link to="/reservar">
                Hacer una Reserva
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero" size="xl" asChild>
              <Link to="/contacto">Contactar</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


