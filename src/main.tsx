import { createRoot } from "react-dom/client";
import App from "./App.tsx";

if (typeof window !== "undefined") {
  const suppress = (event: PromiseRejectionEvent) => {
    try {
      if (typeof event.preventDefault === "function") event.preventDefault();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      if (typeof event.stopPropagation === "function") event.stopPropagation();
    } catch (err) {
      console.warn("[App] Suppressed unhandled rejection:", err);
    }
    return true;
  };
  window.addEventListener("unhandledrejection", suppress, true);
  window.addEventListener("unhandledrejection", suppress, false);
  window.onunhandledrejection = suppress;
}

createRoot(document.getElementById("root")!).render(<App />);
