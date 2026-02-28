import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from "lucide-react";
import { useHotelInfo } from "@/hooks/useHotelInfo";

export function Footer() {
  const { hotelInfo } = useHotelInfo();
  const telHref = hotelInfo.phone ? `tel:${hotelInfo.phone.replace(/\s/g, "")}` : "#";
  const mailHref = hotelInfo.email ? `mailto:${hotelInfo.email}` : "#";
  const socials = [
    { icon: Instagram, label: "Instagram", url: hotelInfo.instagram_url },
    { icon: Facebook, label: "Facebook", url: hotelInfo.facebook_url },
    { icon: Twitter, label: "Twitter", url: hotelInfo.twitter_url },
  ].filter((s) => s.url);

  return (
    <footer className="bg-navy text-cream">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <img
              src="/logo.png"
              alt="Hotel Los Robles"
              className="h-24 w-auto object-contain mb-4"
            />
            <p className="text-cream/70 text-sm leading-relaxed">
              Una experiencia inolvidable en el corazón de la ciudad.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              {[
                { name: "Habitaciones", path: "/habitaciones" },
                { name: "Salones", path: "/salones" },
                { name: "Reservar", path: "/reservar" },
                { name: "Contacto", path: "/contacto" },
                { name: "Login", path: "/login" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-cream/70 hover:text-gold transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gold font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              {hotelInfo.address && (
                <li className="flex items-start gap-3 text-sm text-cream/70">
                  <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <span>{hotelInfo.address}</span>
                </li>
              )}
              {hotelInfo.phone && (
                <li className="flex items-center gap-3 text-sm text-cream/70">
                  <Phone className="h-5 w-5 text-gold shrink-0" />
                  <a href={telHref} className="hover:text-gold transition-colors">{hotelInfo.phone}</a>
                </li>
              )}
              {hotelInfo.email && (
                <li className="flex items-center gap-3 text-sm text-cream/70">
                  <Mail className="h-5 w-5 text-gold shrink-0" />
                  <a href={mailHref} className="hover:text-gold transition-colors">{hotelInfo.email}</a>
                </li>
              )}
            </ul>
          </div>

          {/* Social */}
          <div>
            {socials.length > 0 && (
              <>
                <h4 className="text-gold font-semibold mb-4">Síguenos</h4>
                <div className="flex gap-4">
                  {socials.map(({ icon: Icon, label, url }) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-gold hover:text-navy-dark transition-all"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 text-center text-sm text-cream/50">
          <p>© 2024 Hotel Los Robles. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
