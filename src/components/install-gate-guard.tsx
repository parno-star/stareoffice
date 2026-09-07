import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useInstallPrompt } from "@/hooks/use-install-prompt.ts";

/**
 * Wraps the app root to redirect users to the install gate page
 * unless they are running in standalone mode (PWA installed), in preview/iframe, or have marked install.
 *
 * Bypassed routes: /install, /auth/callback, /verifikasi-surat, /presentation, /download-pricing
 */
const BYPASS_PATHS = [
  "/install",
  "/auth/callback",
  "/verifikasi-surat",
  "/presentation",
  "/download-pricing",
];

const INSTALL_KEY = "star-eoffice-installed";

export function markInstallComplete() {
  try {
    localStorage.setItem(INSTALL_KEY, "1");
  } catch {
    // Storage not available
  }
}

export function isInstallComplete() {
  try {
    return localStorage.getItem(INSTALL_KEY) === "1";
  } catch {
    return false;
  }
}

export default function InstallGateGuard({
  children,
}: {
  children: ReactNode;
}) {
  const location = useLocation();
  const { isStandalone } = useInstallPrompt();

  // Always allow bypass paths
  const isBypassed = BYPASS_PATHS.some((p) =>
    location.pathname.startsWith(p),
  );
  if (isBypassed) return <>{children}</>;

  // Skip install gate in development mode or inside iframe previews
  const isIframe = typeof window !== "undefined" && window.self !== window.top;
  if (import.meta.env.DEV || isIframe) return <>{children}</>;

  // Allow access if app is running in standalone mode or install was confirmed
  if (isStandalone || isInstallComplete()) return <>{children}</>;

  // Otherwise redirect to install page
  return <Navigate to="/install" replace />;
}
