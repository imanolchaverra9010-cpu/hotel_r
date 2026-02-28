import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { name: "Inicio", path: "/" },
  { name: "Habitaciones", path: "/habitaciones" },
  { name: "Salones", path: "/salones" },
  { name: "Restaurante", path: "/restaurante" },
  { name: "Galeria", path: "/galeria" },
  { name: "Resenas", path: "/resenas" },
  { name: "Contacto", path: "/contacto" },
];

// Color gradients based on scroll progress
const getHeaderColor = (progress: number) => {
  if (progress < 25) {
    return "from-rose-900/95 to-pink-900/95";
  } else if (progress < 50) {
    return "from-purple-900/95 to-indigo-900/95";
  } else if (progress < 75) {
    return "from-blue-900/95 to-cyan-900/95";
  } else {
    return "from-teal-900/95 to-emerald-900/95";
  }
};

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isHome = location.pathname === "/";
  const { scrollProgress, scrollY } = useScrollProgress();

  const isScrolled = scrollY > 50;
  const gradientColors = getHeaderColor(scrollProgress);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isHome && !isScrolled
          ? "bg-transparent"
          : `bg-gradient-to-r ${gradientColors} backdrop-blur-md shadow-lg`
      )}
    >
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-[#D4A5A5] transition-all duration-300 shadow-glow"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Hotel Los Robles"
              className="h-16 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gold",
                  isHome && !isScrolled ? "text-cream/90" : "text-white/90",
                  location.pathname === link.path && "text-gold"
                )}
              >
                {link.name}
              </Link>
            ))}

            <Button variant={isHome && !isScrolled ? "heroGold" : "gold"} asChild>
              <Link to="/reservar">Reservar Ahora</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className={cn("h-6 w-6", isHome && !isScrolled ? "text-cream" : "text-white")} />
            ) : (
              <Menu className={cn("h-6 w-6", isHome && !isScrolled ? "text-cream" : "text-white")} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/20 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "text-sm font-medium py-2 transition-colors",
                    isHome && !isScrolled ? "text-cream/90" : "text-white/90",
                    location.pathname === link.path && "text-gold"
                  )}
                >
                  {link.name}
                </Link>
              ))}

              <Button variant="gold" className="mt-2" asChild>
                <Link to="/reservar" onClick={() => setIsMenuOpen(false)}>
                  Reservar Ahora
                </Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
