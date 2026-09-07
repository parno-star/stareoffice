import React, { createContext, useMemo } from "react";
import {
  HerculesAuthProvider,
  useAuth as useHerculesAuth,
} from "@usehercules/auth/react";

export interface AppAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    profile: {
      sub: string;
      name: string;
      email: string;
      picture?: string;
      [key: string]: unknown;
    };
    id_token?: string;
    access_token?: string;
    [key: string]: unknown;
  } | null;
  error?: Error;
  signinRedirect: (args?: Record<string, unknown>) => Promise<void>;
  removeUser: () => Promise<void>;
  signoutRedirect: (args?: Record<string, unknown>) => Promise<void>;
}

export const MockAuthContext = createContext<AppAuthContextType | null>(null);

export const IS_HERCULES_CONFIGURED = Boolean(
  import.meta.env.VITE_HERCULES_OIDC_AUTHORITY &&
    import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID,
);

function HerculesBridge({ children }: { children: React.ReactNode }) {
  const hercules = useHerculesAuth();

  const value = useMemo<AppAuthContextType>(
    () => ({
      isAuthenticated: hercules.isAuthenticated,
      isLoading: hercules.isLoading,
      user: hercules.user as AppAuthContextType["user"],
      error: hercules.error,
      signinRedirect: (args) => hercules.signinRedirect(args),
      removeUser: () => hercules.removeUser(),
      signoutRedirect: (args) => hercules.signoutRedirect(args),
    }),
    [hercules],
  );

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (IS_HERCULES_CONFIGURED) {
    return (
      <HerculesAuthProvider
        authority={import.meta.env.VITE_HERCULES_OIDC_AUTHORITY!}
        client_id={import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID!}
        userManagerSettings={{
          prompt: import.meta.env.VITE_HERCULES_OIDC_PROMPT ?? "select_account",
          response_type:
            import.meta.env.VITE_HERCULES_OIDC_RESPONSE_TYPE ?? "code",
          scope:
            import.meta.env.VITE_HERCULES_OIDC_SCOPE ??
            "openid profile email offline_access",
          redirect_uri:
            import.meta.env.VITE_HERCULES_OIDC_REDIRECT_URI ??
            `${window.location.origin}/auth/callback`,
          post_logout_redirect_uri: window.location.origin,
          monitorSession: false,
        }}
      >
        <HerculesBridge>{children}</HerculesBridge>
      </HerculesAuthProvider>
    );
  }

  const mockValue: AppAuthContextType = {
    isAuthenticated: true,
    isLoading: false,
    user: {
      profile: {
        sub: "local-dev-user",
        name: "Developer Admin",
        email: "admin@local.test",
        picture: "",
      },
      id_token: "mock-token",
      access_token: "mock-token",
    },
    error: undefined,
    signinRedirect: async () => {
      window.location.href = "/home";
    },
    removeUser: async () => {
      window.location.href = "/";
    },
    signoutRedirect: async () => {
      window.location.href = "/";
    },
  };

  return (
    <MockAuthContext.Provider value={mockValue}>
      {children}
    </MockAuthContext.Provider>
  );
}
