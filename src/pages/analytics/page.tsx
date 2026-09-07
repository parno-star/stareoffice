import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import {
  BarChart3,
  Users,
  UserPlus,
  GraduationCap,
  HeartPulse,
  Award,
  ShieldAlert,
  Building2,
  Briefcase,
  Clock,
  Wallet,
  LineChart as LineChartIcon,
  UserSearch,
  Sparkles,
  Network,
  Target,
} from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
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
import StatCard from "../admin/_components/StatCard.tsx";
import {
  HeadcountTrendCard,
  CompositionCard,
  TenureDistributionCard,
  PerformanceDistributionCard,
  CompensationCard,
  PayrollTrendCard,
  PipelineCard,
  EngagementPulseCard,
  TopSkillsCard,
  DepartmentScorecardTable,
} from "./_components/AnalyticsCharts.tsx";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";

function formatShortIdr(amount: number | null): string {
  if (amount === null) return "-";
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function AnalyticsContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const hasAccess = isAdminRole(currentUser?.role);

  const kpis = useQuery(api.analytics.getKpis, hasAccess ? {} : "skip");
  const composition = useQuery(
    api.analytics.getWorkforceComposition,
    hasAccess ? {} : "skip",
  );
  const headcountTrend = useQuery(
    api.analytics.getHeadcountTrend,
    hasAccess ? {} : "skip",
  );
  const tenure = useQuery(
    api.analytics.getTenureDistribution,
    hasAccess ? {} : "skip",
  );
  const performance = useQuery(
    api.analytics.getPerformanceDistribution,
    hasAccess ? {} : "skip",
  );
  const compensation = useQuery(
    api.analytics.getCompensationByDepartment,
    hasAccess ? {} : "skip",
  );
  const payrollTrend = useQuery(
    api.analytics.getPayrollTrend,
    hasAccess ? {} : "skip",
  );
  const pipeline = useQuery(
    api.analytics.getRecruitmentPipeline,
    hasAccess ? {} : "skip",
  );
  const engagementPulse = useQuery(
    api.analytics.getEngagementPulse,
    hasAccess ? {} : "skip",
  );
  const skills = useQuery(api.analytics.getTopSkills, hasAccess ? {} : "skip");
  const scorecard = useQuery(
    api.analytics.getDepartmentScorecard,
    hasAccess ? {} : "skip",
  );

  if (currentUser === undefined) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlert />
            </EmptyMedia>
            <EmptyTitle>Akses dibatasi</EmptyTitle>
            <EmptyDescription>
              Dashboard Analitik HR hanya dapat diakses oleh admin. Hubungi
              administrator perusahaan untuk mendapatkan akses.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const isLoading =
    kpis === undefined ||
    composition === undefined ||
    headcountTrend === undefined ||
    tenure === undefined ||
    performance === undefined ||
    compensation === undefined ||
    payrollTrend === undefined ||
    pipeline === undefined ||
    engagementPulse === undefined ||
    skills === undefined ||
    scorecard === undefined;

  const defaultKpis = {
    totalEmployees: 0,
    totalDepartments: 0,
    newHiresYtd: 0,
    newHires90d: 0,
    averageTenureYears: 0,
    openPositions: 0,
    openRequisitions: 0,
    avgEngagementScore: null as number | null,
    engagementResponses: 0,
    avgPerformanceRating: null as number | null,
    performanceReviews90d: 0,
    trainingCompletionRate: 0,
    certificatesIssued90d: 0,
    payrollCostLastPeriod: 0,
    avgMonthlySalary: 0,
    recognitions90d: 0,
    candidatesInPipeline: 0,
    absenceRate30d: 0,
    activeEmployees: 0,
  };

  const safeKpis = kpis ?? defaultKpis;
  const safeComposition = composition ?? {
    byDepartment: [],
    byLevel: [],
    byLocation: [],
  };
  const safeHeadcountTrend = headcountTrend ?? [];
  const safeTenure = tenure ?? [];
  const safePerformance = performance ?? [];
  const safeEngagementPulse = engagementPulse ?? [];
  const safeSkills = skills ?? [];
  const safePayrollTrend = payrollTrend ?? [];
  const safeCompensation = compensation ?? [];
  const safePipeline = pipeline ?? [];
  const safeScorecard = scorecard ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dashboard Analitik HR
            </h1>
            <p className="text-sm text-muted-foreground">
              Insight eksekutif: komposisi tenaga kerja, performa, kompensasi,
              dan engagement.
            </p>
          </div>
        </div>
      </div>

      <DataAccessBanner category="reports" />

      {/* KPI summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Karyawan"
              value={safeKpis.totalEmployees}
              sublabel={`${safeKpis.totalDepartments} departemen`}
              tone="primary"
            />
            <StatCard
              icon={UserPlus}
              label="Karyawan Baru (YTD)"
              value={safeKpis.newHiresYtd}
              sublabel={`${safeKpis.newHires90d} dalam 90 hari terakhir`}
              tone="emerald"
            />
            <StatCard
              icon={Clock}
              label="Rata-rata Tenure"
              value={`${safeKpis.averageTenureYears}j`}
              sublabel="Masa kerja rata-rata"
              tone="sky"
            />
            <StatCard
              icon={Briefcase}
              label="Posisi Terbuka"
              value={safeKpis.openPositions}
              sublabel={`${safeKpis.openRequisitions} requisisi eksternal aktif`}
              tone="amber"
            />
            <StatCard
              icon={HeartPulse}
              label="Skor Engagement"
              value={
                safeKpis.avgEngagementScore === null
                  ? "-"
                  : `${safeKpis.avgEngagementScore}`
              }
              sublabel={`${safeKpis.engagementResponses} respons (90 hari)`}
              tone="rose"
            />
            <StatCard
              icon={Target}
              label="Rata-rata Kinerja"
              value={
                safeKpis.avgPerformanceRating === null
                  ? "-"
                  : safeKpis.avgPerformanceRating.toFixed(1)
              }
              sublabel={`${safeKpis.performanceReviews90d} review (90 hari)`}
              tone="violet"
            />
            <StatCard
              icon={GraduationCap}
              label="Completion Pelatihan"
              value={`${safeKpis.trainingCompletionRate}%`}
              sublabel={`${safeKpis.certificatesIssued90d} sertifikat (90 hari)`}
              tone="emerald"
            />
            <StatCard
              icon={Wallet}
              label="Biaya Payroll"
              value={formatShortIdr(safeKpis.payrollCostLastPeriod)}
              sublabel={`Rata-rata ${formatShortIdr(safeKpis.avgMonthlySalary)}/orang`}
              tone="slate"
            />
            <StatCard
              icon={Award}
              label="Apresiasi 90 Hari"
              value={safeKpis.recognitions90d}
              sublabel="Total recognition antar karyawan"
              tone="amber"
            />
            <StatCard
              icon={UserSearch}
              label="Pipeline Kandidat"
              value={safeKpis.candidatesInPipeline}
              sublabel="Aktif di proses rekrutmen"
              tone="sky"
            />
            <StatCard
              icon={Sparkles}
              label="Rate Absen 30 Hari"
              value={`${safeKpis.absenceRate30d}%`}
              sublabel="Hari cuti disetujui / hari kerja"
              tone="rose"
            />
            <StatCard
              icon={Network}
              label="Karyawan Aktif"
              value={safeKpis.activeEmployees}
              sublabel="Memiliki peran aktif"
              tone="primary"
            />
          </>
        )}
      </div>

      <Tabs defaultValue="workforce" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="workforce" className="gap-2">
            <Users className="size-4" />
            Tenaga Kerja
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Target className="size-4" />
            Kinerja & Engagement
          </TabsTrigger>
          <TabsTrigger value="compensation" className="gap-2">
            <Wallet className="size-4" />
            Kompensasi
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="gap-2">
            <UserSearch className="size-4" />
            Rekrutmen
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="size-4" />
            Departemen
          </TabsTrigger>
        </TabsList>

        {/* Workforce tab */}
        <TabsContent value="workforce" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <HeadcountTrendCard data={safeHeadcountTrend} />
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : (
              <>
                <CompositionCard
                  title="Komposisi per Departemen"
                  description={`${safeComposition.byDepartment.length} departemen aktif`}
                  items={safeComposition.byDepartment}
                />
                <CompositionCard
                  title="Komposisi per Jenjang"
                  description="Estimasi dari jabatan karyawan"
                  items={safeComposition.byLevel}
                />
              </>
            )}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : (
              <>
                <TenureDistributionCard items={safeTenure} />
                <CompositionCard
                  title="Komposisi per Lokasi"
                  description={`${safeComposition.byLocation.length} lokasi kerja`}
                  items={safeComposition.byLocation}
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* Performance + engagement tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : (
              <>
                <PerformanceDistributionCard items={safePerformance} />
                <EngagementPulseCard data={safeEngagementPulse} />
              </>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <TopSkillsCard items={safeSkills} />
          )}
        </TabsContent>

        {/* Compensation tab */}
        <TabsContent value="compensation" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <PayrollTrendCard data={safePayrollTrend} />
          )}
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <CompensationCard items={safeCompensation} />
          )}
        </TabsContent>

        {/* Recruitment tab */}
        <TabsContent value="recruitment" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : (
              <>
                <PipelineCard items={safePipeline} />
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <LineChartIcon className="size-5 text-primary" />
                    <h3 className="font-semibold">Ringkasan Rekrutmen</h3>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center justify-between rounded-lg border p-3">
                      <span>Requisisi aktif</span>
                      <span className="text-lg font-semibold">
                        {safeKpis.openRequisitions}
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border p-3">
                      <span>Kandidat dalam pipeline</span>
                      <span className="text-lg font-semibold">
                        {safeKpis.candidatesInPipeline}
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border p-3">
                      <span>Karyawan baru YTD</span>
                      <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        {safeKpis.newHiresYtd}
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border p-3">
                      <span>Posisi direncanakan</span>
                      <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                        {safeKpis.openPositions}
                      </span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Departments tab */}
        <TabsContent value="departments" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <DepartmentScorecardTable items={safeScorecard} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk melihat dashboard analitik HR.
        </div>
      </Unauthenticated>
      <Authenticated>
        <AnalyticsContent />
      </Authenticated>
    </>
  );
}
