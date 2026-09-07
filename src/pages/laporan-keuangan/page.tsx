/**
 * Halaman Laporan Kinerja Keuangan
 * Hanya dapat diakses oleh user dari Departemen Keuangan.
 * Fitur: riwayat laporan, input manual, upload Excel, pengaturan template.
 */
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  ClipboardList, Plus, Pencil, Trash2, ShieldAlert,
  CheckCircle2, Clock, ArrowUpRight, Building2,
  Upload, Settings2, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { FinanceReportRow } from "@/convex/bodExtended.ts";
import FinanceReportForm from "./_components/FinanceReportForm.tsx";
import ExcelUploader from "./_components/ExcelUploader.tsx";
import TemplateManager from "./_components/TemplateManager.tsx";
import LineManager from "./_components/LineManager.tsx";
import { formatPeriod } from "@/pages/bod-dashboard/_components/PeriodSelector.tsx";
import { useSuperAdminAccess } from "@/hooks/use-super-admin-access.ts";
import SuperAdminBanner from "@/components/super-admin-banner.tsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FINANCE_DEPT_KEYWORDS = ["keuangan", "finance", "akuntansi", "accounting", "treasury"];

function isFinanceDept(deptName: string | null | undefined) {
  if (!deptName) return false;
  const lower = deptName.toLowerCase();
  return FINANCE_DEPT_KEYWORDS.some((kw) => lower.includes(kw));
}

function formatIDR(v: number) {
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `Rp ${(v / 1e9).toFixed(1)}M`;
  if (v >= 1e6)  return `Rp ${(v / 1e6).toFixed(1)}Jt`;
  return `Rp ${v.toLocaleString("id-ID")}`;
}

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy HH:mm", { locale: idLocale });
  } catch { return iso; }
}

// ── Row card ──────────────────────────────────────────────────────────────────

type RowCardProps = {
  row: FinanceReportRow;
  onEdit: (r: FinanceReportRow) => void;
  onDelete: (id: string) => void;
};

