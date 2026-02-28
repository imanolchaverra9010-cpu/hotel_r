import { Link } from "react-router-dom";
import { Users, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Venue } from "@/data/hotelData";
import { formatCOP } from "@/lib/utils";

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const featureChips = Array.isArray(venue.features) ? venue.features.slice(0, 3) : [];
  const remainingFeatures = Math.max(0, (Array.isArray(venue.features) ? venue.features.length : 0) - featureChips.length);

  return (
    <Card className="overflow-hidden group rounded-2xl shadow-card hover:shadow-elevated transition-all duration-300 border border-navy-dark/10 hover:border-gold/40 hover:-translate-y-1">
      <div className="relative h-80 overflow-hidden bg-muted">
        <img
          src={venue.image || (Array.isArray(venue.gallery) && venue.gallery[0]) || "/placeholder.svg"}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/35 to-transparent" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose/15 rounded-full blur-3xl" />
        </div>

        <div className="absolute top-4 left-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur border border-white/15 text-cream">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-xs font-medium tracking-wide">Salón Premium</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-cream/80 text-xs">Desde</p>
              <p className="text-gold font-semibold text-lg leading-tight">
                {formatCOP(venue.pricePerHour)}
                <span className="text-cream/70 text-sm font-normal"> / hora</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/35 backdrop-blur border border-white/10 text-cream text-xs">
                <Users className="h-3.5 w-3.5 text-gold" />
                {venue.capacity} personas
              </span>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-2 group-hover:text-gold transition-colors">
          {venue.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
          {venue.description}
        </p>

        {featureChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {featureChips.map((f) => (
              <span key={f} className="text-xs px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                {f}
              </span>
            ))}
            {remainingFeatures > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-muted/50 text-muted-foreground border border-navy-dark/10">
                +{remainingFeatures}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/salones/${venue.id}`}>
              Ver Detalles
            </Link>
          </Button>
          <Button variant="gold" size="sm" className="flex-1 shadow-gold/20 shadow-lg" asChild>
            <Link to={`/reservar?type=venue&id=${venue.id}`}>
              Reservar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
