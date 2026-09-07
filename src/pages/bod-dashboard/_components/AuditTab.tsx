import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog.tsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { ClipboardCheck, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import RagBadge from "./RagBadge.tsx";
import PeriodSelector from "./PeriodSelector.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const SEVERITIES = [
  { value: "critical", label: "Kritis" }, { value: "major", label: "Mayor" },
  { value: "minor", label: "Minor" }, { value: "observation", label: "Observasi" },
];
const STATUSES = [
  { value: "open", label: "Terbuka" }, { value: "in_progress", label: "Dalam Proses" },
  { value: "closed", label: "Selesai" }, { value: "overdue", label: "Terlambat" },
];
const SEV_COLOR: Record<string, string> = { critical: "critical", major: "high", minor: "medium", observation: "neutral" };
const SEV_PIE = ["#ef4444", "#f97316", "#f59e0b", "#6366f1"];

type FormData = {
  division: string; auditTitle: string; findingTitle: string; description: string;
  severity: string; status: string; recommendation: string; actionPlan: string;
  responsiblePerson: string; dueDate: string; closedDate: string;
};
const EMPTY_FORM: FormData = {
  division: "", auditTitle: "", findingTitle: "", description: "",
  severity: "major", status: "open", recommendation: "", actionPlan: "",
  responsiblePerson: "", dueDate: "", closedDate: "",
};

// Closure rate % 
function closureRate(closed: number, total: number): number {
  return total > 0 ? Math.round((closed / total) * 100) : 0;
}

