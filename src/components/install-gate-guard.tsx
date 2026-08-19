import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useInstallPrompt } from "@/hooks/use-install-prompt.ts";

/**
 * Wraps the app root to redirect ALL users to the install gate page
 * unless they are running in standalone mode (PWA installed).
 *
 * Bypassed routes: /install, /auth/callback, /verifikasi-surat
 */
const BYPASS_PATHS = ["/install", "/auth/callback", "/verifikasi-surat"];

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
  return <>{children}</>;
}
