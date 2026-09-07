import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Wallet,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  FileStack,
  CircleDollarSign,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import { isAdminRole, canManageFinance, canApprove } from "@/convex/roles.ts";
import type { FundRequestWithDetails } from "@/convex/fundRequests.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  getCategoryConfig,
  getStatusConfig,
  formatCurrency,
  formatDate,
  getAllCategoryOptions,
  getRequestTypeConfig,
} from "./_lib/fund-utils.ts";
import CreateFundRequestDialog from "./_components/CreateFundRequestDialog.tsx";
import UnifiedFundRequestForm from "./_components/UnifiedFundRequestForm.tsx";
import FundRequestDetail from "./_components/FundRequestDetail.tsx";
import FundRecap from "./_components/FundRecap.tsx";
import ManageCategoriesDialog from "./_components/ManageCategoriesDialog.tsx";
import BulkApprovePanel from "./_components/BulkApprovePanel.tsx";

// ─── helpers ─────────────────────────────────────────────────────────────────
function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  tone: "blue" | "amber" | "emerald" | "red" | "teal";
}) {
  const colors = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    red: "text-red-600 dark:text-red-400 bg-red-500/10",
    teal: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
  };
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className={cn("rounded-lg p-2", colors[tone])}>
          <Icon className={cn("size-4", colors[tone].split(" ")[0])} />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({
  req,
  customs,
  onClick,
}: {
  req: FundRequestWithDetails;
  customs?: ReadonlyArray<{ key: string; label: string; color: string; isActive?: boolean }>;
  onClick: () => void;
}) {
  const statusCfg = getStatusConfig(req.status);
  const catCfg = getCategoryConfig(req.category, customs);
  const typeCfg = req.requestType ? getRequestTypeConfig(req.requestType) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{req.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {typeCfg && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full border", typeCfg.bg, typeCfg.color, typeCfg.border)}>
                {typeCfg.label}
              </span>
            )}
            <span className={cn("text-xs px-2 py-0.5 rounded-full border", catCfg.bg, catCfg.color, catCfg.border)}>
              {catCfg.label}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <p className="text-base font-bold text-primary">{formatCurrency(req.amount)}</p>
          <div className="flex items-center gap-1">
            <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
            <span className={cn("text-[11px]", statusCfg.color)}>{statusCfg.label}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Avatar className="size-5">
            {req.submitterAvatar ? <AvatarImage src={req.submitterAvatar} /> : null}
            <AvatarFallback className="text-[9px]">{getInitials(req.submitterName)}</AvatarFallback>
          </Avatar>
          <span>{req.submitterName ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="size-3" />
          <span>{req.neededBy ? formatDate(req.neededBy) : "—"}</span>
        </div>
      </div>

      {/* Approval progress */}
      {req.totalApprovalLevels > 0 && req.status !== "draft" ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Level {Math.min(req.currentApprovalLevel, req.totalApprovalLevels)} / {req.totalApprovalLevels}</span>
            {req.currentApprover ? (
              <span>Menunggu: {req.currentApprover.name}</span>
            ) : null}
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                req.status === "approved" || req.status === "disbursed"
                  ? "bg-emerald-500"
                  : req.status === "rejected"
                  ? "bg-red-500"
                  : "bg-amber-400",
              )}
              style={{
                width: `${(Math.min(req.currentApprovalLevel - 1, req.totalApprovalLevels) / req.totalApprovalLevels) * 100}%`,
              }}
            />
          </div>
        </div>
      ) : null}
    </button>
  );
}

