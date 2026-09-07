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
import { HardHat, Plus, Trash2, AlertOctagon, ShieldCheck, Flame, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import RagBadge from "./RagBadge.tsx";
import PeriodSelector from "./PeriodSelector.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const INCIDENT_TYPES = [
  { value: "near_miss", label: "Near Miss" },
  { value: "first_aid", label: "P3K" },
  { value: "medical_treatment", label: "Pengobatan" },
  { value: "lost_time", label: "Lost Time Injury" },
  { value: "fatality", label: "Fatality" },
  { value: "property_damage", label: "Kerusakan Aset" },
];
const SEVERITIES = [
  { value: "low", label: "Rendah" }, { value: "medium", label: "Sedang" },
  { value: "high", label: "Tinggi" }, { value: "critical", label: "Kritis" },
];
const STATUSES = [
  { value: "open", label: "Terbuka" }, { value: "investigating", label: "Investigasi" }, { value: "closed", label: "Selesai" },
];

type FormData = {
  division: string; incidentDate: string; title: string; description: string;
  type: string; severity: string; location: string; injuredCount: string;
  lostDays: string; rootCause: string; correctiveAction: string; status: string;
};
const EMPTY_FORM: FormData = {
  division: "", incidentDate: "", title: "", description: "", type: "near_miss",
  severity: "low", location: "", injuredCount: "0", lostDays: "0",
  rootCause: "", correctiveAction: "", status: "open",
};

const TYPE_PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#dc2626", "#94a3b8"];

// LTIFR = (Lost Time Injuries × 1,000,000) / hours worked (approx 170 hrs/month/person)
function calcLtifr(lostTimeCount: number, totalHeadcount: number): string {
  if (totalHeadcount === 0) return "N/A";
  const hrs = totalHeadcount * 170;
  return ((lostTimeCount * 1_000_000) / hrs).toFixed(2);
}

