import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, RadialBarChart, RadialBar,
} from "recharts";
import {
  Factory, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Clock,
  Gauge, PackageCheck, TrendingUp, TrendingDown, Info, CircleCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import PeriodSelector from "./PeriodSelector.tsx";
import RagBadge from "./RagBadge.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

// ---- helpers ---------------------------------------------------------------
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(p: string): string {
  const [y, m] = p.split("-");
  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${MONTHS[(parseInt(m) - 1)] ?? m} ${y?.slice(2)}`;
}

function formatNum(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
  return String(v);
}

function otdRag(otd: number): string {
  if (otd >= 95) return "green";
  if (otd >= 80) return "amber";
  return "red";
}

function capColor(v: number): string {
  if (v >= 90) return "text-rose-600";
  if (v >= 75) return "text-amber-600";
  return "text-emerald-600";
}

type StatCardProps = { label: string; value: string | number; sub?: string; icon: React.ElementType; color?: string };
function StatCard({ label, value, sub, icon: Icon, color = "text-foreground" }: StatCardProps) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-start justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="size-3.5 text-muted-foreground/60" />
      </div>
      <p className={cn("text-xl font-bold leading-tight", color)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

// Status stacked bar colors
const STATUS_COLORS = {
  onTrack: "#10b981",
  atRisk: "#f59e0b",
  delayed: "#ef4444",
  completed: "#6366f1",
};

export default function ProductionTab() {
  const [period, setPeriod] = useState(currentPeriod());
  const [trendMonths, setTrendMonths] = useState(6);
  const [typeFilter, setTypeFilter] = useState<"all" | "jasa" | "manufaktur">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const summary = useQuery(api.bodExtended.getProductionSummary, { period });
  const trend = useQuery(api.bodExtended.getProductionTrend, { months: trendMonths });
  const bulkUpsert = useMutation(api.bodExtended.bulkUpsertKpiReports);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1).filter((l) => l.trim());
    const reports = lines.map((line) => {
      const parts = line.split(",").map((s) => s.trim().replace(/"/g, ""));
      const [division, type, projects, onTrack, atRisk, delayed, completed, otd, capacityUtilization, outputVolume, pipelineValue] = parts;
      return {
        division: division ?? "",
        divisionType: type === "manufaktur" ? "manufaktur" : "jasa",
        data: JSON.stringify({
          projects: Number(projects ?? 0),
          onTrack: Number(onTrack ?? 0),
          atRisk: Number(atRisk ?? 0),
          delayed: Number(delayed ?? 0),
          completed: Number(completed ?? 0),
          otd: Number(otd ?? 0),
          capacityUtilization: Number(capacityUtilization ?? 0),
          outputVolume: Number(outputVolume ?? 0),
          pipelineValue: Number(pipelineValue ?? 0),
        }),
      };
    }).filter((r) => r.division);

    if (reports.length === 0) { toast.error("Tidak ada data valid"); return; }
    try {
      const count = await bulkUpsert({ period, category: "production", reports });
      toast.success(`${count} data produksi berhasil diimpor`);
    } catch { toast.error("Gagal mengimpor"); }
    e.target.value = "";
  }

  const filtered = (summary?.byDivision ?? []).filter(
    (d) => typeFilter === "all" || d.type === typeFilter
  );

  // Stacked bar: project status per division (top 8)
  const stackedData = filtered.slice(0, 8).map((d) => ({
    name: d.division.replace(/^Divisi\s*/i, "").slice(0, 12),
    onTrack: d.onTrack,
    atRisk: d.atRisk,
    delayed: d.delayed,
    completed: d.completed,
  }));

  // Trend data
  const trendData = (trend?.periods ?? []).map((p) => ({
    name: periodLabel(p.period),
    "Proyek Aktif": p.activeProjects,
    "Delayed": p.delayedProjects,
    "OTD (%)": p.otdRate,
  }));

  // Radial for OTD gauge
  const otdGaugeData = [{ name: "OTD", value: summary?.otdRate ?? 0, fill: (summary?.otdRate ?? 0) >= 95 ? "#10b981" : (summary?.otdRate ?? 0) >= 80 ? "#f59e0b" : "#ef4444" }];

  const hasData = (summary?.byDivision?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* ---- KPI summary cards ---- */}
      {summary === undefined ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Proyek Aktif" value={summary.activeProjects} icon={Factory} sub={`Jasa: ${summary.jasaProjects} · Manufaktur: ${summary.manufakturProjects}`} />
            <StatCard label="On Track" value={summary.onTrackProjects} icon={CircleCheck} color="text-emerald-600" sub={`${summary.activeProjects > 0 ? Math.round((summary.onTrackProjects / summary.activeProjects) * 100) : 0}% dari total`} />
            <StatCard label="At Risk" value={summary.atRiskProjects} icon={AlertTriangle} color="text-amber-600" sub="perlu perhatian" />
            <StatCard label="Delayed" value={summary.delayedProjects} icon={Clock} color={summary.delayedProjects > 0 ? "text-rose-600" : "text-emerald-600"} sub={summary.delayedProjects === 0 ? "Semua tepat waktu!" : "melebihi jadwal"} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Selesai" value={summary.completedProjects} icon={PackageCheck} color="text-indigo-600" sub="periode ini" />
            <StatCard label="Utilisasi Kapasitas" value={`${summary.avgCapacityUtilization}%`} icon={Gauge} color={capColor(summary.avgCapacityUtilization)} sub="rata-rata seluruh divisi" />
            <StatCard label="Output Volume" value={formatNum(summary.totalOutputVolume)} icon={TrendingUp} sub="total unit produksi" />
            <StatCard label="Pipeline Value" value={summary.totalPipelineValue > 0 ? `Rp ${formatNum(summary.totalPipelineValue)}` : "-"} icon={TrendingUp} sub="nilai pipeline proyek jasa" />
          </div>
        </>
      )}

      {/* ---- OTD gauge + trend ---- */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* OTD radial gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" /> On-Time Delivery (OTD)
            </CardTitle>
            <CardDescription className="text-xs">Rata-rata seluruh divisi</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            {summary === undefined ? <Skeleton className="h-36 w-full" /> : (
              <>
                <div className="relative">
                  <ResponsiveContainer width={140} height={140}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                      startAngle={90} endAngle={90 - (summary.otdRate / 100) * 360}
                      data={otdGaugeData} barSize={16}>
                      <RadialBar dataKey="value" cornerRadius={8} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-bold", otdRag(summary.otdRate) === "green" ? "text-emerald-600" : otdRag(summary.otdRate) === "amber" ? "text-amber-600" : "text-rose-600")}>
                      {summary.otdRate}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">OTD Rate</span>
                  </div>
                </div>
                <RagBadge level={otdRag(summary.otdRate)} label={summary.otdRate >= 95 ? "Target Tercapai" : summary.otdRate >= 80 ? "Perlu Peningkatan" : "Di Bawah Target"} />
                <p className="text-[11px] text-muted-foreground text-center">Target OTD: 95%</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-blue-500" /> Tren Proyek & OTD
              </CardTitle>
              <Select value={String(trendMonths)} onValueChange={(v) => setTrendMonths(Number(v))}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Bulan</SelectItem>
                  <SelectItem value="6">6 Bulan</SelectItem>
                  <SelectItem value="12">12 Bulan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {trend === undefined ? <Skeleton className="h-44 w-full" /> : trendData.every((d) => d["Proyek Aktif"] === 0) ? (
              <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data tren. Import data beberapa periode.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} width={36} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="Proyek Aktif" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="Delayed" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="OTD (%)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Stacked bar: project status per division ---- */}
      {hasData && stackedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Factory className="size-4 text-blue-500" /> Status Proyek per Divisi
              </CardTitle>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "jasa" | "manufaktur")}>
                <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="jasa">Jasa</SelectItem>
                  <SelectItem value="manufaktur">Manufaktur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stackedData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="onTrack" name="On Track" stackId="a" fill={STATUS_COLORS.onTrack} radius={[0, 0, 0, 0]} />
                <Bar dataKey="atRisk" name="At Risk" stackId="a" fill={STATUS_COLORS.atRisk} />
                <Bar dataKey="delayed" name="Delayed" stackId="a" fill={STATUS_COLORS.delayed} />
                <Bar dataKey="completed" name="Selesai" stackId="a" fill={STATUS_COLORS.completed} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ---- Detail table ---- */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Factory className="size-5 text-blue-500" /> KPI Produksi & Operasional per Divisi
              </CardTitle>
              <CardDescription>Status proyek, OTD, utilisasi kapasitas, dan output</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodSelector value={period} onChange={setPeriod} />
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "jasa" | "manufaktur")}>
                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="jasa">Jasa</SelectItem>
                  <SelectItem value="manufaktur">Manufaktur</SelectItem>
                </SelectContent>
              </Select>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} className="cursor-pointer">
                <Upload className="size-4" /> Import CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summary === undefined ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Factory /></EmptyMedia>
                <EmptyTitle>Belum ada data produksi</EmptyTitle>
                <EmptyDescription>Import CSV untuk mulai memantau proyek dan OTD per divisi</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" onClick={() => fileRef.current?.click()} className="cursor-pointer">
                  <Upload className="size-4" /> Import CSV
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-center">Proyek</TableHead>
                    <TableHead className="text-center text-emerald-600">On Track</TableHead>
                    <TableHead className="text-center text-amber-600">At Risk</TableHead>
                    <TableHead className="text-center text-rose-600">Delayed</TableHead>
                    <TableHead className="text-center text-indigo-600">Selesai</TableHead>
                    <TableHead className="min-w-[110px]">OTD Rate</TableHead>
                    <TableHead className="text-center">Kapasitas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.division}>
                      <TableCell className="font-medium text-sm">{d.division}</TableCell>
                      <TableCell>
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", d.type === "manufaktur" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" : "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400")}>
                          {d.type === "manufaktur" ? "Manufaktur" : "Jasa"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm font-semibold">{d.projects}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-emerald-600 font-semibold text-sm">{d.onTrack}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {d.atRisk > 0 ? <span className="text-amber-600 font-semibold text-sm">{d.atRisk}</span> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {d.delayed > 0 ? (
                          <span className="text-rose-600 font-semibold text-sm flex items-center justify-center gap-1">
                            <AlertTriangle className="size-3" />{d.delayed}
                          </span>
                        ) : <CheckCircle2 className="size-3.5 text-emerald-500 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-indigo-600 font-semibold text-sm">{d.completed}</span>
                      </TableCell>
                      <TableCell className="min-w-[110px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full rounded-full", d.otd >= 95 ? "bg-emerald-500" : d.otd >= 80 ? "bg-amber-500" : "bg-rose-500")}
                              style={{ width: `${Math.min(d.otd, 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold w-9 tabular-nums">{d.otd}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {d.capacityUtilization > 0 ? (
                          <span className={cn("text-xs font-semibold", capColor(d.capacityUtilization))}>
                            {d.capacityUtilization}%
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <RagBadge level={otdRag(d.otd)} label={d.otd >= 95 ? "Baik" : d.otd >= 80 ? "Perhatian" : "Kritis"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV format guide */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <FileSpreadsheet className="size-3.5" /> Format CSV untuk Import Produksi & Operasional
          </p>
          <p className="text-[11px] text-muted-foreground font-mono bg-background rounded px-2 py-2 border leading-relaxed">
            division,type,projects,onTrack,atRisk,delayed,completed,otd,capacityUtilization,outputVolume,pipelineValue<br />
            Divisi Proyek A,jasa,12,8,2,2,5,83,75,0,2500000000<br />
            Divisi Manufaktur B,manufaktur,8,7,1,0,3,100,88,15000,0
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Info className="size-3" /> atRisk, completed, capacityUtilization, outputVolume, pipelineValue bersifat opsional.
            pipelineValue untuk divisi jasa (Rp), outputVolume untuk manufaktur (unit).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
