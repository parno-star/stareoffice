import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Goal,
  Plus,
  Target,
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  User,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { isAdminRole } from "@/convex/roles.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import ObjectiveCard from "./_components/ObjectiveCard.tsx";
import ObjectiveFormDialog from "./_components/ObjectiveFormDialog.tsx";
import RecentCheckInsPanel from "./_components/RecentCheckInsPanel.tsx";
import {
  generateCurrentPeriodOptions,
  SCOPE_LABELS,
} from "./_lib/okr-utils.ts";

type ObjectiveWithOwner = Doc<"objectives"> & {
  owner?: {
    _id: Doc<"users">["_id"];
    name?: string;
    avatarUrl?: string;
    department?: string;
    jobTitle?: string;
  } | null;
};

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
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-xl font-semibold">{value}</p>
            {hint ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OkrPageInner() {
  const { user } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const isAdmin = isAdminRole(currentUser?.role);

  const periodOptions = useMemo(() => generateCurrentPeriodOptions(), []);
  const [period, setPeriod] = useState<string>(
    periodOptions[0]?.value ?? new Date().getFullYear().toString(),
  );
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("mine");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ObjectiveWithOwner | null>(null);

  const myObjectives = useQuery(
    api.okr.objectives.listObjectives,
    currentUser ? { period, ownerId: currentUser._id } : "skip",
  );
  const companyObjectives = useQuery(
    api.okr.objectives.listObjectives,
    { period, scope: "company" },
  );
  const allObjectives = useQuery(
    api.okr.objectives.listObjectives,
    { period },
  );

  const myStats = useQuery(api.okr.stats.getMyStats, { period });
  const globalStats = useQuery(api.okr.stats.getStats, { period });

  if (!currentUser) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const activeList: Array<ObjectiveWithOwner> | undefined =
    tab === "mine"
      ? myObjectives
      : tab === "company"
        ? companyObjectives
        : allObjectives;

  const filtered =
    activeList === undefined
      ? undefined
      : activeList.filter((o) => {
          if (scopeFilter !== "all" && o.scope !== scopeFilter) return false;
          if (statusFilter !== "all" && o.status !== statusFilter) return false;
          if (search.trim()) {
            const q = search.toLowerCase();
            if (
              !o.title.toLowerCase().includes(q) &&
              !(o.description ?? "").toLowerCase().includes(q)
            ) {
              return false;
            }
          }
          return true;
        });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Goal className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              OKR &amp; Goals
            </h1>
            <p className="text-sm text-muted-foreground">
              Objectives &amp; Key Results: selaraskan tujuan perusahaan, tim,
              dan pribadi.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="cursor-pointer"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" />
            OKR Baru
          </Button>
        </div>
      </div>

      {/* Stats */}
      {isAdmin ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={Target}
            label="Total OKR"
            value={`${globalStats?.total ?? "-"}`}
            hint={`${globalStats?.active ?? 0} aktif`}
            accent="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          />
          <StatCard
            icon={TrendingUp}
            label="Rata-rata progress"
            value={`${globalStats?.averageProgress ?? 0}%`}
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          />
          <StatCard
            icon={CheckCircle2}
            label="On track"
            value={`${globalStats?.onTrack ?? 0}`}
            hint={`${globalStats?.atRisk ?? 0} at risk`}
            accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
          />
          <StatCard
            icon={AlertTriangle}
            label="Off track"
            value={`${globalStats?.offTrack ?? 0}`}
            accent="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={Target}
            label="OKR Saya"
            value={`${myStats?.objectives ?? "-"}`}
            hint={`${myStats?.activeObjectives ?? 0} aktif`}
            accent="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          />
          <StatCard
            icon={TrendingUp}
            label="Progress rata-rata"
            value={`${myStats?.averageProgress ?? 0}%`}
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          />
          <StatCard
            icon={CheckCircle2}
            label="KR Tercapai"
            value={`${myStats?.achievedKeyResults ?? 0}`}
            hint={`dari ${myStats?.keyResults ?? 0} KR`}
            accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
          />
          <StatCard
            icon={User}
            label="Owner"
            value={user?.profile.name?.split(" ")[0] ?? "Saya"}
            accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <TabsList className="inline-flex w-max flex-nowrap">
                <TabsTrigger value="mine" className="cursor-pointer gap-2">
                  <User className="size-4" />
                  OKR Saya
                </TabsTrigger>
                <TabsTrigger value="company" className="cursor-pointer gap-2">
                  <Building2 className="size-4" />
                  Perusahaan
                </TabsTrigger>
                <TabsTrigger value="all" className="cursor-pointer gap-2">
                  <Users className="size-4" />
                  Semua
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px] flex-1">
                <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari OKR..."
                  className="pl-8"
                />
              </div>
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-36 cursor-pointer">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua scope</SelectItem>
                  {Object.entries(SCOPE_LABELS).map(([val, lbl]) => (
                    <SelectItem key={val} value={val}>
                      {lbl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="archived">Arsip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value={tab} className="mt-4 space-y-3">
              {filtered === undefined ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Goal />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada OKR</EmptyTitle>
                    <EmptyDescription>
                      Buat OKR pertama untuk periode ini dan tambahkan key
                      results terukur.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => {
                        setEditing(null);
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-1 size-4" />
                      Buat OKR
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                filtered.map((o) => (
                  <ObjectiveCard
                    key={o._id}
                    objective={o}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    onEdit={(obj) => {
                      setEditing(obj);
                      setDialogOpen(true);
                    }}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <RecentCheckInsPanel />
        </div>
      </div>

      <ObjectiveFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        objective={editing}
        currentUser={currentUser}
        isAdmin={isAdmin}
        defaultScope={isAdmin ? "company" : "individual"}
      />
    </div>
  );
}

export default function OkrPage() {
  return (
    <>
      <Authenticated>
        <OkrPageInner />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="text-center">
            <p className="mb-3 text-muted-foreground">
              Silakan masuk untuk melihat OKR.
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="p-4 md:p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthLoading>
    </>
  );
}
