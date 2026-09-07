import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import {
  BarChart3,
  Users,
  CalendarCheck,
  CalendarX,
  Clock,
  AlertTriangle,
  Briefcase,
  Receipt,
  LifeBuoy,
  Sparkles,
  HeartHandshake,
  GraduationCap,
  ShieldAlert,
  TrendingUp,
  PieChart as PieChartIcon,
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
import AttendanceTrendCard from "./_components/AttendanceTrendCard.tsx";
import LeaveBreakdownCard from "./_components/LeaveBreakdownCard.tsx";
import ExpensesMonthlyCard from "./_components/ExpensesMonthlyCard.tsx";
import HeadcountCard from "./_components/HeadcountCard.tsx";
import TopEmployeesCard from "./_components/TopEmployeesCard.tsx";
import TicketsBreakdownCard from "./_components/TicketsBreakdownCard.tsx";
import TrainingSnapshotCard from "./_components/TrainingSnapshotCard.tsx";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";

function ReportsContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const hasAccess = isAdminRole(currentUser?.role);

  const summary = useQuery(
    api.reports.getSummary,
    hasAccess ? {} : "skip",
  );
  const attendance = useQuery(
    api.reports.getAttendanceTrend,
    hasAccess ? {} : "skip",
  );
  const leaveBreakdown = useQuery(
    api.reports.getLeaveBreakdown,
    hasAccess ? {} : "skip",
  );
  const expensesMonthly = useQuery(
    api.reports.getExpensesMonthly,
    hasAccess ? {} : "skip",
  );
  const headcount = useQuery(
    api.reports.getHeadcountByDepartment,
    hasAccess ? {} : "skip",
  );
  const tickets = useQuery(
    api.reports.getTicketStatusBreakdown,
    hasAccess ? {} : "skip",
  );
  const topEmployees = useQuery(
    api.reports.getTopRecognizedEmployees,
    hasAccess ? {} : "skip",
  );
  const training = useQuery(
    api.reports.getTrainingSnapshot,
    hasAccess ? {} : "skip",
  );

  if (currentUser === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
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
              Hanya admin yang dapat melihat Laporan & Analitik HR. Hubungi
              admin perusahaan jika Anda memerlukan akses.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const isLoading =
    summary === undefined ||
    attendance === undefined ||
    leaveBreakdown === undefined ||
    expensesMonthly === undefined ||
    headcount === undefined ||
    tickets === undefined ||
    topEmployees === undefined ||
    training === undefined;

  const defaultSummary = {
    totalEmployees: 0,
    newHires30d: 0,
    activeToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
    pendingLeave: 0,
    avgWorkHours30d: 0,
    attendanceRate30d: 0,
    upcomingAnniversaries: 0,
    pendingExpenses: 0,
    openTickets: 0,
    recognitionsThisMonth: 0,
    trainingCompletions30d: 0,
  };

  const safeSummary = summary ?? defaultSummary;
  const safeAttendance = attendance ?? [];
  const safeLeaveBreakdown = leaveBreakdown ?? [];
  const safeExpensesMonthly = expensesMonthly ?? [];
  const safeHeadcount = headcount ?? [];
  const safeTickets = tickets ?? [];
  const safeTopEmployees = topEmployees ?? [];
  const safeTraining = training ?? {
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    avgProgress: 0,
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
          <BarChart3 className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Laporan & Analitik HR
          </h1>
          <p className="text-sm text-muted-foreground">
            Insight karyawan, kehadiran, cuti, reimbursement, dan pengembangan.
          </p>
        </div>
      </div>

      <DataAccessBanner category="reports" />

      {/* KPI row */}
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
              value={safeSummary.totalEmployees}
              sublabel={`${safeSummary.newHires30d} karyawan baru (30 hari)`}
              tone="primary"
            />
            <StatCard
              icon={CalendarCheck}
              label="Hadir Hari Ini"
              value={safeSummary.activeToday}
              sublabel={`${safeSummary.lateToday} terlambat`}
              tone="emerald"
            />
            <StatCard
              icon={CalendarX}
              label="Cuti Hari Ini"
              value={safeSummary.onLeaveToday}
              sublabel={`${safeSummary.pendingLeave} menunggu persetujuan`}
              tone="amber"
            />
            <StatCard
              icon={Clock}
              label="Rata-rata Jam Kerja"
              value={`${safeSummary.avgWorkHours30d}j`}
              sublabel={`Kehadiran 30 hari: ${safeSummary.attendanceRate30d}%`}
              tone="sky"
            />
            <StatCard
              icon={Briefcase}
              label="Anniversary Mendatang"
              value={safeSummary.upcomingAnniversaries}
              sublabel="30 hari ke depan"
              tone="violet"
            />
            <StatCard
              icon={Receipt}
              label="Reimbursement Pending"
              value={safeSummary.pendingExpenses}
              sublabel="Perlu ditinjau"
              tone="rose"
            />
            <StatCard
              icon={LifeBuoy}
              label="Tiket IT Aktif"
              value={safeSummary.openTickets}
              sublabel="Open + diproses"
              tone="slate"
            />
            <StatCard
              icon={HeartHandshake}
              label="Apresiasi 30 Hari"
              value={safeSummary.recognitionsThisMonth}
              sublabel={`${safeSummary.trainingCompletions30d} pelatihan selesai`}
              tone="emerald"
            />
          </>
        )}
      </div>

      <Tabs defaultValue="people" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="people" className="gap-2">
            <Users className="size-4" />
            Karyawan
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <CalendarCheck className="size-4" />
            Kehadiran & Cuti
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2">
            <Receipt className="size-4" />
            Finansial & Layanan
          </TabsTrigger>
          <TabsTrigger value="development" className="gap-2">
            <GraduationCap className="size-4" />
            Pengembangan
          </TabsTrigger>
        </TabsList>

        {/* People / headcount */}
        <TabsContent value="people" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : (
              <>
                <HeadcountCard items={safeHeadcount} />
                <TopEmployeesCard items={safeTopEmployees} />
              </>
            )}
          </div>
        </TabsContent>

        {/* Attendance + leave */}
        <TabsContent value="attendance" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <AttendanceTrendCard data={safeAttendance} />
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : (
              <>
                <LeaveBreakdownCard items={safeLeaveBreakdown} />
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="size-5 text-primary" />
                    <h3 className="font-semibold">Ringkasan Cuti</h3>
                  </div>
                  <dl className="space-y-3 text-sm">
                    {safeLeaveBreakdown.length === 0 ? (
                      <p className="text-muted-foreground">
                        Belum ada data cuti.
                      </p>
                    ) : (
                      safeLeaveBreakdown.map((row) => (
                        <div
                          key={row.type}
                          className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                        >
                          <dt className="font-medium capitalize">
                            {row.type}
                          </dt>
                          <dd className="text-right">
                            <span className="text-lg font-semibold">
                              {row.totalDays}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              hari disetujui
                            </span>
                          </dd>
                        </div>
                      ))
                    )}
                  </dl>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Finance + tickets */}
        <TabsContent value="finance" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <ExpensesMonthlyCard data={safeExpensesMonthly} />
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : (
              <>
                <TicketsBreakdownCard items={safeTickets} />
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <AlertTriangle className="size-5 text-amber-500" />
                    <h3 className="font-semibold">Aksi Perlu Perhatian</h3>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center justify-between rounded-lg border p-3">
                      <span>Cuti menunggu persetujuan</span>
                      <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                        {safeSummary.pendingLeave}
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border p-3">
                      <span>Reimbursement menunggu</span>
                      <span className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                        {safeSummary.pendingExpenses}
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border p-3">
                      <span>Tiket IT aktif</span>
                      <span className="text-lg font-semibold text-sky-600 dark:text-sky-400">
                        {safeSummary.openTickets}
                      </span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Development */}
        <TabsContent value="development" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : (
              <>
                <TrainingSnapshotCard snapshot={safeTraining} />
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="size-5 text-amber-500" />
                    <h3 className="font-semibold">Sorotan Karyawan</h3>
                  </div>
                  {safeTopEmployees.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Belum ada apresiasi dalam 90 hari terakhir.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Total apresiasi bulan ini:{" "}
                        <span className="font-semibold text-foreground">
                          {safeSummary.recognitionsThisMonth}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pelatihan selesai 30 hari terakhir:{" "}
                        <span className="font-semibold text-foreground">
                          {safeSummary.trainingCompletions30d}
                        </span>
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <PieChartIcon className="size-4" />
                        Lihat grafik lengkap di tab Karyawan.
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk melihat laporan HR.
        </div>
      </Unauthenticated>
      <Authenticated>
        <ReportsContent />
      </Authenticated>
    </>
  );
}
