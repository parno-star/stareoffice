import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useServiceWorker() {
  const toastShown = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In development mode or inside preview iframes, unregister any active service worker
    // to avoid stale caching, fetch hijacking, and unhandled promise rejections.
    const isDev = import.meta.env.DEV;
    const isIframe = typeof window !== "undefined" && window.self !== window.top;
    if (isDev || isIframe) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const reg of registrations) {
            reg.unregister().catch(() => {});
          }
        })
        .catch(() => {});
      return;
    }

    const showUpdateToast = () => {
      if (toastShown.current) return;
      toastShown.current = true;

      toast("Versi baru tersedia!", {
        duration: Infinity,
        action: { label: "Muat Ulang", onClick: () => window.location.reload() },
      });
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check if update is already waiting
        if (registration.waiting) {
          showUpdateToast();
          return;
        }

        // Listen for new updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateToast();
            }
          });
        });
      })
      .catch((err) => {
        console.warn("Service Worker registration skipped:", err);
      });
  }, []);
}
