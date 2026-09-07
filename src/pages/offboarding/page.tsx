import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { Badge } from "@/components/ui/badge.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
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
  DoorOpen,
  LogOut,
  Search,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  FileStack,
  MessageSquareHeart,
  Briefcase,
  CircleCheck,
  CircleX,
  RotateCcw,
  CalendarClock,
  ThumbsUp,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { isAdminRole } from "@/convex/roles.ts";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import ResignationFormDialog from "./_components/ResignationFormDialog.tsx";
import ResignationReviewDialog from "./_components/ResignationReviewDialog.tsx";
import TemplateFormDialog from "./_components/TemplateFormDialog.tsx";
import CaseDetailDialog from "./_components/CaseDetailDialog.tsx";
import ExitInterviewDialog from "./_components/ExitInterviewDialog.tsx";
import {
  formatDate,
  formatOffsetDays,
  getCategoryConfig,
  getExitTypeConfig,
  OWNER_LABELS,
  REASON_CATEGORY_LABELS,
  STATUS_BADGE,
  STATUS_LABELS,
} from "./_lib/offboarding-utils.ts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart.tsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils.ts";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sublabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
  sublabel?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              accent,
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-xl font-bold">{value}</p>
            {sublabel ? (
              <p className="text-[10px] text-muted-foreground">{sublabel}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MyOffboardingView({
  currentUserId,
}: {
  currentUserId: Id<"users"> | undefined;
}) {
  const myCase = useQuery(api.offboarding.getMyCase, {});
  const myReqs = useQuery(api.offboarding.getMyResignations, {});
  const withdraw = useMutation(api.offboarding.withdrawResignation);
  const [selectedCase, setSelectedCase] = useState<Id<"offboardingCases"> | null>(
    null,
  );
  const [eiOpen, setEiOpen] = useState(false);

  async function handleWithdraw(id: Id<"resignationRequests">) {
    try {
      await withdraw({ id });
      toast.success("Pengajuan dibatalkan");
    } catch {
      toast.error("Gagal membatalkan");
    }
  }

  const pending = useMemo(
    () => (myReqs ?? []).find((r) => r.status === "pending"),
    [myReqs],
  );

  if (myReqs === undefined || myCase === undefined) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!myCase && (!myReqs || myReqs.length === 0)) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LogOut />
          </EmptyMedia>
          <EmptyTitle>Belum ada pengajuan</EmptyTitle>
          <EmptyDescription>
            Gunakan tombol &ldquo;Ajukan Resign&rdquo; untuk memulai proses
            offboarding Anda.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <ResignationFormDialog />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {myCase ? (
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => setSelectedCase(myCase._id)}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Offboarding {myCase.userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Hari terakhir: {formatDate(myCase.lastWorkingDay)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={STATUS_BADGE[myCase.status] ?? ""}
              >
                {STATUS_LABELS[myCase.status] ?? myCase.status}
              </Badge>
            </div>
            <Progress value={myCase.progress.percent} />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {myCase.progress.done} / {myCase.progress.total} tugas selesai
              </span>
              {myCase.exitInterviewStatus ? (
                <Badge
                  variant="outline"
                  className={
                    STATUS_BADGE[myCase.exitInterviewStatus] ??
                    "bg-muted text-muted-foreground"
                  }
                >
                  Exit Interview:{" "}
                  {STATUS_LABELS[myCase.exitInterviewStatus] ??
                    myCase.exitInterviewStatus}
                </Badge>
              ) : null}
            </div>
            {myCase.exitInterview?.status === "pending" ? (
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setEiOpen(true);
                }}
              >
                <MessageSquareHeart className="size-4" />
                Isi Exit Interview
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">Riwayat Pengajuan</p>
        {(myReqs ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada pengajuan sebelumnya.
          </p>
        ) : (
          (myReqs ?? []).map((r) => {
            const exitCfg = getExitTypeConfig(r.exitType);
            return (
              <Card key={r._id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <exitCfg.icon className={cn("size-4", exitCfg.color)} />
                        {exitCfg.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hari terakhir: {formatDate(r.lastWorkingDay)} · Diajukan{" "}
                        {formatDate(r.noticeDate)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={STATUS_BADGE[r.status] ?? ""}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </div>
                  <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                    {r.reason}
                  </p>
                  {r.reviewNote ? (
                    <p className="text-xs bg-muted/50 rounded p-2">
                      <span className="font-medium">Catatan HR:</span>{" "}
                      {r.reviewNote}
                    </p>
                  ) : null}
                  {r.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleWithdraw(r._id)}
                      className="cursor-pointer"
                    >
                      <RotateCcw className="size-4" />
                      Batalkan Pengajuan
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
        {!pending && !myCase ? (
          <div className="pt-2">
            <ResignationFormDialog />
          </div>
        ) : null}
      </div>

      <CaseDetailDialog
        open={selectedCase !== null}
        onOpenChange={(v) => {
          if (!v) setSelectedCase(null);
        }}
        caseId={selectedCase}
        isAdmin={false}
        currentUserId={currentUserId}
      />

      {myCase?.exitInterview ? (
        <ExitInterviewDialog
          open={eiOpen}
          onOpenChange={setEiOpen}
          interviewId={myCase.exitInterview._id}
        />
      ) : null}
    </div>
  );
}

function TemplateRow({
  template,
}: {
  template: Doc<"offboardingChecklistTemplates">;
}) {
  const update = useMutation(api.offboarding.updateTemplate);
  const remove = useMutation(api.offboarding.removeTemplate);
  const cat = getCategoryConfig(template.category);
  const Icon = cat.icon;

  async function toggleActive() {
    try {
      await update({ id: template._id, isActive: !template.isActive });
      toast.success(template.isActive ? "Dinonaktifkan" : "Diaktifkan");
    } catch {
      toast.error("Gagal memperbarui");
    }
  }

  async function handleDelete() {
    try {
      await remove({ id: template._id });
      toast.success("Dihapus");
    } catch {
      toast.error("Gagal menghapus");
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          cat.iconBg,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{template.title}</p>
            {template.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {template.description}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className={cat.badge}>
                {cat.label}
              </Badge>
              <Badge variant="outline">
                {OWNER_LABELS[template.ownerRole] ?? template.ownerRole}
              </Badge>
              <span className="text-muted-foreground">
                {formatOffsetDays(template.dueOffsetDays)}
              </span>
              {!template.isActive ? (
                <Badge variant="outline" className="bg-muted">
                  Nonaktif
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              className="cursor-pointer"
              onClick={toggleActive}
            >
              {template.isActive ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <TemplateFormDialog
              template={template}
              trigger={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="cursor-pointer"
                >
                  <Pencil className="size-4" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus template ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Case yang sudah dibuat tidak akan terpengaruh.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

function OffboardingInner() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const isAdmin = isAdminRole(currentUser?.role);

  const statsQuery = useQuery(api.offboarding.getStats, isAdmin ? {} : "skip");
  const stats = statsQuery ?? {
    pendingRequests: 0,
    activeCases: 0,
    completedCases: 0,
    avgTenure: null,
    avgSatisfaction: null,
    avgRecommend: null,
    reasonBreakdown: [],
    departmentBreakdown: [],
  };
  const [reqFilter, setReqFilter] = useState("all");
  const resignations = useQuery(
    api.offboarding.listResignations,
    isAdmin ? { status: reqFilter } : "skip",
  );
  const [caseFilter, setCaseFilter] = useState("all");
  const cases = useQuery(
    api.offboarding.listCases,
    isAdmin ? { status: caseFilter } : "skip",
  );
  const templates = useQuery(
    api.offboarding.listTemplates,
    isAdmin ? {} : "skip",
  );
  const [caseSearch, setCaseSearch] = useState("");
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    const q = caseSearch.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.userName.toLowerCase().includes(q) ||
        (c.userDepartment ?? "").toLowerCase().includes(q) ||
        (c.userJobTitle ?? "").toLowerCase().includes(q),
    );
  }, [cases, caseSearch]);

  const [selectedCase, setSelectedCase] = useState<Id<"offboardingCases"> | null>(
    null,
  );
  const [reviewState, setReviewState] = useState<{
    id: Id<"resignationRequests"> | null;
    decision: "approve" | "reject";
  }>({ id: null, decision: "approve" });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-slate-500 to-zinc-500 flex items-center justify-center shadow-lg shadow-slate-500/30">
            <DoorOpen className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Offboarding &amp; Exit Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola proses resign, handover, clearance, dan exit interview
              dengan checklist terstruktur.
            </p>
          </div>
        </div>
        <ResignationFormDialog />
      </div>

      {isAdmin ? (
        statsQuery === undefined ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={AlertTriangle}
              label="Pengajuan Menunggu"
              value={String(stats.pendingRequests)}
              accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              icon={Briefcase}
              label="Case Berjalan"
              value={String(stats.activeCases)}
              accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              icon={CheckCircle2}
              label="Selesai"
              value={String(stats.completedCases)}
              accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={Clock}
              label="Rata-rata Masa Kerja"
              value={stats.avgTenure != null ? `${stats.avgTenure} th` : "-"}
              accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              sublabel={
                stats.avgSatisfaction != null
                  ? `Kepuasan ${stats.avgSatisfaction}/5`
                  : undefined
              }
            />
          </div>
        )
      ) : null}

      <Tabs defaultValue={isAdmin ? "cases" : "mine"} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="mine" className="cursor-pointer">
              <LogOut className="size-4" />
              Saya
            </TabsTrigger>
            {isAdmin ? (
              <>
                <TabsTrigger value="requests" className="cursor-pointer">
                  <FileStack className="size-4" />
                  Pengajuan
                  {stats && stats.pendingRequests > 0 ? (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 min-w-5 px-1.5"
                    >
                      {stats.pendingRequests}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="cases" className="cursor-pointer">
                  <Users className="size-4" />
                  Case Offboarding
                </TabsTrigger>
                <TabsTrigger value="analytics" className="cursor-pointer">
                  <ThumbsUp className="size-4" />
                  Analitik Exit
                </TabsTrigger>
                <TabsTrigger value="templates" className="cursor-pointer">
                  <ListChecks className="size-4" />
                  Template
                </TabsTrigger>
              </>
            ) : null}
          </TabsList>
        </div>

        <TabsContent value="mine" className="space-y-3">
          <MyOffboardingView currentUserId={currentUser?._id} />
        </TabsContent>

        {isAdmin ? (
          <>
            <TabsContent value="requests" className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 rounded-md bg-muted/50 p-1">
                  {[
                    { key: "all", label: "Semua" },
                    { key: "pending", label: "Menunggu" },
                    { key: "approved", label: "Disetujui" },
                    { key: "rejected", label: "Ditolak" },
                    { key: "withdrawn", label: "Dibatalkan" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setReqFilter(t.key)}
                      className={cn(
                        "text-sm px-3 py-1 rounded cursor-pointer",
                        reqFilter === t.key
                          ? "bg-background font-medium shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {resignations === undefined ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : resignations.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileStack />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada pengajuan</EmptyTitle>
                    <EmptyDescription>
                      Pengajuan resign karyawan akan tampil di sini.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {resignations.map((r) => {
                    const exit = getExitTypeConfig(r.exitType);
                    return (
                      <Card key={r._id}>
                        <CardContent className="p-3 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <Avatar className="size-10">
                                {r.userAvatar ? (
                                  <AvatarImage
                                    src={r.userAvatar}
                                    alt={r.userName}
                                  />
                                ) : null}
                                <AvatarFallback>
                                  {r.userName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {r.userName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {r.userJobTitle
                                    ? `${r.userJobTitle} · `
                                    : ""}
                                  {r.userDepartment ?? "-"}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="gap-1"
                                  >
                                    <exit.icon
                                      className={cn("size-3", exit.color)}
                                    />
                                    {exit.label}
                                  </Badge>
                                  <Badge variant="outline">
                                    {REASON_CATEGORY_LABELS[r.reasonCategory] ??
                                      r.reasonCategory}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={STATUS_BADGE[r.status] ?? ""}
                                  >
                                    {STATUS_LABELS[r.status] ?? r.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-right text-muted-foreground space-y-0.5">
                              <p className="flex items-center gap-1 justify-end">
                                <CalendarClock className="size-3" />
                                Hari terakhir {formatDate(r.lastWorkingDay)}
                              </p>
                              {r.tenureYears != null ? (
                                <p>{r.tenureYears} th masa kerja</p>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {r.reason}
                          </p>
                          {r.futureEmployer ? (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Rencana:</span>{" "}
                              {r.futureEmployer}
                            </p>
                          ) : null}
                          {r.reviewNote ? (
                            <p className="text-xs bg-muted/50 rounded p-2">
                              <span className="font-medium">
                                Catatan {r.reviewerName ?? "HR"}:
                              </span>{" "}
                              {r.reviewNote}
                            </p>
                          ) : null}
                          {r.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                                onClick={() =>
                                  setReviewState({
                                    id: r._id,
                                    decision: "approve",
                                  })
                                }
                              >
                                <CircleCheck className="size-4" />
                                Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="cursor-pointer text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  setReviewState({
                                    id: r._id,
                                    decision: "reject",
                                  })
                                }
                              >
                                <CircleX className="size-4" />
                                Tolak
                              </Button>
                            </div>
                          ) : null}
                          {r.caseId ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => setSelectedCase(r.caseId!)}
                            >
                              Buka Case Offboarding
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cases" className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    placeholder="Cari nama karyawan..."
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-1 rounded-md bg-muted/50 p-1">
                  {[
                    { key: "all", label: "Semua" },
                    { key: "in_progress", label: "Berjalan" },
                    { key: "completed", label: "Selesai" },
                    { key: "cancelled", label: "Dibatalkan" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setCaseFilter(t.key)}
                      className={cn(
                        "text-sm px-3 py-1 rounded cursor-pointer",
                        caseFilter === t.key
                          ? "bg-background font-medium shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {cases === undefined ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredCases.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada case</EmptyTitle>
                    <EmptyDescription>
                      Case offboarding akan otomatis dibuat saat pengajuan
                      resign disetujui.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredCases.map((c) => (
                    <Card
                      key={c._id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedCase(c._id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="size-10">
                            {c.userAvatar ? (
                              <AvatarImage
                                src={c.userAvatar}
                                alt={c.userName}
                              />
                            ) : null}
                            <AvatarFallback>
                              {c.userName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {c.userName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.userJobTitle ?? ""}
                              {c.userDepartment
                                ? ` · ${c.userDepartment}`
                                : ""}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={STATUS_BADGE[c.status] ?? ""}
                          >
                            {STATUS_LABELS[c.status] ?? c.status}
                          </Badge>
                        </div>
                        <Progress value={c.progress.percent} />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {c.progress.done}/{c.progress.total} tugas ·{" "}
                            {c.progress.percent}%
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarClock className="size-3" />
                            {formatDate(c.lastWorkingDay)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-3">
              {stats === undefined ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold">
                          Alasan Utama Exit
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Berdasarkan pengajuan yang disetujui
                        </p>
                      </div>
                      {stats.reasonBreakdown.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Belum ada data.
                        </p>
                      ) : (
                        <ChartContainer
                          config={
                            {
                              count: {
                                label: "Jumlah",
                                color: "var(--chart-3)",
                              },
                            } satisfies ChartConfig
                          }
                          className="h-56 w-full"
                        >
                          <BarChart
                            data={stats.reasonBreakdown.map((r) => ({
                              label:
                                REASON_CATEGORY_LABELS[r.key] ?? r.key,
                              count: r.count,
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
                            />
                            <YAxis
                              type="category"
                              dataKey="label"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                              width={120}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                              dataKey="count"
                              fill="var(--chart-3)"
                              radius={[0, 6, 6, 0]}
                            />
                          </BarChart>
                        </ChartContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold">
                          Exit per Departemen
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Case offboarding yang sudah/sedang berjalan
                        </p>
                      </div>
                      {stats.departmentBreakdown.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Belum ada data.
                        </p>
                      ) : (
                        <ChartContainer
                          config={
                            {
                              count: {
                                label: "Jumlah",
                                color: "var(--chart-1)",
                              },
                            } satisfies ChartConfig
                          }
                          className="h-56 w-full"
                        >
                          <BarChart
                            data={stats.departmentBreakdown.map((d) => ({
                              label: d.department,
                              count: d.count,
                            }))}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="label"
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              fontSize={11}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                              dataKey="count"
                              fill="var(--chart-1)"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ChartContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-semibold">
                        Indikator Sentimen Exit
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">
                            Kepuasan Rata-rata
                          </p>
                          <p className="text-xl font-bold">
                            {stats.avgSatisfaction != null
                              ? `${stats.avgSatisfaction}/5`
                              : "-"}
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">
                            Rekomendasi (eNPS)
                          </p>
                          <p className="text-xl font-bold">
                            {stats.avgRecommend != null
                              ? `${stats.avgRecommend}/10`
                              : "-"}
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">
                            Masa Kerja
                          </p>
                          <p className="text-xl font-bold">
                            {stats.avgTenure != null
                              ? `${stats.avgTenure} th`
                              : "-"}
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">
                            Total Selesai
                          </p>
                          <p className="text-xl font-bold">
                            {stats.completedCases}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Tugas otomatis yang dibuat untuk setiap case offboarding.
                </p>
                <TemplateFormDialog
                  trigger={
                    <Button size="sm" className="gap-1 cursor-pointer">
                      <Plus className="size-4" />
                      Template Baru
                    </Button>
                  }
                />
              </div>
              {templates === undefined ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ListChecks />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada template</EmptyTitle>
                    <EmptyDescription>
                      Tambahkan template seperti &ldquo;Kembalikan laptop&rdquo;,
                      &ldquo;Cabut akses sistem&rdquo;, atau &ldquo;Final
                      payroll&rdquo;.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <TemplateFormDialog
                      trigger={
                        <Button size="sm" className="gap-1 cursor-pointer">
                          <Plus className="size-4" />
                          Template Baru
                        </Button>
                      }
                    />
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <TemplateRow key={t._id} template={t} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        ) : null}
      </Tabs>

      <CaseDetailDialog
        open={selectedCase !== null}
        onOpenChange={(v) => {
          if (!v) setSelectedCase(null);
        }}
        caseId={selectedCase}
        isAdmin={isAdmin}
        currentUserId={currentUser?._id}
      />

      <ResignationReviewDialog
        open={reviewState.id !== null}
        onOpenChange={(v) => {
          if (!v) setReviewState({ id: null, decision: "approve" });
        }}
        requestId={reviewState.id}
        decision={reviewState.decision}
      />
    </div>
  );
}

export default function OffboardingPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
          <LogOut className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Silakan masuk untuk mengakses offboarding.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <OffboardingInner />
      </Authenticated>
    </>
  );
}
