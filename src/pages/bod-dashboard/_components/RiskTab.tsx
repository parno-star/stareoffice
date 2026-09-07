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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AlertTriangle, Plus, Pencil, Trash2, ShieldAlert, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import RagBadge from "./RagBadge.tsx";
import PeriodSelector from "./PeriodSelector.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const RISK_CATEGORIES = [
  { value: "strategic", label: "Strategis" },
  { value: "operational", label: "Operasional" },
  { value: "financial", label: "Keuangan" },
  { value: "compliance", label: "Kepatuhan" },
  { value: "hse", label: "HSE" },
];
const RISK_STATUSES = [
  { value: "open", label: "Terbuka" },
  { value: "mitigated", label: "Dimitigasi" },
  { value: "accepted", label: "Diterima" },
  { value: "closed", label: "Ditutup" },
];
const LEVEL_LABEL: Record<string, string> = { critical: "Kritis", high: "Tinggi", medium: "Sedang", low: "Rendah" };

function riskLevel(score: number): string {
  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}

// Risk matrix cell background
function cellBg(l: number, i: number): string {
  const s = l * i;
  if (s >= 20) return "bg-rose-500 text-white";
  if (s >= 12) return "bg-orange-400 text-white";
  if (s >= 6) return "bg-amber-300 text-gray-900";
  return "bg-emerald-200 text-gray-800";
}

type FormData = {
  division: string; title: string; description: string; category: string;
  likelihood: string; impact: string; mitigationPlan: string; status: string; owner: string; dueDate: string;
};
const EMPTY_FORM: FormData = {
  division: "", title: "", description: "", category: "operational",
  likelihood: "3", impact: "3", mitigationPlan: "", status: "open", owner: "", dueDate: "",
};

const PIE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981"];

