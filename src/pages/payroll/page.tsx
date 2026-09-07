import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Card,
  CardContent,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  Wallet,
  Users,
  CalendarRange,
  Receipt,
  Coins,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import ComponentsTab from "./_components/ComponentsTab.tsx";
import StructuresTab from "./_components/StructuresTab.tsx";
import PeriodsTab from "./_components/PeriodsTab.tsx";
import MyPayslipsTab from "./_components/MyPayslipsTab.tsx";
import {
  formatIDR,
  formatISODate,
  PERIOD_STATUS_CONFIG,
} from "./_lib/payroll-utils.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { useSearchParams } from "react-router-dom";

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
              <p className="text-xs text-muted-foreground truncate">{hint}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollPageInner() {
  const statsQuery = useQuery(api.payroll.dashboard.getDashboard, {});
  const [searchParams, setSearchParams] = useSearchParams();

  const stats = statsQuery ?? {
    isAdmin: true,
    componentCount: 0,
    activePeriods: 0,
    draftPeriods: 0,
    latestPeriod: null,
    employeeWithoutSalary: 0,
    myLatestNet: 0,
    myLatestPeriod: null,
    myNextPayDate: null,
    myAcknowledgmentNeeded: 0,
    myLifetimeEarnings: 0,
  };

  const isAdmin = stats.isAdmin;
  const tab = searchParams.get("tab") ?? (isAdmin ? "periods" : "my");

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Payroll & Kompensasi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola komponen gaji, struktur kompensasi per karyawan, dan slip gaji
          bulanan.
        </p>
      </div>

      {statsQuery === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isAdmin ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Coins}
            label="Komponen Aktif"
            value={String(stats.componentCount)}
            hint="penerimaan + potongan"
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={CalendarRange}
            label="Periode Terbuka"
            value={String(stats.draftPeriods + stats.activePeriods)}
            hint={`${stats.activePeriods} diterbitkan`}
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          {stats.latestPeriod ? (
            <StatCard
              icon={TrendingUp}
              label={`Total Netto ${stats.latestPeriod.periodLabel}`}
              value={formatIDR(stats.latestPeriod.totalNet)}
              hint={`${stats.latestPeriod.employeeCount} karyawan`}
              accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
          ) : (
            <StatCard
              icon={TrendingUp}
              label="Total Netto"
              value="-"
              hint="belum ada periode"
              accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
          )}
          <StatCard
            icon={AlertTriangle}
            label="Tanpa Struktur Gaji"
            value={String(stats.employeeWithoutSalary)}
            hint="karyawan perlu ditata"
            accent="bg-red-500/10 text-red-600 dark:text-red-400"
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Wallet}
            label={
              stats.myLatestPeriod
                ? `Gaji Bersih ${stats.myLatestPeriod}`
                : "Gaji Bersih Terakhir"
            }
            value={formatIDR(stats.myLatestNet)}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={CalendarRange}
            label="Tanggal Bayar Terakhir"
            value={formatISODate(stats.myNextPayDate)}
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Perlu Konfirmasi"
            value={String(stats.myAcknowledgmentNeeded)}
            hint="slip baru"
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Diterima"
            value={formatIDR(stats.myLifetimeEarnings)}
            hint="semua slip diterbitkan"
            accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
        </div>
      )}

      {stats?.isAdmin && stats.latestPeriod ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <CalendarRange className="size-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Periode terakhir
              </p>
              <p className="font-semibold truncate">
                {stats.latestPeriod.periodLabel}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                PERIOD_STATUS_CONFIG[stats.latestPeriod.status]?.badge ??
                PERIOD_STATUS_CONFIG.draft.badge
              }
            >
              {PERIOD_STATUS_CONFIG[stats.latestPeriod.status]?.label ??
                "Draft"}
            </Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Gross</p>
              <p className="font-semibold tabular-nums">
                {formatIDR(stats.latestPeriod.totalGross)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Netto</p>
              <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatIDR(stats.latestPeriod.totalNet)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="my" className="cursor-pointer">
            <Receipt className="size-4" />
            Slip Saya
          </TabsTrigger>
          {isAdmin ? (
            <>
              <TabsTrigger value="periods" className="cursor-pointer">
                <CalendarRange className="size-4" />
                Periode
              </TabsTrigger>
              <TabsTrigger value="structures" className="cursor-pointer">
                <Users className="size-4" />
                Struktur Gaji
              </TabsTrigger>
              <TabsTrigger value="components" className="cursor-pointer">
                <Coins className="size-4" />
                Komponen
              </TabsTrigger>
            </>
          ) : null}
        </TabsList>
        <TabsContent value="my" className="space-y-4">
          <MyPayslipsTab />
        </TabsContent>
        {isAdmin ? (
          <>
            <TabsContent value="periods" className="space-y-4">
              <PeriodsTab />
            </TabsContent>
            <TabsContent value="structures" className="space-y-4">
              <StructuresTab />
            </TabsContent>
            <TabsContent value="components" className="space-y-4">
              <ComponentsTab />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}

export default function PayrollPage() {
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
            Silakan masuk untuk melihat slip gaji Anda.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <PayrollPageInner />
      </Authenticated>
    </>
  );
}
