import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiUrl } from "@/config/api";
import { useHotelInfo } from "@/hooks/useHotelInfo";

export default function Contact() {
  const { hotelInfo } = useHotelInfo();
  const contactInfo = [
    { icon: MapPin, title: "Dirección", content: hotelInfo.address },
    { icon: Phone, title: "Teléfono", content: hotelInfo.phone },
    { icon: Mail, title: "Email", content: hotelInfo.email },
    { icon: Clock, title: "Horario de Atención", content: hotelInfo.opening_hours },
  ].filter((item) => item.content);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, whatsapp, subject, message }),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("Mensaje enviado correctamente. Te responderemos pronto.");
      setName("");
      setEmail("");
      setWhatsapp("");
      setSubject("");
      setMessage("");
    } catch {
      toast.error("No se pudo enviar el mensaje. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            <span className="text-gold">Contacto</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                Información de <span className="text-gold">Contacto</span>
              </h2>
              <div className="space-y-6">
                {contactInfo.map((info) => (
                  <div key={info.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                      <info.icon className="h-5 w-5 text-navy-dark" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{info.title}</h3>
                      {info.title === "Teléfono" && info.content ? (
                        <a href={`tel:${info.content.replace(/\s/g, "")}`} className="text-muted-foreground hover:text-gold">{info.content}</a>
                      ) : info.title === "Email" && info.content ? (
                        <a href={`mailto:${info.content}`} className="text-muted-foreground hover:text-gold">{info.content}</a>
                      ) : (
                        <p className="text-muted-foreground">{info.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map placeholder */}
              <div className="mt-8 rounded-xl overflow-hidden shadow-card">
                <iframe
                  title="Ubicación del Hotel"
                  src="https://www.google.com/maps?q=Hotel%20Los%20Robles%2C%20Cl.%2028%20%23314%20a%203-174%2C%20Quibd%C3%B3%2C%20Choc%C3%B3&output=embed"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="shadow-elevated">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                    Envíanos un <span className="text-gold">Mensaje</span>
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label>WhatsApp</Label>
                      <Input
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Ej: +57 300 000 0000"
                        required
                      />
                    </div>
                    <div>
                      <Label>Asunto</Label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="¿En qué podemos ayudarte?"
                        required
                      />
                    </div>
                    <div>
                      <Label>Mensaje</Label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe tu mensaje aquí..."
                        rows={5}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
