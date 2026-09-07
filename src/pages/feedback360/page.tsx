import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
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
  Compass,
  Plus,
  Search,
  Inbox,
  Users2,
  CheckCircle2,
  CalendarClock,
  TrendingUp,
  Star,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { isAdminRole } from "@/convex/roles.ts";
import CycleCard from "@/pages/feedback360/_components/CycleCard.tsx";
import MyInviteCard from "@/pages/feedback360/_components/MyInviteCard.tsx";
import CreateCycleDialog from "@/pages/feedback360/_components/CreateCycleDialog.tsx";
import RespondReviewerDialog from "@/pages/feedback360/_components/RespondReviewerDialog.tsx";
import { scoreColor, formatScore } from "@/pages/feedback360/_lib/feedback360-utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <p className="mt-0.5 truncate text-xl font-bold">{value}</p>
          )}
          {hint ? (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Feedback360Inner() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const stats = useQuery(api.feedback360.reviews.getStats, {});
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const cycles = useQuery(api.feedback360.cycles.listCycles, { filter });
  const myInvites = useQuery(api.feedback360.reviewers.listMyInvites, {
    filter: "pending",
  });
  const mySubmitted = useQuery(api.feedback360.reviewers.listMyInvites, {
    filter: "submitted",
  });
  const myReports = useQuery(api.feedback360.reviews.listMyReports, {});

  const [createOpen, setCreateOpen] = useState(false);
  const [respondRowId, setRespondRowId] =
    useState<Id<"feedback360Reviewers"> | null>(null);

  const isAdmin = isAdminRole(currentUser?.role);

  const filteredCycles = useMemo(() => {
    if (!cycles) return [];
    const q = search.trim().toLowerCase();
    if (!q) return cycles;
    return cycles.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        c.periodLabel.toLowerCase().includes(q),
    );
  }, [cycles, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
            <Compass className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Feedback 360°</h1>
            <p className="text-sm text-muted-foreground">
              Kumpulkan perspektif dari atasan, rekan, bawahan, dan diri sendiri
              untuk pertumbuhan yang seimbang.
            </p>
          </div>
        </div>
        {isAdmin ? (
          <Button
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer"
          >
            <Plus className="size-4" />
            Siklus Baru
          </Button>
        ) : null}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Menunggu Anda"
          value={stats ? String(stats.pendingAsReviewer) : "—"}
          hint="invitasi feedback"
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          loading={!stats}
        />
        <StatCard
          icon={SendHorizontal}
          label="Feedback Terkirim"
          value={stats ? String(stats.submittedAsReviewer) : "—"}
          hint="di siklus aktif"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          loading={!stats}
        />
        <StatCard
          icon={TrendingUp}
          label="Laporan Saya"
          value={stats ? String(stats.mySharedReports) : "—"}
          hint={`${stats?.myActiveAsReviewee ?? 0} siklus berjalan`}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          loading={!stats}
        />
        <StatCard
          icon={CalendarClock}
          label="Siklus Aktif"
          value={stats ? String(stats.activeCycles) : "—"}
          hint={`total ${stats?.totalCycles ?? 0} siklus`}
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          loading={!stats}
        />
      </div>

      {/* Pending invites banner */}
      {myInvites && myInvites.length > 0 ? (
        <Card className="border-amber-200/50 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 p-4 dark:border-amber-500/20">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
              <Inbox className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">
                {myInvites.length} undangan feedback menunggu Anda
              </h3>
              <p className="text-sm text-muted-foreground">
                Luangkan waktu singkat untuk memberi umpan balik yang berarti.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Tabs defaultValue="cycles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cycles" className="cursor-pointer gap-2">
            <Compass className="size-4" />
            Siklus
          </TabsTrigger>
          <TabsTrigger value="inbox" className="cursor-pointer gap-2">
            <Inbox className="size-4" />
            Kotak Saya
            {myInvites && myInvites.length > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {myInvites.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="reports" className="cursor-pointer gap-2">
            <Star className="size-4" />
            Laporan Saya
          </TabsTrigger>
        </TabsList>

        {/* ---- Cycles tab ---- */}
        <TabsContent value="cycles" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari siklus..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-md bg-muted/50 p-1">
              {[
                { key: "all", label: "Semua" },
                { key: "active", label: "Aktif" },
                ...(isAdmin ? [{ key: "draft", label: "Draf" }] : []),
                { key: "closed", label: "Ditutup" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`cursor-pointer rounded px-3 py-1 text-sm transition-colors ${
                    filter === tab.key
                      ? "bg-background font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {cycles === undefined ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          ) : filteredCycles.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Compass />
                </EmptyMedia>
                <EmptyTitle>Belum ada siklus feedback</EmptyTitle>
                <EmptyDescription>
                  {isAdmin
                    ? "Mulai dengan membuat siklus pertama dan undang karyawan untuk saling memberi feedback."
                    : "Siklus feedback 360° akan muncul di sini saat HR mengaktifkannya."}
                </EmptyDescription>
              </EmptyHeader>
              {isAdmin ? (
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    className="cursor-pointer"
                  >
                    <Plus className="size-4" />
                    Buat Siklus
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCycles.map((c) => (
                <CycleCard key={c._id} cycle={c} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- Inbox tab ---- */}
        <TabsContent value="inbox" className="space-y-6">
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Inbox className="size-4" />
              Perlu dijawab
            </h3>
            {myInvites === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : myInvites.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CheckCircle2 />
                  </EmptyMedia>
                  <EmptyTitle>Semua sudah selesai</EmptyTitle>
                  <EmptyDescription>
                    Tidak ada undangan feedback yang menunggu saat ini.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {myInvites.map((inv) => (
                  <MyInviteCard
                    key={inv._id}
                    invite={inv}
                    onOpen={() => setRespondRowId(inv._id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <SendHorizontal className="size-4" />
              Sudah dikirim
            </h3>
            {mySubmitted === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 1 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : mySubmitted.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Feedback yang sudah Anda kirim akan tampil di sini.
              </p>
            ) : (
              <div className="space-y-3">
                {mySubmitted.map((inv) => (
                  <MyInviteCard key={inv._id} invite={inv} readOnly />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ---- My reports tab ---- */}
        <TabsContent value="reports" className="space-y-3">
          {myReports === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : myReports.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Star />
                </EmptyMedia>
                <EmptyTitle>Belum ada laporan</EmptyTitle>
                <EmptyDescription>
                  Hasil feedback 360° akan muncul di sini setelah admin
                  membagikannya.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {myReports.map((r) => (
                <Card
                  key={r._id}
                  className="cursor-pointer transition-colors hover:border-primary/40"
                  onClick={() => {
                    window.location.href = `/feedback360/${r.cycleId}`;
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          {r.periodLabel}
                        </p>
                        <h4 className="truncate text-base font-semibold">
                          {r.cycleTitle}
                        </h4>
                      </div>
                      <span className={`text-2xl font-bold ${scoreColor(r.overallScore)}`}>
                        {formatScore(r.overallScore)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                      {[
                        { k: "self", v: r.selfScore, label: "Diri" },
                        { k: "manager", v: r.managerScore, label: "Atasan" },
                        { k: "peer", v: r.peerScore, label: "Rekan" },
                        { k: "report", v: r.reportScore, label: "Bawahan" },
                      ].map((s) => (
                        <div
                          key={s.k}
                          className="rounded-md bg-muted/50 p-2"
                        >
                          <p className="text-muted-foreground">{s.label}</p>
                          <p className={`mt-0.5 font-semibold ${scoreColor(s.v)}`}>
                            {formatScore(s.v)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isAdmin ? (
        <CreateCycleDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(cycleId) => {
            toast.success("Siklus dibuat sebagai draf");
            window.location.href = `/feedback360/${cycleId}`;
          }}
        />
      ) : null}

      <RespondReviewerDialog
        reviewerRowId={respondRowId}
        onOpenChange={(open) => {
          if (!open) setRespondRowId(null);
        }}
      />
    </div>
  );
}

export default function Feedback360Page() {
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
            Silakan masuk untuk mengakses Feedback 360°.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <Feedback360Inner />
      </Authenticated>
    </>
  );
}