function ReportCard({ row, onEdit, onDelete }: RowCardProps) {
  const isFinal = row.status === "final";
  const rev = row.data.totalRevenue;
  const ach = rev.program > 0
    ? Math.round((rev.realisasi / rev.program) * 100)
    : null;

  // KPI ditampilkan sebagai Program / Realisasi / Pencapaian (3 KPI teratas)
  const miniKpis: { label: string; pr: { program: number; realisasi: number } }[] = [
    { label: "Total Revenue", pr: row.data.totalRevenue },
    { label: "Laba Kotor",  pr: row.data.grossProfit },
    { label: "EBITDA",        pr: row.data.ebitda },
  ];

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isFinal ? "border-emerald-200 dark:border-emerald-800" : "border-amber-200 dark:border-amber-800"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="font-semibold text-sm">{formatPeriod(row.period)}</p>
              <Badge
                variant={isFinal ? "default" : "secondary"}
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  isFinal
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                )}
              >
                {isFinal ? <><CheckCircle2 className="size-2.5 mr-0.5" />Final</> : <><Clock className="size-2.5 mr-0.5" />Draft</>}
              </Badge>
              {ach !== null && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Pencapaian {ach}%
                </Badge>
              )}
            </div>

            {/* KPI mini-grid: Program / Realisasi / Pencapaian */}
            <div className="space-y-1.5">
              {miniKpis.map((kpi) => {
                const kAch = kpi.pr.program > 0
                  ? Math.round((kpi.pr.realisasi / kpi.pr.program) * 100)
                  : null;
                const achCls = kAch === null
                  ? "text-muted-foreground"
                  : kAch >= 100 ? "text-emerald-600" : kAch >= 80 ? "text-amber-600" : "text-rose-600";
                return (
                  <div key={kpi.label} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 text-xs">
                    <span className="text-muted-foreground truncate">{kpi.label}</span>
                    <span className="tabular-nums text-right text-muted-foreground">
                      P: <span className="font-medium text-foreground">{kpi.pr.program > 0 ? formatIDR(kpi.pr.program) : "—"}</span>
                    </span>
                    <span className="tabular-nums text-right text-muted-foreground">
                      R: <span className="font-semibold text-foreground">{kpi.pr.realisasi > 0 ? formatIDR(kpi.pr.realisasi) : "—"}</span>
                    </span>
                    <span className={cn("tabular-nums text-right font-bold w-12", achCls)}>
                      {kAch !== null ? `${kAch}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {row.note && (
              <p className="mt-2 text-[11px] text-muted-foreground italic truncate">{row.note}</p>
            )}
            <p className="mt-1 text-[10px] text-muted-foreground">
              Diperbarui: {formatDate(row.updatedAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 cursor-pointer"
              onClick={() => onEdit(row)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
              onClick={() => onDelete(row._id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
            {isFinal && (
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-blue-600 cursor-pointer"
                asChild
              >
                <a href="/bod-dashboard" title="Lihat di Dashboard Direksi">
                  <ArrowUpRight className="size-3.5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Access denied ─────────────────────────────────────────────────────────────

function AccessDenied({ deptName }: { deptName: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
      <div className="p-4 rounded-full bg-destructive/10">
        <ShieldAlert className="size-10 text-destructive" />
      </div>
      <div>
        <p className="font-semibold text-lg">Akses Terbatas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Halaman ini hanya dapat diakses oleh anggota <strong>Departemen Keuangan</strong>.
        </p>
        {deptName && (
          <p className="text-xs text-muted-foreground mt-1">
            Departemen Anda saat ini: <strong>{deptName}</strong>
          </p>
        )}
      </div>
      <Button variant="secondary" size="sm" asChild className="cursor-pointer">
        <a href="/home">Kembali ke Beranda</a>
      </Button>
    </div>
  );
}

// ── Inner (authenticated) ─────────────────────────────────────────────────────

function LaporanKeuanganInner() {
  const userDept = useQuery(api.bodExtended.getCurrentUserDeptInfo, {});
  const reports  = useQuery(api.bodExtended.listFinanceReports, {});
  const deleteReport = useMutation(api.bodExtended.deleteFinanceReport);

  const [formOpen, setFormOpen]          = useState(false);
  const [editRow, setEditRow]            = useState<FinanceReportRow | null>(null);
  const [deleteId, setDeleteId]          = useState<string | null>(null);
  const [uploadOpen, setUploadOpen]      = useState(false);
  const [templateOpen, setTemplateOpen]  = useState(false);
  const [lineMgrOpen, setLineMgrOpen]    = useState(false);

  const normalAccess = userDept !== undefined
    ? isFinanceDept(userDept?.departmentName)
    : undefined;
  const { hasAccess, bypassedViaRole, isLoading } = useSuperAdminAccess(normalAccess);

  if (isLoading || userDept === undefined || reports === undefined) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied deptName={userDept?.departmentName ?? null} />;
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteReport({ id: deleteId as Id<"financeReports"> });
      toast.success("Laporan dihapus");
    } catch {
      toast.error("Gagal menghapus laporan");
    } finally {
      setDeleteId(null);
    }
  }

  function openEdit(row: FinanceReportRow) {
    setEditRow(row);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditRow(null);
  }

  const finalCount = (reports ?? []).filter((r) => r.status === "final").length;
  const draftCount = (reports ?? []).filter((r) => r.status === "draft").length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Super Admin Mode banner */}
      {bypassedViaRole && (
        <SuperAdminBanner
          pageName="Laporan Dashboard Direksi - Keuangan"
          requiredRole="Departemen Keuangan"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="size-5 text-blue-600" />
            <h1 className="text-xl font-bold">Laporan Dashboard Direksi - Keuangan</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Input laporan keuangan periodik untuk dashboard BoD Direksi.
          </p>
          {userDept?.departmentName && (
            <div className="flex items-center gap-1.5 mt-2">
              <Building2 className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{userDept.departmentName}</span>
              {userDept?.isHeadOfDept && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Kepala Dept</Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLineMgrOpen(true)}
            className="cursor-pointer gap-1.5"
          >
            <Layers className="size-4" />
            Kelola Lini Bisnis
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTemplateOpen(true)}
            className="cursor-pointer gap-1.5"
          >
            <Settings2 className="size-4" />
            Pengaturan Template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="cursor-pointer gap-1.5"
          >
            <Upload className="size-4" />
            Upload Excel
          </Button>
          <Button
            onClick={() => { setEditRow(null); setFormOpen(true); }}
            className="cursor-pointer gap-1.5"
          >
            <Plus className="size-4" />
            Input Manual
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Laporan",  value: (reports ?? []).length, color: "text-foreground" },
          { label: "Final (Terkirim)", value: finalCount, color: "text-emerald-600" },
          { label: "Draft",          value: draftCount,  color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Info banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="p-4 text-sm text-blue-800 dark:text-blue-200">
          <strong>Cara kerja:</strong> Laporan yang dikirim (<em>Final</em>) akan langsung muncul di kartu KPI tab <strong>Keuangan</strong> pada Dashboard Direksi. Laporan <em>Draft</em> hanya tersimpan di sini dan belum terkirim.
        </CardContent>
      </Card>

      {/* List laporan */}
      {(reports ?? []).length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><ClipboardList /></EmptyMedia>
            <EmptyTitle>Belum ada laporan</EmptyTitle>
            <EmptyDescription>Mulai dengan klik "Input Laporan Baru" di atas.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              onClick={() => { setEditRow(null); setFormOpen(true); }}
              className="cursor-pointer gap-1.5"
            >
              <Plus className="size-4" />
              Input Laporan Baru
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Riwayat Laporan ({(reports ?? []).length})
          </p>
          {(reports ?? []).map((row) => (
            <ReportCard
              key={row._id}
              row={row}
              onEdit={openEdit}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <FinanceReportForm
        open={formOpen}
        onClose={closeForm}
        editRow={editRow}
        onManageLines={() => setLineMgrOpen(true)}
      />

      {/* Kelola Lini Bisnis */}
      <LineManager open={lineMgrOpen} onClose={() => setLineMgrOpen(false)} />

      {/* Upload Excel */}
      <ExcelUploader open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {/* Template Manager */}
      <TemplateManager
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSaved={() => setTemplateOpen(false)}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus laporan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data laporan akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function LaporanKeuanganPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">Silakan masuk untuk mengakses halaman ini.</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <LaporanKeuanganInner />
      </Authenticated>
    </>
  );
}
