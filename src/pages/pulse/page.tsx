import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  Activity,
  ClipboardCheck,
  Gauge,
  LineChart as LineChartIcon,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users2,
  Zap,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart.tsx";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { isAdminRole } from "@/convex/roles.ts";
import type { Id } from "@/convex/_generated/dataModel.js";
import type { PulseListItem } from "@/convex/pulse";
import PulseCard from "@/pages/pulse/_components/PulseCard.tsx";
import PulseFormDialog from "@/pages/pulse/_components/PulseFormDialog.tsx";
import PulseRespondDialog from "@/pages/pulse/_components/PulseRespondDialog.tsx";
import PulseResultsDialog from "@/pages/pulse/_components/PulseResultsDialog.tsx";
import {
  CATEGORY_LABELS,
  formatScorePercent,
  getSentimentBand,
} from "@/pages/pulse/_lib/pulse-utils.ts";
import { cn } from "@/lib/utils.ts";

function PulseInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const departments = useQuery(api.users.listDepartments, {});
  const stats = useQuery(api.pulse.getStats, {});
  const safeStats = useMemo(() => {
    return {
      activePulses: stats?.activePulses ?? 0,
      totalResponses: stats?.totalResponses ?? 0,
      averageSentiment: stats?.averageSentiment ?? null,
      participationRate: stats?.participationRate ?? 0,
      myPending: stats?.myPending ?? 0,
      trend: stats?.trend ?? [],
      distributionByCategory: stats?.distributionByCategory ?? [],
    };
  }, [stats]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const pulses = useQuery(api.pulse.listPulses, { filter });

  const [createOpen, setCreateOpen] = useState(false);
  const [editPulse, setEditPulse] = useState<PulseListItem | null>(null);
  const [respondId, setRespondId] = useState<Id<"pulseSurveys"> | null>(null);
  const [resultsId, setResultsId] = useState<Id<"pulseSurveys"> | null>(null);
  const [deleteId, setDeleteId] = useState<Id<"pulseSurveys"> | null>(null);

  const publishPulse = useMutation(api.pulse.publishPulse);
  const closePulse = useMutation(api.pulse.closePulse);
  const duplicatePulse = useMutation(api.pulse.duplicatePulse);
  const removePulse = useMutation(api.pulse.removePulse);

  const isAdmin = isAdminRole(currentUser?.role);

  // Deep-link: ?id=<pulseId> opens the respond dialog
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && !respondId) {
      setRespondId(id as Id<"pulseSurveys">);
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, respondId, setSearchParams]);

  const filteredPulses = useMemo(() => {
    if (!pulses) return [];
    const q = search.trim().toLowerCase();
    if (!q) return pulses;
    return pulses.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.question.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [pulses, search]);

  async function handlePublish(id: Id<"pulseSurveys">) {
    try {
      await publishPulse({ pulseId: id });
      toast.success("Pulse berhasil diterbitkan");
    } catch (err) {
      toast.error(
        err instanceof ConvexError
          ? ((err.data as { message?: string }).message ?? "Gagal menerbitkan")
          : "Gagal menerbitkan",
      );
    }
  }
  async function handleClose(id: Id<"pulseSurveys">) {
    try {
      await closePulse({ pulseId: id });
      toast.success("Pulse ditutup");
    } catch {
      toast.error("Gagal menutup pulse");
    }
  }
  async function handleDuplicate(p: PulseListItem) {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await duplicatePulse({
        pulseId: p._id,
        startDate: today,
      });
      toast.success("Pulse diduplikasi sebagai draft baru");
    } catch {
      toast.error("Gagal menduplikasi pulse");
    }
  }
  async function handleDelete() {
    if (!deleteId) return;
    try {
      await removePulse({ pulseId: deleteId });
      toast.success("Pulse dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus pulse");
    }
  }

  const primaryBand = getSentimentBand(safeStats.averageSentiment);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Gauge className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pulse Survey & Sentimen
            </h1>
            <p className="text-sm text-muted-foreground">
              Dengarkan suara karyawan secara rutin, dan pantau sentimen dari
              waktu ke waktu.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <Button
              onClick={() => {
                setEditPulse(null);
                setCreateOpen(true);
              }}
              className="cursor-pointer"
            >
              <Plus className="size-4" />
              Buat Pulse
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Activity}
          label="Pulse Aktif"
          value={stats ? String(safeStats.activePulses) : "-"}
          loading={stats === undefined}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Rata-rata Sentimen"
          value={stats ? formatScorePercent(safeStats.averageSentiment) : "-"}
          loading={stats === undefined}
          color={primaryBand.color}
          bg="bg-rose-500/10"
          sublabel={safeStats.averageSentiment !== null ? primaryBand.label : undefined}
        />
        <StatCard
          icon={Users2}
          label="Partisipasi"
          value={stats ? `${safeStats.participationRate}%` : "-"}
          loading={stats === undefined}
          color="text-violet-500"
          bg="bg-violet-500/10"
        />
        <StatCard
          icon={MessageSquare}
          label="Total Respons"
          value={stats ? String(safeStats.totalResponses) : "-"}
          loading={stats === undefined}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
      </div>

      {/* Pending banner */}
      {stats && safeStats.myPending > 0 && (
        <Card className="p-4 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-violet-500/10 border-rose-200/50 dark:border-rose-500/20">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="size-10 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
              <ClipboardCheck className="size-5 text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">
                Ada {safeStats.myPending} pulse menunggu pendapat Anda
              </h3>
              <p className="text-sm text-muted-foreground">
                Cukup 15 detik. Suara Anda membantu perusahaan bergerak cepat.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setFilter("active")}
              className="cursor-pointer"
            >
              Lihat Pulse Aktif
            </Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="pulses">
        <TabsList>
          <TabsTrigger value="pulses" className="cursor-pointer">
            <Zap className="size-4" />
            Pulse
          </TabsTrigger>
          <TabsTrigger value="insights" className="cursor-pointer">
            <LineChartIcon className="size-4" />
            Insights Sentimen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pulses" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pulse..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-md bg-muted/50 p-1">
              {[
                { key: "all", label: "Semua" },
                { key: "active", label: "Aktif" },
                ...(isAdmin ? [{ key: "draft", label: "Draft" }] : []),
                { key: "closed", label: "Ditutup" },
                ...(isAdmin ? [{ key: "mine", label: "Saya Buat" }] : []),
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "text-sm px-3 py-1 rounded cursor-pointer transition-colors",
                    filter === tab.key
                      ? "bg-background font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {pulses === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filteredPulses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Gauge />
                </EmptyMedia>
                <EmptyTitle>Belum ada pulse</EmptyTitle>
                <EmptyDescription>
                  {isAdmin
                    ? "Mulai dengan template untuk mengukur mood atau eNPS dalam hitungan detik."
                    : "Pulse baru akan muncul di sini saat HR mempublikasikannya."}
                </EmptyDescription>
              </EmptyHeader>
              {isAdmin && (
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditPulse(null);
                      setCreateOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <Plus className="size-4" />
                    Buat Pulse Pertama
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPulses.map((p) => (
                <PulseCard
                  key={p._id}
                  pulse={p}
                  isAdmin={isAdmin}
                  isOwner={p.authorId === currentUser?._id}
                  onRespond={() => setRespondId(p._id)}
                  onViewResults={() => setResultsId(p._id)}
                  onPublish={() => handlePublish(p._id)}
                  onClose={() => handleClose(p._id)}
                  onDuplicate={() => handleDuplicate(p)}
                  onEdit={() => {
                    setEditPulse(p);
                    setCreateOpen(true);
                  }}
                  onDelete={() => setDeleteId(p._id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 mt-4">
          {stats === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">
                    Tren Sentimen Mingguan
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    12 minggu terakhir
                  </p>
                </div>
                {(safeStats.trend || []).length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                    Belum ada data untuk ditampilkan
                  </div>
                ) : (
                  <ChartContainer
                    config={
                      {
                        score: {
                          label: "Sentimen",
                          color: "var(--chart-2)",
                        },
                      } satisfies ChartConfig
                    }
                    className="h-64 w-full"
                  >
                    <AreaChart data={safeStats.trend}>
                      <defs>
                        <linearGradient
                          id="pulseGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--chart-2)"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--chart-2)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        tickFormatter={(value: string) =>
                          value.split(" ")[0]
                        }
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        domain={[0, 100]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="var(--chart-2)"
                        fill="url(#pulseGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </Card>

              <Card className="p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">
                    Sentimen per Kategori
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Area yang paling diperhatikan karyawan
                  </p>
                </div>
                {(safeStats.distributionByCategory || []).length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                    Belum ada data kategori
                  </div>
                ) : (
                  <ChartContainer
                    config={
                      {
                        averageSentiment: {
                          label: "Sentimen",
                          color: "var(--chart-1)",
                        },
                      } satisfies ChartConfig
                    }
                    className="h-64 w-full"
                  >
                    <BarChart
                      data={(safeStats.distributionByCategory || []).map((c) => ({
                        ...c,
                        label: CATEGORY_LABELS[c.category] ?? c.category,
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        domain={[0, 100]}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        width={110}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="averageSentiment"
                        fill="var(--chart-1)"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </Card>

              <Card className="p-4 md:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Ringkasan Sentimen
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Indikator cepat untuk tim HR
                    </p>
                  </div>
                  <Sparkles className="size-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <SentimentBandCard
                    label="Saat Ini"
                    score={safeStats.averageSentiment}
                  />
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">
                      Tingkat Partisipasi
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {safeStats.participationRate}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      dari total karyawan pada pulse aktif
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Minggu Aktif</p>
                    <p className="text-2xl font-bold mt-1">
                      {(safeStats.trend || []).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      minggu dengan respons dalam 12 minggu terakhir
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {isAdmin && (
        <PulseFormDialog
          open={createOpen}
          onOpenChange={(v) => {
            setCreateOpen(v);
            if (!v) setEditPulse(null);
          }}
          departments={departments ?? []}
          editing={editPulse}
        />
      )}
      <PulseRespondDialog
        open={respondId !== null}
        onOpenChange={(o) => {
          if (!o) setRespondId(null);
        }}
        pulseId={respondId}
      />
      <PulseResultsDialog
        open={resultsId !== null}
        onOpenChange={(o) => {
          if (!o) setResultsId(null);
        }}
        pulseId={resultsId}
      />
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pulse ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua respons yang terkait akan ikut terhapus dan tidak dapat
              dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground cursor-pointer"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  loading,
  sublabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  bg: string;
  loading: boolean;
  sublabel?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className={cn("size-8 rounded-lg flex items-center justify-center", bg)}>
          <Icon className={cn("size-4", color)} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 mt-2" />
      ) : (
        <>
          <p className={cn("mt-1 text-2xl font-bold", color)}>{value}</p>
          {sublabel && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
          )}
        </>
      )}
    </Card>
  );
}

function SentimentBandCard({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  const band = getSentimentBand(score);
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", band.color)}>
        {formatScorePercent(score)}
      </p>
      <p className={cn("text-[10px] font-medium mt-1", band.color)}>
        {band.label}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {band.description}
      </p>
    </div>
  );
}

export default function PulsePage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
          <Gauge className="size-10 text-rose-500" />
          <p className="text-sm text-muted-foreground">
            Silakan masuk untuk mengakses pulse survey.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <PulseInner />
      </Authenticated>
    </>
  );
}

// Re-export for unused warnings avoidance (BarChart3 unused)
