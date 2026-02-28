import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const mobile = /android|iphone|ipad|ipod/.test(ua);

    setIsIos(iosDevice);
    setIsStandalone(standalone);
    setIsMobile(mobile);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIos) {
      toast.info("En iPhone/iPad: Safari > Compartir > Agregar a pantalla de inicio.");
      return;
    }

    toast.info("Abre el menu del navegador y elige 'Instalar app' o 'Agregar a pantalla principal'.");
  };

  if (isStandalone || !isMobile) return null;

  return (
    <button
      type="button"
      aria-label="Instalar app"
      onClick={installApp}
      className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy-dark shadow-elevated transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      title="Instalar app"
    >
      <Download className="h-6 w-6" />
    </button>
  );
}
