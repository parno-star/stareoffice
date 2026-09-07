import React from "react";
import { ConvexProvider as PostgresConvexProvider } from "convex/react";

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return <PostgresConvexProvider>{children}</PostgresConvexProvider>;
}
