/**
 * useSuperAdminAccess — hook terpusat untuk bypass akses super_admin.
 *
 * Tujuan:
 *  - Super admin dapat mengakses semua halaman untuk evaluasi dan testing.
 *  - Data tetap terisolasi per-deployment (single-tenant): super admin hanya
 *    melihat data organisasinya sendiri, tidak ada akses lintas-tenant.
 *  - Setiap bypass ditandai dengan `bypassedViaRole: true` agar UI dapat
 *    menampilkan banner "Super Admin Mode" yang jelas.
 *
 * Cara pakai:
 *   const { isSuperAdmin, hasAccess, bypassedViaRole } = useSuperAdminAccess(normalAccess);
 *   if (!hasAccess) return <AccessDenied />;
 *   if (bypassedViaRole) return <><SuperAdminBanner /><Content /></>;
 */
import { useCurrentRole } from "@/hooks/use-current-role.ts";

type AccessResult = {
  /** Apakah user adalah super_admin */
  isSuperAdmin: boolean;
  /** Apakah user boleh masuk ke halaman ini (role normal ATAU super_admin bypass) */
  hasAccess: boolean;
  /** true jika user masuk via super_admin bypass (bukan via role normal) */
  bypassedViaRole: boolean;
  /** Masih loading data user/role */
  isLoading: boolean;
};

/**
 * @param normalAccess - apakah user punya akses normal ke halaman ini
 *                       (boleh undefined/false saat loading)
 */
export function useSuperAdminAccess(normalAccess: boolean | undefined): AccessResult {
  const { isSuperAdmin, isLoading } = useCurrentRole();

  if (isLoading || normalAccess === undefined) {
    return { isSuperAdmin, hasAccess: false, bypassedViaRole: false, isLoading: true };
  }

  const bypassedViaRole = !normalAccess && isSuperAdmin;
  const hasAccess = normalAccess || isSuperAdmin;

  return { isSuperAdmin, hasAccess, bypassedViaRole, isLoading: false };
}
