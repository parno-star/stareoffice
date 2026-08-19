import { useAuth as useHerculesAuth, useUser as useHerculesUser } from "@usehercules/auth/react";
import { useCallback, useEffect, useState } from "react";

function getEffectiveDemoRole(): string {
  if (typeof window === "undefined") return "super_admin";
  const val = localStorage.getItem("star_eoffice_demo_user");
  if (val && val !== "logged_out") return val;
  return "super_admin";
}

export function useAuth() {
  const herculesAuth = useHerculesAuth();
  const [demoRole, setDemoRoleState] = useState<string>(getEffectiveDemoRole);

  useEffect(() => {
    const handleStorage = () => {
      setDemoRoleState(getEffectiveDemoRole());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setDemoLogin = useCallback((role: string) => {
    localStorage.setItem("star_eoffice_demo_user", role);
    setDemoRoleState(role);
    window.dispatchEvent(new Event("storage"));
  }, []);

  const removeUser = useCallback(async () => {
    localStorage.setItem("star_eoffice_demo_user", "super_admin");
    setDemoRoleState("super_admin");
    window.dispatchEvent(new Event("storage"));
    try {
      await herculesAuth.removeUser();
    } catch {
      // Ignore
    }
  }, [herculesAuth]);

  return {
    ...herculesAuth,
    isAuthenticated: true,
    isDemo: true,
    demoRole,
    setDemoLogin,
    removeUser,
  };
}

export function useUser() {
  return useHerculesUser();
}
