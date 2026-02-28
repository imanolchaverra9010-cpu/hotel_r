import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { API_BASE } from "@/config/api";

function resolveAssetUrl(url?: string) {
  if (!url) return url;
  return url.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
}

export default function Gallery() {
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/gallery`);
        if (res.ok) setGallery((await res.json()) || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const images = useMemo(() => {
    const all = (gallery || [])
      .map((x: any) => resolveAssetUrl(x?.image_url))
      .filter(Boolean) as string[];
    return all;
  }, [gallery]);

  const current = openIndex != null ? images[openIndex] : null;

  const prev = () => {
    if (openIndex == null || images.length === 0) return;
    setOpenIndex((openIndex - 1 + images.length) % images.length);
  };

  const next = () => {
    if (openIndex == null || images.length === 0) return;
    setOpenIndex((openIndex + 1) % images.length);
  };

  const tileClass = (idx: number) => {
    // Collage-style layout (repeats pattern every 10)
    const k = idx % 10;
    if (k === 0) return "sm:col-span-2 lg:col-span-3 lg:row-span-2";
    if (k === 1) return "lg:col-span-2 lg:row-span-2";
    if (k === 2) return "lg:col-span-1";
    if (k === 3) return "lg:col-span-1";
    if (k === 4) return "lg:col-span-2";
    if (k === 5) return "lg:col-span-2";
    return "lg:col-span-2";
  };

  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-28 md:pt-32 pb-16 md:pb-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 mb-6">
            <Images className="h-4 w-4 text-gold" />
            <span className="text-sm text-gold font-medium">Galería</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Momentos en <span className="text-gold">Hotel Los Robles</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Una selección de imágenes de nuestras habitaciones, salones y restaurante.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading && images.length === 0 ? (
            <div className="text-center py-10">Cargando galería...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No hay imágenes para mostrar.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-2 gap-4 auto-rows-[12rem]">
              {images.map((src, idx) => (
                <button
                  type="button"
                  key={src + idx}
                  className={`relative overflow-hidden rounded-2xl shadow-card group ${tileClass(idx)}`}
                  onClick={() => setOpenIndex(idx)}
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
          )}

          <Dialog open={openIndex != null} onOpenChange={(v) => !v && setOpenIndex(null)}>
            <DialogContent className="max-w-6xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
              {current && (
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <img src={current} alt="Vista previa" className="w-full max-h-[80vh] object-contain" />

                  {images.length > 1 && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 border-white/20 text-white hover:bg-black/60"
                        onClick={prev}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 border-white/20 text-white hover:bg-black/60"
                        onClick={next}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <Footer />
    </div>
  );
}

