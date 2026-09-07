import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { useTenant } from "@/hooks/use-tenant.ts";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import { Authenticated } from "convex/react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  Building2,
  Users,
  Contact,
  Shield,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  UserPlus,
  PowerOff,
  Power,
  CheckCircle2,
  XCircle,
  Globe,
  Activity,
  Clock,
  AlertTriangle,
  UserX,
  Filter,
  Trash2,
  Landmark,
  Package,
  Tag,
  Crown,
  Layout,
  SlidersHorizontal,
  FileText,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import { ROLE_VALUES, ROLE_LABELS } from "@/convex/roles";
import RoleMenuSettingsTab from "./_components/RoleMenuSettingsTab.tsx";
import PlanSettingsTab from "./_components/PlanSettingsTab.tsx";
import { PromoSettingsEmbedded } from "@/pages/promo-settings/page.tsx";
import { MembershipDashboardEmbedded } from "@/pages/membership-dashboard/page.tsx";
import LandingPageSettings from "@/pages/admin/_components/LandingPageSettings.tsx";
import FooterLinksManager from "@/pages/admin/_components/FooterLinksManager.tsx";
import OrgMenuOverridesDialog from "./_components/OrgMenuOverridesDialog.tsx";
import ResponsiblesTab from "./_components/ResponsiblesTab.tsx";
import OrphanUsersCleanup from "./_components/OrphanUsersCleanup.tsx";
import InvoicesTab from "./_components/InvoicesTab.tsx";
import TrialSettingsTab from "./_components/TrialSettingsTab.tsx";
import InitialPlatformSetup from "./_components/InitialPlatformSetup.tsx";

export default function SuperAdminPage() {
  return (
    <Authenticated>
      <SuperAdminGate />
    </Authenticated>
  );
}

// Only render the super-admin dashboard (and its super-admin-only queries) once
// we have confirmed the current user actually is a super admin. This prevents
// FORBIDDEN errors from firing during login/logout transitions or when a
// non-super-admin lands on this route.
function SuperAdminGate() {
  const { isSuperAdmin, isLoading } = useCurrentRole();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center space-y-3">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-semibold text-foreground">
            Akses ditolak
          </p>
          <p className="text-sm text-muted-foreground">
            Halaman ini hanya untuk super admin.
          </p>
        </div>
      </div>
    );
  }

  return <SuperAdminInner />;
}

function SuperAdminInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "dashboard";
  function setActiveTab(tab: string) {
    setSearchParams({ tab });
  }

  // Count of self-service org registrations awaiting approval, used to show a
  // red indicator badge on the "Organisasi" tab.
  const pendingRegistrations = useQuery(
    api.organizations.listPendingRegistrations,
    {},
  );
  const pendingCount = pendingRegistrations?.length ?? 0;

  // Count of organizations needing billing attention (expired, overdue,
  // due-soon), used to show a red indicator badge on the "Keanggotaan" tab.
  const billingAttention = useQuery(
    api.subscriptionBilling.getBillingAttentionCounts,
    {},
  );
  const attentionCount = billingAttention?.total ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Super Admin Panel
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola seluruh platform: organisasi, pengguna, dan aktivitas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="cursor-pointer gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="platform_setup" className="cursor-pointer gap-1.5 font-medium text-primary">
            <ShieldCheck className="w-4 h-4" />
            <span>Setup Super Admin & Platform</span>
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="cursor-pointer gap-1.5 relative"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Organisasi</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="cursor-pointer gap-1.5">
            <Contact className="w-4 h-4" />
            <span className="hidden sm:inline">Penanggung Jawab</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="cursor-pointer gap-1.5">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Paket</span>
          </TabsTrigger>
          <TabsTrigger value="trial" className="cursor-pointer gap-1.5">
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">Trial</span>
          </TabsTrigger>
          <TabsTrigger value="promos" className="cursor-pointer gap-1.5">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Promo</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="cursor-pointer gap-1.5">
            <Landmark className="w-4 h-4" />
            <span className="hidden sm:inline">Rekening</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="cursor-pointer gap-1.5">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Faktur</span>
          </TabsTrigger>
          <TabsTrigger
            value="monitoring"
            className="cursor-pointer gap-1.5 relative"
          >
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Keanggotaan</span>
            {attentionCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                {attentionCount > 99 ? "99+" : attentionCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="menu_access" className="cursor-pointer gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Akses Menu</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="cursor-pointer gap-1.5">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
          <TabsTrigger
            value="page_settings"
            className="cursor-pointer gap-1.5"
          >
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Landing & Footer</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="platform_setup" className="mt-4">
          <InitialPlatformSetup />
        </TabsContent>
        <TabsContent value="organizations">
          <OrganizationsTab />
        </TabsContent>
        <TabsContent value="users">
          <ResponsiblesTab />
        </TabsContent>
        <TabsContent value="plans">
          <PlanSettingsTab />
        </TabsContent>
        <TabsContent value="trial">
          <TrialSettingsTab />
        </TabsContent>
        <TabsContent value="promos" className="mt-4">
          <PromoSettingsEmbedded />
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          <BankSettingsTab />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <InvoicesTab />
        </TabsContent>
        <TabsContent value="monitoring" className="mt-4">
          <MembershipDashboardEmbedded />
        </TabsContent>
        <TabsContent value="menu_access">
          <RoleMenuSettingsTab />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogTab />
        </TabsContent>
        <TabsContent value="page_settings" className="mt-4 space-y-6">
          <LandingPageSettings />
          <FooterLinksManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────────────────────

function DashboardTab() {
  const stats = useQuery(api.superAdmin.getPlatformStats, {});
  const accessSummary = useQuery(
    api.superAdmin.getAccessGovernanceSummary,
    {},
  );

  if (!stats || typeof stats !== "object" || Array.isArray(stats)) {
    return (
      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const planDistribution = Array.isArray(stats.planDistribution) ? stats.planDistribution : [];
  const roleDistribution = Array.isArray(stats.roleDistribution) ? stats.roleDistribution : [];
  const recentOrganizations = Array.isArray(stats.recentOrganizations) ? stats.recentOrganizations : [];

  return (
    <div className="space-y-6 mt-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Organisasi"
          value={stats.totalOrganizations ?? 0}
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          label="Organisasi Aktif"
          value={stats.activeOrganizations ?? 0}
          icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
          accent="green"
        />
        <StatCard
          label="Total Pengguna"
          value={stats.totalUsers ?? 0}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Pengguna Aktif"
          value={stats.activeUsers ?? 0}
          icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
          accent="green"
        />
        <StatCard
          label="Menunggu Persetujuan"
          value={stats.pendingUsers ?? 0}
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          accent="amber"
        />
        <StatCard
          label="Dinonaktifkan"
          value={stats.suspendedUsers ?? 0}
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          accent="red"
        />
        <StatCard
          label="Org. Nonaktif"
          value={stats.inactiveOrganizations ?? 0}
          icon={<XCircle className="w-4 h-4 text-muted-foreground" />}
        />
        <StatCard
          label="Tanpa Organisasi"
          value={stats.usersWithoutOrg ?? 0}
          icon={<UserX className="w-4 h-4 text-muted-foreground" />}
        />
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribusi Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {planDistribution.map((p) => (
              <div
                key={p.plan}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {p.plan}
                  </Badge>
                </div>
                <span className="font-semibold">{p.count}</span>
              </div>
            ))}
            {planDistribution.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribusi Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {roleDistribution.slice(0, 8).map((r) => (
              <div
                key={r.role}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {ROLE_LABELS[r.role as keyof typeof ROLE_LABELS] ?? r.role}
                  </Badge>
                </div>
                <span className="font-semibold">{r.count}</span>
              </div>
            ))}
            {roleDistribution.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organisasi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentOrganizations.map((org) => (
              <div
                key={org._id}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {org.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs capitalize shrink-0"
                  >
                    {org.plan ?? "free"}
                  </Badge>
                </div>
                {org.isActive ? (
                  <Badge className="text-xs bg-green-100 text-green-700 border-green-200 shrink-0">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Nonaktif
                  </Badge>
                )}
              </div>
            ))}
            {recentOrganizations.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada organisasi</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                Status Izin Akses Data
              </CardTitle>
              {accessSummary && (accessSummary.pendingRequests ?? 0) > 0 && (
                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 shrink-0">
                  {accessSummary.pendingRequests} menunggu
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!accessSummary || typeof accessSummary !== "object" ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Coverage summary */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/50 py-2">
                    <p className="text-lg font-bold text-green-600">
                      {accessSummary.activeGrants ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Izin Aktif
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 py-2">
                    <p className="text-lg font-bold text-amber-600">
                      {accessSummary.pendingRequests ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Menunggu
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 py-2">
                    <p className="text-lg font-bold">
                      {accessSummary.coveragePercent ?? 0}%
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Cakupan
                    </p>
                  </div>
                </div>

                {/* Active grants list */}
                {Array.isArray(accessSummary.activeGrantsList) && accessSummary.activeGrantsList.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {accessSummary.activeGrantsList.map((g) => (
                      <div
                        key={g.organizationId}
                        className="flex items-center justify-between py-1"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {g.orgName}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {g.expiresAt
                            ? `s/d ${new Date(g.expiresAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}`
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Belum ada perusahaan yang memberi izin akses. Data
                      pengguna perusahaan tetap terlindungi hingga izin
                      disetujui.
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "green" | "amber" | "red";
}) {
  const accentClass =
    accent === "green"
      ? "text-green-600"
      : accent === "amber"
        ? "text-amber-600"
        : accent === "red"
          ? "text-red-600"
          : "text-foreground";

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <p className={`text-2xl font-bold ${accentClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// ─── Organizations Tab ──────────────────────────────────────────────────────

type OrgFormData = {
  name: string;
  slug: string;
  plan: string;
  website: string;
  phone: string;
  address: string;
  maxSeats: string;
};

const DEFAULT_ORG_FORM: OrgFormData = {
  name: "",
  slug: "",
  plan: "free",
  website: "",
  phone: "",
  address: "",
  maxSeats: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function OrganizationsTab() {
  const organizations = useQuery(api.organizations.listAll, {
    includeInactive: true,
  });
  const userCounts = useQuery(api.organizations.getUserCounts, {});
  // Ambil statistik platform agar kartu "Total Pengguna" di tab ini memakai
  // sumber angka yang SAMA PERSIS dengan tab Dashboard (menghindari selisih
  // akibat akun tanpa organisasi yang tidak terjumlah di userCounts per-org).
  const platformStats = useQuery(api.superAdmin.getPlatformStats, {});
  const menuOverrideCounts = useQuery(
    api.orgMenuOverrides.getCountsForAllOrgs,
    {},
  );
  const createOrg = useMutation(api.organizations.create);
  const updateOrg = useMutation(api.organizations.update);
  const deactivateOrg = useMutation(api.organizations.deactivate);
  const activateOrg = useMutation(api.superAdmin.activateOrganization);
  const deleteOrg = useMutation(api.organizations.deleteOrganization);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<Id<"organizations"> | null>(null);
  const [form, setForm] = useState<OrgFormData>(DEFAULT_ORG_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"organizations">; name: string; memberCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [menuOverrideTarget, setMenuOverrideTarget] = useState<{ id: Id<"organizations">; name: string } | null>(null);

  const editingOrg = editingId
    ? organizations?.find((o) => o._id === editingId)
    : null;

  function openCreate() {
    setForm(DEFAULT_ORG_FORM);
    setEditingId(null);
    setShowDialog(true);
  }

  function openEdit(id: Id<"organizations">) {
    const org = organizations?.find((o) => o._id === id);
    if (!org) return;
    setForm({
      name: org.name,
      slug: org.slug,
      plan: org.plan ?? "free",
      website: org.website ?? "",
      phone: org.phone ?? "",
      address: org.address ?? "",
      maxSeats: org.maxSeats ? String(org.maxSeats) : "",
    });
    setEditingId(id);
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Nama dan slug wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateOrg({
          id: editingId,
          name: form.name.trim(),
          slug: form.slug.trim(),
          plan: form.plan,
          website: form.website || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          maxSeats: form.maxSeats ? parseInt(form.maxSeats) : undefined,
        });
        toast.success("Organisasi berhasil diperbarui");
      } else {
        await createOrg({
          name: form.name.trim(),
          slug: form.slug.trim(),
          plan: form.plan,
          website: form.website || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          maxSeats: form.maxSeats ? parseInt(form.maxSeats) : undefined,
        });
        toast.success("Organisasi berhasil dibuat");
      }
      setShowDialog(false);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Terjadi kesalahan");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(org: Doc<"organizations">) {
    try {
      if (org.isActive) {
        await deactivateOrg({ id: org._id });
        toast.success("Organisasi dinonaktifkan");
      } else {
        await activateOrg({ id: org._id });
        toast.success("Organisasi diaktifkan kembali");
      }
    } catch {
      toast.error("Gagal mengubah status organisasi");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrg({ id: deleteTarget.id });
      toast.success("Organisasi berhasil dihapus");
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal menghapus organisasi");
      }
    } finally {
      setDeleting(false);
    }
  }

  const isLoading = organizations === undefined;
  const filteredOrgs = organizations?.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCount = organizations?.filter((o) => o.isActive).length ?? 0;
  // Gunakan angka total pengguna dari statistik platform (sama dengan Dashboard).
  const totalUsers = platformStats?.totalUsers;

  return (
    <div className="space-y-4 mt-4">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">
              {isLoading ? "—" : organizations.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Aktif</p>
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? "—" : activeCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total Pengguna</p>
            <p className="text-2xl font-bold">
              {totalUsers === undefined ? "—" : totalUsers}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari organisasi..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Organisasi
        </Button>
      </div>

      {/* Pending self-service registrations */}
      <PendingRegistrations />

      {/* Cleanup: accounts left without an organization */}
      <OrphanUsersCleanup />

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (filteredOrgs?.length ?? 0) === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>
              {searchQuery ? "Tidak ditemukan" : "Belum ada organisasi"}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? "Coba kata kunci lain"
                : "Buat organisasi pertama untuk memulai"}
            </EmptyDescription>
          </EmptyHeader>
          {!searchQuery && (
            <EmptyContent>
              <Button
                size="sm"
                onClick={openCreate}
                className="cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="space-y-3">
          {filteredOrgs?.map((org) => {
            const memberCount = userCounts?.[org._id] ?? 0;
            const customMenuCount = menuOverrideCounts?.[org._id] ?? 0;
            return (
              <Card
                key={org._id}
                className={!org.isActive ? "opacity-60" : ""}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {org.name}
                          </span>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {org.plan ?? "free"}
                          </Badge>
                          {org.isTrial && (
                            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                              <Rocket className="w-3 h-3 mr-1" /> Trial
                            </Badge>
                          )}
                          {org.isActive ? (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Aktif
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-xs text-muted-foreground"
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Nonaktif
                            </Badge>
                          )}
                          {customMenuCount > 0 && (
                            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">
                              <SlidersHorizontal className="w-3 h-3 mr-1" />
                              {customMenuCount} menu khusus
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            /{org.slug}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {memberCount} pengguna
                          </span>
                          {org.website && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <a
                                href={org.website}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline truncate max-w-[200px]"
                              >
                                {org.website}
                              </a>
                            </span>
                          )}
                          {org.maxSeats && (
                            <span className="text-xs">
                              Maks. {org.maxSeats} kursi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer shrink-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEdit(org._id)}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setMenuOverrideTarget({ id: org._id, name: org.name })}
                          className="cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4 mr-2" /> Menu Khusus
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => void handleToggleActive(org)}
                          className="cursor-pointer"
                        >
                          {org.isActive ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-2" /> Nonaktifkan
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-2" /> Aktifkan
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget({ id: org._id, name: org.name, memberCount })}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? `Edit: ${editingOrg?.name ?? ""}`
                : "Tambah Organisasi Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Organisasi *</Label>
              <Input
                placeholder="PT Maju Jaya"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editingId ? f.slug : slugify(name),
                  }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL) *</Label>
              <Input
                placeholder="pt-maju-jaya"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Hanya huruf kecil, angka, dan tanda hubung
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select
                value={form.plan}
                onValueChange={(v) => setForm((f) => ({ ...f, plan: v }))}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="poc">POC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telepon</Label>
                <Input
                  placeholder="021-12345678"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <Input
                placeholder="Jl. Contoh No. 1, Jakarta"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Maks. Kursi (opsional)</Label>
              <Input
                type="number"
                placeholder="100"
                value={form.maxSeats}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxSeats: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="cursor-pointer"
            >
              {saving
                ? "Menyimpan..."
                : editingId
                  ? "Simpan Perubahan"
                  : "Buat Organisasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-tenant Menu Overrides Dialog */}
      {menuOverrideTarget && (
        <OrgMenuOverridesDialog
          organizationId={menuOverrideTarget.id}
          organizationName={menuOverrideTarget.name}
          open={menuOverrideTarget !== null}
          onClose={() => setMenuOverrideTarget(null)}
        />
      )}

      {/* Delete Organization Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Hapus Organisasi
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus organisasi{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span> secara permanen?
            </p>
            {(deleteTarget?.memberCount ?? 0) > 0 && (
              <p className="text-sm text-amber-600">
                {deleteTarget?.memberCount} pengguna akan dilepaskan dari organisasi ini (akun pengguna tidak dihapus).
              </p>
            )}
            <p className="text-sm text-destructive">
              Tindakan ini tidak dapat dibatalkan. Data organisasi akan dihapus dari sistem.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="cursor-pointer">
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Pending Registrations (self-service org approval) ────────────────────────

function PendingRegistrations() {
  const pending = useQuery(api.organizations.listPendingRegistrations, {});
  const approve = useMutation(api.organizations.approveRegistration);
  const reject = useMutation(api.organizations.rejectRegistration);

  const [busyId, setBusyId] = useState<Id<"organizations"> | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{
    id: Id<"organizations">;
    name: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  async function handleApprove(id: Id<"organizations">) {
    setBusyId(id);
    try {
      await approve({ id });
      toast.success("Pendaftaran disetujui. Organisasi kini aktif.");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal menyetujui pendaftaran");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await reject({ id: rejectTarget.id, reason: rejectReason.trim() });
      toast.success("Pendaftaran ditolak");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal menolak pendaftaran");
      }
    } finally {
      setRejecting(false);
    }
  }

  // Hide the section entirely when there is nothing pending
  if (pending === undefined) {
    return <Skeleton className="h-28 w-full" />;
  }
  const pendingList = Array.isArray(pending) ? pending : [];
  if (pendingList.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
          <Clock className="w-4 h-4" />
          Pendaftaran Menunggu Persetujuan
          <Badge className="bg-amber-500 text-white border-amber-500">
            {pendingList.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingList.map((org) => {
          const isPaid = org.paymentMethod === "transfer";
          return (
            <div
              key={org._id}
              className="rounded-lg border bg-background p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {org.name}
                    </span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {org.planName ?? org.plan ?? "free"}
                    </Badge>
                    <Badge
                      className={
                        isPaid
                          ? "text-xs bg-blue-100 text-blue-700 border-blue-200"
                          : "text-xs bg-emerald-100 text-emerald-700 border-emerald-200"
                      }
                    >
                      {isPaid ? "Berbayar" : "Gratis"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Didaftarkan oleh{" "}
                    <span className="font-medium text-foreground">
                      {org.registrantName ?? "—"}
                    </span>
                    {org.registrantEmail ? ` (${org.registrantEmail})` : ""}
                  </p>
                  {org.submittedAt && (
                    <p className="text-xs text-muted-foreground">
                      Diajukan:{" "}
                      {new Date(org.submittedAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment details */}
              {isPaid && (
                <div className="rounded-md bg-muted/60 p-3 text-sm space-y-1">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Landmark className="w-4 h-4" /> Detail Pembayaran
                  </div>
                  <p className="text-muted-foreground">
                    Nominal:{" "}
                    <span className="text-foreground font-medium">
                      {org.paymentAmountLabel ?? "—"}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Referensi/Bukti transfer:{" "}
                    <span className="text-foreground font-medium break-all">
                      {org.paymentReference ?? "—"}
                    </span>
                  </p>
                </div>
              )}

              {/* Contact */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                {org.email && <span>{org.email}</span>}
                {org.phone && <span>{org.phone}</span>}
                {org.address && <span className="truncate max-w-[240px]">{org.address}</span>}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => void handleApprove(org._id)}
                  disabled={busyId === org._id}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {busyId === org._id ? "Menyetujui..." : "Setujui & Aktifkan"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setRejectTarget({ id: org._id, name: org.name })
                  }
                  disabled={busyId === org._id}
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Tolak
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>

      {/* Reject dialog */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Tolak Pendaftaran
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Tolak pendaftaran organisasi{" "}
              <span className="font-semibold text-foreground">
                {rejectTarget?.name}
              </span>
              ? Pemberi tahu akan diberikan alasan berikut.
            </p>
            <div className="space-y-1.5">
              <Label>Alasan penolakan *</Label>
              <Input
                placeholder="Contoh: Bukti transfer tidak valid"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReject()}
              disabled={rejecting}
              className="cursor-pointer"
            >
              {rejecting ? "Menolak..." : "Tolak Pendaftaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Bank Transfer Settings Tab ───────────────────────────────────────────────

type BankAccountRow = {
  _id: Id<"bankAccounts">;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  instructions: string;
  isActive: boolean;
};

function BankSettingsTab() {
  const accounts = useQuery(api.paymentSettings.listBankAccounts, {});
  const deleteAccount = useMutation(api.paymentSettings.deleteBankAccount);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccountRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(account: BankAccountRow) {
    setEditing(account);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAccount({ id: deleteTarget._id });
      toast.success("Rekening dihapus");
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal menghapus rekening");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-4 max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            Rekening Tujuan Transfer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Rekening aktif ditampilkan kepada pendaftar yang memilih paket
            berbayar saat pembayaran melalui transfer bank.
          </p>
        </div>
        <Button onClick={openAdd} className="cursor-pointer shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Rekening
        </Button>
      </div>

      {accounts === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !Array.isArray(accounts) || accounts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Landmark />
            </EmptyMedia>
            <EmptyTitle>Belum ada rekening</EmptyTitle>
            <EmptyDescription>
              Tambahkan rekening bank tujuan transfer agar pendaftar paket
              berbayar dapat melakukan pembayaran.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openAdd} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Rekening
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account._id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{account.bankName}</span>
                    {account.isActive ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </div>
                  <p className="font-mono text-sm">{account.accountNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    a.n. {account.accountHolder}
                  </p>
                  {account.instructions && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {account.instructions}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(account)}
                    className="cursor-pointer"
                    aria-label="Edit rekening"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(account)}
                    className="cursor-pointer text-destructive hover:text-destructive"
                    aria-label="Hapus rekening"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BankAccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editing}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus rekening?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Rekening {deleteTarget?.bankName} ({deleteTarget?.accountNumber})
            akan dihapus permanen dan tidak lagi ditampilkan ke pendaftar.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BankAccountFormDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccountRow | null;
}) {
  const addAccount = useMutation(api.paymentSettings.addBankAccount);
  const updateAccount = useMutation(api.paymentSettings.updateBankAccount);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  // Track which account (or "new") the form is currently loaded for so we can
  // reset the fields whenever the dialog is opened for a different target.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const currentKey = open ? (account?._id ?? "new") : null;
  if (currentKey !== loadedKey) {
    setBankName(account?.bankName ?? "");
    setAccountNumber(account?.accountNumber ?? "");
    setAccountHolder(account?.accountHolder ?? "");
    setInstructions(account?.instructions ?? "");
    setIsActive(account?.isActive ?? true);
    setLoadedKey(currentKey);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (account) {
        await updateAccount({
          id: account._id,
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          instructions: instructions.trim(),
          isActive,
        });
        toast.success("Rekening diperbarui");
      } else {
        await addAccount({
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          instructions: instructions.trim(),
          isActive,
        });
        toast.success("Rekening ditambahkan");
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal menyimpan rekening");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            {account ? "Edit Rekening" : "Tambah Rekening"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nama Bank</Label>
              <Input
                placeholder="BCA"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nomor Rekening</Label>
              <Input
                placeholder="1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Atas Nama</Label>
            <Input
              placeholder="PT Nama Perusahaan"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Instruksi Pembayaran</Label>
            <textarea
              className="w-full min-h-24 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Tuliskan instruksi transfer untuk pendaftar..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
            <div>
              <Label>Tampilkan ke pendaftar</Label>
              <p className="text-xs text-muted-foreground">
                Rekening nonaktif disembunyikan dari halaman pendaftaran.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Batal
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="cursor-pointer"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Audit Log Tab ──────────────────────────────────────────────────────────
function AuditLogTab() {
  const auditLog = useQuery(api.superAdmin.getAuditLog, {});
  const logList = Array.isArray(auditLog) ? auditLog : [];

  if (auditLog === undefined) {
    return (
      <div className="space-y-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (logList.length === 0) {
    return (
      <div className="mt-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Activity />
            </EmptyMedia>
            <EmptyTitle>Belum ada aktivitas</EmptyTitle>
            <EmptyDescription>
              Log aktivitas akan muncul di sini
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm text-muted-foreground">
        50 aktivitas terakhir
      </p>
      {logList.map(({ event, actor }) => (
        <Card key={event._id}>
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{event.summary}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span>
                    {event.timestamp
                      ? new Date(event.timestamp).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </span>
                  {actor && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {actor.name ?? "—"}
                    </span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {event.eventType}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

