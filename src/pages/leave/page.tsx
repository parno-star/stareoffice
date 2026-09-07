import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
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
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  CalendarDays,
  Sun,
  Plane,
  Users,
  Check,
  X,
} from "lucide-react";
import CreateLeaveRequestDialog from "./_components/CreateLeaveRequestDialog.tsx";
import LeaveRequestCard from "./_components/LeaveRequestCard.tsx";
import ReviewActions from "./_components/ReviewActions.tsx";
import OnLeaveTodayCard from "./_components/OnLeaveTodayCard.tsx";
import UpcomingLeaveList from "./_components/UpcomingLeaveList.tsx";
import BalancesTab from "./_components/BalancesTab.tsx";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { canManageTeam, isAdminRole } from "@/convex/roles.ts";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";
import BulkActionBar from "@/components/BulkActionBar.tsx";
import { useBulkSelection } from "@/hooks/use-bulk-selection.ts";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {hint ? (
            <p className="text-[10px] text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function QuotaProgress({
  used,
  quota,
  year,
}: {
  used: number;
  quota: number;
  year: number;
}) {
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const remaining = Math.max(0, quota - used);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sun className="size-4 text-amber-500" />
          Saldo cuti tahunan {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">
              {remaining}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {quota} hari
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Tersisa dari kuota tahunan Anda
            </p>
          </div>
          <Badge variant="secondary">{used} terpakai</Badge>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MyRequestsSection() {
  const requests = useQuery(api.leaveRequests.listMine, {});

  if (requests === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>Belum ada pengajuan</EmptyTitle>
          <EmptyDescription>
            Klik tombol "Ajukan Cuti" untuk mengirim permintaan pertama Anda.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <LeaveRequestCard key={r._id} request={r} allowCancel />
      ))}
    </div>
  );
}

function BulkReviewDialog({
  open,
  onOpenChange,
  decision,
  ids,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  decision: "approved" | "rejected";
  ids: Array<Id<"leaveRequests">>;
  onDone: () => void;
}) {
  const bulkReview = useMutation(api.leaveRequests.bulkReview);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { count } = await bulkReview({
        ids,
        decision,
        note: note.trim() ? note.trim() : undefined,
      });
      toast.success(
        `${count} pengajuan ${decision === "approved" ? "disetujui" : "ditolak"}`,
      );
      setNote("");
      onOpenChange(false);
      onDone();
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal memproses");
      } else {
        toast.error("Gagal memproses");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {decision === "approved"
              ? `Setujui ${ids.length} pengajuan`
              : `Tolak ${ids.length} pengajuan`}
          </DialogTitle>
          <DialogDescription>
            {decision === "approved"
              ? "Semua pengajuan terpilih akan disetujui. Tambahkan catatan jika perlu."
              : "Berikan alasan penolakan yang akan dikirim ke semua karyawan terpilih."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bulk-review-note">
            Catatan {decision === "rejected" ? "(disarankan)" : "(opsional)"}
          </Label>
          <Textarea
            id="bulk-review-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              decision === "approved"
                ? "Selamat berlibur!"
                : "Jelaskan alasan penolakan..."
            }
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="cursor-pointer"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant={decision === "approved" ? "default" : "destructive"}
            className="cursor-pointer"
          >
            {submitting
              ? "Memproses..."
              : decision === "approved"
                ? "Setujui semua"
                : "Tolak semua"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewSection() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const requests = useQuery(api.leaveRequests.listForReview, { status });

  const selectableIds = useMemo(
    () => (requests ?? []).map((r) => r._id),
    [requests],
  );
  const selection = useBulkSelection(selectableIds);
  const [bulkDecision, setBulkDecision] = useState<
    "approved" | "rejected" | null
  >(null);

  return (
    <div className="space-y-4">
      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as "pending" | "approved" | "rejected");
          selection.clear();
        }}
      >
        <TabsList>
          <TabsTrigger value="pending" className="cursor-pointer">
            Menunggu
          </TabsTrigger>
          <TabsTrigger value="approved" className="cursor-pointer">
            Disetujui
          </TabsTrigger>
          <TabsTrigger value="rejected" className="cursor-pointer">
            Ditolak
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {status === "pending" &&
      requests !== undefined &&
      requests.length > 0 ? (
        <BulkActionBar
          allSelected={selection.allSelected}
          onToggleAll={selection.toggleAll}
          selectedCount={selection.count}
          totalCount={selectableIds.length}
          onClear={selection.clear}
        >
          <Button
            size="sm"
            onClick={() => setBulkDecision("approved")}
            className="gap-1 cursor-pointer"
          >
            <Check className="size-4" />
            Setujui
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setBulkDecision("rejected")}
            className="gap-1 cursor-pointer"
          >
            <X className="size-4" />
            Tolak
          </Button>
        </BulkActionBar>
      ) : null}

      {requests === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>
              {status === "pending"
                ? "Tidak ada pengajuan menunggu"
                : status === "approved"
                  ? "Belum ada pengajuan disetujui"
                  : "Belum ada pengajuan ditolak"}
            </EmptyTitle>
            <EmptyDescription>
              {status === "pending"
                ? "Semua pengajuan sudah ditinjau. Kerja bagus!"
                : "Pengajuan yang Anda tinjau akan muncul di sini."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <LeaveRequestCard
              key={r._id}
              request={r}
              showUser
              selectable={status === "pending"}
              selected={selection.isSelected(r._id)}
              onToggleSelect={selection.toggle}
              adminActions={
                r.status === "pending" ? (
                  <ReviewActions requestId={r._id} />
                ) : null
              }
            />
          ))}
        </div>
      )}

      {bulkDecision ? (
        <BulkReviewDialog
          open={bulkDecision !== null}
          onOpenChange={(v) => {
            if (!v) setBulkDecision(null);
          }}
          decision={bulkDecision}
          ids={selection.selectedIds}
          onDone={selection.clear}
        />
      ) : null}
    </div>
  );
}