// ─── Inner (authenticated) ────────────────────────────────────────────────────
function FundRequestsInner() {
  const { role, userId } = useCurrentRole();
  const isPrivileged = isAdminRole(role) || canManageFinance(role) || canApprove(role);
  const canDisburse = canManageFinance(role) || isAdminRole(role);
  const canManageCategories = isAdminRole(role);

  const [tab, setTab] = useState("requests");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [unifiedFormOpen, setUnifiedFormOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<FundRequestWithDetails | null>(null);

  const requests = useQuery(api.fundRequests.list, { statusFilter, categoryFilter });
  const pendingForMe = useQuery(api.fundRequests.listPendingForMe, {});
  const statsData = useQuery(api.fundRequests.stats, {});
  const customCategories = useQuery(api.fundRequests.listCategories, {});
  const categoryOptions = useMemo(
    () => getAllCategoryOptions(customCategories ?? []),
    [customCategories],
  );

  const filtered = useMemo(() => {
    if (!requests) return [];
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.submitterName?.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q),
    );
  }, [requests, search]);

  const isLoading = requests === undefined || statsData === undefined;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <CircleDollarSign className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Pengajuan Dana</h1>
            <p className="text-sm text-muted-foreground">Ajukan dan kelola dana operasional</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManageCategories ? (
            <Button
              variant="secondary"
              className="gap-1.5"
              onClick={() => setManageCategoriesOpen(true)}
            >
              <Tags className="size-4" />
              Tambah Kategori
            </Button>
          ) : null}
          <Button className="gap-1.5" onClick={() => setUnifiedFormOpen(true)}>
            <Plus className="size-4" />
            Buat Pengajuan
          </Button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`stat-skel-${i}`} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FileStack}
            label="Total Pengajuan"
            value={statsData?.total ?? 0}
            tone="blue"
          />
          <StatCard
            icon={Clock}
            label="Menunggu Review"
            value={statsData?.byStatus?.["in_review"] ?? 0}
            sub={formatCurrency(statsData?.pendingAmount ?? 0)}
            tone="amber"
          />
          <StatCard
            icon={CheckCircle2}
            label="Disetujui"
            value={statsData?.byStatus?.["approved"] ?? 0}
            sub={formatCurrency(statsData?.approvedAmount ?? 0)}
            tone="emerald"
          />
          <StatCard
            icon={Banknote}
            label="Sudah Dicairkan"
            value={statsData?.byStatus?.["disbursed"] ?? 0}
            tone="teal"
          />
        </div>
      )}

      {/* Pending for me - bulk approval */}
      {(pendingForMe?.length ?? 0) > 0 ? (
        <BulkApprovePanel requests={pendingForMe ?? []} />
      ) : null}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="requests">Daftar Pengajuan</TabsTrigger>
          {isPrivileged ? <TabsTrigger value="recap">Rekapitulasi</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="requests" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengajuan…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">Dalam Review</SelectItem>
                <SelectItem value="revision_needed">Perlu Revisi</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="disbursed">Dicairkan</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categoryOptions.map((opt, idx) => (
                  <SelectItem key={`${opt.key}-${idx}`} value={opt.key}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`req-skel-${i}`} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Wallet /></EmptyMedia>
                <EmptyTitle>Belum ada pengajuan</EmptyTitle>
                <EmptyDescription>
                  {search ? "Tidak ada pengajuan yang cocok dengan pencarian." : "Buat pengajuan dana pertama Anda."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" onClick={() => setUnifiedFormOpen(true)}>
                  <Plus className="size-4 mr-1" />
                  Buat Pengajuan
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((req, idx) => (
                <RequestCard
                  key={req._id ? `${req._id}-${idx}` : `req-${idx}`}
                  req={req}
                  customs={customCategories ?? []}
                  onClick={() => setSelectedReq(req)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {isPrivileged ? (
          <TabsContent value="recap" className="mt-4">
            <FundRecap />
          </TabsContent>
        ) : null}
      </Tabs>

      {/* Dialogs */}
      <UnifiedFundRequestForm open={unifiedFormOpen} onClose={() => setUnifiedFormOpen(false)} />
      <CreateFundRequestDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ManageCategoriesDialog
        open={manageCategoriesOpen}
        onClose={() => setManageCategoriesOpen(false)}
      />
      <FundRequestDetail
        request={selectedReq}
        open={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
        myUserId={userId as Id<"users"> | null}
        isPrivileged={isPrivileged}
        canDisburse={canDisburse}
      />
    </div>
  );
}

export default function FundRequestsPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`auth-skel-${i}`} className="h-24" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center space-y-4">
            <CircleDollarSign className="mx-auto size-12 text-muted-foreground" />
            <p className="text-muted-foreground">Masuk untuk melihat pengajuan dana</p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <FundRequestsInner />
      </Authenticated>
    </>
  );
}
