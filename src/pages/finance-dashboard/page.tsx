import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  AlertTriangle,
  FileStack,
  ArrowRight,
  Timer,
  Building2,
  PieChart,
  Activity,
  CircleDollarSign,
  BarChart3,
  ShieldAlert,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell,
  PieChart as RePieChart,
  Pie,
} from "recharts";
import { motion } from "motion/react";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import { isAdminRole, canManageFinance, canApprove } from "@/convex/roles.ts";
import {
  getCategoryConfig,
  getStatusConfig,
  formatCurrency,
  getRequestTypeConfig,
  getAllCategoryOptions,
} from "../fund-requests/_lib/fund-utils.ts";
import type {
  DashboardSummary,
  SlaItem,
  PendingApprovalItem,
  RecentActivity as RecentActivityType,
} from "@/convex/financeDashboard.ts";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatSlaRemaining(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 0) return `Terlambat ${Math.abs(hours)} jam`;
  if (hours < 24) return `${hours} jam tersisa`;
  return `${Math.floor(hours / 24)} hari tersisa`;
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

const TONE_MAP = {
  blue: { icon: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  amber: { icon: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  emerald: { icon: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  red: { icon: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  teal: { icon: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10" },
  violet: { icon: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  orange: { icon: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
} as const;

type Tone = keyof typeof TONE_MAP;

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  tone: Tone;
  delay?: number;
}) {
  const c = TONE_MAP[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="rounded-xl border bg-card p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <div className={cn("rounded-lg p-2", c.bg)}>
          <Icon className={cn("size-4", c.icon)} />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </motion.div>
  );
}

// ─── SLA Card ───────────────────────────────────────────────────────────────

function SlaCard({ item, onClick }: { item: SlaItem; onClick: () => void }) {
  const typeCfg = item.requestType ? getRequestTypeConfig(item.requestType) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 space-y-2 transition-shadow hover:shadow-md cursor-pointer",
        item.isOverdue ? "border-red-500/40 bg-red-500/5" : "bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {typeCfg && (
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", typeCfg.bg, typeCfg.color, typeCfg.border)}>
                {typeCfg.label}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              Level {item.currentLevel}/{item.totalLevels}
            </span>
          </div>
        </div>
        <p className="text-sm font-bold text-primary shrink-0">{formatCurrency(item.amount)}</p>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Avatar className="size-5">
            <AvatarFallback className="text-[9px]">{getInitials(item.submitterName)}</AvatarFallback>
          </Avatar>
          <span className="truncate max-w-[100px]">{item.submitterName ?? "—"}</span>
          <ChevronRight className="size-3" />
          <span className="truncate max-w-[100px]">{item.currentApproverName ?? "—"}</span>
        </div>
        <div className={cn("flex items-center gap-1 font-medium", item.isOverdue ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
          {item.isOverdue ? <AlertTriangle className="size-3" /> : <Timer className="size-3" />}
          <span>{formatSlaRemaining(item.hoursRemaining)}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Pending Approval Card ──────────────────────────────────────────────────

function PendingCard({ item, onClick }: { item: PendingApprovalItem; onClick: () => void }) {
  const typeCfg = item.requestType ? getRequestTypeConfig(item.requestType) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 space-y-2 transition-shadow hover:shadow-md cursor-pointer",
        item.isOverdue ? "border-red-500/40 bg-red-500/5" : "border-amber-400/40 bg-amber-500/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {typeCfg && (
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", typeCfg.bg, typeCfg.color, typeCfg.border)}>
                {typeCfg.label}
              </span>
            )}
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              Level {item.level}/{item.totalLevels}
            </Badge>
          </div>
        </div>
        <p className="text-base font-bold text-primary shrink-0">{formatCurrency(item.amount)}</p>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Avatar className="size-5">
            <AvatarFallback className="text-[9px]">{getInitials(item.submitterName)}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium">{item.submitterName ?? "—"}</span>
            {item.submitterJobTitle ? <span className="ml-1 text-muted-foreground">· {item.submitterJobTitle}</span> : null}
          </div>
        </div>
        {item.slaDeadline && (
          <div className={cn("flex items-center gap-1", item.isOverdue ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
            <Timer className="size-3" />
            <span>{formatSlaRemaining(item.hoursRemaining)}</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Activity Item ──────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  submitted: { icon: FileStack, color: "text-blue-600 dark:text-blue-400", label: "Mengajukan" },
  approved: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", label: "Menyetujui" },
  rejected: { icon: XCircle, color: "text-red-600 dark:text-red-400", label: "Menolak" },
  disbursed: { icon: Banknote, color: "text-teal-600 dark:text-teal-400", label: "Mencairkan" },
  revision: { icon: RotateCw, color: "text-orange-600 dark:text-orange-400", label: "Minta Revisi" },
};

function ActivityItem({ activity }: { activity: RecentActivityType }) {
  const cfg = ACTION_CONFIG[activity.action] ?? ACTION_CONFIG.submitted;
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-muted last:border-0">
      <div className={cn("mt-0.5 rounded-full p-1.5", cfg.color === "text-blue-600 dark:text-blue-400" ? "bg-blue-500/10" : cfg.color === "text-emerald-600 dark:text-emerald-400" ? "bg-emerald-500/10" : cfg.color === "text-red-600 dark:text-red-400" ? "bg-red-500/10" : cfg.color === "text-teal-600 dark:text-teal-400" ? "bg-teal-500/10" : "bg-orange-500/10")}>
        <Icon className={cn("size-3.5", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.actorName ?? "—"}</span>{" "}
          <span className="text-muted-foreground">{cfg.label.toLowerCase()}</span>{" "}
          <span className="font-medium truncate">{activity.title}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span>{formatRelativeTime(activity.timestamp)}</span>
          <span>·</span>
          <span className="font-medium text-primary">{formatCurrency(activity.amount)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Chart Colors ───────────────────────────────────────────────────────────

const PIE_COLORS = [
  "hsl(221, 83%, 53%)", // blue
  "hsl(160, 84%, 39%)", // emerald
  "hsl(271, 91%, 65%)", // violet
  "hsl(25, 95%, 53%)",  // orange
  "hsl(199, 89%, 48%)", // sky
  "hsl(346, 77%, 50%)", // rose
  "hsl(45, 93%, 47%)",  // amber
];

// ─── Inner Dashboard ────────────────────────────────────────────────────────

function FinanceDashboardInner() {
  const navigate = useNavigate();
  const { role } = useCurrentRole();
  const isPrivileged = isAdminRole(role) || canManageFinance(role) || canApprove(role);

  const [tab, setTab] = useState("overview");

  const summary = useQuery(api.financeDashboard.getSummary, {});
  const trends = useQuery(api.financeDashboard.getMonthlyTrends, { months: 6 });
  const slaItems = useQuery(api.financeDashboard.getSlaMonitoring, {});
  const pendingApprovals = useQuery(api.financeDashboard.getMyPendingApprovals, {});
  const categoryBreakdown = useQuery(api.financeDashboard.getCategoryBreakdown, {});
  const deptBreakdown = useQuery(api.financeDashboard.getDepartmentBreakdown, {});
  const requestTypeBreakdown = useQuery(api.financeDashboard.getRequestTypeBreakdown, {});
  const recentActivity = useQuery(api.financeDashboard.getRecentActivity, { limit: 10 });
  const customCategories = useQuery(api.fundRequests.listCategories, {});

  const isLoading = summary === undefined;

  const overdueCount = slaItems?.filter((i) => i.isOverdue).length ?? 0;
  const nearDeadlineCount = slaItems?.filter((i) => !i.isOverdue && i.hoursRemaining !== null && i.hoursRemaining <= 24).length ?? 0;

  // Enrich category labels
  const enrichedCategories = categoryBreakdown?.map((c) => ({
    ...c,
    label: getCategoryConfig(c.category, customCategories ?? []).label,
  })) ?? [];

  const enrichedRequestTypes = requestTypeBreakdown?.map((r) => ({
    ...r,
    label: getRequestTypeConfig(r.requestType).label,
  })) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <LayoutDashboard className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Dashboard Keuangan</h1>
            <p className="text-sm text-muted-foreground">Monitor pengajuan, persetujuan, dan pencairan dana</p>
          </div>
        </div>
        <Button className="gap-1.5" onClick={() => navigate("/fund-requests")}>
          <CircleDollarSign className="size-4" />
          Lihat Pengajuan
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={FileStack}
            label="Total Pengajuan"
            value={summary?.totalRequests ?? 0}
            sub={formatCurrency(summary?.totalAmount ?? 0)}
            tone="blue"
            delay={0}
          />
          <SummaryCard
            icon={Clock}
            label="Menunggu Review"
            value={summary?.pendingCount ?? 0}
            sub={formatCurrency(summary?.pendingAmount ?? 0)}
            tone="amber"
            delay={0.05}
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Disetujui"
            value={summary?.approvedCount ?? 0}
            sub={formatCurrency(summary?.approvedAmount ?? 0)}
            tone="emerald"
            delay={0.1}
          />
          <SummaryCard
            icon={Banknote}
            label="Dicairkan"
            value={summary?.disbursedCount ?? 0}
            sub={formatCurrency(summary?.disbursedAmount ?? 0)}
            tone="teal"
            delay={0.15}
          />
        </div>
      )}

      {/* Alert banners */}
      {(summary?.awaitingMyApproval ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/5 px-4 py-3"
          onClick={() => setTab("pending")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setTab("pending")}
        >
          <AlertTriangle className="size-5 text-amber-500 shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">{summary?.awaitingMyApproval} pengajuan</span> menunggu persetujuan Anda
          </p>
          <Badge className="ml-auto bg-amber-500 text-white shrink-0">
            {summary?.awaitingMyApproval}
          </Badge>
        </motion.div>
      )}

      {overdueCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25, ease: "easeOut" }}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/5 px-4 py-3"
          onClick={() => setTab("sla")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setTab("sla")}
        >
          <ShieldAlert className="size-5 text-red-500 shrink-0" />
          <p className="text-sm">
            <span className="font-semibold text-red-600 dark:text-red-400">{overdueCount} pengajuan</span> melewati batas waktu SLA
            {nearDeadlineCount > 0 && (
              <span className="text-muted-foreground"> · {nearDeadlineCount} mendekati deadline</span>
            )}
          </p>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="size-3.5" />
            Ringkasan
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="size-3.5" />
            Menunggu Saya
            {(summary?.awaitingMyApproval ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {summary?.awaitingMyApproval}
              </Badge>
            )}
          </TabsTrigger>
          {isPrivileged && (
            <TabsTrigger value="sla" className="gap-1.5">
              <Timer className="size-3.5" />
              SLA Monitor
              {overdueCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                  {overdueCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="size-3.5" />
            Aktivitas
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ───────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Trend Chart */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Tren Pengajuan (6 Bulan Terakhir)</h3>
            </div>
            {trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    name="Diajukan"
                    stroke="hsl(221, 83%, 53%)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    name="Disetujui"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    name="Ditolak"
                    stroke="hsl(0, 72%, 51%)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="disbursed"
                    name="Dicairkan"
                    stroke="hsl(175, 77%, 40%)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                Belum ada data tren
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Amount Trend Bar Chart */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Banknote className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Nominal per Bulan</h3>
              </div>
              {trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trends} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val: number) =>
                        val >= 1_000_000_000
                          ? `${(val / 1_000_000_000).toFixed(1)}M`
                          : val >= 1_000_000
                          ? `${(val / 1_000_000).toFixed(0)}jt`
                          : `${(val / 1_000).toFixed(0)}rb`
                      }
                    />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Nominal"]} contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="totalAmount" name="Total Diajukan" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
                    <Bar dataKey="approvedAmount" name="Disetujui" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  Belum ada data
                </div>
              )}
            </div>

            {/* Request Type Pie Chart */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <PieChart className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Distribusi Jenis Pengajuan</h3>
              </div>
              {enrichedRequestTypes.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <RePieChart>
                      <Pie
                        data={enrichedRequestTypes}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {enrichedRequestTypes.map((_entry, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {enrichedRequestTypes.map((rt, idx) => (
                      <div key={rt.requestType} className="flex items-center gap-2 text-xs">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="truncate">{rt.label}</span>
                        <span className="ml-auto font-medium">{rt.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  Belum ada data
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Pengeluaran per Kategori</h3>
              </div>
              {enrichedCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={enrichedCategories} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val: number) =>
                        val >= 1_000_000 ? `${(val / 1_000_000).toFixed(0)}jt` : `${(val / 1_000).toFixed(0)}rb`
                      }
                    />
                    <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Nominal"]} contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="amount" name="Total" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} fillOpacity={0.6} />
                    <Bar dataKey="approvedAmount" name="Disetujui" fill="hsl(160, 84%, 39%)" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  Belum ada data
                </div>
              )}
            </div>

            {/* Department Breakdown */}
            {isPrivileged && (
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Per Departemen</h3>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {(deptBreakdown ?? []).map((dept) => {
                    const pct = (summary?.totalAmount ?? 0) > 0 ? (dept.amount / (summary?.totalAmount ?? 1)) * 100 : 0;
                    return (
                      <div key={dept.department} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium truncate max-w-[140px]">{dept.department}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{dept.count} pengajuan</span>
                            <span className="font-semibold">{formatCurrency(dept.amount)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(deptBreakdown ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">Tidak ada data</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Pending Tab ────────────────────────────────── */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Menunggu Persetujuan Saya</h3>
            {(pendingApprovals?.length ?? 0) > 0 && (
              <Badge variant="secondary">{pendingApprovals?.length} pengajuan</Badge>
            )}
          </div>
          {pendingApprovals === undefined ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (pendingApprovals ?? []).length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><CheckCircle2 /></EmptyMedia>
                <EmptyTitle>Tidak ada pengajuan menunggu</EmptyTitle>
                <EmptyDescription>Semua pengajuan sudah ditinjau.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(pendingApprovals ?? []).map((item) => (
                <PendingCard
                  key={item.requestId}
                  item={item}
                  onClick={() => navigate("/fund-requests")}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── SLA Monitor Tab ────────────────────────────── */}
        {isPrivileged && (
          <TabsContent value="sla" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">SLA Monitoring</h3>
              <div className="flex items-center gap-2">
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="size-3" />
                    {overdueCount} Terlambat
                  </Badge>
                )}
                {nearDeadlineCount > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <Timer className="size-3" />
                    {nearDeadlineCount} Mendekati Deadline
                  </Badge>
                )}
              </div>
            </div>

            {/* SLA Stats */}
            <div className="grid gap-3 grid-cols-3">
              <div className="rounded-xl border bg-card p-4 text-center space-y-1">
                <p className="text-2xl font-bold text-primary">{slaItems?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Aktif</p>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center space-y-1">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
                <p className="text-xs text-muted-foreground">Terlambat</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center space-y-1">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{nearDeadlineCount}</p>
                <p className="text-xs text-muted-foreground">{"< 24 Jam"}</p>
              </div>
            </div>

            {slaItems === undefined ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : (slaItems ?? []).length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><CheckCircle2 /></EmptyMedia>
                  <EmptyTitle>Tidak ada pengajuan aktif</EmptyTitle>
                  <EmptyDescription>Semua pengajuan sudah selesai diproses.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(slaItems ?? []).map((item) => (
                  <SlaCard
                    key={item.requestId}
                    item={item}
                    onClick={() => navigate("/fund-requests")}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* ── Activity Tab ───────────────────────────────── */}
        <TabsContent value="activity" className="mt-4">
          <div className="rounded-xl border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="size-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Aktivitas Terbaru</h3>
            </div>
            {recentActivity === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (recentActivity ?? []).length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Activity /></EmptyMedia>
                  <EmptyTitle>Belum ada aktivitas</EmptyTitle>
                  <EmptyDescription>Aktivitas pengajuan akan muncul di sini.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div>
                {(recentActivity ?? []).map((a, idx) => (
                  <ActivityItem key={`${a.requestId}-${a.action}-${idx}`} activity={a} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center space-y-4">
            <LayoutDashboard className="mx-auto size-12 text-muted-foreground" />
            <p className="text-muted-foreground">Masuk untuk melihat dashboard keuangan</p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <FinanceDashboardInner />
      </Authenticated>
    </>
  );
}