export default function AuditTab() {
  const [period, setPeriod] = useState(currentPeriod());
  const [divFilter, setDivFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"bodAuditFindings"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const divisions = useQuery(api.bodExtended.getDivisions, {});
  const findings = useQuery(api.bodExtended.getAuditFindings, {
    period, division: divFilter !== "all" ? divFilter : undefined,
  });
  const summary = useQuery(api.bodExtended.getAuditSummary, { period });
  const upsert = useMutation(api.bodExtended.upsertAuditFinding);
  const remove = useMutation(api.bodExtended.deleteAuditFinding);

  function openNew() { setEditing(null); setForm({ ...EMPTY_FORM, division: divisions?.[0]?.name ?? "" }); setDialogOpen(true); }
  function openEdit(f: Doc<"bodAuditFindings">) {
    setEditing(f);
    setForm({ division: f.division, auditTitle: f.auditTitle, findingTitle: f.findingTitle, description: f.description ?? "", severity: f.severity, status: f.status, recommendation: f.recommendation ?? "", actionPlan: f.actionPlan ?? "", responsiblePerson: f.responsiblePerson ?? "", dueDate: f.dueDate ?? "", closedDate: f.closedDate ?? "" });
    setDialogOpen(true);
  }
  async function handleSubmit() {
    try {
      await upsert({ id: editing?._id as Id<"bodAuditFindings"> | undefined, period, ...form, description: form.description || undefined, recommendation: form.recommendation || undefined, actionPlan: form.actionPlan || undefined, responsiblePerson: form.responsiblePerson || undefined, dueDate: form.dueDate || undefined, closedDate: form.closedDate || undefined });
      toast.success(editing ? "Temuan diperbarui" : "Temuan ditambahkan");
      setDialogOpen(false);
    } catch { toast.error("Gagal menyimpan"); }
  }
  async function handleDelete(id: Id<"bodAuditFindings">) {
    try { await remove({ id }); toast.success("Dihapus"); } catch { toast.error("Gagal"); }
  }

  const filtered = (findings ?? []).filter((f) => {
    if (sevFilter !== "all" && f.severity !== sevFilter) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    return true;
  });

  const total = summary ? summary.total : 0;
  const rate = summary ? closureRate(summary.closed, total) : 0;
  const overdueAlert = (summary?.overdue ?? 0) > 0;

  const sevPie = SEVERITIES.map((s, i) => ({
    name: s.label,
    value: summary?.[s.value as keyof typeof summary] as number ?? 0,
    color: SEV_PIE[i],
  })).filter((d) => d.value > 0);

  const statusBar = [
    { name: "Terbuka", value: summary?.open ?? 0, fill: "#ef4444" },
    { name: "Proses", value: summary?.inProgress ?? 0, fill: "#f59e0b" },
    { name: "Selesai", value: summary?.closed ?? 0, fill: "#10b981" },
    { name: "Terlambat", value: summary?.overdue ?? 0, fill: "#f97316" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Overdue alert */}
      {overdueAlert && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-orange-600 shrink-0" />
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              {summary?.overdue} temuan audit TERLAMBAT ditindaklanjuti — perlu eskalasi segera
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Temuan", value: total, icon: ClipboardCheck, color: "text-foreground" },
            { label: "Closure Rate", value: `${rate}%`, icon: CheckCircle2, color: rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-rose-600" },
            { label: "Kritis + Mayor", value: summary.critical + summary.major, icon: AlertTriangle, color: (summary.critical + summary.major) > 0 ? "text-rose-600" : "text-emerald-600" },
            { label: "Terlambat", value: summary.overdue, icon: XCircle, color: summary.overdue > 0 ? "text-orange-600" : "text-emerald-600" },
          ].map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <k.icon className="size-3.5 text-muted-foreground/60" />
              </div>
              <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
            </Card>
          ))}
        </div>
      ) : <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}

      {/* Charts */}
      {total > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Status Tindak Lanjut</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={statusBar} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Temuan" radius={[3, 3, 0, 0]}>
                    {statusBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Distribusi Severity</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={sevPie} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={3} dataKey="value" nameKey="name">
                    {sevPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center">
                {sevPie.map((d) => (
                  <div key={d.name} className="flex items-center gap-1 text-xs">
                    <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-blue-500" />Temuan Audit Internal</CardTitle>
              <CardDescription>Daftar temuan audit per divisi. Klik baris untuk edit.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodSelector value={period} onChange={setPeriod} />
              <Select value={sevFilter} onValueChange={setSevFilter}>
                <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Severity</SelectItem>
                  {SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={divFilter} onValueChange={setDivFilter}>
                <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Divisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {(divisions ?? []).map((d) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={openNew} className="cursor-pointer"><Plus className="size-4" />Tambah Temuan</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {findings === undefined ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia>
                <EmptyTitle>Belum ada temuan audit</EmptyTitle>
                <EmptyDescription>Tambahkan temuan audit untuk periode {period}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Button size="sm" onClick={openNew} className="cursor-pointer">Tambah Temuan</Button></EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Judul Audit</TableHead>
                    <TableHead>Temuan</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PIC</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f._id} className={cn("cursor-pointer hover:bg-muted/30", f.status === "overdue" && "bg-orange-50/50 dark:bg-orange-950/10")} onClick={() => openEdit(f)}>
                      <TableCell className="text-sm font-medium">{f.division}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{f.auditTitle}</TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">{f.findingTitle}</TableCell>
                      <TableCell><RagBadge level={SEV_COLOR[f.severity] ?? "neutral"} label={SEVERITIES.find((s) => s.value === f.severity)?.label ?? f.severity} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {f.status === "closed" && <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />}
                          {f.status === "overdue" && <XCircle className="size-3.5 text-orange-500 shrink-0" />}
                          {f.status === "in_progress" && <Clock className="size-3.5 text-amber-500 shrink-0" />}
                          <span className="text-xs">{STATUSES.find((s) => s.value === f.status)?.label ?? f.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.responsiblePerson ?? "-"}</TableCell>
                      <TableCell className={cn("text-xs", f.status === "overdue" && "text-orange-600 font-semibold")}>{f.dueDate ?? "-"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="size-7 cursor-pointer text-muted-foreground hover:text-rose-600"><Trash2 className="size-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Hapus temuan?</AlertDialogTitle><AlertDialogDescription>Tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(f._id)} className="bg-rose-600 hover:bg-rose-700">Hapus</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Temuan" : "Tambah Temuan Audit"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Divisi</Label>
              <Select value={form.division} onValueChange={(v) => setForm((f) => ({ ...f, division: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih divisi" /></SelectTrigger>
                <SelectContent>{(divisions ?? []).map((d) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Judul Audit</Label><Input value={form.auditTitle} onChange={(e) => setForm((f) => ({ ...f, auditTitle: e.target.value }))} placeholder="e.g. Audit Keuangan Q1 2026" /></div>
            <div className="space-y-1"><Label>Judul Temuan</Label><Input value={form.findingTitle} onChange={(e) => setForm((f) => ({ ...f, findingTitle: e.target.value }))} placeholder="Ringkasan temuan" /></div>
            <div className="space-y-1"><Label>Deskripsi</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Rekomendasi</Label><Input value={form.recommendation} onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Rencana Tindak Lanjut</Label><Input value={form.actionPlan} onChange={(e) => setForm((f) => ({ ...f, actionPlan: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>PIC</Label><Input value={form.responsiblePerson} onChange={(e) => setForm((f) => ({ ...f, responsiblePerson: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">Batal</Button>
            <Button onClick={handleSubmit} disabled={!form.findingTitle || !form.division} className="cursor-pointer">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
