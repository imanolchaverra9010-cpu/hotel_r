import { useEffect, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
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

type ReviewModerationProps = { skipHeader?: boolean };

export default function ReviewModeration({ skipHeader = false }: ReviewModerationProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(apiUrl("/api/admin/reviews"));
      if (!res.ok) throw new Error(await res.text());
      setReviews(await res.json());
    } catch {
      toast.error("No se pudieron cargar las resenas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (reviewId: string, approve: boolean) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/reviews/${reviewId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: approve }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
      toast.success(approve ? "Resena aprobada" : "Resena ocultada");
    } catch {
      toast.error("No se pudo actualizar la resena");
    }
  };

  const remove = async (reviewId: string) => {
    if (!window.confirm("Eliminar esta resena?")) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/reviews/${reviewId}`), { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Resena eliminada");
    } catch {
      toast.error("No se pudo eliminar la resena");
    }
  };

  const content = (
    <main className={skipHeader ? "p-0" : "container mx-auto px-4 pt-28 pb-16"}>
        <Card>
          <CardHeader>
            <CardTitle>Moderacion de Resenas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
            {!loading && reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay resenas registradas.</p>
            )}
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border p-4 bg-card">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="font-semibold">{review.guest_name}</p>
                    <p className="text-sm text-muted-foreground">Calificacion: {review.rating}/5</p>
                    <p className="text-sm text-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">
                      Estado: {review.is_approved ? "Aprobada" : "Pendiente"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => moderate(review.id, true)}>
                      <Check className="h-4 w-4 mr-1" /> Aprobar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => moderate(review.id, false)}>
                      <X className="h-4 w-4 mr-1" /> Ocultar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(review.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </main>
  );

  if (skipHeader) return content;
  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      {content}
    </div>
  );
}
