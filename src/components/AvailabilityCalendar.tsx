import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Bed, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { rooms, venues, Reservation } from "@/data/hotelData";

interface AvailabilityCalendarProps {
  reservations: Reservation[];
}

export default function AvailabilityCalendar({ reservations }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<"rooms" | "venues">("rooms");

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getReservationsForDate = (date: Date, type: "room" | "venue") => {
    return reservations.filter((res) => {
      if (res.type !== type || res.status === "cancelled") return false;
      const checkIn = parseISO(res.checkIn);
      const checkOut = parseISO(res.checkOut);
      return isWithinInterval(date, { start: checkIn, end: checkOut }) ||
        isSameDay(date, checkIn) ||
        isSameDay(date, checkOut);
    });
  };

  const getItemAvailability = (date: Date, itemId: string, type: "room" | "venue") => {
    return reservations.some((res) => {
      if (res.itemId !== itemId || res.status === "cancelled") return false;
      const checkIn = parseISO(res.checkIn);
      const checkOut = parseISO(res.checkOut);
      return isWithinInterval(date, { start: checkIn, end: checkOut }) ||
        isSameDay(date, checkIn);
    });
  };

  const getDayStatus = (date: Date, type: "room" | "venue") => {
    const items = type === "room" ? rooms : venues;
    const reservedCount = items.filter((item) =>
      getItemAvailability(date, item.id, type)
    ).length;

    if (reservedCount === 0) return "available";
    if (reservedCount < items.length) return "partial";
    return "full";
  };

  const items = viewType === "rooms" ? rooms : venues;

  const selectedDateReservations = selectedDate
    ? getReservationsForDate(selectedDate, viewType === "rooms" ? "room" : "venue")
    : [];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif">Calendario de Disponibilidad</CardTitle>
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as "rooms" | "venues")}>
            <TabsList>
              <TabsTrigger value="rooms" className="gap-2">
                <Bed className="h-4 w-4" />
                Habitaciones
              </TabsTrigger>
              <TabsTrigger value="venues" className="gap-2">
                <Building className="h-4 w-4" />
                Salones
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the 1st */}
              {Array.from({
                length: (days[0].getDay() + 6) % 7,
              }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const status = getDayStatus(day, viewType === "rooms" ? "room" : "venue");
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:ring-2 hover:ring-gold/50",
                      isSelected && "ring-2 ring-gold",
                      isToday && "font-bold",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground/50",
                      status === "available" && "bg-green-100 text-green-800 hover:bg-green-200",
                      status === "partial" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                      status === "full" && "bg-red-100 text-red-800 hover:bg-red-200"
                    )}
                  >
                    <span>{format(day, "d")}</span>
                    {status === "partial" && (
                      <span className="text-[10px] mt-0.5">Parcial</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-100" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-100" />
                <span>Parcial</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-100" />
                <span>Completo</span>
              </div>
            </div>
          </div>

          {/* Details panel */}
          <div className="lg:border-l lg:pl-6">
            <h4 className="font-semibold mb-4">
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM", { locale: es })
                : "Selecciona una fecha"}
            </h4>

            {selectedDate && (
              <div className="space-y-3">
                {items.map((item) => {
                  const isBooked = getItemAvailability(
                    selectedDate,
                    item.id,
                    viewType === "rooms" ? "room" : "venue"
                  );
                  const reservation = selectedDateReservations.find(
                    (r) => r.itemId === item.id
                  );

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        isBooked
                          ? "bg-red-50 border-red-200"
                          : "bg-green-50 border-green-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge
                          className={cn(
                            isBooked
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          )}
                        >
                          {isBooked ? "Reservado" : "Disponible"}
                        </Badge>
                      </div>
                      {reservation && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>{reservation.guestName}</p>
                          <p>
                            {format(parseISO(reservation.checkIn), "d MMM", { locale: es })} -{" "}
                            {format(parseISO(reservation.checkOut), "d MMM", { locale: es })}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!selectedDate && (
              <p className="text-sm text-muted-foreground">
                Haz clic en una fecha para ver la disponibilidad detallada.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
