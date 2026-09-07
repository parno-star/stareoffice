import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuth } from "@/hooks/use-auth.ts";
import { isAdminRole } from "@/convex/roles.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Sprout, Plus, ArrowRight, Sparkles, Users, Target } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import CreateCycleDialog from "./_components/CreateCycleDialog.tsx";
import {
  CYCLE_STATUS,
  formatDate,
  BOX_META,
  type BoxCode,
} from "./_lib/talent-utils.ts";

function TalentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = useQuery(api.users.getCurrentUser, {});
  const cycles = useQuery(api.talent.listCycles, {});
  const succession = useQuery(api.talent.getSuccessionOverview, {});
  const [createOpen, setCreateOpen] = useState(false);

  const isAdmin = isAdminRole(me?.role);

  if (cycles === undefined || me === undefined) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const activeCycles = cycles.filter(
    (c) => c.cycle.status === "active" || c.cycle.status === "calibration",
  );
  const latestActive = activeCycles[0]?.cycle;

  // Aggregate segment counts across active cycles
  const totalPlacements = cycles.reduce((sum, c) => sum + c.placementCount, 0);
  const totalFinalized = cycles.reduce((sum, c) => sum + c.finalizedCount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero header */}
      <div className="rounded-2xl border bg-gradient-to-br from-violet-50 via-background to-sky-50 dark:from-violet-950/20 dark:to-sky-950/20 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Sprout className="size-5 text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Talent Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Halo {user?.profile.name ?? "sahabat"}, kelola siklus kalibrasi
                  Nine Box, IDP, dan succession planning di sini.
                </p>
              </div>
            </div>
          </div>
          {isAdmin ? (
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              <Plus className="size-4" /> Siklus Baru
            </Button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Sparkles className="size-4 text-violet-600" />}
          label="Siklus Aktif"
          value={activeCycles.length.toString()}
          sub={latestActive?.periodLabel ?? "Belum ada siklus berjalan"}
          tone="bg-violet-50 dark:bg-violet-950/30"
        />
        <StatCard
          icon={<Users className="size-4 text-sky-600" />}
          label="Karyawan Dinilai"
          value={`${totalFinalized}`}
          sub={`${totalPlacements} total placement`}
          tone="bg-sky-50 dark:bg-sky-950/30"
        />
        <StatCard
          icon={<Target className="size-4 text-emerald-600" />}
          label="Kandidat Succession"
          value={`${succession?.totalCandidates ?? 0}`}
          sub={`${succession?.totalIncumbents ?? 0} posisi kunci`}
          tone="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          icon={<Sprout className="size-4 text-amber-600" />}
          label="Posisi Tanpa Succession"
          value={`${succession?.positionsWithoutSuccessor ?? 0}`}
          sub="Perlu ditindaklanjuti"
          tone="bg-amber-50 dark:bg-amber-950/30"
        />
      </div>

      {/* Readiness breakdown */}
      {succession && Object.keys(succession.byReadiness).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Kesiapan Succession</CardTitle>
            <CardDescription>
              Distribusi kandidat berdasarkan tingkat kesiapan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ReadinessStat
                label="Siap Sekarang"
                count={succession.byReadiness.ready_now ?? 0}
                tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              />
              <ReadinessStat
                label="1 Tahun"
                count={succession.byReadiness["1_year"] ?? 0}
                tone="bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
              />
              <ReadinessStat
                label="2-3 Tahun"
                count={succession.byReadiness["2_3_years"] ?? 0}
                tone="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
              />
              <ReadinessStat
                label="Darurat"
                count={succession.byReadiness.emergency ?? 0}
                tone="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Cycles list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Siklus Review</CardTitle>
            <CardDescription>
              Pilih siklus untuk mengelola placement & kalibrasi.
            </CardDescription>
          </div>
          {isAdmin ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" /> Tambah
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sprout />
                </EmptyMedia>
                <EmptyTitle>Belum ada siklus</EmptyTitle>
                <EmptyDescription>
                  Mulai siklus kalibrasi untuk memetakan talenta perusahaan.
                </EmptyDescription>
              </EmptyHeader>
              {isAdmin ? (
                <EmptyContent>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" /> Buat Siklus Pertama
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="space-y-2">
              {cycles.map((c) => {
                const status = CYCLE_STATUS[c.cycle.status];
                const pct = c.placementCount
                  ? Math.round((c.finalizedCount / c.placementCount) * 100)
                  : 0;
                return (
                  <button
                    key={c.cycle._id}
                    onClick={() => navigate(`/talent/${c.cycle._id}`)}
                    className="w-full rounded-lg border p-3 text-left hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium truncate">
                            {c.cycle.name}
                          </span>
                          {status ? (
                            <Badge
                              className={cn(
                                "rounded-full text-[10px] border-0",
                                status.tone,
                              )}
                            >
                              {status.label}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {c.cycle.periodLabel} · {formatDate(c.cycle.startDate)}{" "}
                          – {formatDate(c.cycle.endDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {c.finalizedCount}/{c.placementCount}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {pct}% final
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrix legend */}
      <Card>
        <CardHeader>
          <CardTitle>Peta Kotak Nine Box</CardTitle>
          <CardDescription>
            Referensi cepat 9 segmen & rekomendasi tindakan HR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(BOX_META) as Array<BoxCode>).map((code) => {
              const m = BOX_META[code];
              return (
                <div
                  key={code}
                  className={cn("rounded-lg border-2 p-3", m.bg, m.border)}
                >
                  <div className={cn("text-xs font-semibold", m.text)}>
                    {m.label}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                    {m.description}
                  </p>
                  <p className="mt-1 text-[11px] italic text-muted-foreground">
                    → {m.action}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CreateCycleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4", tone)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground truncate">{sub}</div>
    </div>
  );
}

function ReadinessStat({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: string;
}) {
  return (
    <div className={cn("rounded-lg p-3", tone)}>
      <div className="text-xs font-medium">{label}</div>
      <div className="mt-1 text-2xl font-bold">{count}</div>
    </div>
  );
}

export default function TalentPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6">
          <Skeleton className="h-32 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center gap-4 p-10">
          <Sprout className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Masuk untuk mengakses Talent Management.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <TalentDashboard />
      </Authenticated>
    </>
  );
}
