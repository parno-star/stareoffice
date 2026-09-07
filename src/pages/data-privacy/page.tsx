import { useState } from "react";
import {
  useQuery,
  useMutation,
  useAction,
  usePaginatedQuery,
  Authenticated,
} from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty.tsx";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  ShieldCheck, ShieldAlert, Clock, Check, X, Ban, History, Info, Loader2,
  UserCog, LogIn, LogOut, KeyRound, Search, Download,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { ROLE_LABELS, isRole } from "@/convex/roles.ts";
import { scopeLabel } from "@/convex/dataScopes.ts";

const DURATION_OPTIONS = [
  { hours: 1, label: "1 jam" },
  { hours: 4, label: "4 jam" },
  { hours: 8, label: "8 jam" },
  { hours: 24, label: "24 jam" },
  { hours: 72, label: "3 hari" },
];

function ScopeChips({ scopes }: { scopes?: string[] }) {
  if (!scopes || scopes.length === 0) {
    return (
      <Badge variant="outline" className="text-[10px]">
        Semua data (permintaan lama)
      </Badge>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {scopes.map((s) => (
        <Badge key={s} variant="secondary" className="text-[10px]">
          {scopeLabel(s)}
        </Badge>
      ))}
    </div>
  );
}

export default function DataPrivacyPage() {
  return (
    <Authenticated>
      <DataPrivacyContent />
    </Authenticated>
  );
}

function DataPrivacyContent() {
  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Privasi & Akses Data</h1>
          <p className="text-xs text-muted-foreground">
            Anda memegang kendali penuh atas siapa yang boleh mengakses data perusahaan Anda.
          </p>
        </div>
      </div>

      {/* Assurance note */}
      <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p className="text-xs">
          Penyedia aplikasi <span className="font-semibold">tidak dapat membuka data Anda tanpa izin</span>.
          Setiap permintaan akses harus Anda setujui, dibatasi waktu, dapat Anda cabut kapan saja,
          dan seluruhnya tercatat pada jejak audit di bawah ini.
        </p>
      </div>

      <PendingRequests />
      <ActiveGrants />
      <AuditTrail />
    </div>
  );
}

// ─── Pending requests ─────────────────────────────────────────────────────────

