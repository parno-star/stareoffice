import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Card,
  CardContent,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
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
import {
  BriefcaseBusiness,
  Users as UsersIcon,
  Inbox,
  FileCheck,
  Search,
} from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import JobFormDialog from "./_components/JobFormDialog.tsx";
import JobCard from "./_components/JobCard.tsx";
import {
  getApplicationStatusConfig,
  getStatusConfig,
} from "./_lib/job-utils.ts";

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

function JobsPageInner() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const stats = useQuery(api.jobs.getStats, {});
  const jobs = useQuery(api.jobs.list, {
    status: statusFilter,
    department: departmentFilter,
    search: search.trim() || undefined,
  });
  const departments = useQuery(api.jobs.listDepartments, {});
  const myApplications = useQuery(api.jobs.listMyApplications, {});

  const loading = stats === undefined || jobs === undefined;
  const canPost = stats?.canPost ?? false;

  const sortedDepartments = useMemo(
    () => (departments ?? []).filter((d) => d && d.length > 0),
    [departments],
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lowongan Internal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jelajahi peluang karier internal dan lamar posisi yang sesuai dengan
            Anda.
          </p>
        </div>
        {canPost ? <JobFormDialog mode="create" /> : null}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BriefcaseBusiness}
            label="Lowongan Terbuka"
            value={String(stats.openCount)}
            hint="siap menerima lamaran"
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={FileCheck}
            label="Lamaran Saya"
            value={String(stats.myApplicationCount)}
            hint="total sepanjang waktu"
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={UsersIcon}
            label="Total Lowongan"
            value={String(stats.totalCount)}
            hint="termasuk yang sudah ditutup"
            accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          />
          {canPost ? (
            <StatCard
              icon={Inbox}
              label="Menunggu Review"
              value={String(stats.pendingReviewCount)}
              hint="lamaran aktif"
              accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          ) : (
            <StatCard
              icon={Inbox}
              label="Departemen"
              value={String(sortedDepartments.length)}
              hint="membuka lowongan"
              accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          )}
        </div>
      )}

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse" className="cursor-pointer">
            Jelajahi Lowongan
          </TabsTrigger>
          <TabsTrigger value="mine" className="cursor-pointer">
            Lamaran Saya
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari posisi, misalnya Engineer atau Analyst..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {sortedDepartments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Dibuka</SelectItem>
                <SelectItem value="closed">Ditutup</SelectItem>
                <SelectItem value="all">Semua Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {jobs === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BriefcaseBusiness />
                </EmptyMedia>
                <EmptyTitle>Belum ada lowongan</EmptyTitle>
                <EmptyDescription>
                  Tidak ada lowongan yang cocok dengan filter Anda. Coba ubah
                  kriteria pencarian.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="space-y-3">
          {myApplications === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : myApplications.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileCheck />
                </EmptyMedia>
                <EmptyTitle>Belum ada lamaran</EmptyTitle>
                <EmptyDescription>
                  Jelajahi lowongan terbuka dan kirim lamaran pertama Anda.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => {
                const appStatus = getApplicationStatusConfig(app.status);
                const jobStatus = app.jobStatus
                  ? getStatusConfig(app.jobStatus)
                  : null;
                return (
                  <Card
                    key={app._id}
                    className="cursor-pointer transition-colors hover:border-primary/40"
                    onClick={() => navigate(`/jobs/${app.jobId}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold">
                            {app.jobTitle ?? "Lowongan tidak ditemukan"}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={appStatus.badge}
                            >
                              {appStatus.label}
                            </Badge>
                            {jobStatus ? (
                              <Badge
                                variant="outline"
                                className={jobStatus.badge}
                              >
                                Lowongan: {jobStatus.label}
                              </Badge>
                            ) : null}
                            <span className="text-xs text-muted-foreground">
                              {app.jobDepartment}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Dilamar{" "}
                              {formatDistanceToNowStrict(
                                new Date(app._creationTime),
                                {
                                  locale: idLocale,
                                  addSuffix: true,
                                },
                              )}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {appStatus.description}
                          </p>
                          {app.reviewNote ? (
                            <p className="mt-2 rounded-md bg-muted/60 p-2 text-sm">
                              Catatan: {app.reviewNote}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${app.jobId}`);
                          }}
                        >
                          Detail
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function JobsPage() {
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
            Silakan masuk untuk melihat lowongan internal.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <JobsPageInner />
      </Authenticated>
    </>
  );
}
