import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
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
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Users,
  History,
  Gauge,
  Target,
  CheckCircle2,
  XCircle,
  Trash2,
  FileText,
  Pencil,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import {
  bandColorForGrade,
  bandLabelForGrade,
  EVAL_STATUS_CONFIG,
  formatCompaRatio,
  compaRatioColor,
  formatIDR,
  SIZE_BAND_CONFIG,
  FACTORS,
} from "./_lib/grading-utils.ts";
import ScoreFormDialog from "./_components/ScoreFormDialog.tsx";
import CreateEvaluationDialog from "./_components/CreateEvaluationDialog.tsx";
import AssignEmployeeDialog from "./_components/AssignEmployeeDialog.tsx";
import JobEvaluationReportDialog from "./_components/JobEvaluationReportDialog.tsx";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import { cn } from "@/lib/utils.ts";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function EvaluatorsList({
  evaluationId,
}: {
  evaluationId: Id<"ggsEvaluations">;
}) {
  const [scoreOpen, setScoreOpen] = useState(false);
  const data = useQuery(api.grading.getEvaluation, { evaluationId });
  const approve = useMutation(api.grading.approveEvaluation);
  const reject = useMutation(api.grading.rejectEvaluation);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!data) {
    return <Skeleton className="h-32 w-full" />;
  }
  const { evaluation, evaluators, isAdmin, currentUserId } = data;
  const myEvaluator = evaluators.find((e) => e.userId === currentUserId);
  const allSubmitted =
    evaluators.length > 0 && evaluators.every((e) => e.status === "submitted");
  const submittedCount = evaluators.filter(
    (e) => e.status === "submitted",
  ).length;

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approve({ evaluationId });
      toast.success("Evaluasi disetujui & grade diperbarui");
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string };
        toast.error(d.message ?? "Gagal menyetujui");
      } else {
        toast.error("Gagal menyetujui");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }
    setBusy(true);
    try {
      await reject({ evaluationId, reason: rejectReason.trim() });
      toast.success("Evaluasi ditolak");
    } catch {
      toast.error("Gagal menolak");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {evaluation.periodLabel}
            <Badge
              variant="outline"
              className={cn(
                "ml-2",
                EVAL_STATUS_CONFIG[evaluation.status]?.className,
              )}
            >
              {EVAL_STATUS_CONFIG[evaluation.status]?.label}
            </Badge>
          </p>
          <p className="text-xs text-muted-foreground">
            {submittedCount}/{evaluators.length} komite sudah submit
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {myEvaluator &&
          (evaluation.status === "in_review" ||
            evaluation.status === "draft") ? (
            <Button
              onClick={() => setScoreOpen(true)}
              className="cursor-pointer"
            >
              <Target className="size-4" />
              {myEvaluator.status === "submitted"
                ? "Edit Penilaian Saya"
                : "Isi Penilaian Saya"}
            </Button>
          ) : null}
          {isAdmin &&
          evaluation.status === "in_review" &&
          submittedCount > 0 ? (
            <>
              <Button
                onClick={handleApprove}
                disabled={busy}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="size-4" />
                Setujui &amp; Finalisasi
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="cursor-pointer text-destructive"
                  >
                    <XCircle className="size-4" />
                    Tolak
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tolak Evaluasi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tulis alasan penolakan. Evaluasi ditandai rejected dan
                      dapat dibuat ulang.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <textarea
                    className="min-h-20 w-full rounded-md border bg-background p-2 text-sm"
                    placeholder="Alasan penolakan..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReject}
                      className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Tolak
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </div>
      </div>

      {/* Committee list */}
      <div className="space-y-2">
        {evaluators.map((e) => (
          <div
            key={e._id}
            className="flex items-center gap-3 rounded-md border bg-muted/20 p-2"
          >
            <Avatar className="size-8">
              <AvatarImage src={e.user?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {(e.user?.name ?? "?").slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {e.user?.name ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {e.user?.jobTitle ?? e.user?.department ?? ""}
              </p>
            </div>
            {e.status === "submitted" ? (
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3" /> Submit
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-700 dark:text-amber-300"
              >
                Menunggu
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Factor breakdown if approved or scores visible */}
      {evaluation.status === "approved" ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hasil Akhir
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FACTORS.map((f) => {
              const map: Record<string, number | undefined> = {
                functional_knowledge: evaluation.finalFunctionalKnowledge,
                business_expertise: evaluation.finalBusinessExpertise,
                leadership: evaluation.finalLeadership,
                problem_solving: evaluation.finalProblemSolving,
                nature_of_impact: evaluation.finalNatureOfImpact,
                area_of_impact: evaluation.finalAreaOfImpact,
                interpersonal_skills: evaluation.finalInterpersonalSkills,
              };
              const val = map[f.key];
              return (
                <div
                  key={f.key}
                  className="flex items-center justify-between gap-2 rounded border bg-background p-2"
                >
                  <p className="truncate text-xs">{f.label}</p>
                  <p className="text-sm font-bold">
                    {val !== undefined ? val.toFixed(2) : "—"}
                    <span className="text-[10px] text-muted-foreground"> /7</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {myEvaluator ? (
        <ScoreFormDialog
          open={scoreOpen}
          onOpenChange={setScoreOpen}
          evaluationId={evaluationId}
        />
      ) : null}
    </div>
  );
}

function GradingDetailInner({ positionId }: { positionId: Id<"ggsPositions"> }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeEvalId = searchParams.get("evalId") as Id<"ggsEvaluations"> | null;
  const detail = useQuery(api.grading.getPositionDetail, { positionId });
  const deletePos = useMutation(api.grading.deletePosition);
  const archiveAssignment = useMutation(api.grading.archiveAssignment);
  const { isAdmin } = useCurrentRole();

  if (detail === undefined) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Briefcase />
            </EmptyMedia>
            <EmptyTitle>Jabatan tidak ditemukan</EmptyTitle>
            <EmptyDescription>
              Jabatan ini mungkin sudah dihapus atau diarsipkan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const { position, currentEvaluation, salaryBand, evaluations, assignments, history } = detail;
  const grade = position.currentGrade ?? 0;
  const selectedEval =
    activeEvalId !== null
      ? evaluations.find((e) => e._id === activeEvalId)
      : evaluations[0];

  const handleDelete = async () => {
    try {
      await deletePos({ positionId });
      toast.success("Jabatan dihapus");
      navigate("/grading");
    } catch {
      toast.error("Gagal menghapus jabatan");
    }
  };

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/grading")}
          className="cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="size-4" />
                <span>{position.department}</span>
                {position.jobFamily ? (
                  <span>· {position.jobFamily}</span>
                ) : null}
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {position.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {position.summary}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              {position.currentGrade !== undefined ? (
                <>
                  <div
                    className={cn(
                      "flex size-20 items-center justify-center rounded-xl text-3xl font-bold",
                      bandColorForGrade(grade),
                    )}
                  >
                    {grade}
                  </div>
                  <p className="text-xs font-semibold">
                    {bandLabelForGrade(grade)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Global Grade
                  </p>
                </>
              ) : (
                <Badge variant="outline">Belum dievaluasi</Badge>
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-muted/20 p-3">
              <p className="text-[11px] uppercase text-muted-foreground">
                Salary Band (Mid)
              </p>
              <p className="text-sm font-semibold">
                {salaryBand ? formatIDR(salaryBand.midSalary) : "—"}
              </p>
              {salaryBand ? (
                <p className="text-[11px] text-muted-foreground">
                  {formatIDR(salaryBand.minSalary)} —{" "}
                  {formatIDR(salaryBand.maxSalary)}
                </p>
              ) : null}
            </div>
            <div className="rounded-md border bg-muted/20 p-3">
              <p className="text-[11px] uppercase text-muted-foreground">
                Karyawan Terpetakan
              </p>
              <p className="text-sm font-semibold">
                <Users className="mr-1 inline size-3.5" />
                {assignments.length}
              </p>
            </div>
            <div className="rounded-md border bg-muted/20 p-3">
              <p className="text-[11px] uppercase text-muted-foreground">
                Size Band Efektif
              </p>
              <p className="text-sm font-semibold">
                {currentEvaluation?.sizeBandUsed
                  ? (SIZE_BAND_CONFIG[currentEvaluation.sizeBandUsed]?.label ??
                    currentEvaluation.sizeBandUsed)
                  : "—"}
              </p>
            </div>
          </div>
          {isAdmin ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CreateEvaluationDialog
                positionId={positionId}
                positionTitle={position.title}
                triggerLabel={
                  position.currentGrade === undefined
                    ? "Mulai Evaluasi Pertama"
                    : "Re-Evaluasi"
                }
              />
              <AssignEmployeeDialog
                positionId={positionId}
                positionTitle={position.title}
              />
              {currentEvaluation && position.currentGrade !== undefined ? (
                <JobEvaluationReportDialog
                  position={position}
                  evaluation={currentEvaluation}
                  salaryBand={salaryBand}
                />
              ) : null}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="ml-auto cursor-pointer text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Jabatan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Seluruh evaluasi, penilaian, dan riwayat akan dihapus.
                      Tindakan ini tidak dapat dibatalkan.
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
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="evaluations" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="inline-flex w-max flex-nowrap">
            <TabsTrigger value="evaluations" className="cursor-pointer">
              <Gauge className="size-4" />
              Evaluasi
            </TabsTrigger>
            <TabsTrigger value="employees" className="cursor-pointer">
              <Users className="size-4" />
              Karyawan
            </TabsTrigger>
            <TabsTrigger value="jd" className="cursor-pointer">
              <FileText className="size-4" />
              Job Description
            </TabsTrigger>
            <TabsTrigger value="history" className="cursor-pointer">
              <History className="size-4" />
              Riwayat
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="evaluations">
          {evaluations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Target />
                </EmptyMedia>
                <EmptyTitle>Belum ada evaluasi</EmptyTitle>
                <EmptyDescription>
                  Mulai evaluasi pertama untuk menentukan grade jabatan ini.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              {evaluations.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {evaluations.map((e) => (
                    <Button
                      key={e._id}
                      size="sm"
                      variant={
                        (selectedEval?._id ?? evaluations[0]?._id) === e._id
                          ? "default"
                          : "secondary"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set("evalId", e._id);
                        setSearchParams(next);
                      }}
                    >
                      {e.periodLabel}
                    </Button>
                  ))}
                </div>
              ) : null}
              {selectedEval ? (
                <Card>
                  <CardContent className="p-4">
                    <EvaluatorsList evaluationId={selectedEval._id} />
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardContent className="p-4">
              {assignments.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada karyawan</EmptyTitle>
                    <EmptyDescription>
                      Petakan karyawan ke jabatan ini untuk melihat compa-ratio.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Gaji Saat Ini</TableHead>
                        <TableHead>Compa-Ratio</TableHead>
                        {isAdmin ? <TableHead /> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a) => {
                        const compa =
                          a.currentSalary && salaryBand
                            ? (a.currentSalary / salaryBand.midSalary) * 100
                            : null;
                        return (
                          <TableRow key={a._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="size-7">
                                  <AvatarImage
                                    src={a.user?.avatarUrl ?? undefined}
                                  />
                                  <AvatarFallback className="text-[10px]">
                                    {(a.user?.name ?? "?").slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {a.user?.name ?? "—"}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {a.user?.jobTitle ?? ""}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {a.currentSalary
                                ? formatIDR(a.currentSalary)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-semibold",
                                  compaRatioColor(compa),
                                )}
                              >
                                {formatCompaRatio(compa)}
                              </span>
                            </TableCell>
                            {isAdmin ? (
                              <TableCell className="text-right">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="cursor-pointer text-destructive"
                                  onClick={async () => {
                                    if (!window.confirm("Arsipkan mapping ini?"))
                                      return;
                                    await archiveAssignment({ id: a._id });
                                    toast.success("Mapping diarsipkan");
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jd">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Job Description</h3>
                {isAdmin ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      toast.info(
                        "Edit JD dapat dilakukan dari halaman ini (fitur edit inline akan ditambahkan).",
                      )
                    }
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                ) : null}
              </div>
              <div className="mt-3">
                {position.jobDescription ? (
                  <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm font-sans">
                    {position.jobDescription}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Belum ada job description. Tambahkan melalui form edit
                    jabatan.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-4">
              {history.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <History />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada riwayat</EmptyTitle>
                    <EmptyDescription>
                      Setiap re-grading akan dicatat di sini.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => {
                    const diff =
                      h.previousGrade !== undefined
                        ? h.newGrade - h.previousGrade
                        : null;
                    return (
                      <div
                        key={h._id}
                        className="flex items-start gap-3 rounded-md border bg-muted/20 p-3"
                      >
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            diff === null
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                              : diff > 0
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : diff < 0
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "bg-muted text-muted-foreground",
                          )}
                        >
                          {diff === null ? (
                            <ArrowUpRight className="size-4" />
                          ) : diff > 0 ? (
                            <ArrowUpRight className="size-4" />
                          ) : diff < 0 ? (
                            <ArrowDownRight className="size-4" />
                          ) : (
                            <Minus className="size-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {h.previousGrade !== undefined ? (
                              <>
                                Grade {h.previousGrade}{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                <span className="font-bold">{h.newGrade}</span>
                              </>
                            ) : (
                              <>
                                Grade awal:{" "}
                                <span className="font-bold">{h.newGrade}</span>
                              </>
                            )}
                          </p>
                          {h.reason ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {h.reason}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(h.changedAt), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function GradingDetailPage() {
  const { positionId } = useParams<{ positionId: string }>();
  if (!positionId) {
    return (
      <div className="p-6">
        <p>Jabatan tidak ditemukan</p>
      </div>
    );
  }
  return <GradingDetailInner positionId={positionId as Id<"ggsPositions">} />;
}