function PendingRequests() {
  const requests = useQuery(api.dataAccess.listPendingRequests, {});
  const [approveTarget, setApproveTarget] =
    useState<Doc<"dataAccessGrants"> | null>(null);
  const [denyTarget, setDenyTarget] =
    useState<Doc<"dataAccessGrants"> | null>(null);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-amber-600" />
        <h2 className="text-sm font-semibold">Permintaan Akses Menunggu</h2>
        {requests && requests.length > 0 && (
          <Badge className="bg-amber-600 text-white">{requests.length}</Badge>
        )}
      </div>

      {requests === undefined ? (
        <Skeleton className="h-20 w-full" />
      ) : requests.length === 0 ? (
        <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          Tidak ada permintaan akses yang menunggu persetujuan.
        </p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r._id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <UserCog className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {r.superAdminName ?? "Penyedia aplikasi"}
                      <span className="font-normal text-muted-foreground"> meminta akses</span>
                    </p>
                    <Badge className="gap-1 bg-amber-600 text-white hover:bg-amber-600">
                      <Clock className="size-3" /> Menunggu persetujuan Anda
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.requestedAt), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </p>
                  <p className="mt-1.5 rounded-md bg-muted/50 p-2 text-xs">
                    <span className="font-medium">Alasan: </span>
                    {r.reason}
                  </p>
                  <div className="mt-1.5 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Kategori data yang diminta:
                    </span>
                    <ScopeChips scopes={r.scopes} />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 cursor-pointer text-destructive hover:text-destructive"
                  onClick={() => setDenyTarget(r)}
                >
                  <X className="size-4" /> Tolak
                </Button>
                <Button
                  size="sm"
                  className="h-8 cursor-pointer"
                  onClick={() => setApproveTarget(r)}
                >
                  <Check className="size-4" /> Setujui
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approveTarget && (
        <ApproveDialog
          grant={approveTarget}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {denyTarget && (
        <DenyDialog grant={denyTarget} onClose={() => setDenyTarget(null)} />
      )}
    </section>
  );
}

function ApproveDialog({
  grant,
  onClose,
}: {
  grant: Doc<"dataAccessGrants">;
  onClose: () => void;
}) {
  const approve = useMutation(api.dataAccess.approveRequest);
  const [hours, setHours] = useState(4);
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    setSaving(true);
    try {
      await approve({ grantId: grant._id, durationHours: hours });
      toast.success("Akses disetujui.");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string };
        toast.error(d.message ?? "Gagal menyetujui");
      } else {
        toast.error("Terjadi kesalahan");
      }
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> Setujui Akses
          </DialogTitle>
          <DialogDescription>
            Pilih berapa lama {grant.superAdminName ?? "penyedia aplikasi"} boleh
            mengakses data perusahaan Anda. Akses berakhir otomatis setelah batas
            waktu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-medium">Batas waktu akses</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.hours}
                type="button"
                onClick={() => setHours(opt.hours)}
                className={
                  "cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors " +
                  (hours === opt.hours
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-accent")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="cursor-pointer">
            Batal
          </Button>
          <Button onClick={handleApprove} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Setujui {DURATION_OPTIONS.find((o) => o.hours === hours)?.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DenyDialog({
  grant,
  onClose,
}: {
  grant: Doc<"dataAccessGrants">;
  onClose: () => void;
}) {
  const deny = useMutation(api.dataAccess.denyRequest);
  const [saving, setSaving] = useState(false);

  const handleDeny = async () => {
    setSaving(true);
    try {
      await deny({ grantId: grant._id });
      toast.success("Permintaan ditolak.");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string };
        toast.error(d.message ?? "Gagal menolak");
      } else {
        toast.error("Terjadi kesalahan");
      }
      setSaving(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tolak permintaan akses?</AlertDialogTitle>
          <AlertDialogDescription>
            {grant.superAdminName ?? "Penyedia aplikasi"} tidak akan bisa
            mengakses data perusahaan Anda. Tindakan ini tercatat pada jejak audit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeny}
            disabled={saving}
            className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Tolak
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Active grants ──────────────────────────────────────────────────────────

type ActiveGrant = Doc<"dataAccessGrants"> & { isActive: boolean };

function ActiveGrants() {
  const grants = useQuery(api.dataAccess.listActiveGrants, {});
  const [revokeTarget, setRevokeTarget] = useState<ActiveGrant | null>(null);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-emerald-600" />
        <h2 className="text-sm font-semibold">Akses Aktif Saat Ini</h2>
      </div>

      {grants === undefined ? (
        <Skeleton className="h-16 w-full" />
      ) : grants.length === 0 ? (
        <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          Tidak ada pihak penyedia yang sedang memiliki akses ke data Anda.
        </p>
      ) : (
        <div className="space-y-2">
          {grants.map((g) => (
            <div
              key={g._id}
              className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20"
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <ShieldCheck className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    {g.superAdminName ?? "Penyedia aplikasi"}
                  </p>
                  <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                    <ShieldCheck className="size-3" /> Sudah aktif
                  </Badge>
                </div>
                {g.expiresAt && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    Berakhir{" "}
                    {formatDistanceToNow(new Date(g.expiresAt), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium">Alasan: </span>
                  {g.reason}
                </p>
                <div className="mt-1.5">
                  <ScopeChips scopes={g.scopes} />
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 cursor-pointer text-destructive hover:text-destructive"
                onClick={() => setRevokeTarget(g)}
              >
                <Ban className="size-4" /> Cabut
              </Button>
            </div>
          ))}
        </div>
      )}

      {revokeTarget && (
        <RevokeDialog grant={revokeTarget} onClose={() => setRevokeTarget(null)} />
      )}
    </section>
  );
}

function RevokeDialog({
  grant,
  onClose,
}: {
  grant: ActiveGrant;
  onClose: () => void;
}) {
  const revoke = useMutation(api.dataAccess.revokeGrant);
  const [saving, setSaving] = useState(false);

  const handleRevoke = async () => {
    setSaving(true);
    try {
      await revoke({ grantId: grant._id });
      toast.success("Akses dicabut.");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string };
        toast.error(d.message ?? "Gagal mencabut");
      } else {
        toast.error("Terjadi kesalahan");
      }
      setSaving(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cabut akses sekarang?</AlertDialogTitle>
          <AlertDialogDescription>
            {grant.superAdminName ?? "Penyedia aplikasi"} akan langsung kehilangan
            akses ke data perusahaan Anda. Tindakan ini tercatat pada jejak audit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={saving}
            className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
            Cabut Akses
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Audit trail ──────────────────────────────────────────────────────────────

type AuditRow = Doc<"dataAccessAudit">;

const ACTION_META: Record<
  string,
  { label: string; filterLabel?: string; icon: typeof Info; className: string }
> = {
  requested: { label: "mengajukan permintaan akses", filterLabel: "Permintaan diajukan", icon: KeyRound, className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  approved: { label: "menyetujui akses", filterLabel: "Akses disetujui", icon: Check, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  denied: { label: "menolak permintaan akses", filterLabel: "Permintaan ditolak", icon: X, className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
  revoked: { label: "mencabut akses", filterLabel: "Akses dicabut", icon: Ban, className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
  expired: { label: "akses berakhir", filterLabel: "Akses berakhir", icon: Clock, className: "bg-muted text-muted-foreground" },
  access_started: { label: "mulai mengakses data", filterLabel: "Mulai mengakses", icon: LogIn, className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  access_ended: { label: "selesai mengakses data", filterLabel: "Selesai mengakses", icon: LogOut, className: "bg-muted text-muted-foreground" },
};

function roleLabel(role: string | undefined): string | null {
  if (!role) return null;
  return isRole(role) ? ROLE_LABELS[role] : role;
}

function AuditTrail() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [action, setAction] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebounce(searchInput, 300);
  const [exporting, setExporting] = useState(false);
  const exportCsv = useAction(api.dataAccess.exportAuditCsv);

  // Build server-side filter args. Convert local date inputs to UTC instants.
  const startInstant = startDate
    ? new Date(`${startDate}T00:00:00`).toISOString()
    : undefined;
  const endInstant = endDate
    ? new Date(`${endDate}T23:59:59.999`).toISOString()
    : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.dataAccess.listAudit,
    {
      startDate: startInstant,
      endDate: endInstant,
      action: action === "all" ? undefined : action,
    },
    { initialNumItems: 30 },
  );

  const hasFilters =
    Boolean(startDate) ||
    Boolean(endDate) ||
    action !== "all" ||
    searchInput.trim().length > 0;

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setAction("all");
    setSearchInput("");
  };

  // Search is applied to the loaded rows (name / detail). Date & action
  // filters run on the server so they cover the full history.
  const term = search.trim().toLowerCase();
  const visible = (results ?? []).filter((row: AuditRow) => {
    if (!term) return true;
    return (
      (row.actorName ?? "").toLowerCase().includes(term) ||
      (row.detail ?? "").toLowerCase().includes(term)
    );
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const { url, filename, rowCount } = await exportCsv({
        startDate: startInstant,
        endDate: endInstant,
        action: action === "all" ? undefined : action,
      });
      if (!url) throw new Error("Berkas tidak tersedia");
      if (rowCount === 0) {
        toast.info("Tidak ada data untuk diekspor pada filter ini.");
        return;
      }
      const blob = await (await fetch(url)).blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success(`Berhasil mengunduh ${rowCount} baris.`);
    } catch {
      toast.error("Gagal mengekspor jejak audit.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Jejak Audit Akses Data</h2>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 cursor-pointer"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Ekspor CSV
        </Button>
      </div>
      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p className="text-xs">
          Catatan lengkap dan tidak dapat diubah atas setiap permintaan, persetujuan,
          penolakan, pencabutan, dan sesi akses ke data perusahaan Anda.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Dari tanggal
            </label>
            <Input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Sampai tanggal
            </label>
            <Input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Jenis aktivitas
            </label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Semua aktivitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua aktivitas</SelectItem>
                {Object.entries(ACTION_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.filterLabel ?? meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Cari nama / kata kunci
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nama atau alasan..."
                className="h-9 pl-8"
              />
            </div>
          </div>
        </div>
        {hasFilters && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Pencarian kata kunci berlaku untuk data yang sudah dimuat. Gunakan
              tanggal &amp; jenis aktivitas untuk menelusuri seluruh riwayat.
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 cursor-pointer text-xs"
              onClick={clearFilters}
            >
              <X className="size-3.5" /> Reset filter
            </Button>
          </div>
        )}
      </div>

      {results === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <History />
            </EmptyMedia>
            <EmptyTitle>
              {hasFilters ? "Tidak ada hasil" : "Belum ada aktivitas"}
            </EmptyTitle>
            <EmptyDescription>
              {hasFilters
                ? "Tidak ada aktivitas yang cocok dengan filter Anda."
                : "Semua aktivitas akses data akan muncul di sini."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {visible.map((row: AuditRow) => {
            const meta = ACTION_META[row.action] ?? {
              label: row.action,
              icon: Info,
              className: "bg-muted text-muted-foreground",
            };
            const Icon = meta.icon;
            return (
              <div key={row._id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <div className={"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg " + meta.className}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium">{row.actorName ?? "Pengguna"}</span>
                    {roleLabel(row.actorRole) && (
                      <Badge variant="outline" className="text-[10px]">{roleLabel(row.actorRole)}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{meta.label}</span>
                  </div>
                  {row.detail && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{row.detail}</p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {format(new Date(row.occurredAt), "d MMM yyyy HH:mm", { locale: localeId })}
                </span>
              </div>
            );
          })}
          {status === "CanLoadMore" && (
            <Button
              variant="ghost"
              className="w-full cursor-pointer"
              size="sm"
              onClick={() => loadMore(30)}
            >
              Muat lebih banyak
            </Button>
          )}
          {status === "LoadingMore" && (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
