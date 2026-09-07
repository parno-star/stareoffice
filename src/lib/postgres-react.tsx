/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { getFunctionName as convexGetFunctionName } from "convex/server";

export function getFunctionName(fn: any): string {
  if (typeof fn === "string") return fn;
  if (!fn) return "";
  try {
    const name = convexGetFunctionName(fn);
    if (name) return name;
  } catch (err) {
    // Fallback if not convex ref
    console.debug("getFunctionName fallback", err);
  }
  if (fn._functionPath) return fn._functionPath;
  if (fn.name) return fn.name;
  return String(fn);
}

// Global cache and pub-sub for reactive query refetching
const cache = new Map<string, any>();
const subscribers = new Set<() => void>();

export function invalidateAllQueries() {
  subscribers.forEach((callback) => {
    try {
      callback();
    } catch (e) {
      console.error("Query subscriber error:", e);
    }
  });
}

/**
 * Execute a query against the PostgreSQL backend via REST API
 */
export async function executeQuery(name: string, args: any = {}) {
  try {
    const res = await fetch("/api/pg/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, args }),
    });
    if (!res.ok) {
      console.warn(`[PostgreSQL Query] ${name} HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data?.value ?? null;
  } catch (err) {
    console.warn(`[PostgreSQL Query] ${name} error:`, err);
    return null;
  }
}

/**
 * Execute a mutation against the PostgreSQL backend via REST API
 */
export async function executeMutation(name: string, args: any = {}) {
  try {
    const res = await fetch("/api/pg/mutation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, args }),
    });
    if (!res.ok) {
      console.warn(`[PostgreSQL Mutation] ${name} HTTP ${res.status}`);
      return { success: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    // Automatically trigger refetches for all active queries
    invalidateAllQueries();
    return data?.value ?? data ?? { success: true };
  } catch (err) {
    console.warn(`[PostgreSQL Mutation] ${name} error:`, err);
    return { success: false, error: String(err) };
  }
}

/**
 * Hook to perform a reactive PostgreSQL query.
 * Mimics Convex useQuery API.
 */
export function useQuery(queryReference: any, args: any = {}): any {
  const isSkipped = args === "skip" || queryReference === "skip" || !queryReference;
  const fnName = isSkipped ? "" : getFunctionName(queryReference);
  const serializedArgs = isSkipped ? "" : typeof args === "object" && args !== null ? JSON.stringify(args) : String(args || "");
  const cacheKey = `${fnName}:${serializedArgs}`;

  const [data, setData] = useState<any>(() => (isSkipped ? undefined : cache.get(cacheKey)));
  const mountedRef = useRef(true);
  const argsRef = useRef(args);
  argsRef.current = args;

  const fetchData = useCallback(async () => {
    if (isSkipped || !fnName) return;
    try {
      const result = await executeQuery(fnName, argsRef.current);
      cache.set(cacheKey, result);
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      console.warn(`[PostgreSQL useQuery] ${fnName} error:`, err);
      if (mountedRef.current) {
        setData(null);
      }
    }
  }, [isSkipped, fnName, cacheKey]);

  useEffect(() => {
    if (isSkipped) return;
    mountedRef.current = true;
    fetchData().catch(() => {});

    // Subscribe to mutation updates
    const onUpdate = () => {
      fetchData().catch(() => {});
    };
    subscribers.add(onUpdate);

    return () => {
      mountedRef.current = false;
      subscribers.delete(onUpdate);
    };
  }, [isSkipped, fetchData]);

  if (isSkipped) {
    return undefined;
  }

  return data;
}

/**
 * Hook to perform a PostgreSQL mutation.
 * Mimics Convex useMutation API.
 */
export function useMutation(mutationReference: any) {
  const fnName = getFunctionName(mutationReference);

  return useCallback(
    async (args: any = {}) => {
      try {
        return await executeMutation(fnName, args);
      } catch (err) {
        console.warn(`[PostgreSQL useMutation] ${fnName} error:`, err);
        return { success: false, error: String(err) };
      }
    },
    [fnName]
  );
}

/**
 * Hook for action execution
 */
export function useAction(actionReference: any) {
  const fnName = getFunctionName(actionReference);

  return useCallback(
    async (args: any = {}) => {
      try {
        return await executeMutation(fnName, args);
      } catch (err) {
        console.warn(`[PostgreSQL useAction] ${fnName} error:`, err);
        return { success: false, error: String(err) };
      }
    },
    [fnName]
  );
}

export function useQueries(queries: any) {
  const results: Record<string, any> = {};
  for (const [key, q] of Object.entries(queries || {})) {
    const { query, args } = (q as any) || {};
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useQuery(query, args);
  }
  return results;
}

export function usePaginatedQuery(queryReference: any, args: any = {}, _options: any = {}) {
  const data = useQuery(queryReference, args);
  return {
    results: Array.isArray(data) ? data : [],
    status: data === undefined ? "LoadingFirstPage" : "Loaded",
    loadMore: () => {},
    isLoading: data === undefined,
  };
}

export const usePaginatedQuery_experimental = usePaginatedQuery;
export const useQuery_experimental = useQuery;
export const useSubscription = useQuery;
export const usePreloadedQuery = (preloaded: any) => preloaded;

export function convexQueryOptions(opts: any) {
  return opts;
}

export class ConvexReactClient {
  constructor(_url?: string) {}
  setAuth(_fetchToken: any, onChange?: (isAuthenticated: boolean) => void) {
    try {
      onChange?.(true);
    } catch (err) {
      console.warn("setAuth error:", err);
    }
  }
  async query(fn: any, args: any = {}) {
    try {
      return await executeQuery(getFunctionName(fn), args);
    } catch {
      return null;
    }
  }
  async mutation(fn: any, args: any = {}) {
    try {
      return await executeMutation(getFunctionName(fn), args);
    } catch {
      return { success: false };
    }
  }
  async action(fn: any, args: any = {}) {
    try {
      return await executeMutation(getFunctionName(fn), args);
    } catch {
      return { success: false };
    }
  }
}

const ConvexContext = createContext<{
  client: ConvexReactClient;
  isLoading: boolean;
  isAuthenticated: boolean;
}>({
  client: new ConvexReactClient(),
  isLoading: false,
  isAuthenticated: true,
});

export function useConvex() {
  return useContext(ConvexContext).client;
}

export function useConvexAuth() {
  return {
    isLoading: false,
    isAuthenticated: true,
  };
}

export function useConvexConnectionState() {
  return "connected";
}

export function ConvexProvider({
  children,
  client,
}: {
  children: React.ReactNode;
  client?: any;
}) {
  const ctxValue = {
    client: client || new ConvexReactClient(),
    isLoading: false,
    isAuthenticated: true,
  };
  return (
    <ConvexContext.Provider value={ctxValue}>{children}</ConvexContext.Provider>
  );
}

export function ConvexProviderWithAuth({
  children,
  client,
}: {
  children: React.ReactNode;
  client?: any;
  useAuth?: any;
}) {
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

export function Authenticated({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Unauthenticated({ children: _children }: { children?: React.ReactNode }) {
  return null;
}

export function AuthLoading({ children: _children }: { children?: React.ReactNode }) {
  return null;
}

export function AuthRefreshing({ children: _children }: { children?: React.ReactNode }) {
  return null;
}
