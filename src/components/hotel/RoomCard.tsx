import { Bed, Users, Wifi, Tv, Wind, Wine } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Room } from '@/types/hotel';
import { RoomStatusBadge } from './RoomStatusBadge';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
  selected?: boolean;
  showPrice?: boolean;
}

const typeLabels = {
  standard: 'Estándar',
  deluxe: 'Deluxe',
  suite: 'Suite',
  presidential: 'Presidencial',
};

const amenityIcons: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  TV: Tv,
  AC: Wind,
  Minibar: Wine,
};

export const RoomCard = ({ room, onClick, selected, showPrice = true }: RoomCardProps) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        selected && 'ring-2 ring-primary',
        room.status === 'available' && 'hover:border-success',
        room.status !== 'available' && 'opacity-80'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Bed className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Hab. {room.number}</h3>
              <p className="text-sm text-muted-foreground">{typeLabels[room.type]}</p>
            </div>
          </div>
          <RoomStatusBadge status={room.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {/* Capacity and Price removed */}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {(Array.isArray(room.amenities) ? room.amenities : []).slice(0, 4).map((amenity) => {
            const Icon = amenityIcons[amenity];
            return Icon ? (
              <div key={amenity} className="p-2 bg-muted rounded-lg" title={amenity}>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : null;
          })}
          {Array.isArray(room.amenities) && room.amenities.length > 4 && (
            <div className="p-2 bg-muted rounded-lg text-xs text-muted-foreground flex items-center">
              +{room.amenities.length - 4}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
