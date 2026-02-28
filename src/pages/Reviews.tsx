import { FormEvent, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "@/config/api";
import { toast } from "sonner";

type Review = {
  id: string;
  guest_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at?: string;
};

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(apiUrl("/api/reviews?approved_only=true&limit=50"));
        if (!res.ok) throw new Error(await res.text());
        setReviews(await res.json());
      } catch {
        toast.error("No se pudieron cargar las resenas");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  }, [reviews]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = guestName.trim();
    const trimmedComment = comment.trim();

    if (trimmedName.length < 2) {
      toast.error("Escribe un nombre valido");
      return;
    }

    if (trimmedComment.length < 10) {
      toast.error("La resena debe tener al menos 10 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/reviews"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_name: trimmedName, rating, comment: trimmedComment }),
      });
      if (!res.ok) throw new Error(await res.text());
      setGuestName("");
      setRating(5);
      setComment("");
      toast.success("Gracias. Tu resena fue enviada y quedo pendiente de aprobacion.");
    } catch {
      toast.error("No se pudo enviar la resena");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 space-y-8">
        <section className="space-y-3">
          <h1 className="text-4xl font-serif font-bold text-foreground">Resenas de Huéspedes</h1>
          <p className="text-muted-foreground">Opiniones verificadas y moderadas de clientes.</p>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
            <Star className="h-4 w-4 text-gold fill-gold" />
            <span className="font-medium">{avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground">promedio ({reviews.length} resenas)</span>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Lo que dicen nuestros clientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && <p className="text-sm text-muted-foreground">Cargando resenas...</p>}
              {!loading && reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">Aun no hay resenas publicadas.</p>
              )}
              {reviews.map((review) => (
                <article key={review.id} className="rounded-xl border p-4 bg-card">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{review.guest_name}</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={`${review.id}-${i}`}
                          className={`h-4 w-4 ${i < review.rating ? "text-gold fill-gold" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                </article>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deja tu resena</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  placeholder="Tu nombre"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  disabled={submitting}
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Calificacion</p>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const next = i + 1;
                      return (
                        <button
                          key={next}
                          type="button"
                          onClick={() => setRating(next)}
                          className="p-1"
                          aria-label={`Calificar con ${next} estrellas`}
                        >
                          <Star className={`h-5 w-5 ${next <= rating ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Textarea
                  placeholder="Comparte tu experiencia"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  disabled={submitting}
                />
                <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
                  {submitting ? "Enviando..." : "Enviar resena"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
