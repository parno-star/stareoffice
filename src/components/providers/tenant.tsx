import { TenantContext, type TenantContextValue } from "@/hooks/use-tenant.ts";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.users.getCurrentUser, {});
  const organization = useQuery(api.organizations.getMyOrganization, {});

  const value = useMemo<TenantContextValue>(() => {
    if (user === undefined) {
      return {
        organization: null,
        isLoading: true,
        isSuperAdmin: false,
        organizationId: null,
      };
    }

    const isSuperAdmin = user?.role === "super_admin";

    // For super admins: default to platform-wide ("Semua Organisasi")
    // unless they explicitly have a viewingOrganizationId set
    const effectiveOrganization = isSuperAdmin
      ? (user?.viewingOrganizationId ? (organization ?? null) : null)
      : (organization ?? null);

    return {
      organization: effectiveOrganization,
      isLoading: false,
      isSuperAdmin,
      organizationId: isSuperAdmin ? null : ((user?.organizationId as Id<"organizations">) ?? null),
    };
  }, [user, organization]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}
