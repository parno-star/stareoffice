import { TenantContext, type TenantContextValue } from "@/hooks/use-tenant.ts";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.users.getCurrentUser, {});
  const organization = useQuery(api.organizations.getMyOrganization, {});

  const value = useMemo<TenantContextValue>(() => {
    const isBypass = typeof window !== "undefined" && localStorage.getItem("star_demo_org_bypass") === "1";

    if (user === undefined && !isBypass) {
      return {
        organization: null,
        isLoading: true,
        isSuperAdmin: false,
        organizationId: null,
      };
    }

    // Default to super admin or demo access if user has super_admin role, no role, or demo bypass
    const isSuperAdmin = Boolean(isBypass || user?.role === "super_admin" || (!user && isBypass));

    // For super admins: provide organization context (from active organization or sample org)
    const effectiveOrganization = organization ?? null;

    return {
      organization: effectiveOrganization,
      isLoading: false,
      isSuperAdmin,
      organizationId: isSuperAdmin ? null : ((user?.organizationId as Id<"organizations">) ?? (organization?._id as Id<"organizations">) ?? null),
    };
  }, [user, organization]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}
