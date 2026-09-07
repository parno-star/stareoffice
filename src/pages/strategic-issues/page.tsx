import { useQuery, useMutation } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import {
  TriangleAlert,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Gavel,
  Loader2,
  Eye,
  CheckCircle2,
  CalendarX2,
  Search,
} from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { cn } from "@/lib/utils.ts";
import { useSuperAdminAccess } from "@/hooks/use-super-admin-access.ts";
import IssueCard from "./_components/IssueCard.tsx";
import IssueFormDialog from "./_components/IssueFormDialog.tsx";

// Row shape returned by api.strategicIssues.listIssues. Re-exported so the
// card and form dialog can share it.
export type StrategicIssueRow = {
  _id: Id<"strategicIssues">;
  title: string;
  description: string | null;
  ownerId: Id<"users">;
  ownerName: string | null;
  department: string | null;
  urgency: string;
  impact: string;
  dueDate: string | null;
  status: string;
  linkedObjectiveId: Id<"objectives"> | null;
  linkedObjectiveTitle: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

function StrategicIssuesContent() {
  const board = useQuery(api.strategicIssues.listIssues, {});
  const setStatus = useMutation(api.strategicIssues.setStatus);
  const deleteIssue = useMutation(api.strategicIssues.deleteIssue);

  const rawBoard = board && typeof board === "object" && !Array.isArray(board) ? board : null;
  const boardHasAccess = rawBoard?.hasAccess;
  const { isSuperAdmin } = useSuperAdminAccess(boardHasAccess);

  const effectiveHasAccess = isSuperAdmin || Boolean(boardHasAccess);
  const effectiveCanManage = isSuperAdmin || Boolean(rawBoard?.canManage);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StrategicIssueRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StrategicIssueRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (issue: StrategicIssueRow) => {
    setEditing(issue);
    setFormOpen(true);
  };

  const handleStatusChange = async (
    issue: StrategicIssueRow,
    status: string,
  ) => {
    try {
      await setStatus({
        issueId: issue._id,
        status: status as
          | "needs_decision"
          | "in_progress"
          | "monitoring"
          | "resolved",
      });
      toast.success("Status isu diperbarui");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal memperbarui status");
      } else {
        toast.error("Gagal memperbarui status");
      }
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteIssue({ issueId: pendingDelete._id });
      toast.success("Isu dihapus");
      setPendingDelete(null);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus isu");
      } else {
        toast.error("Gagal menghapus isu");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (board === undefined) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!effectiveHasAccess) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlert />
            </EmptyMedia>
            <EmptyTitle>Akses dibatasi</EmptyTitle>
            <EmptyDescription>
              Papan Isu Strategis hanya dapat diakses oleh direksi (C-Level) dan
              pengelola. Hubungi administrator perusahaan untuk mendapatkan
              akses.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const counts = rawBoard?.counts ?? {
    needsDecision: 0,
    inProgress: 0,
    monitoring: 0,
    resolved: 0,
    overdue: 0,
  };
  const allIssues: StrategicIssueRow[] = Array.isArray(rawBoard?.issues) ? rawBoard.issues : [];
  const canManage = effectiveCanManage;

  const filteredIssues = allIssues.filter((issue) => {
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (issue.title || "").toLowerCase().includes(q);
      const matchDesc = (issue.description || "").toLowerCase().includes(q);
      const matchDept = (issue.department || "").toLowerCase().includes(q);
      const matchOwner = (issue.ownerName || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchDept && !matchOwner) return false;
    }
    return true;
  });

  const summaryCards: Array<{
    key: string;
    label: string;
    value: number;
    icon: typeof Gavel;
    tone: string;
  }> = [
    {
      key: "needs_decision",
      label: "Perlu Keputusan",
      value: counts.needsDecision,
      icon: Gavel,
      tone: "text-rose-600 dark:text-rose-400",
    },
    {
      key: "in_progress",
      label: "Dalam Pengerjaan",
      value: counts.inProgress,
      icon: Loader2,
      tone: "text-sky-600 dark:text-sky-400",
    },
    {
      key: "monitoring",
      label: "Terpantau",
      value: counts.monitoring,
      icon: Eye,
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "resolved",
      label: "Selesai",
      value: counts.resolved,
      icon: CheckCircle2,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const filterTabs = [
    { key: "all", label: "Semua", count: allIssues.length },
    { key: "needs_decision", label: "Perlu Keputusan", count: counts.needsDecision },
    { key: "in_progress", label: "Dalam Pengerjaan", count: counts.inProgress },
    { key: "monitoring", label: "Terpantau", count: counts.monitoring },
    { key: "resolved", label: "Selesai", count: counts.resolved },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <TriangleAlert className="size-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Isu Strategis</h1>
              {isSuperAdmin ? (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1 font-medium py-0.5 px-2 text-xs">
                  <ShieldCheck className="size-3" />
                  Akses Penuh Super Admin
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Papan isu strategis &amp; prioritas mendesak untuk perhatian
              Direksi.
            </p>
          </div>
        </div>
        {canManage ? (
          <Button onClick={openCreate} className="shrink-0 gap-1.5">
            <Plus className="size-4" />
            Tambah Isu
          </Button>
        ) : null}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <Card
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50 hover:shadow-xs",
              statusFilter === s.key && "ring-2 ring-primary/40 border-primary",
            )}
          >
            <CardContent className="flex items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-2xl font-bold leading-none">{s.value}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {s.label}
                </p>
              </div>
              <s.icon className={cn("size-5", s.tone)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue banner */}
      {counts.overdue > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <CalendarX2 className="size-4 shrink-0" />
          <span>
            {counts.overdue} isu telah melewati tenggat dan belum selesai.
          </span>
        </div>
      ) : null}

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              className="h-8 gap-1.5 text-xs"
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  statusFilter === tab.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari isu, unit, atau PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Issue list */}
      {filteredIssues.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlert />
            </EmptyMedia>
            <EmptyTitle>
              {allIssues.length === 0
                ? "Belum ada isu strategis"
                : "Tidak ada isu yang cocok"}
            </EmptyTitle>
            <EmptyDescription>
              {allIssues.length === 0
                ? canManage
                  ? "Catat isu atau prioritas mendesak pertama untuk dibawa ke perhatian Direksi."
                  : "Belum ada isu strategis yang tercatat untuk perusahaan ini."
                : "Ubah filter atau kata kunci pencarian untuk melihat isu lain."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && allIssues.length === 0 ? (
            <EmptyContent>
              <Button size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="size-4" />
                Tambah Isu
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={setPendingDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <IssueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        issue={editing}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus isu strategis?</AlertDialogTitle>
            <AlertDialogDescription>
              Isu &quot;{pendingDelete?.title}&quot; akan dihapus permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function StrategicIssuesPage() {
  return (
    <>
      <Authenticated>
        <StrategicIssuesContent />
      </Authenticated>
      <Unauthenticated>
        <div className="mx-auto w-full max-w-2xl p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TriangleAlert />
              </EmptyMedia>
              <EmptyTitle>Masuk untuk melanjutkan</EmptyTitle>
              <EmptyDescription>
                Silakan masuk untuk mengakses Papan Isu Strategis.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <SignInButton />
            </EmptyContent>
          </Empty>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </AuthLoading>
    </>
  );
}
