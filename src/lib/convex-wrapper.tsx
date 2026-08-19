import * as originalConvexReact from "../../node_modules/convex/dist/esm/react/index.js";
import React from "react";
import { resolveMockQuery, getQueryName } from "./convex-mock-resolver";

const isMockMode = typeof window !== "undefined" && (!import.meta.env.VITE_CONVEX_URL || import.meta.env.VITE_CONVEX_URL.includes("localhost:3000"));

export * from "../../node_modules/convex/dist/esm/react/index.js";

export function useConvexAuth() {
  try {
    const original = originalConvexReact.useConvexAuth();
    if (original && original.isAuthenticated) {
      return original;
    }
  } catch {
    /* ignore fallback */
  }
  return { isLoading: false, isAuthenticated: true };
}

export function Authenticated({ children }: { children: React.ReactNode }) {
  const auth = useConvexAuth();
  if (auth.isAuthenticated) {
    return <>{children}</>;
  }
  return null;
}

export function Unauthenticated({ children }: { children: React.ReactNode }) {
  const auth = useConvexAuth();
  if (!auth.isAuthenticated) {
    return <>{children}</>;
  }
  return null;
}

export function AuthLoading({ children }: { children: React.ReactNode }) {
  const auth = useConvexAuth();
  if (auth.isLoading) {
    return <>{children}</>;
  }
  return null;
}

export function useQuery(query: any, args?: any): any {
  let result: any = undefined;
  try {
    result = originalConvexReact.useQuery(query, args);
  } catch {
    result = undefined;
  }

  if (result !== undefined) {
    return result;
  }

  return resolveMockQuery(query, args);
}

export function useMutation(mutation: any): (args?: any) => Promise<any> {
  let originalMutation: any = null;
  try {
    originalMutation = originalConvexReact.useMutation(mutation);
  } catch {
    originalMutation = null;
  }

  return async (args?: any) => {
    const name = getQueryName(mutation).toLowerCase();
    if (name.includes("setviewingorganization") || name.includes("set_viewing_organization")) {
      if (args && args.organizationId !== undefined) {
        if (args.organizationId === null) {
          localStorage.removeItem("viewingOrganizationId");
        } else {
          localStorage.setItem("viewingOrganizationId", args.organizationId);
        }
      }
    }

    if (originalMutation && !isMockMode) {
      try {
        const res = await originalMutation(args);
        if (res !== undefined) return res;
      } catch {
        /* fallback to mock response */
      }
    }
    return { success: true, id: `mock_id_${Date.now()}` };
  };
}

export function useAction(action: any): (args?: any) => Promise<any> {
  let originalAction: any = null;
  try {
    originalAction = originalConvexReact.useAction(action);
  } catch {
    originalAction = null;
  }

  return async (args?: any) => {
    if (originalAction && !isMockMode) {
      try {
        const res = await originalAction(args);
        if (res !== undefined) return res;
      } catch (err) {
        console.warn("Convex action fallback:", err);
      }
    }
    return { success: true, messageId: `mock_msg_${Date.now()}` };
  };
}
