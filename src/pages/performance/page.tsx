import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Target,
  ClipboardCheck,
  Inbox,
  Star,
  FileSignature,
  BarChart3,
  History,
  Users as UsersIcon,
  Send,
  Trash2,
  BellRing,
} from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import CreateReviewDialog from "./_components/CreateReviewDialog.tsx";
import ReviewCard from "./_components/ReviewCard.tsx";
import BulkActionBar from "@/components/BulkActionBar.tsx";
import { useBulkSelection } from "@/hooks/use-bulk-selection.ts";
import { ratingColor, ratingLabel } from "./_lib/performance-utils.ts";
import { canManageTeam, isAdminRole } from "@/convex/roles.ts";

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
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate text-xl font-bold">{value}</p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function MyReviewsSection() {
  const reviews = useQuery(api.performance.listMine, {});

  if (reviews === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileSignature />
          </EmptyMedia>
          <EmptyTitle>Belum ada penilaian</EmptyTitle>
          <EmptyDescription>
            Penilaian kinerja Anda akan muncul di sini setelah atasan
            mengirimnya.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewCard key={r._id} review={r} perspective="reviewer" />
      ))}
    </div>
  );
}

function AsReviewerSection() {
  const [status, setStatus] = useState<"draft" | "submitted" | "acknowledged">(
    "draft",
  );
  const reviews = useQuery(api.performance.listAsReviewer, { status });

  const selectableIds = (reviews ?? []).map((r) => r._id);
  const {
    selectedIds,
    count,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allSelected,
  } = useBulkSelection(selectableIds);

  const bulkSubmit = useMutation(api.performance.bulkSubmit);
  const bulkRemind = useMutation(api.performance.bulkRemind);
  const bulkRemove = useMutation(api.performance.bulkRemove);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Reset selection whenever the active status tab changes.
  const handleTabChange = (v: string) => {
    clear();
    setStatus(v as "draft" | "submitted" | "acknowledged");
  };

  async function runBulk(
    fn: (args: { ids: Array<Id<"performanceReviews">> }) => Promise<{
      count: number;
    }>,
    successVerb: string,
  ) {
    try {
      const res = await fn({ ids: selectedIds });
      toast.success(`${res.count} penilaian ${successVerb}`);
      clear();
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string };
        toast.error(data.message ?? "Gagal memproses");
      } else {
        toast.error("Gagal memproses");
      }
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="draft" className="cursor-pointer">
            Draf
          </TabsTrigger>
          <TabsTrigger value="submitted" className="cursor-pointer">
            Menunggu Konfirmasi
          </TabsTrigger>
          <TabsTrigger value="acknowledged" className="cursor-pointer">
            Selesai
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {reviews === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>
              {status === "draft"
                ? "Tidak ada draf"
                : status === "submitted"
                  ? "Tidak ada yang menunggu konfirmasi"
                  : "Belum ada penilaian yang selesai"}
            </EmptyTitle>
            <EmptyDescription>
              {status === "draft"
                ? "Klik 'Penilaian Baru' untuk mulai menilai karyawan."
                : "Penilaian yang Anda buat akan muncul di sini."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {/* Bulk action bar - only for draft (submit/delete) and submitted (remind) */}
          {status !== "acknowledged" ? (
            <BulkActionBar
              allSelected={allSelected}
              onToggleAll={toggleAll}
              selectedCount={count}
              totalCount={selectableIds.length}
              onClear={clear}
            >
              {status === "draft" ? (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      runBulk(
                        (a) => bulkSubmit(a),
                        "dikirim (draf tanpa skor dilewati)",
                      )
                    }
                    className="cursor-pointer"
                  >
                    <Send className="size-4" />
                    Kirim
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmRemove(true)}
                    className="cursor-pointer text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Hapus
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() =>
                    runBulk((a) => bulkRemind(a), "dikirim pengingat")
                  }
                  className="cursor-pointer"
                >
                  <BellRing className="size-4" />
                  Kirim Pengingat
                </Button>
              )}
            </BulkActionBar>
          ) : null}

          {reviews.map((r) => (
            <ReviewCard
              key={r._id}
              review={r}
              perspective="reviewee"
              selectable={status !== "acknowledged"}
              selected={isSelected(r._id)}
              onToggleSelect={() => toggle(r._id)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus penilaian terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              {count} penilaian draf akan dihapus permanen. Penilaian yang sudah
              dikonfirmasi tidak akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmRemove(false);
                runBulk((a) => bulkRemove(a), "dihapus");
              }}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AllReviewsSection() {
  const periods = useQuery(api.performance.listPeriods, {});
  const [period, setPeriod] = useState("all");
  const reviews = useQuery(api.performance.listAll, { period });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Periode:</span>
        <button
          onClick={() => setPeriod("all")}
          className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            period === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Semua
        </button>
        {(periods ?? []).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {reviews === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardCheck />
            </EmptyMedia>
            <EmptyTitle>Belum ada penilaian</EmptyTitle>
            <EmptyDescription>
              Penilaian kinerja dari seluruh perusahaan akan tampil di sini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r._id} review={r} perspective="reviewee" />
          ))}
        </div>
      )}
    </div>
  );
}

