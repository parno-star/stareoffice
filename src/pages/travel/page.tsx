import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
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
import { Input } from "@/components/ui/input.tsx";
import { DateField } from "@/components/ui/date-field.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Plane,
  Clock,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Filter,
  Check,
  X,
} from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import CreateTravelRequestDialog from "./_components/CreateTravelRequestDialog.tsx";
import TravelRequestCard from "./_components/TravelRequestCard.tsx";
import TravelAnalyticsPanel from "./_components/TravelAnalyticsPanel.tsx";
import {
  STATUS_CONFIG,
  formatCurrency,
} from "./_lib/travel-utils.ts";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import BulkActionBar from "@/components/BulkActionBar.tsx";
import { useBulkSelection } from "@/hooks/use-bulk-selection.ts";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 truncate text-xl font-bold">{value}</p>
            {hint ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MyTripsTab({ currentUserId }: { currentUserId: Id<"users"> | null }) {
  const [status, setStatus] = useState("all");
  const requests = useQuery(api.travel.listMine, { status });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Riwayat Perjalanan Saya</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
              <SelectItem key={v} value={v}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {requests === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : !requests || requests.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plane />
            </EmptyMedia>
            <EmptyTitle>Belum ada perjalanan</EmptyTitle>
            <EmptyDescription>
              Ajukan perjalanan dinas pertama Anda untuk mulai melacak rencana,
              anggaran, dan laporan di satu tempat.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateTravelRequestDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <TravelRequestCard
              key={r._id}
              request={r}
              isAdmin={false}
              canApprove={false}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TravelBulkReviewDialog({
  decision,
  ids,
  onOpenChange,
  onDone,
}: {
  decision: "approved" | "rejected";
  ids: Array<Id<"travelRequests">>;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const bulkReview = useMutation(api.travel.bulkReview);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (ids.length === 0) {
      toast.error("Pilih pengajuan terlebih dahulu");
      return;
    }
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
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {decision === "approved"
              ? `Setujui ${ids.length} pengajuan`
              : `Tolak ${ids.length} pengajuan`}
          </DialogTitle>
          <DialogDescription>
            {decision === "approved"
              ? "Semua pengajuan perjalanan terpilih akan disetujui."
              : "Berikan alasan penolakan yang akan dikirim ke pengaju."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="travel-bulk-note">
            Catatan {decision === "rejected" ? "(disarankan)" : "(opsional)"}
          </Label>
          <Textarea
            id="travel-bulk-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              decision === "approved"
                ? "Selamat bertugas!"
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

function ApprovalsTab({
  currentUserId,
}: {
  currentUserId: Id<"users"> | null;
}) {
  const [status, setStatus] = useState("pending");
  const requests = useQuery(api.travel.listForReview, { status });

  const selectableIds = useMemo(
    () => (status === "pending" ? (requests ?? []).map((r) => r._id) : []),
    [requests, status],
  );
  const selection = useBulkSelection(selectableIds);
  const [bulkDecision, setBulkDecision] = useState<
    "approved" | "rejected" | null
  >(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Pengajuan Tim</h2>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            selection.clear();
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
              <SelectItem key={v} value={v}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : !requests || requests.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle2 />
            </EmptyMedia>
            <EmptyTitle>Tidak ada pengajuan</EmptyTitle>
            <EmptyDescription>
              Tidak ada pengajuan perjalanan dinas tim yang perlu ditinjau.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <TravelRequestCard
              key={r._id}
              request={r}
              isAdmin={false}
              canApprove={status === "pending"}
              currentUserId={currentUserId}
              selectable={status === "pending"}
              selected={selection.isSelected(r._id)}
              onToggleSelect={selection.toggle}
            />
          ))}
        </div>
      )}

      {bulkDecision ? (
        <TravelBulkReviewDialog
          decision={bulkDecision}
          ids={selection.selectedIds}
          onOpenChange={(v) => {
            if (!v) setBulkDecision(null);
          }}
          onDone={selection.clear}
        />
      ) : null}
    </div>
  );
}

function AllRequestsTab({
  currentUserId,
}: {
  currentUserId: Id<"users"> | null;
}) {
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const requests = useQuery(api.travel.listAll, {
    status,
    department,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const departments = useQuery(api.travel.listDepartments, {});

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-1 text-xs">
              <Filter className="size-3" /> Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                  <SelectItem key={v} value={v}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Departemen</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {(departments ?? []).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Dari Tanggal</Label>
            <DateField
              value={startDate}
              onChange={(v) => setStartDate(v)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai Tanggal</Label>
            <DateField
              value={endDate}
              onChange={(v) => setEndDate(v)}
            />
          </div>
        </CardContent>
      </Card>
      {requests === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : !requests || requests.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plane />
            </EmptyMedia>
            <EmptyTitle>Tidak ada pengajuan</EmptyTitle>
            <EmptyDescription>
              Tidak ada perjalanan dinas dengan filter yang dipilih.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Menampilkan {requests.length} perjalanan · Total estimasi{" "}
            {formatCurrency(
              requests.reduce((s, r) => s + r.estimatedCost, 0),
            )}
          </p>
          <div className="space-y-3">
            {requests.map((r) => (
              <TravelRequestCard
                key={r._id}
                request={r}
                isAdmin
                canApprove={false}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TravelPageInner() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const { role } = useCurrentRole();
  const stats = useQuery(api.travel.getStats, {});

  const isAdmin = role === "super_admin" || role === "admin";
  const canManageTeam = isAdmin || role === "department_head" || role === "hr_manager" || role === "team_lead";

  if (!currentUser || !stats) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const currentUserId = currentUser?._id ?? null;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Perjalanan Dinas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajukan, kelola itinerary, dan laporkan perjalanan dinas perusahaan.
          </p>
        </div>
        <CreateTravelRequestDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Menunggu Persetujuan"
          value={String(stats?.myPending ?? 0)}
          hint="pengajuan Anda"
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Disetujui"
          value={String(stats?.myApproved ?? 0)}
          hint={`${stats?.myUpcomingCount ?? 0} akan datang`}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={MapPin}
          label="Selesai"
          value={String(stats?.myCompleted ?? 0)}
          hint={`${stats?.myTotalTrips ?? 0} total perjalanan`}
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        {canManageTeam ? (
          <StatCard
            icon={AlertCircle}
            label="Menunggu Review Tim"
            value={String(stats?.adminPendingCount ?? 0)}
            hint={`${stats?.adminInProgressCount ?? 0} sedang berjalan`}
            accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          />
        ) : (
          <StatCard
            icon={Plane}
            label="Estimasi Total"
            value={formatCurrency(stats?.myTotalEstimated ?? 0)}
            hint="seluruh perjalanan"
            accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />
        )}
      </div>

      <Tabs defaultValue="mine" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="inline-flex w-max flex-nowrap">
            <TabsTrigger value="mine" className="cursor-pointer">
              Perjalanan Saya
            </TabsTrigger>
            {canManageTeam ? (
              <TabsTrigger value="approvals" className="cursor-pointer">
                Persetujuan Tim
              </TabsTrigger>
            ) : null}
            {isAdmin ? (
              <>
                <TabsTrigger value="all" className="cursor-pointer">
                  Semua Pengajuan
                </TabsTrigger>
                <TabsTrigger value="analytics" className="cursor-pointer">
                  Analitik
                </TabsTrigger>
              </>
            ) : null}
          </TabsList>
        </div>

        <TabsContent value="mine">
          <MyTripsTab currentUserId={currentUserId} />
        </TabsContent>
        {canManageTeam ? (
          <TabsContent value="approvals">
            <ApprovalsTab currentUserId={currentUserId} />
          </TabsContent>
        ) : null}
        {isAdmin ? (
          <>
            <TabsContent value="all">
              <AllRequestsTab currentUserId={currentUserId} />
            </TabsContent>
            <TabsContent value="analytics">
              <TravelAnalyticsPanel />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}

export default function TravelPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk mengajukan perjalanan dinas.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <TravelPageInner />
      </Authenticated>
    </>
  );
}
