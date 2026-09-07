import { useState } from "react";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
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
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Briefcase,
  Target,
  Gauge,
  Users,
  Clock,
  Search,
  Settings2,
  BookOpen,
} from "lucide-react";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import { useDebounce } from "@/hooks/use-debounce.ts";
import CreatePositionDialog from "./_components/CreatePositionDialog.tsx";
import PositionCard from "./_components/PositionCard.tsx";
import SalaryBandsPanel from "./_components/SalaryBandsPanel.tsx";
import CompanySizePanel from "./_components/CompanySizePanel.tsx";
import MyEvaluationsPanel from "./_components/MyEvaluationsPanel.tsx";
import FactorGuideDialog from "./_components/FactorGuideDialog.tsx";

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
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
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

function PositionsTab() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("active");
  const [debouncedSearch] = useDebounce(search, 250);
  const positions = useQuery(api.grading.listPositions, {
    search: debouncedSearch || undefined,
    department,
    status,
  });
  const departments = useQuery(api.users.listDepartments, {});

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="archived">Arsip</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {positions === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (positions ?? []).length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Briefcase />
            </EmptyMedia>
            <EmptyTitle>Belum ada jabatan</EmptyTitle>
            <EmptyDescription>
              Tambahkan jabatan pertama Anda untuk mulai mengevaluasi grade
              menggunakan metode WTW GGS.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreatePositionDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Menampilkan {(positions ?? []).length} jabatan
          </p>
          <div className="space-y-3">
            {(positions ?? []).map((p) => (
              <PositionCard key={p._id} position={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GradingPageInner() {
  const statsQuery = useQuery(api.grading.getDashboardStats, {});
  const { isAdmin } = useCurrentRole();

  if (statsQuery === undefined) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const stats = statsQuery ?? {
    totalPositions: 0,
    gradedPositions: 0,
    pendingEvaluations: 0,
    approvedEvaluations: 0,
    totalAssignments: 0,
    avgCompaRatio: null,
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Grading & Job Evaluation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistem evaluasi jabatan berbasis{" "}
            <span className="font-medium">
              WTW Global Grading System (GGS)
            </span>{" "}
            — 7 faktor, 25 grade, kalkulator compa-ratio, dan riwayat re-grading.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FactorGuideDialog />
          {isAdmin ? <CreatePositionDialog /> : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Total Jabatan"
          value={String(stats.totalPositions)}
          hint={`${stats.gradedPositions} sudah digrade`}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          icon={Clock}
          label="Evaluasi Berjalan"
          value={String(stats.pendingEvaluations)}
          hint={`${stats.approvedEvaluations} disetujui`}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Users}
          label="Karyawan Terpetakan"
          value={String(stats.totalAssignments)}
          hint="pada posisi aktif"
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          icon={Gauge}
          label="Rata-rata Compa-Ratio"
          value={
            stats.avgCompaRatio !== null
              ? `${stats.avgCompaRatio.toFixed(1)}%`
              : "—"
          }
          hint="posisi gaji vs mid"
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <Tabs defaultValue="positions" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="inline-flex w-max flex-nowrap">
            <TabsTrigger value="positions" className="cursor-pointer">
              <Briefcase className="size-4" />
              Jabatan
            </TabsTrigger>
            <TabsTrigger value="my-evaluations" className="cursor-pointer">
              <Target className="size-4" />
              Penilaian Saya
            </TabsTrigger>
            {isAdmin ? (
              <>
                <TabsTrigger value="salary-bands" className="cursor-pointer">
                  <BookOpen className="size-4" />
                  Salary Bands
                </TabsTrigger>
                <TabsTrigger value="company-size" className="cursor-pointer">
                  <Settings2 className="size-4" />
                  Company Size
                </TabsTrigger>
              </>
            ) : null}
          </TabsList>
        </div>

        <TabsContent value="positions">
          <PositionsTab />
        </TabsContent>
        <TabsContent value="my-evaluations">
          <MyEvaluationsPanel />
        </TabsContent>
        {isAdmin ? (
          <>
            <TabsContent value="salary-bands">
              <SalaryBandsPanel />
            </TabsContent>
            <TabsContent value="company-size">
              <CompanySizePanel />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}

export default function GradingPage() {
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
            Silakan masuk untuk melihat sistem grading.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <GradingPageInner />
      </Authenticated>
    </>
  );
}