export default function LeavePage() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const stats = useQuery(api.leaveRequests.getMyStats, {});
  const pendingReviewCount = useQuery(api.leaveRequests.getPendingCount, {});

  const canReview = canManageTeam(currentUser?.role ?? null);
  const isAdmin = isAdminRole(currentUser?.role ?? null);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cuti &amp; Izin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola pengajuan cuti Anda, pantau saldo, dan lihat siapa yang
            sedang cuti.
          </p>
        </div>
        <CreateLeaveRequestDialog />
      </div>

      <DataAccessBanner category="leave" />

      {/* Balance + Stats */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {stats ? (
            <QuotaProgress
              used={stats.annualUsed}
              quota={stats.annualQuota}
              year={stats.year}
            />
          ) : (
            <Skeleton className="h-36 w-full" />
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            icon={Clock}
            label="Menunggu"
            value={stats?.pending ?? "-"}
            accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Disetujui"
            value={stats?.approved ?? "-"}
            accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={XCircle}
            label="Ditolak"
            value={stats?.rejected ?? "-"}
            accent="bg-destructive/15 text-destructive"
          />
          <StatCard
            icon={Briefcase}
            label="Total Hari Disetujui"
            value={stats?.approvedDays ?? "-"}
            accent="bg-primary/15 text-primary"
            hint="Semua jenis cuti"
          />
        </div>
      </div>

      {/* Who's on leave today + upcoming */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OnLeaveTodayCard />
        <UpcomingLeaveList />
      </div>

      {canReview ? (
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine" className="cursor-pointer gap-2">
              <CalendarDays className="size-4" />
              Pengajuan Saya
            </TabsTrigger>
            <TabsTrigger value="review" className="cursor-pointer gap-2">
              <Users className="size-4" />
              Perlu Ditinjau
              {pendingReviewCount && pendingReviewCount > 0 ? (
                <Badge variant="destructive" className="h-5 px-1.5">
                  {pendingReviewCount}
                </Badge>
              ) : null}
            </TabsTrigger>
            {isAdmin ? (
              <TabsTrigger value="balances" className="cursor-pointer gap-2">
                <Plane className="size-4" />
                Saldo Cuti
              </TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="mine" className="mt-4">
            <MyRequestsSection />
          </TabsContent>
          <TabsContent value="review" className="mt-4">
            <ReviewSection />
          </TabsContent>
          {isAdmin ? (
            <TabsContent value="balances" className="mt-4">
              <BalancesTab />
            </TabsContent>
          ) : null}
        </Tabs>
      ) : (
        <MyRequestsSection />
      )}
    </div>
  );
}