function PerformancePageInner() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const stats = useQuery(api.performance.getStats, {});

  const canReview = canManageTeam(currentUser?.role ?? null);
  const isAdmin = isAdminRole(currentUser?.role ?? null);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Penilaian Kinerja
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau performa Anda, berikan penilaian kepada tim, dan lihat riwayat
            review.
          </p>
        </div>
        {canReview ? <CreateReviewDialog /> : null}
      </div>

      {/* Stats */}
      {stats === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Star}
            label="Rata-rata Skor Saya"
            value={
              stats?.myAvgRating !== null && stats?.myAvgRating !== undefined ? stats.myAvgRating.toFixed(1) : "-"
            }
            hint={ratingLabel(stats?.myAvgRating ?? null)}
            accent={`bg-amber-500/10 ${ratingColor(stats?.myAvgRating ?? null)}`}
          />
          <StatCard
            icon={History}
            label="Total Penilaian Saya"
            value={String(stats?.myTotal ?? 0)}
            hint="sepanjang waktu"
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          {canReview ? (
            <>
              <StatCard
                icon={FileSignature}
                label="Draf Aktif"
                value={String(stats?.asReviewerDraft ?? 0)}
                hint="perlu diselesaikan"
                accent="bg-muted text-foreground"
              />
              <StatCard
                icon={ClipboardCheck}
                label="Menunggu Konfirmasi"
                value={String(stats?.asReviewerSubmitted ?? 0)}
                hint="dari karyawan"
                accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />
            </>
          ) : (
            <>
              <StatCard
                icon={ClipboardCheck}
                label="Belum Dikonfirmasi"
                value={String(stats?.myPendingAck ?? 0)}
                hint="menunggu tanggapan Anda"
                accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              />
              <StatCard
                icon={Target}
                label="Periode Terakhir"
                value={stats?.myLatestPeriod ?? "-"}
                hint={
                  stats?.myLatestRating !== null && stats?.myLatestRating !== undefined
                    ? `Skor ${stats.myLatestRating}/5`
                    : "Belum ada"
                }
                accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
              />
            </>
          )}
        </div>
      )}

      {canReview ? (
        <Tabs defaultValue="mine" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mine" className="cursor-pointer gap-2">
              <Star className="size-4" />
              Penilaian Saya
            </TabsTrigger>
            <TabsTrigger value="team" className="cursor-pointer gap-2">
              <UsersIcon className="size-4" />
              Penilaian Tim
              {stats && stats.asReviewerDraft > 0 ? (
                <Badge variant="destructive" className="h-5 px-1.5">
                  {stats.asReviewerDraft}
                </Badge>
              ) : null}
            </TabsTrigger>
            {isAdmin ? (
              <TabsTrigger value="all" className="cursor-pointer gap-2">
                <BarChart3 className="size-4" />
                Semua Penilaian
              </TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="mine">
            <MyReviewsSection />
          </TabsContent>
          <TabsContent value="team">
            <AsReviewerSection />
          </TabsContent>
          {isAdmin ? (
            <TabsContent value="all">
              <AllReviewsSection />
            </TabsContent>
          ) : null}
        </Tabs>
      ) : (
        <MyReviewsSection />
      )}
    </div>
  );
}

export default function PerformancePage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk melihat penilaian kinerja.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <PerformancePageInner />
      </Authenticated>
    </>
  );
}
