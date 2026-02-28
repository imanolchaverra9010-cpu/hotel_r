import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { MessageCircle, MessageSquareText, Send, X } from "lucide-react";
import { API_BASE } from "@/config/api";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import Index from "./pages/Index";
import Rooms from "./pages/Rooms";
import RoomDetail from "./pages/RoomDetail";
import Venues from "./pages/Venues";
import VenueDetail from "./pages/VenueDetail";
import Restaurant from "./pages/Restaurant";
import Gallery from "./pages/Gallery";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Reviews from "./pages/Reviews";
import ReviewModeration from "./pages/admin/ReviewModeration";

const queryClient = new QueryClient();

const WELCOME_KEY = "hotel-los-robles-welcome-seen";

const App = () => {
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const seen = localStorage.getItem(WELCOME_KEY);
    if (!seen) setWelcomeOpen(true);
  }, []);

  const closeWelcome = () => {
    setWelcomeOpen(false);
    localStorage.setItem(WELCOME_KEY, "1");
  };
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    {
      role: "bot",
      text: "Hola, soy el asistente de Hotel Los Robles. Puedo explicarte cómo reservar una habitación o un salón, precios, ubicación y más. ¿En qué te ayudo?",
    },
  ]);

  const REPLY = {
    reservarHabitacion: `Para reservar una habitación sigue estos pasos:

1. Entra en Reservar (menú o "Reservar Estancia").
2. Elige el tipo Habitación.
3. Selecciona la habitación que te interese (verás precios por noche).
4. Elige fecha de entrada (check-in) y fecha de salida (check-out).
5. Indica el número de huéspedes.
6. Completa tus datos: nombre, email y teléfono.
7. Revisa el resumen y pulsa Confirmar Reserva.

Recibirás la confirmación por email. Si quieres ver habitaciones antes, entra en Habitaciones en el menú. ¿Necesitas algo más?`,

    reservarSalon: `Para reservar un salón (eventos, bodas, reuniones):

1. Entra en Reservar (menú o "Reservar Estancia").
2. Elige el tipo Salón.
3. Selecciona el salón que necesites (verás capacidad y precio por hora).
4. Elige fecha del evento y fecha de finalización.
5. Indica el número de asistentes.
6. Completa tus datos: nombre, email y teléfono.
7. Pulsa Confirmar Reserva.

Te confirmaremos por email. Puedes ver todos los salones en Salones en el menú. ¿Algo más?`,

    reservarGeneral: `Puedes reservar habitación (alojamiento) o salón (eventos, bodas, reuniones). Todo desde la página Reservar:

• Habitación: eliges habitación, fechas de entrada y salida, huéspedes y datos. Precio por noche.
• Salón: eliges salón, fecha del evento, asistentes y datos. Precio por hora.

¿Quieres que te explique paso a paso cómo reservar una habitación o un salón?`,
  };

  const replyFor = (text: string): string => {
    const t = text.toLowerCase().trim();
    const isReservar = /reservar|reserva|reservaci[oó]n|quiero reservar|como reservo|c[oó]mo reservo|pasos para reservar/.test(t);
    const isHabitacion = /habitaci[oó]n|habitaciones|alojamiento|hospedaje|quedarme|estancia/.test(t);
    const isSalon = /sal[oó]n|salones|evento|boda|reuni[oó]n|conferencia|celebraci[oó]n/.test(t);

    if (isReservar && isHabitacion && !isSalon) return REPLY.reservarHabitacion;
    if (isReservar && isSalon) return REPLY.reservarSalon;
    if (isReservar) return REPLY.reservarGeneral;

    if (isHabitacion && !isSalon) {
      return "Puedes ver disponibilidad y detalles en Habitaciones (menú). Para reservar: entra en Reservar, elige Habitación, selecciona la habitación, fechas, huéspedes y tus datos. ¿Quieres que te detalle los pasos?";
    }
    if (isSalon) {
      return "Tenemos salones para reuniones, bodas y eventos. En Salones (menú) ves opciones y precios. Para reservar: Reservar → tipo Salón → elige salón, fecha, asistentes y datos. ¿Te explico el proceso completo?";
    }
    if (t.includes("restaurante") || t.includes("menú") || t.includes("menu") || t.includes("plato")) {
      return "En Restaurante (menú) puedes ver nuestra carta y Platos Signature. Para reservas de mesa o eventos privados, usa Contacto o el botón de WhatsApp.";
    }
    if (t.includes("precio") || t.includes("tarifa") || t.includes("costo") || t.includes("cuánto") || t.includes("cuanto")) {
      return "Los precios dependen del tipo: habitaciones por noche, salones por hora. En Habitaciones y Salones verás precios al elegir cada opción. En Reservar también se muestra el total antes de confirmar. ¿Habitación o salón?";
    }
    if (t.includes("ubicacion") || t.includes("direcci") || t.includes("como llegar") || t.includes("dónde") || t.includes("donde")) {
      return "En Contacto (menú) tienes mapa, dirección e información para llegar. También puedes escribirnos por WhatsApp con el botón verde.";
    }
    if (t.includes("whatsapp") || t.includes("wpp")) {
      return "Puedes escribirnos por WhatsApp con el botón verde abajo a la derecha. Ideal para consultas rápidas o reservas por mensaje.";
    }
    if (t.includes("hola") || t.includes("buenas") || t.includes("ayuda") || t.length < 3) {
      return "Hola. Puedo explicarte cómo reservar una habitación o un salón, precios, ubicación, restaurante o contacto. ¿Qué necesitas?";
    }
    return "Puedo ayudarte a reservar una habitación o un salón (te explico los pasos), o con precios, ubicación, restaurante y contacto. ¿Qué te interesa?";
  };

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    setChatInput("");
    setChatLoading(true);
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await fetch(`${API_BASE}/api/ai/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const reply = (data?.reply || "").toString().trim();
      setMessages((prev) => [...prev, { role: "bot", text: reply || replyFor(text) }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: replyFor(text) }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Dialog open={welcomeOpen} onOpenChange={(open) => !open && closeWelcome()}>
              <DialogContent className="max-w-md text-center sm:rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif text-gold">
                    Bienvenidos al Hotel Los Robles
                  </DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground py-2">
                  Estamos encantados de tenerte aquí. Descubre habitaciones, salones y nuestra gastronomía.
                </p>
                <Button onClick={closeWelcome} variant="gold" className="w-full mt-2">
                  Explorar
                </Button>
              </DialogContent>
            </Dialog>

            {chatOpen && (
              <div className="fixed bottom-24 right-5 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)]">
                <div className="rounded-2xl overflow-hidden border border-navy-dark/10 bg-card shadow-elevated">
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-navy">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="h-5 w-5 text-gold" />
                      <span className="text-sm font-semibold text-cream">Asistente</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-cream/80 hover:text-cream hover:bg-white/10"
                      onClick={() => setChatOpen(false)}
                      aria-label="Cerrar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-auto px-4 py-3 space-y-3">
                    {messages.map((m, i) => (
                      <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                        <div
                          className={
                            m.role === "user"
                              ? "max-w-[85%] rounded-2xl rounded-br-md bg-gold/15 border border-gold/20 px-3 py-2 text-sm text-foreground"
                              : "max-w-[85%] rounded-2xl rounded-bl-md bg-muted/50 border border-border/50 px-3 py-2 text-sm text-foreground whitespace-pre-line"
                          }
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-border/60 bg-background">
                    <div className="flex items-center gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Escribe tu mensaje..."
                        className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        disabled={chatLoading}
                      />
                      <button
                        type="button"
                        onClick={sendMessage}
                        aria-label="Enviar"
                        disabled={chatLoading}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-navy-dark shadow-soft hover:brightness-105 disabled:opacity-60"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
              <PwaInstallButton />
              <button
                type="button"
                aria-label="Chat"
                onClick={() => setChatOpen((v) => !v)}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-navy-dark text-cream shadow-elevated transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <MessageSquareText className="h-6 w-6" />
              </button>

              <a
                href={`https://wa.me/573104374492?text=${encodeURIComponent(
                  "Hola, estoy interesado(a) en una reserva en Hotel Los Robles."
                )}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elevated transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <MessageCircle className="h-6 w-6" />
              </a>
            </div>

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/habitaciones" element={<Rooms />} />
              <Route path="/habitaciones/:id" element={<RoomDetail />} />
              <Route path="/salones" element={<Venues />} />
              <Route path="/salones/:id" element={<VenueDetail />} />
              <Route path="/restaurante" element={<Restaurant />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/resenas" element={<Reviews />} />
              <Route path="/reservar" element={<Booking />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/resenas"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ReviewModeration />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
