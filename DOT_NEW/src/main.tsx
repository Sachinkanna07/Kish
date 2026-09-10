import { createRoot } from "react-dom/client";
import "./index.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/noto-sans-tamil/tamil-400.css";
import "@fontsource/noto-sans-tamil/tamil-600.css";
import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {
        // The app continues online if a browser disallows offline storage.
      });
  });
}
