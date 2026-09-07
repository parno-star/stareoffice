import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { isAdminRole, isSuperAdminRole } from "@/convex/roles.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Building2,
  Users,
  Package,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  Search,
  BarChart3,
  Activity,
  Crown,
  Lightbulb,
  HardDrive,
  Sparkles,
  Mail,
  Send,
  RefreshCw,
  CalendarClock,
  Puzzle,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale/id";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import BillingTab from "./_components/BillingTab.tsx";
import AddonsTab from "./_components/AddonsTab.tsx";

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: "green" | "amber" | "red" | "blue" | "purple";
  subtitle?: string;
}) {
  const colorMap = {
    green: "text-green-600 dark:text-green-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
  };
  const valueColor = accent ? colorMap[accent] : "text-foreground";

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-1.5">
          {icon}
          <span className="text-xs font-medium text-muted-foreground truncate">
            {label}
          </span>
        </div>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Chart Colors ────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "oklch(0.42 0.12 250)", // primary
  "oklch(0.55 0.18 195)", // accent
  "oklch(0.65 0.15 160)", // chart-3
  "oklch(0.70 0.12 80)",  // chart-4
  "oklch(0.60 0.20 310)", // chart-5
  "oklch(0.50 0.10 30)",  // extra
];

// ── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab() {
  const statsQuery = useQuery(api.membershipDashboard.getOverviewStats, {});
  const distributionQuery = useQuery(api.membershipDashboard.getPlanDistribution, {});

  if (statsQuery === undefined || distributionQuery === undefined) {
    return (
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const stats = statsQuery ?? {
    totalOrgs: 0,
    activeOrgs: 0,
    totalPlans: 0,
    activePlans: 0,
    totalUsers: 0,
    pendingUpgrades: 0,
    activePromos: 0,
    totalRedemptions: 0,
  };
  const distribution = distributionQuery ?? [];

  const pieData = distribution
    .filter((d) => d.orgCount > 0)
    .map((d) => ({
      name: d.planName,
      value: d.orgCount,
    }));

  const barData = distribution.map((d) => ({
    name: d.planName,
    organisasi: d.orgCount,
    pengguna: d.totalUsers,
  }));

  return (
    <div className="space-y-6 mt-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Paket Aktif"
          value={stats.activePlans}
          icon={<Package className="size-4 text-blue-600" />}
          accent="blue"
          subtitle={`dari ${stats.totalPlans} paket`}
        />
        <StatCard
          label="Permintaan Upgrade"
          value={stats.pendingUpgrades}
          icon={<ArrowUpRight className="size-4 text-amber-600" />}
          accent="amber"
          subtitle="menunggu"
        />
        <StatCard
          label="Promo Aktif"
          value={stats.activePromos}
          icon={<Tag className="size-4 text-purple-600" />}
          accent="purple"
        />
        <StatCard
          label="Total Redemption"
          value={stats.totalRedemptions}
          icon={<TrendingUp className="size-4 text-muted-foreground" />}
        />
        <StatCard
          label="Tanpa Paket"
          value={stats.totalOrgs - distribution.filter((d) => d.planId !== null).reduce((s, d) => s + d.orgCount, 0)}
          icon={<XCircle className="size-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart - Plan Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="size-4" />
              Distribusi Organisasi per Paket
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Users & Orgs per Plan */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4" />
              Pengguna & Organisasi per Paket
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="organisasi"
                    fill="oklch(0.42 0.12 250)"
                    radius={[4, 4, 0, 0]}
                    name="Organisasi"
                  />
                  <Bar
                    dataKey="pengguna"
                    fill="oklch(0.55 0.18 195)"
                    radius={[4, 4, 0, 0]}
                    name="Pengguna"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Detail Cards */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Detail per Paket
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {distribution.map((plan, idx) => (
            <Card key={plan.planSlug}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="size-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        CHART_COLORS[idx % CHART_COLORS.length],
                    }}
                  />
                  <span className="font-semibold text-sm truncate">
                    {plan.planName}
                  </span>
                  {plan.planSlug !== "none" && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {plan.planSlug}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Organisasi</p>
                    <p className="font-bold text-lg">{plan.orgCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Pengguna</p>
                    <p className="font-bold text-lg">{plan.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Aktif</p>
                    <p className="font-semibold text-green-600">
                      {plan.activeOrgs}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Nonaktif</p>
                    <p className="font-semibold text-muted-foreground">
                      {plan.inactiveOrgs}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Organizations Tab ───────────────────────────────────────────────────────

function OrganizationsTab({ canManagePlans }: { canManagePlans: boolean }) {
  const orgList = useQuery(api.membershipDashboard.getOrgMembershipList, {});
  const plans = useQuery(api.membership.listActive, {});
  const setPlan = useMutation(api.organizations.setMembershipPlan);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [savingOrgId, setSavingOrgId] = useState<Id<"organizations"> | null>(
    null,
  );

  async function handlePlanChange(
    orgId: Id<"organizations">,
    value: string,
  ) {
    setSavingOrgId(orgId);
    try {
      await setPlan({
        organizationId: orgId,
        membershipPlanId:
          value === "none" ? null : (value as Id<"membershipPlans">),
      });
      toast.success("Paket organisasi berhasil diperbarui");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal memperbarui paket");
      }
    } finally {
      setSavingOrgId(null);
    }
  }

  if (orgList === undefined) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const safeOrgList = orgList ?? [];
  const planNames = [...new Set(safeOrgList.map((o) => o.planName))];

  const filtered = safeOrgList.filter((org) => {
    const matchSearch =
      org.orgName.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === "all" || org.planName === filterPlan;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && org.isActive) ||
      (filterStatus === "inactive" && !org.isActive);
    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <div className="space-y-4 mt-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari organisasi..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[180px] cursor-pointer">
            <SelectValue placeholder="Semua Paket" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Paket</SelectItem>
            {planNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] cursor-pointer">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Menampilkan {filtered.length} dari {orgList.length} organisasi
      </p>

      {/* Org List */}
      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>Tidak ada organisasi ditemukan</EmptyTitle>
            <EmptyDescription>
              Coba ubah filter atau kata kunci pencarian.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {filtered.map((org) => (
            <Card
              key={org.orgId}
              className={!org.isActive ? "opacity-60" : ""}
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="size-4.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">
                          {org.orgName}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {org.planName}
                        </Badge>
                        {org.isActive ? (
                          <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-muted-foreground"
                          >
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                          /{org.slug}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {org.userCount}
                          {org.maxEmployees > 0 && ` / ${org.maxEmployees}`}
                        </span>
                        {org.maxEmployees > 0 && (
                          <span>
                            <span
                              className={
                                org.usagePercent >= 90
                                  ? "text-red-600 font-semibold"
                                  : org.usagePercent >= 70
                                    ? "text-amber-600 font-semibold"
                                    : ""
                              }
                            >
                              {org.usagePercent}% terisi
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Usage bar */}
                  {org.maxEmployees > 0 && (
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-28">
                      <span className="text-[10px] text-muted-foreground">
                        Kapasitas Seat
                      </span>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            org.usagePercent >= 90
                              ? "bg-red-500"
                              : org.usagePercent >= 70
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(org.usagePercent, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Plan control (super admin only) */}
                  {canManagePlans && (
                    <div className="shrink-0 w-40">
                      <Select
                        value={org.membershipPlanId ?? "none"}
                        onValueChange={(v) =>
                          void handlePlanChange(org.orgId, v)
                        }
                        disabled={savingOrgId === org.orgId}
                      >
                        <SelectTrigger className="cursor-pointer h-9 text-xs">
                          <SelectValue placeholder="Pilih paket" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa Paket</SelectItem>
                          {plans?.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Upgrade Requests Tab ────────────────────────────────────────────────────

function UpgradeRequestsTab() {
  const requests = useQuery(
    api.membershipDashboard.getRecentUpgradeRequests,
    {},
  );

  if (requests === undefined) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const safeRequests = requests ?? [];

  if (safeRequests.length === 0) {
    return (
      <div className="mt-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowUpRight />
            </EmptyMedia>
            <EmptyTitle>Belum ada permintaan upgrade</EmptyTitle>
            <EmptyDescription>
              Permintaan upgrade dari organisasi akan muncul di sini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
    approved:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
    rejected:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
    completed:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
  };

  const statusLabel: Record<string, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    completed: "Selesai",
  };

  const typeLabel: Record<string, string> = {
    plan: "Upgrade Paket",
    users: "Tambah Pengguna",
    storage: "Tambah Penyimpanan",
  };

  return (
    <div className="space-y-3 mt-4">
      {safeRequests.map((req) => (
        <Card key={req._id}>
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{req.orgName}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {typeLabel[req.upgradeType] ?? req.upgradeType}
                  </Badge>
                  <Badge
                    className={`text-[10px] ${statusColor[req.status] ?? ""}`}
                  >
                    {statusLabel[req.status] ?? req.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    Diajukan oleh: <span className="font-medium">{req.requestedByName}</span>
                  </p>
                  {req.targetPlanName && (
                    <p>
                      Target paket:{" "}
                      <span className="font-medium">{req.targetPlanName}</span>
                    </p>
                  )}
                  {req.note && (
                    <p className="italic">Catatan: {req.note}</p>
                  )}
                  <p className="text-muted-foreground/70">
                    {format(new Date(req.requestedAt), "d MMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
              </div>
              {req.status === "pending" && (
                <Clock className="size-4 text-amber-500 shrink-0 mt-1" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Recommendations Tab ─────────────────────────────────────────────────────

function RecommendationsTab({ canManagePlans }: { canManagePlans: boolean }) {
  const recs = useQuery(api.membershipDashboard.getPlanRecommendations, {});
  const setPlan = useMutation(api.organizations.setMembershipPlan);
  const recomputeStorage = useMutation(api.organizations.recomputeStorageUsage);
  const [filter, setFilter] = useState("action"); // action | all
  const [savingOrgId, setSavingOrgId] = useState<Id<"organizations"> | null>(
    null,
  );
  const [recomputing, setRecomputing] = useState(false);

  async function handleRecompute() {
    setRecomputing(true);
    try {
      await recomputeStorage({});
      toast.success("Penggunaan penyimpanan berhasil dihitung ulang");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal menghitung ulang penyimpanan");
      }
    } finally {
      setRecomputing(false);
    }
  }

  async function applySuggestion(
    orgId: Id<"organizations">,
    planId: Id<"membershipPlans"> | null,
  ) {
    if (!planId) return;
    setSavingOrgId(orgId);
    try {
      await setPlan({ organizationId: orgId, membershipPlanId: planId });
      toast.success("Paket organisasi berhasil diperbarui");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Gagal memperbarui paket");
      }
    } finally {
      setSavingOrgId(null);
    }
  }

  if (recs === undefined) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const safeRecs = recs ?? [];
  const needsAction = safeRecs.filter((r) => r.recommendation !== "ok");
  const upgradeCount = safeRecs.filter((r) => r.recommendation === "upgrade").length;
  const downgradeCount = safeRecs.filter(
    (r) => r.recommendation === "downgrade",
  ).length;
  const noPlanCount = safeRecs.filter((r) => r.recommendation === "no_plan").length;
  const okCount = safeRecs.filter((r) => r.recommendation === "ok").length;

  const shown = filter === "action" ? needsAction : safeRecs;

  const meta: Record<
    string,
    { label: string; badge: string; icon: React.ReactNode }
  > = {
    upgrade: {
      label: "Perlu Upgrade",
      badge:
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
      icon: <ArrowUpRight className="size-4 text-red-600" />,
    },
    downgrade: {
      label: "Bisa Downgrade",
      badge:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
      icon: <ArrowDownRight className="size-4 text-blue-600" />,
    },
    no_plan: {
      label: "Belum Ada Paket",
      badge:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
      icon: <Package className="size-4 text-amber-600" />,
    },
    ok: {
      label: "Sesuai",
      badge:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
      icon: <CheckCircle2 className="size-4 text-green-600" />,
    },
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Perlu Upgrade"
          value={upgradeCount}
          icon={<ArrowUpRight className="size-4 text-red-600" />}
          accent="red"
        />
        <StatCard
          label="Bisa Downgrade"
          value={downgradeCount}
          icon={<ArrowDownRight className="size-4 text-blue-600" />}
          accent="blue"
        />
        <StatCard
          label="Belum Ada Paket"
          value={noPlanCount}
          icon={<Package className="size-4 text-amber-600" />}
          accent="amber"
        />
        <StatCard
          label="Sudah Sesuai"
          value={okCount}
          icon={<CheckCircle2 className="size-4 text-green-600" />}
          accent="green"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[220px] cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="action">Perlu Tindakan</SelectItem>
            <SelectItem value="all">Semua Organisasi</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Menampilkan {shown.length} organisasi
        </p>
        {canManagePlans && (
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto cursor-pointer"
            onClick={handleRecompute}
            disabled={recomputing}
          >
            {recomputing ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Hitung Ulang Penyimpanan
          </Button>
        )}
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyTitle>Semua paket sudah sesuai</EmptyTitle>
            <EmptyDescription>
              Tidak ada organisasi yang memerlukan perubahan paket saat ini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {shown.map((r) => {
            const m = meta[r.recommendation] ?? meta.ok;
            return (
              <Card
                key={r.orgId}
                className={!r.isActive ? "opacity-60" : ""}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {m.icon}
                        <span className="font-semibold text-sm truncate">
                          {r.orgName}
                        </span>
                        <Badge className={`text-[10px] ${m.badge}`}>
                          {m.label}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {r.currentPlanName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        {r.reason}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {r.userCount}
                          {r.maxEmployees > 0
                            ? ` / ${r.maxEmployees} (${r.employeePercent}%)`
                            : " (tanpa batas)"}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="size-3" />
                          {r.storageMb} MB
                          {r.maxStorageMb > 0
                            ? ` / ${r.maxStorageMb} MB (${r.storagePercent}%)`
                            : " (tanpa batas)"}
                        </span>
                      </div>
                    </div>
                    {canManagePlans &&
                      r.suggestedPlanId &&
                      r.recommendation !== "ok" && (
                        <Button
                          size="sm"
                          className="cursor-pointer shrink-0"
                          disabled={savingOrgId === r.orgId}
                          onClick={() =>
                            void applySuggestion(r.orgId, r.suggestedPlanId)
                          }
                        >
                          <Lightbulb className="size-3.5 mr-1.5" />
                          {savingOrgId === r.orgId
                            ? "Menerapkan..."
                            : `Terapkan ${r.suggestedPlanName}`}
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Content ────────────────────────────────────────────────────────────

function MembershipDashboardContent({ embedded = false }: { embedded?: boolean }) {
  const currentUser = useQuery(api.users.getCurrentUser, {});

  if (currentUser === undefined) {
    return (
      <div
        className={
          embedded
            ? "space-y-6"
            : "mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6"
        }
      >
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdminRole(currentUser?.role)) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlert />
            </EmptyMedia>
            <EmptyTitle>Akses dibatasi</EmptyTitle>
            <EmptyDescription>
              Hanya Administrator atau Super Admin yang dapat mengakses
              dashboard pemantauan keanggotaan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const canManagePlans = isSuperAdminRole(currentUser?.role);

  return (
    <div
      className={
        embedded
          ? "space-y-6"
          : "mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6"
      }
    >
      {/* Header */}
      {!embedded && (
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Crown className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dashboard Pemantauan Keanggotaan
            </h1>
            <p className="text-sm text-muted-foreground">
              Pantau paket, organisasi, penggunaan, dan permintaan upgrade.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="cursor-pointer gap-1.5">
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Ringkasan</span>
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="cursor-pointer gap-1.5"
          >
            <Building2 className="size-4" />
            <span className="hidden sm:inline">Organisasi</span>
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="cursor-pointer gap-1.5"
          >
            <Lightbulb className="size-4" />
            <span className="hidden sm:inline">Rekomendasi</span>
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="cursor-pointer gap-1.5">
            <Activity className="size-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </TabsTrigger>
          {canManagePlans && (
            <TabsTrigger value="billing" className="cursor-pointer gap-1.5">
              <CalendarClock className="size-4" />
              <span className="hidden sm:inline">Penagihan</span>
            </TabsTrigger>
          )}
          {canManagePlans && (
            <TabsTrigger value="addons" className="cursor-pointer gap-1.5">
              <Puzzle className="size-4" />
              <span className="hidden sm:inline">Add-on</span>
            </TabsTrigger>
          )}
          {canManagePlans && (
            <TabsTrigger value="alerts" className="cursor-pointer gap-1.5">
              <Mail className="size-4" />
              <span className="hidden sm:inline">Email Peringatan</span>
            </TabsTrigger>
          )}
          {canManagePlans && (
            <TabsTrigger value="letter-email" className="cursor-pointer gap-1.5">
              <Send className="size-4" />
              <span className="hidden sm:inline">Email Surat</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="organizations">
          <OrganizationsTab canManagePlans={canManagePlans} />
        </TabsContent>
        <TabsContent value="recommendations">
          <RecommendationsTab canManagePlans={canManagePlans} />
        </TabsContent>
        <TabsContent value="upgrades">
          <UpgradeRequestsTab />
        </TabsContent>
        {canManagePlans && (
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
        )}
        {canManagePlans && (
          <TabsContent value="addons">
            <AddonsTab />
          </TabsContent>
        )}
        {canManagePlans && (
          <TabsContent value="alerts">
            <AlertEmailSettingsTab />
          </TabsContent>
        )}
        {canManagePlans && (
          <TabsContent value="letter-email">
            <LetterEmailSettingsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ── Page Export ──────────────────────────────────────────────────────────────

function AlertEmailSettingsTab() {
  const settings = useQuery(api.alertEmailSettings.get, {});
  const update = useMutation(api.alertEmailSettings.update);

  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Seed local state once when the query first resolves
  if (settings && !initialized) {
    setSenderEmail(settings.senderEmail);
    setSenderName(settings.senderName);
    setEmailEnabled(settings.emailEnabled);
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim(),
        emailEnabled,
      });
      toast.success("Pengaturan email peringatan disimpan");
    } catch (error) {
      const msg =
        error instanceof ConvexError
          ? (error.data as { message: string }).message
          : "Gagal menyimpan pengaturan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (settings === undefined) {
    return <Skeleton className="h-64 w-full max-w-2xl" />;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-primary" />
            Email Peringatan Batas Paket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Saat penggunaan karyawan atau penyimpanan sebuah organisasi mencapai
            80%, 90%, dan 95% dari batas paketnya, sistem mengirim notifikasi
            dalam aplikasi ke semua Administrator organisasi dan Super Admin.
            Aktifkan email di bawah untuk juga mengirim peringatan melalui email.
          </p>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Kirim email peringatan</Label>
              <p className="text-xs text-muted-foreground">
                Notifikasi dalam aplikasi selalu aktif. Ini hanya mengatur email.
              </p>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderName" className="text-sm font-medium">
              Nama pengirim
            </Label>
            <Input
              id="senderName"
              type="text"
              placeholder="Star e-Office"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nama ini muncul sebagai pengirim di kotak masuk penerima (mis. nama
              perusahaan Anda). Berlaku untuk email faktur, bukti pelunasan, dan
              peringatan batas paket. Jika kosong, digunakan "Star e-Office".
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderEmail" className="text-sm font-medium">
              Email pengirim (harus terverifikasi)
            </Label>
            <Input
              id="senderEmail"
              type="email"
              placeholder="peringatan@perusahaananda.com"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Verifikasi alamat atau domain pengirim terlebih dahulu di tab
              Emails. Jika kosong atau belum diverifikasi, email dilewati dengan
              aman dan hanya notifikasi dalam aplikasi yang dikirim.
            </p>
          </div>

          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="cursor-pointer"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function MembershipDashboardEmbedded() {
  return <MembershipDashboardContent embedded />;
}

/**
 * Super admin: configure the verified sender used by the "Kirim Surat via Email"
 * feature. Separate from the plan-limit alert sender so each can use its own
 * verified address and toggle.
 */
function LetterEmailSettingsTab() {
  const settings = useQuery(api.letterEmailSettings.get, {});
  const update = useMutation(api.letterEmailSettings.update);

  const [senderEmail, setSenderEmail] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  if (settings && !initialized) {
    setSenderEmail(settings.senderEmail);
    setEmailEnabled(settings.emailEnabled);
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({ senderEmail: senderEmail.trim(), emailEnabled });
      toast.success("Pengaturan email surat disimpan");
    } catch (error) {
      const msg =
        error instanceof ConvexError
          ? (error.data as { message: string }).message
          : "Gagal menyimpan pengaturan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (settings === undefined) {
    return <Skeleton className="h-64 w-full max-w-2xl" />;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="size-4 text-primary" />
            Alamat Pengirim Email Surat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Saat karyawan mengirim surat melalui fitur "Kirim via Email", email
            dikirim dari alamat resmi di bawah ini (nama pengirim tetap memakai
            nama karyawan, dan balasan diarahkan ke email karyawan). Pengaturan
            ini terpisah dari Email Peringatan Batas Paket.
          </p>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Aktifkan kirim surat via email</Label>
              <p className="text-xs text-muted-foreground">
                Jika nonaktif, tombol kirim email pada surat akan menampilkan pesan
                bahwa fitur belum diaktifkan.
              </p>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="letterSenderEmail" className="text-sm font-medium">
              Email pengirim (harus terverifikasi)
            </Label>
            <Input
              id="letterSenderEmail"
              type="email"
              placeholder="surat@perusahaananda.com"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Verifikasi alamat atau domain pengirim terlebih dahulu di tab Emails.
              Jika kosong, belum diverifikasi, atau fitur dinonaktifkan, pengiriman
              surat via email akan ditolak dengan pesan yang jelas.
            </p>
          </div>

          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="cursor-pointer"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MembershipDashboardPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk mengakses dashboard.
        </div>
      </Unauthenticated>
      <Authenticated>
        <MembershipDashboardContent />
      </Authenticated>
    </>
  );
}