export default function RiskTab() {
  const [period, setPeriod] = useState(currentPeriod());
  const [divFilter, setDivFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"bodRiskItems"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const divisions = useQuery(api.bodExtended.getDivisions, {});
  const risks = useQuery(api.bodExtended.getRiskItems, {
    period,
    division: divFilter !== "all" ? divFilter : undefined,
  });
  const summary = useQuery(api.bodExtended.getRiskSummary, { period });
  const upsert = useMutation(api.bodExtended.upsertRiskItem);
  const remove = useMutation(api.bodExtended.deleteRiskItem);

  function openNew() { setEditing(null); setForm({ ...EMPTY_FORM, division: divisions?.[0]?.name ?? "" }); setDialogOpen(true); }
  function openEdit(r: Doc<"bodRiskItems">) {
    setEditing(r);
    setForm({ division: r.division, title: r.title, description: r.description ?? "", category: r.category, likelihood: String(r.likelihood), impact: String(r.impact), mitigationPlan: r.mitigationPlan ?? "", status: r.status, owner: r.owner ?? "", dueDate: r.dueDate ?? "" });
    setDialogOpen(true);
  }
  async function handleSubmit() {
    try {
      await upsert({ id: editing?._id as Id<"bodRiskItems"> | undefined, period, division: form.division, title: form.title, description: form.description || undefined, category: form.category, likelihood: Number(form.likelihood), impact: Number(form.impact), mitigationPlan: form.mitigationPlan || undefined, status: form.status, owner: form.owner || undefined, dueDate: form.dueDate || undefined });
      toast.success(editing ? "Risiko diperbarui" : "Risiko ditambahkan");
      setDialogOpen(false);
    } catch { toast.error("Gagal menyimpan risiko"); }
  }
  async function handleDelete(id: Id<"bodRiskItems">) {
    try { await remove({ id }); toast.success("Risiko dihapus"); } catch { toast.error("Gagal menghapus"); }
  }

  const score = Number(form.likelihood) * Number(form.impact);
  const level = riskLevel(score);

  // Filter risks by category
  const filtered = (risks ?? []).filter((r) => catFilter === "all" || r.category === catFilter);

  // Build risk matrix dots: map of "L-I" -> array of risks
  const matrixMap = new Map<string, number>();
  for (const r of risks ?? []) {
    const key = `${r.likelihood}-${r.impact}`;
    matrixMap.set(key, (matrixMap.get(key) ?? 0) + 1);
  }

  // Charts data
  const levelDist = [
    { name: "Kritis", value: summary?.critical ?? 0, color: "#ef4444" },
    { name: "Tinggi", value: summary?.high ?? 0, color: "#f97316" },
    { name: "Sedang", value: summary?.medium ?? 0, color: "#f59e0b" },
    { name: "Rendah", value: summary?.low ?? 0, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const catDist = RISK_CATEGORIES.map((c) => ({
    name: c.label,
    value: (risks ?? []).filter((r) => r.category === c.value).length,
  })).filter((d) => d.value > 0);

  const hasData = (risks?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Kritis", value: summary.critical, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" },
            { label: "Tinggi", value: summary.high, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" },
            { label: "Sedang", value: summary.medium, color: "text-amber-600", bg: "" },
            { label: "Rendah", value: summary.low, color: "text-emerald-600", bg: "" },
          ].map((s) => (
            <Card key={s.label} className={cn("p-4", s.bg)}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">risiko</p>
            </Card>
          ))}
        </div>
      ) : <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}

      {/* Charts + Risk Matrix */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Risk Matrix 5x5 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="size-4 text-rose-500" /> Risk Matrix (Likelihood × Impact)
            </CardTitle>
            <CardDescription className="text-xs">Angka = jumlah risiko. Merah=Kritis, Oranye=Tinggi, Kuning=Sedang, Hijau=Rendah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="p-1 text-muted-foreground w-16">L \ I →</th>
                    {[1, 2, 3, 4, 5].map((i) => <th key={i} className="p-1 font-semibold text-muted-foreground w-12">{i}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[5, 4, 3, 2, 1].map((l) => (
                    <tr key={l}>
                      <td className="p-1 font-semibold text-muted-foreground">{l}</td>
                      {[1, 2, 3, 4, 5].map((i) => {
                        const count = matrixMap.get(`${l}-${i}`) ?? 0;
                        return (
                          <td key={i} className={cn("p-0 border border-background/50")}>
                            <div className={cn("flex items-center justify-center h-9 w-full rounded font-bold text-sm", cellBg(l, i))}>
                              {count > 0 ? count : <span className="opacity-30">·</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground mt-2">↑ Likelihood (L) · → Impact (I)</p>
            </div>
          </CardContent>
        </Card>

        {/* Donut: level distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Distribusi Level Risiko</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
            ) : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={levelDist} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={3} dataKey="value" nameKey="name">
                      {levelDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1">
                  {levelDist.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <span className="size-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category bar + per-division summary */}
      {hasData && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="size-4 text-orange-500" />Risiko per Kategori</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={catDist} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" name="Risiko" fill="#f97316" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Risiko per Divisi</CardTitle></CardHeader>
            <CardContent>
              {(summary?.byDivision?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(summary?.byDivision ?? []).slice(0, 8).map((d) => (
                    <div key={d.division} className="flex items-center justify-between gap-2">
                      <span className="text-xs truncate max-w-[140px]">{d.division}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{d.count} risiko</span>
                        <RagBadge level={d.maxLevel} label={LEVEL_LABEL[d.maxLevel] ?? d.maxLevel} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk register table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-rose-500" />Risk Register</CardTitle>
              <CardDescription>Daftar risiko per divisi. Klik baris untuk edit.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodSelector value={period} onChange={setPeriod} />
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Semua kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {RISK_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={divFilter} onValueChange={setDivFilter}>
                <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Semua divisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {(divisions ?? []).map((d) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={openNew} className="cursor-pointer"><Plus className="size-4" />Tambah Risiko</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {risks === undefined ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><AlertTriangle /></EmptyMedia>
                <EmptyTitle>Belum ada risiko</EmptyTitle>
                <EmptyDescription>Tambahkan risiko untuk periode {period}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Button size="sm" onClick={openNew} className="cursor-pointer">Tambah Risiko</Button></EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Judul Risiko</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">I</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PIC</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r._id} className="cursor-pointer hover:bg-muted/30" onClick={() => openEdit(r)}>
                      <TableCell className="font-medium text-sm">{r.division}</TableCell>
                      <TableCell className="max-w-[160px]"><p className="truncate text-sm">{r.title}</p></TableCell>
                      <TableCell><Badge variant="outline" className="text-[11px]">{RISK_CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category}</Badge></TableCell>
                      <TableCell className="text-center font-mono text-sm font-semibold">{r.likelihood}</TableCell>
                      <TableCell className="text-center font-mono text-sm font-semibold">{r.impact}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn("font-bold text-sm px-2 py-0.5 rounded", r.riskScore >= 20 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40" : r.riskScore >= 12 ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40" : r.riskScore >= 6 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40")}>
                          {r.riskScore}
                        </span>
                      </TableCell>
                      <TableCell><RagBadge level={r.riskLevel} label={LEVEL_LABEL[r.riskLevel]} /></TableCell>
                      <TableCell><span className="text-xs">{RISK_STATUSES.find((s) => s.value === r.status)?.label ?? r.status}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.owner ?? "-"}</TableCell>
                      <TableCell className="text-xs">{r.dueDate ?? "-"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="size-7 cursor-pointer text-muted-foreground hover:text-rose-600"><Trash2 className="size-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Hapus risiko?</AlertDialogTitle><AlertDialogDescription>Tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(r._id)} className="bg-rose-600 hover:bg-rose-700">Hapus</AlertDialogAction></AlertDialogFooter>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Risiko" : "Tambah Risiko Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Divisi</Label>
              <Select value={form.division} onValueChange={(v) => setForm((f) => ({ ...f, division: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih divisi" /></SelectTrigger>
                <SelectContent>{(divisions ?? []).map((d) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Judul Risiko</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Deskripsi singkat risiko" /></div>
            <div className="space-y-1"><Label>Deskripsi</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Likelihood (1–5)</Label>
                <Input type="number" min={1} max={5} value={form.likelihood} onChange={(e) => setForm((f) => ({ ...f, likelihood: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Impact (1–5)</Label>
                <Input type="number" min={1} max={5} value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
              <div><p className="text-xs text-muted-foreground">Risk Score</p><p className="text-2xl font-bold">{score}</p></div>
              <RagBadge level={level} label={LEVEL_LABEL[level]} size="md" />
            </div>
            <div className="space-y-1"><Label>Rencana Mitigasi</Label><Input value={form.mitigationPlan} onChange={(e) => setForm((f) => ({ ...f, mitigationPlan: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>PIC</Label><Input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Target Tanggal</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">Batal</Button>
            <Button onClick={handleSubmit} disabled={!form.title || !form.division} className="cursor-pointer">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
