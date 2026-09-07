import { useContext } from "react";
import {
  MockAuthContext,
  type AppAuthContextType,
} from "@/components/providers/auth.tsx";

const fallbackAuth: AppAuthContextType = {
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
  signinRedirect: async () => {},
  removeUser: async () => {},
  signoutRedirect: async () => {},
};

export function useAuth(): AppAuthContextType {
  const context = useContext(MockAuthContext);
  return context || fallbackAuth;
}

export function useUser() {
  const auth = useAuth();
  const user = auth.user;

  return {
    ...(user ?? {}),
    id: user?.profile?.sub,
    name: user?.profile?.name,
    email: user?.profile?.email,
    avatar: user?.profile?.picture,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
  };
}
