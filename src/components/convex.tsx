import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useAuth as useHerculesAuth } from "@usehercules/auth/react";
import { useMemo, useState, useEffect } from "react";

const convexUrl = import.meta.env.VITE_CONVEX_URL ?? "http://localhost:3000";
const convex = new ConvexReactClient(convexUrl);

function getEffectiveDemoRole(): string {
  if (typeof window === "undefined") return "super_admin";
  const val = localStorage.getItem("star_eoffice_demo_user");
  if (val && val !== "logged_out") return val;
  return "super_admin";
}

function useAuthWithDemoFallback() {
  const herculesAuth = useHerculesAuth();
  const [demoRole, setDemoRole] = useState<string>(getEffectiveDemoRole);

  useEffect(() => {
    const handleStorage = () => {
      setDemoRole(getEffectiveDemoRole());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return useMemo(() => {
    if (herculesAuth.isAuthenticated) {
      return {
        isLoading: false,
        isAuthenticated: true,
        fetchAccessToken: async () => herculesAuth.user?.id_token ?? "demo_access_token",
      };
    }

    return {
      isLoading: false,
      isAuthenticated: true,
      fetchAccessToken: async () => "demo_access_token",
    };
  }, [herculesAuth.isAuthenticated, herculesAuth.user, demoRole]);
}

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthWithDemoFallback}>
      {children}
    </ConvexProviderWithAuth>
  );
}
