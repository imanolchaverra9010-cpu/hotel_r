import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, UtensilsCrossed, Wine, Star, ChefHat, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCOP } from "@/lib/utils";
import { API_BASE } from "@/config/api";
import { useHotelInfo } from "@/hooks/useHotelInfo";
import restaurantMain from "@/assets/restaurant-main.jpg";

// Fallback image
const dishImage = restaurantMain;

function resolveAssetUrl(url?: string) {
  if (!url) return url;
  return url.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
}

export default function Restaurant() {
    const { hotelInfo } = useHotelInfo();
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [diningAreas, setDiningAreas] = useState<any[]>([]);
    const [restaurantGallery, setRestaurantGallery] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [openImage, setOpenImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [menuRes, areasRes, galleryRes] = await Promise.all([
                    fetch(`${API_BASE}/api/menu`, { cache: "no-store" }),
                    fetch(`${API_BASE}/api/dining-areas`, { cache: "no-store" }),
                    fetch(`${API_BASE}/api/restaurant-gallery`, { cache: "no-store" })
                ]);

                if (menuRes.ok) {
                    const data = await menuRes.json();
                    setMenuItems(data.map((x: any) => ({ ...x, image: resolveAssetUrl(x.image) })));
                }
                if (areasRes.ok) {
                    const data = await areasRes.json();
                    setDiningAreas(data.map((x: any) => ({ ...x, image: resolveAssetUrl(x.image) })));
                }
                if (galleryRes.ok) {
                    const data = await galleryRes.json();
                    const urls = (data || []).map((x: any) => resolveAssetUrl(x.image_url)).filter(Boolean);
                    setRestaurantGallery(urls);
                }
            } catch (e) {
                console.error("Error fetching restaurant data:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Flexible category matching
    const isCategory = (item: any, ...cats: string[]) => {
        const c = (item.category || "").toLowerCase();
        return cats.some(cat => c.includes(cat));
    };

    const entrantes = menuItems.filter(d => isCategory(d, "entrante", "entrada"));
    const principales = menuItems.filter(d => isCategory(d, "principal", "plato fuerte", "fuerte"));
    const postres = menuItems.filter(d => isCategory(d, "postre"));

    const heroImage = diningAreas[0]?.image || restaurantMain;

    const galleryBase = restaurantGallery.length > 0
        ? restaurantGallery
        : [
            diningAreas[0]?.image,
            diningAreas[1]?.image,
            diningAreas[2]?.image,
            dishImage,
        ].filter(Boolean) as string[];

    const safeGallery = galleryBase.length > 0 ? galleryBase : [restaurantMain, restaurantMain, restaurantMain];
    const galleryImages = Array.from({ length: 6 }, (_, i) => safeGallery[i % safeGallery.length]);

    const galleryTileClass = (idx: number) => {
        switch (idx) {
            case 0: return "sm:col-span-2 lg:col-span-3 lg:row-span-2";
            case 1: return "lg:col-span-2 lg:row-span-2";
            case 2: return "lg:col-span-1";
            case 3: return "lg:col-span-1";
            case 4: return "lg:col-span-2";
            case 5: return "lg:col-span-2";
            default: return "";
        }
    };

    return (
        <div className="min-h-screen">
            <Header />

            {/* Hero */}
            <section className="relative h-[70vh] flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroImage})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/60 via-navy-dark/40 to-navy-dark/80" />
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
                    <div className="flex items-center justify-center gap-1 mb-4">
                        <ChefHat className="h-8 w-8 text-gold" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-cream mb-4">
                        Gastronomía de <span className="text-gradient-gold">Excelencia</span>
                    </h1>
                    <p className="text-lg text-cream/80 max-w-2xl mx-auto mb-8">
                        Una experiencia culinaria que celebra los sabores del Mediterráneo
                        con un toque de innovación contemporánea.
                    </p>
                </div>
            </section>

            {/* Dining Areas */}
            {diningAreas.length > 0 && (
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                                Nuestros <span className="text-gold">Espacios</span>
                            </h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Cada rincón está diseñado para crear momentos inolvidables
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {diningAreas.map((area, index) => (
                                <Card
                                    key={area.id}
                                    className="overflow-hidden group animate-fade-in"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <div className="relative h-72 overflow-hidden">
                                        <img
                                            src={area.image || dishImage}
                                            alt={area.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 to-transparent" />
                                    </div>
                                    <div className="p-6 relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-2xl font-serif font-bold text-navy-dark">{area.name}</h3>
                                            <div className="flex items-center text-gold">
                                                <Clock className="h-4 w-4 mr-2" />
                                                <span className="text-sm font-medium">{area.schedule}</span>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mb-6">{area.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {area.features?.split(',').map((feature: string, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-sand/30 text-navy-dark text-xs font-medium rounded-full">
                                                    {feature.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Signature Dishes */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
                                Platos <span className="text-gold">Signature</span>
                            </h2>
                            <p className="text-muted-foreground mb-8">
                                Nuestra carta es un viaje sensorial donde cada plato cuenta una historia
                                de tradición e innovación.
                            </p>

                            <div className="space-y-8">
                                {/* Entrantes */}
                                {entrantes.length > 0 && (
                                    <div>
                                        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                                            <UtensilsCrossed className="h-5 w-5 text-gold" />
                                            Entrantes
                                        </h3>
                                        <div className="space-y-3">
                                            {entrantes.map((dish) => (
                                                <div key={dish.id} className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-foreground">{dish.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{dish.description}</p>
                                                    </div>
                                                    <span className="text-gold font-semibold ml-4">{formatCOP(Number(dish.price))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Principales */}
                                {principales.length > 0 && (
                                    <div>
                                        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                                            <Star className="h-5 w-5 text-gold" />
                                            Principales
                                        </h3>
                                        <div className="space-y-3">
                                            {principales.map((dish) => (
                                                <div key={dish.id} className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-foreground">{dish.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{dish.description}</p>
                                                    </div>
                                                    <span className="text-gold font-semibold ml-4">{formatCOP(Number(dish.price))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Postres */}
                                {postres.length > 0 && (
                                    <div>
                                        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                                            <Wine className="h-5 w-5 text-gold" />
                                            Postres
                                        </h3>
                                        <div className="space-y-3">
                                            {postres.map((dish) => (
                                                <div key={dish.id} className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-foreground">{dish.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{dish.description}</p>
                                                    </div>
                                                    <span className="text-gold font-semibold ml-4">{formatCOP(Number(dish.price))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {menuItems.length === 0 && !loading && (
                                    <div className="text-muted-foreground">No hay platos disponibles en este momento.</div>
                                )}
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="relative">
                                <img
                                    src={dishImage}
                                    alt="Plato signature"
                                    className="w-full rounded-2xl shadow-elevated"
                                />
                                <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-card">
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium text-foreground">
                                            Estrella Michelin
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                            Galería <span className="text-gold">del Restaurante</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Ambientes cuidadosamente diseñados y detalles gastronómicos que elevan la experiencia.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-2 gap-4 auto-rows-[12rem]">
                        {galleryImages.map((src, idx) => (
                            <button
                                type="button"
                                key={src + idx}
                                className={
                                    `relative overflow-hidden rounded-2xl shadow-card group ${galleryTileClass(idx)}`
                                }
                                onClick={() => setOpenImage(src)}
                                aria-label={`Ver imagen ${idx + 1}`}
                            >
                                <img
                                    src={src}
                                    alt={`Galería ${idx + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-navy-dark/15 to-transparent opacity-90" />
                            </button>
                        ))}
                    </div>

                    <Dialog open={!!openImage} onOpenChange={(v) => !v && setOpenImage(null)}>
                        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
                            {openImage && (
                                <div className="relative rounded-2xl overflow-hidden bg-black">
                                    <img src={openImage} alt="Vista previa" className="w-full max-h-[80vh] object-contain" />
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-navy">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-cream mb-4">
                        Reserve su <span className="text-gold">Experiencia Gastronómica</span>
                    </h2>
                    <p className="text-cream/70 max-w-2xl mx-auto mb-8">
                        Para reservas en Le Grand Restaurant o eventos privados, contáctenos.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="heroGold" size="xl" asChild>
                            <Link to="/contacto">
                                Contactar
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Button variant="hero" size="xl" asChild>
                            <a href={hotelInfo.phone ? `tel:${hotelInfo.phone.replace(/\s/g, "")}` : "#"}>{hotelInfo.phone || "Contactar"}</a>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}