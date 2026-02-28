import { Link } from "react-router-dom";
import { Users, Bed, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Room } from "@/data/hotelData";
import { ImageCarousel } from "@/components/ImageCarousel";
import { cn, formatCOP } from "@/lib/utils";
import roomStandard from "@/assets/room-standard.jpg";

interface RoomCardProps {
  room: Room;
}

const typeTranslations: Record<string, string> = {
  standard: "Estándar",
  deluxe: "Lujo",
  suite: "Suite",
  presidential: "Presidencial",
};

export function RoomCard({ room }: RoomCardProps) {
  const displayType = typeTranslations[room.type.toLowerCase()] || room.type;
  return (
    <Card className="overflow-hidden group shadow-card hover:shadow-elevated transition-all duration-300">
      <div className="relative h-64 overflow-hidden">
        <ImageCarousel className="h-full" images={room.gallery && room.gallery.length ? room.gallery : [room.image || roomStandard]} />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-gold font-semibold text-lg">
            {formatCOP(room.price_per_night)}
            <span className="text-cream/70 text-sm font-normal"> / noche</span>
          </p>
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
          Habitación {room.number}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          Habitación {displayType}. {room.amenities}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4 text-gold" />
            {room.capacity} huéspedes
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/habitaciones/${room.id}`}>
              Ver Detalles
            </Link>
          </Button>
          <Button variant="gold" size="sm" className="flex-1" asChild>
            <Link to={`/reservar?type=room&id=${room.id}`}>
              Reservar
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card >
  );
}
