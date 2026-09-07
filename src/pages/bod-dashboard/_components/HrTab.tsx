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
  LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import {
  Users, Upload, FileSpreadsheet, UserCheck, TrendingUp, TrendingDown,
  Wallet, Clock, GraduationCap, UserMinus, Info, Building2,
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

function formatIDR(v: number | null | undefined, compact = false): string {
  if (v === null || v === undefined || isNaN(Number(v))) return compact ? "0" : "Rp 0";
  const num = Number(v);
  if (compact) {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}M`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}jt`;
    return `${(num / 1_000).toFixed(0)}rb`;
  }
  if (num >= 1_000_000_000_000) return `Rp ${(num / 1_000_000_000_000).toFixed(2)}T`;
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(2)}M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function attendanceRag(r: number): string {
  if (r >= 95) return "green";
  if (r >= 85) return "amber";
  return "red";
}

function prodRag(p: number): string {
  if (p >= 85) return "green";
  if (p >= 70) return "amber";
  return "red";
}

type KpiCardProps = { label: string; value: string; sub?: string; icon: React.ElementType; color?: string };
function KpiCard({ label, value, sub, icon: Icon, color = "text-foreground" }: KpiCardProps) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-start justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className="size-3.5 text-muted-foreground/60 mt-0.5" />
      </div>
      <p className={cn("text-xl font-bold leading-tight", color)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

// ---- main component --------------------------------------------------------
export default function HrTab() {
  const [period, setPeriod] = useState(currentPeriod());
  const [trendMonths, setTrendMonths] = useState(6);
  const [typeFilter, setTypeFilter] = useState<"all" | "jasa" | "manufaktur">("all");
  const [sortBy, setSortBy] = useState<"headcount" | "attendance" | "productivity" | "payroll">("headcount");
  const fileRef = useRef<HTMLInputElement>(null);

  const summary = useQuery(api.bodExtended.getHrSummary, { period });
  const trend = useQuery(api.bodExtended.getHrTrend, { months: trendMonths });
  const bulkUpsert = useMutation(api.bodExtended.bulkUpsertKpiReports);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1).filter((l) => l.trim());
    const reports = lines.map((line) => {
      const parts = line.split(",").map((s) => s.trim().replace(/"/g, ""));
      const [division, type, headcount, attendanceRate, productivity, payroll, absentDays, overtimeHours, trainingHours, turnoverRate] = parts;
      return {
        division: division ?? "",
        divisionType: type === "manufaktur" ? "manufaktur" : "jasa",
        data: JSON.stringify({
          headcount: Number(headcount ?? 0),
          attendanceRate: Number(attendanceRate ?? 0),
          productivity: Number(productivity ?? 0),
          payroll: Number(payroll ?? 0),
          absentDays: Number(absentDays ?? 0),
          overtimeHours: Number(overtimeHours ?? 0),
          trainingHours: Number(trainingHours ?? 0),
          turnoverRate: Number(turnoverRate ?? 0),
        }),
      };
    }).filter((r) => r.division);

    if (reports.length === 0) { toast.error("Tidak ada data valid"); return; }
    try {
      const count = await bulkUpsert({ period, category: "hr", reports });
      toast.success(`${count} data HR berhasil diimpor`);
    } catch { toast.error("Gagal mengimpor"); }
    e.target.value = "";
  }

  const filtered = (summary?.byDivision ?? [])
    .filter((d) => typeFilter === "all" || d.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === "headcount") return b.headcount - a.headcount;
      if (sortBy === "attendance") return b.attendanceRate - a.attendanceRate;
      if (sortBy === "productivity") return b.productivity - a.productivity;
      return b.payroll - a.payroll;
    });

  // Bar chart: payroll per division top 8
  const payrollBar = filtered.slice(0, 8).map((d) => ({
    name: d.division.replace(/^Divisi\s*/i, "").slice(0, 12),
    payroll: d.payroll,
    headcount: d.headcount,
  }));

  // Trend chart
  const trendData = (trend?.periods ?? []).map((p) => ({
    name: periodLabel(p.period),
    Headcount: p.totalHeadcount,
    "Kehadiran (%)": p.attendanceRate,
    "Produktivitas (%)": p.productivityScore,
  }));

  // Radar chart: top 6 divisions by headcount
  const radarData = filtered.slice(0, 6).map((d) => ({
    division: d.division.replace(/^Divisi\s*/i, "").slice(0, 10),
    Kehadiran: d.attendanceRate,
    Produktivitas: d.productivity,
    "Utilisasi OT": Math.min(d.overtimeHours > 0 ? Math.round(d.overtimeHours / 10) : 0, 100),
    Pelatihan: Math.min(d.trainingHours > 0 ? Math.round(d.trainingHours / 2) : 0, 100),
  }));

  const hasData = (summary?.byDivision?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* ---- KPI summary cards ---- */}
      {summary === undefined || Array.isArray(summary) ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Total Karyawan" icon={Users} value={(summary.totalHeadcount ?? 0).toLocaleString("id-ID")}
              sub={`Jasa: ${(summary.jasaHeadcount ?? 0).toLocaleString()} · Manufaktur: ${(summary.manufakturHeadcount ?? 0).toLocaleString()}`} />
            <KpiCard label="Kehadiran Rata-rata" icon={UserCheck}
              value={`${summary.attendanceRate ?? 0}%`}
              color={(summary.attendanceRate ?? 0) >= 95 ? "text-emerald-600" : (summary.attendanceRate ?? 0) >= 85 ? "text-amber-600" : "text-rose-600"}
              sub="target: ≥95%" />
            <KpiCard label="Produktivitas Rata-rata" icon={TrendingUp}
              value={`${summary.productivityScore ?? 0}%`}
              color={(summary.productivityScore ?? 0) >= 85 ? "text-emerald-600" : (summary.productivityScore ?? 0) >= 70 ? "text-amber-600" : "text-rose-600"}
              sub="target: ≥85%" />
            <KpiCard label="Total Payroll" icon={Wallet}
              value={formatIDR(summary.totalPayroll)}
              sub={`Rata-rata: ${formatIDR(summary.avgSalary)}/orang`} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Total Absensi" icon={UserMinus}
              value={(summary.totalAbsent ?? 0).toLocaleString("id-ID")}
              color={(summary.totalAbsent ?? 0) > 0 ? "text-amber-600" : "text-emerald-600"}
              sub="hari ketidakhadiran" />
            <KpiCard label="Total Lembur" icon={Clock}
              value={`${(summary.totalOvertime ?? 0).toLocaleString()} jam`}
              sub="akumulasi semua divisi" />
            <KpiCard label="Jam Pelatihan" icon={GraduationCap}
              value={`${(summary.totalTrainingHours ?? 0).toLocaleString()} jam`}
              sub="total training period ini" />
            <KpiCard label="Turnover Rate" icon={UserMinus}
              value={`${summary.turnoverRate ?? 0}%`}
              color={(summary.turnoverRate ?? 0) <= 5 ? "text-emerald-600" : (summary.turnoverRate ?? 0) <= 10 ? "text-amber-600" : "text-rose-600"}
              sub="rata-rata seluruh divisi" />
          </div>
        </>
      )}

      {/* ---- Charts row ---- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Trend line chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-violet-500" /> Tren HR
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
            {trend === undefined ? <Skeleton className="h-44 w-full" /> : trendData.every((d) => d.Headcount === 0) ? (
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
                  <Line yAxisId="left" type="monotone" dataKey="Headcount" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Kehadiran (%)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Produktivitas (%)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payroll bar per division */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="size-4 text-emerald-500" /> Payroll per Divisi (Top 8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary === undefined ? <Skeleton className="h-44 w-full" /> : payrollBar.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={payrollBar} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => formatIDR(v, true)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip formatter={(v: number) => formatIDR(v)} />
                  <Bar dataKey="payroll" name="Payroll" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Radar chart: multi-KPI per division */}
      {hasData && radarData.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="size-4 text-violet-500" /> Perbandingan KPI HR Divisi (Top 6)
            </CardTitle>
            <CardDescription className="text-xs">Kehadiran, produktivitas, pelatihan — skala 0–100</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Attendance comparison bar */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><UserCheck className="size-3" /> Kehadiran per Divisi</p>
                {filtered.slice(0, 8).map((d) => (
                  <div key={d.division} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs truncate max-w-[140px]">{d.division.replace(/^Divisi\s*/i, "")}</span>
                      <span className={cn("text-xs font-semibold tabular-nums", d.attendanceRate >= 95 ? "text-emerald-600" : d.attendanceRate >= 85 ? "text-amber-600" : "text-rose-600")}>
                        {d.attendanceRate}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", d.attendanceRate >= 95 ? "bg-emerald-500" : d.attendanceRate >= 85 ? "bg-amber-500" : "bg-rose-500")}
                        style={{ width: `${d.attendanceRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Productivity comparison bar */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><TrendingUp className="size-3" /> Produktivitas per Divisi</p>
                {filtered.slice(0, 8).map((d) => (
                  <div key={d.division} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs truncate max-w-[140px]">{d.division.replace(/^Divisi\s*/i, "")}</span>
                      <span className={cn("text-xs font-semibold tabular-nums", d.productivity >= 85 ? "text-emerald-600" : d.productivity >= 70 ? "text-amber-600" : "text-rose-600")}>
                        {d.productivity}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", d.productivity >= 85 ? "bg-blue-500" : d.productivity >= 70 ? "bg-amber-500" : "bg-rose-500")}
                        style={{ width: `${d.productivity}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Detail table ---- */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-violet-500" /> KPI HR per Divisi
              </CardTitle>
              <CardDescription>Headcount, kehadiran, produktivitas, payroll, absensi, lembur, pelatihan</CardDescription>
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
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="headcount">Urut: Headcount</SelectItem>
                  <SelectItem value="attendance">Urut: Kehadiran</SelectItem>
                  <SelectItem value="productivity">Urut: Produktivitas</SelectItem>
                  <SelectItem value="payroll">Urut: Payroll</SelectItem>
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
                <EmptyMedia variant="icon"><Users /></EmptyMedia>
                <EmptyTitle>Belum ada data HR</EmptyTitle>
                <EmptyDescription>Import CSV untuk mulai memantau KPI HR per divisi</EmptyDescription>
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
                    <TableHead className="text-right">Headcount</TableHead>
                    <TableHead className="text-right">Payroll</TableHead>
                    <TableHead className="text-right">Rata-rata Gaji</TableHead>
                    <TableHead className="min-w-[110px]">Kehadiran</TableHead>
                    <TableHead className="min-w-[110px]">Produktivitas</TableHead>
                    <TableHead className="text-right">Absensi</TableHead>
                    <TableHead className="text-right">Lembur</TableHead>
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
                      <TableCell className="text-right font-mono text-sm font-semibold">{d.headcount.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatIDR(d.payroll)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatIDR(d.avgSalary)}</TableCell>
                      <TableCell className="min-w-[110px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full rounded-full", d.attendanceRate >= 95 ? "bg-emerald-500" : d.attendanceRate >= 85 ? "bg-amber-500" : "bg-rose-500")}
                              style={{ width: `${d.attendanceRate}%` }} />
                          </div>
                          <span className={cn("text-xs font-semibold w-9 tabular-nums", d.attendanceRate >= 95 ? "text-emerald-600" : d.attendanceRate >= 85 ? "text-amber-600" : "text-rose-600")}>
                            {d.attendanceRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[110px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full rounded-full", d.productivity >= 85 ? "bg-blue-500" : d.productivity >= 70 ? "bg-amber-500" : "bg-rose-500")}
                              style={{ width: `${d.productivity}%` }} />
                          </div>
                          <span className={cn("text-xs font-semibold w-9 tabular-nums", d.productivity >= 85 ? "text-blue-600" : d.productivity >= 70 ? "text-amber-600" : "text-rose-600")}>
                            {d.productivity}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {d.absentDays > 0 ? <span className="text-amber-600">{d.absentDays} hr</span> : <span className="text-emerald-600">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {d.overtimeHours > 0 ? `${d.overtimeHours} jam` : "—"}
                      </TableCell>
                      <TableCell>
                        <RagBadge
                          level={attendanceRag(d.attendanceRate) === "red" || prodRag(d.productivity) === "red" ? "red" : attendanceRag(d.attendanceRate) === "amber" || prodRag(d.productivity) === "amber" ? "amber" : "green"}
                          label={attendanceRag(d.attendanceRate) === "red" || prodRag(d.productivity) === "red" ? "Kritis" : attendanceRag(d.attendanceRate) === "amber" || prodRag(d.productivity) === "amber" ? "Perhatian" : "Normal"}
                        />
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
            <FileSpreadsheet className="size-3.5" /> Format CSV untuk Import HR
          </p>
          <p className="text-[11px] text-muted-foreground font-mono bg-background rounded px-2 py-2 border leading-relaxed">
            division,type,headcount,attendanceRate,productivity,payroll,absentDays,overtimeHours,trainingHours,turnoverRate<br />
            Divisi HRD,jasa,45,96,88,450000000,12,80,120,3.5<br />
            Divisi Produksi,manufaktur,120,94,82,1200000000,30,200,80,5.2
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Info className="size-3" /> absentDays (hari), overtimeHours (jam), trainingHours (jam), turnoverRate (%) bersifat opsional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