export default function HseTab() {
  const [period, setPeriod] = useState(currentPeriod());
  const [divFilter, setDivFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"bodHseIncidents"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const divisions = useQuery(api.bodExtended.getDivisions, {});
  const incidents = useQuery(api.bodExtended.getHseIncidents, {
    period, division: divFilter !== "all" ? divFilter : undefined,
  });
  const summary = useQuery(api.bodExtended.getHseSummary, { period });
  const upsert = useMutation(api.bodExtended.upsertHseIncident);
  const remove = useMutation(api.bodExtended.deleteHseIncident);

  function openNew() { setEditing(null); setForm({ ...EMPTY_FORM, division: divisions?.[0]?.name ?? "" }); setDialogOpen(true); }
  function openEdit(i: Doc<"bodHseIncidents">) {
    setEditing(i);
    setForm({ division: i.division, incidentDate: i.incidentDate, title: i.title, description: i.description ?? "", type: i.type, severity: i.severity, location: i.location ?? "", injuredCount: String(i.injuredCount), lostDays: String(i.lostDays), rootCause: i.rootCause ?? "", correctiveAction: i.correctiveAction ?? "", status: i.status });
    setDialogOpen(true);
  }
  async function handleSubmit() {
    try {
      await upsert({ id: editing?._id as Id<"bodHseIncidents"> | undefined, period, ...form, description: form.description || undefined, location: form.location || undefined, rootCause: form.rootCause || undefined, correctiveAction: form.correctiveAction || undefined, injuredCount: Number(form.injuredCount), lostDays: Number(form.lostDays) });
      toast.success(editing ? "Insiden diperbarui" : "Insiden dicatat");
      setDialogOpen(false);
    } catch { toast.error("Gagal menyimpan"); }
  }
  async function handleDelete(id: Id<"bodHseIncidents">) {
    try { await remove({ id }); toast.success("Dihapus"); } catch { toast.error("Gagal"); }
  }

  const filtered = (incidents ?? []).filter((i) => typeFilter === "all" || i.type === typeFilter);
  const hasFatality = (summary?.fatality ?? 0) > 0;

  // Pie: by incident type
  const typePie = INCIDENT_TYPES.map((t, i) => ({
    name: t.label,
    value: (incidents ?? []).filter((inc) => inc.type === t.value).length,
    color: TYPE_PIE_COLORS[i],
  })).filter((d) => d.value > 0);

  // Bar: incidents per division
  const divBar = (summary?.byDivision ?? []).slice(0, 8).map((d) => ({
    name: d.division.replace(/^Divisi\s*/i, "").slice(0, 12),
    insiden: d.count,
    fill: d.severity === "critical" ? "#ef4444" : d.severity === "high" ? "#f97316" : "#f59e0b",
  }));

  const totalHeadcount = divisions?.reduce((s) => s + 0, 0) ?? 0; // approximate
  const lostTimeCount = (incidents ?? []).filter((i) => i.type === "lost_time").length;

  return (
    <div className="space-y-6">
      {/* Fatality banner */}
      {hasFatality && (
        <Card className="border-rose-400 bg-rose-50 dark:bg-rose-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertOctagon className="size-6 text-rose-600 shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-rose-700 dark:text-rose-400">⚠ KRITIS: {summary?.fatality} Fatality tercatat periode ini</p>
              <p className="text-xs text-rose-600/80 mt-0.5">Membutuhkan tindak lanjut segera dari Direksi dan laporan ke otoritas terkait.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Insiden", value: summary.totalIncidents, icon: Flame, color: summary.totalIncidents === 0 ? "text-emerald-600" : "text-rose-600", sub: "periode ini" },
            { label: "Near Miss", value: summary.nearMiss, icon: Eye, color: "text-amber-600", sub: "potensi bahaya" },
            { label: "Lost Time Injury", value: summary.lostTime, icon: AlertOctagon, color: summary.lostTime > 0 ? "text-rose-600" : "text-emerald-600", sub: "cedera kehilangan hari kerja" },
            { label: "Total Hari Hilang", value: summary.totalLostDays, icon: HardHat, color: summary.totalLostDays > 0 ? "text-orange-600" : "text-emerald-600", sub: "hari kerja hilang" },
          ].map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <k.icon className="size-3.5 text-muted-foreground/60" />
              </div>
              <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
              <p className="text-[11px] text-muted-foreground">{k.sub}</p>
            </Card>
          ))}
        </div>
      ) : <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}

      {/* Secondary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Korban Cedera</p>
          <p className={cn("text-2xl font-bold", (summary?.totalInjured ?? 0) > 0 ? "text-rose-600" : "text-emerald-600")}>{summary?.totalInjured ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">total korban</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Fatality</p>
          <p className={cn("text-2xl font-bold", (summary?.fatality ?? 0) > 0 ? "text-rose-700" : "text-emerald-600")}>{summary?.fatality ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">{(summary?.fatality ?? 0) === 0 ? "✓ Nihil" : "⚠ Perlu eskalasi"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">LTIFR (est.)</p>
          <p className="text-xl font-bold">{calcLtifr(lostTimeCount, 500)}</p>
          <p className="text-[11px] text-muted-foreground">per juta jam kerja</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Status Keselamatan</p>
          {summary ? (
            <>
              <div className="mt-1">
                <RagBadge level={hasFatality ? "critical" : (summary.lostTime > 0 ? "red" : summary.nearMiss > 2 ? "amber" : "green")}
                  label={hasFatality ? "Kritis" : summary.lostTime > 0 ? "Waspada" : summary.nearMiss > 2 ? "Perhatian" : "Aman"} size="md" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">penilaian periode ini</p>
            </>
          ) : <Skeleton className="h-6 w-20 mt-1" />}
        </Card>
      </div>

      {/* Charts */}
      {(incidents?.length ?? 0) > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Insiden per Divisi</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={divBar} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="insiden" name="Insiden" radius={[0, 3, 3, 0]}>
                    {divBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Distribusi Tipe Insiden</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={typePie} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={3} dataKey="value" nameKey="name">
                    {typePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                {typePie.map((d) => (
                  <div key={d.name} className="flex items-center gap-1 text-xs">
                    <span className="size-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Zero Accident goal banner if all clear */}
      {summary && summary.totalIncidents === 0 && (
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">Zero Accident — Periode {period}</p>
              <p className="text-xs text-emerald-600/80">Tidak ada insiden HSE yang dilaporkan pada periode ini. Pertahankan!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incident table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><HardHat className="size-5 text-amber-500" />Log Insiden HSE</CardTitle>
              <CardDescription>Health, Safety & Environment incidents per divisi. Klik baris untuk edit.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodSelector value={period} onChange={setPeriod} />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Tipe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {INCIDENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={divFilter} onValueChange={setDivFilter}>
                <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Divisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {(divisions ?? []).map((d) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={openNew} className="cursor-pointer"><Plus className="size-4" />Catat Insiden</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {incidents === undefined ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><HardHat /></EmptyMedia>
                <EmptyTitle>Tidak ada insiden</EmptyTitle>
                <EmptyDescription>Tidak ada insiden HSE untuk filter ini pada periode {period}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Button size="sm" onClick={openNew} className="cursor-pointer">Catat Insiden</Button></EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Insiden</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead className="text-center">Cedera</TableHead>
                    <TableHead className="text-center">Hari Hilang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => (
                    <TableRow key={i._id} className={cn("cursor-pointer hover:bg-muted/30", i.type === "fatality" && "bg-rose-50/60 dark:bg-rose-950/20")} onClick={() => openEdit(i)}>
                      <TableCell className="text-sm font-medium">{i.division}</TableCell>
                      <TableCell className="text-xs">{i.incidentDate}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{i.title}</TableCell>
                      <TableCell>
                        <Badge variant={i.type === "fatality" ? "destructive" : "outline"} className="text-[11px]">
                          {INCIDENT_TYPES.find((t) => t.value === i.type)?.label ?? i.type}
                        </Badge>
                      </TableCell>
                      <TableCell><RagBadge level={i.severity} label={SEVERITIES.find((s) => s.value === i.severity)?.label ?? i.severity} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{i.location ?? "-"}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{i.injuredCount > 0 ? <span className="text-rose-600 font-semibold">{i.injuredCount}</span> : "—"}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{i.lostDays > 0 ? <span className="text-orange-600 font-semibold">{i.lostDays}</span> : "—"}</TableCell>
                      <TableCell><span className="text-xs">{STATUSES.find((s) => s.value === i.status)?.label ?? i.status}</span></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="size-7 cursor-pointer text-muted-foreground hover:text-rose-600"><Trash2 className="size-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Hapus insiden?</AlertDialogTitle><AlertDialogDescription>Tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(i._id)} className="bg-rose-600 hover:bg-rose-700">Hapus</AlertDialogAction></AlertDialogFooter>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Insiden" : "Catat Insiden HSE"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Divisi</Label>
              <Select value={form.division} onValueChange={(v) => setForm((f) => ({ ...f, division: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih divisi" /></SelectTrigger>
                <SelectContent>{(divisions ?? []).map((d) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Tanggal Insiden</Label><Input type="date" value={form.incidentDate} onChange={(e) => setForm((f) => ({ ...f, incidentDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Lokasi</Label><Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Lokasi kejadian" /></div>
            </div>
            <div className="space-y-1"><Label>Judul Insiden</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Deskripsi singkat insiden" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipe</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INCIDENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Jumlah Cedera</Label><Input type="number" min={0} value={form.injuredCount} onChange={(e) => setForm((f) => ({ ...f, injuredCount: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Hari Kerja Hilang</Label><Input type="number" min={0} value={form.lostDays} onChange={(e) => setForm((f) => ({ ...f, lostDays: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Akar Penyebab</Label><Input value={form.rootCause} onChange={(e) => setForm((f) => ({ ...f, rootCause: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Tindakan Koreksi</Label><Input value={form.correctiveAction} onChange={(e) => setForm((f) => ({ ...f, correctiveAction: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">Batal</Button>
            <Button onClick={handleSubmit} disabled={!form.title || !form.division || !form.incidentDate} className="cursor-pointer">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
