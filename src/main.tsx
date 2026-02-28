import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Evitar "Uncaught AbortError: play() interrupted by pause()" (iframe/medios o pestana en segundo plano)
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason?.name === "AbortError" &&
    (String(event.reason?.message || "").includes("play") || String(event.reason?.message || "").includes("pause"))
  ) {
    event.preventDefault();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service Worker registration failed", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
