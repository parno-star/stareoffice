/**
 * RevenueTab – Tab Revenue BoD Dashboard
 *
 * Setiap kartu KPI menampilkan:
 *  - Label KPI + Periode
 *  - Mini-tabel Program | Realisasi | Achievement (dengan border internal)
 *  - Indikator panah naik/turun vs periode sebelumnya
 *  - Modal input per divisi untuk mengisi Program & Realisasi
 */

import { useState, useRef } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { DivisionKpiRow } from "@/convex/bodExtended.ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Minus, Upload, FileSpreadsheet,
  Banknote, Percent, ArrowRightLeft, BarChart3, Receipt,
  Calendar, Settings, Wallet, TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import PeriodSelector from "./PeriodSelector.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import TabConfigEditor, { useResolvedConfig } from "./TabConfigEditor.tsx";
import type { KpiFieldDef, SectionFieldDef } from "./TabConfigEditor.tsx";

// ── helpers ──────────────────────────────────────────────────────────────────

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function periodLabel(p: string): string {
  const [y, m] = p.split("-");
  return `${MONTH_NAMES[(parseInt(m) - 1)] ?? m} ${y}`;
}

function fmtMoney(v: number | null | undefined) {
  if (v === null || v === undefined || isNaN(Number(v))) return "0";
  return Number(v).toLocaleString("id-ID");
}

function achColor(v: number) {
  if (v >= 100) return "text-emerald-600";
  if (v >= 80)  return "text-amber-600";
  return "text-rose-600";
}
function achBg(v: number) {
  if (v >= 100) return "bg-emerald-500";
  if (v >= 80)  return "bg-amber-500";
  return "bg-rose-500";
}

// Warna batang untuk grafik pendapatan per lini bisnis
const LINE_BAR_COLORS = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ec4899","#06b6d4","#f97316","#84cc16","#a78bfa","#fb923c"];

// ── KPI definitions ───────────────────────────────────────────────────────────

type TrendPeriod = {
  period: string;
  totalRevenue: number; totalBudget: number; achievement: number;
  totalCost: number; totalCostProgram: number;
  grossProfit: number; grossProfitProgram: number;
  ebitda: number; ebitdaProgram: number;
  netProfit: number; netProfitProgram: number;
  cashFlow: number; cashFlowProgram: number;
  ar: number; arProgram: number;
  ap: number; apProgram: number;
};

/** Mapping tailwind color class → hex for chart strokes */
const COLOR_MAP: Record<string, string> = {
  "text-emerald-600": "#059669",
  "text-rose-600": "#e11d48",
  "text-blue-600": "#2563eb",
  "text-violet-600": "#7c3aed",
  "text-teal-600": "#0d9488",
  "text-cyan-600": "#0891b2",
  "text-orange-600": "#ea580c",
  "text-pink-600": "#db2777",
};

type KpiMeta = {
  key: string;
  defaultLabel: string;
  icon: React.ElementType;
  color: string;
  /** get program value from summary */
  program: (s: RevSummary) => number;
  /** get realisasi value from summary */
  realisasi: (s: RevSummary) => number;
  /** get realisasi value from trend period */
  trendRealisasi: (p: TrendPeriod) => number;
  /** get program value from trend period */
  trendProgram: (p: TrendPeriod) => number;
};

type RevSummary = {
  totalRevenue: number; totalBudget: number; achievement: number;
  totalGrossProfit: number; grossProfitProgram: number; grossProfitMargin: number;
  totalEbitda: number; ebitdaProgram: number; ebitdaMargin: number;
  totalCashFlow: number; cashFlowProgram: number;
  totalAr: number; arProgram: number;
  totalAp: number; apProgram: number;
  totalCost: number; totalCostProgram: number;
  totalNetProfit: number; netProfitProgram: number;
  period: string;
  byDivision: Array<{
    division: string; type: string; revenue: number; budget: number;
    achievement: number; grossProfit: number; ebitda: number; cashFlow: number; ar: number; ap: number;
  }>;
};

const KPI_META: KpiMeta[] = [
  { key: "total_revenue", defaultLabel: "Total Pendapatan",            icon: Banknote,       color: "text-emerald-600", program: (s) => s.totalBudget,        realisasi: (s) => s.totalRevenue,     trendRealisasi: (p) => p.totalRevenue, trendProgram: (p) => p.totalBudget       },
  { key: "total_cost",    defaultLabel: "Total Biaya Pokok",           icon: Receipt,        color: "text-rose-600",    program: (s) => s.totalCostProgram,   realisasi: (s) => s.totalCost,        trendRealisasi: (p) => p.totalCost,    trendProgram: (p) => p.totalCostProgram  },
  { key: "gross_profit",  defaultLabel: "Laba Kotor",                  icon: TrendingUp,     color: "text-blue-600",    program: (s) => s.grossProfitProgram, realisasi: (s) => s.totalGrossProfit, trendRealisasi: (p) => p.grossProfit,  trendProgram: (p) => p.grossProfitProgram },
  { key: "ebitda",        defaultLabel: "EBITDA",                      icon: Percent,        color: "text-violet-600",  program: (s) => s.ebitdaProgram,      realisasi: (s) => s.totalEbitda,      trendRealisasi: (p) => p.ebitda,       trendProgram: (p) => p.ebitdaProgram     },
  { key: "net_profit",    defaultLabel: "Laba Bersih",                 icon: Wallet,         color: "text-teal-600",    program: (s) => s.netProfitProgram,   realisasi: (s) => s.totalNetProfit,   trendRealisasi: (p) => p.netProfit,    trendProgram: (p) => p.netProfitProgram  },
  { key: "cash_flow",     defaultLabel: "Arus Kas",                    icon: ArrowRightLeft, color: "text-cyan-600",    program: (s) => s.cashFlowProgram,    realisasi: (s) => s.totalCashFlow,    trendRealisasi: (p) => p.cashFlow,     trendProgram: (p) => p.cashFlowProgram   },
  { key: "ar",            defaultLabel: "Hutang",    icon: FileSpreadsheet,color: "text-orange-600",  program: (s) => s.arProgram,          realisasi: (s) => s.totalAr,          trendRealisasi: (p) => p.ar,           trendProgram: (p) => p.arProgram         },
  { key: "ap",            defaultLabel: "Tagihan",       icon: FileSpreadsheet,color: "text-pink-600",    program: (s) => s.apProgram,          realisasi: (s) => s.totalAp,          trendRealisasi: (p) => p.ap,           trendProgram: (p) => p.apProgram         },
];

const KPI_FIELDS: KpiFieldDef[] = KPI_META.map((m) => ({ key: m.key, defaultLabel: m.defaultLabel }));
const SECTION_FIELDS: SectionFieldDef[] = [
  { key: "trend_chart",  defaultTitle: "Pendapatan - Program vs Realisasi" },
  { key: "bar_chart",    defaultTitle: "Top Departemen" },
  { key: "table_title",  defaultTitle: "Pendapatan per Lini Bisnis" },
  { key: "table_desc",   defaultTitle: "Program vs Realisasi pendapatan per lini bisnis" },
];

/** Custom legend for the main trend chart — draws solid / dashed line indicators */
function renderTrendLegend() {
  return (
    <div className="flex items-center justify-center gap-4 mt-1">
      <div className="flex items-center gap-1.5">
        <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#10b981" strokeWidth="2" /></svg>
        <span className="text-[11px] text-muted-foreground">Realisasi</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
        <span className="text-[11px] text-muted-foreground">Program</span>
      </div>
    </div>
  );
}


// ── KPI Card with Prog/Real/Acvt table ───────────────────────────────────────

type KpiCardProps = {
  label: string;
  period: string;
  program: number;
  realisasi: number;
  achievement: number;
  prevRealisasi: number | null;
  divKpiRows: DivisionKpiRow[];
  prevAvgAchievement: number | null;
  icon: React.ElementType;
  color: string;
  editing: boolean;
};

function KpiCard({
  label, period, program, realisasi, achievement,
  prevRealisasi, divKpiRows, prevAvgAchievement,
  icon: Icon, color, editing,
}: KpiCardProps) {
  // Jika ada program/realisasi dari financeReports (program > 0 atau realisasi > 0),
  // gunakan data tersebut sebagai sumber utama. divKpiRows hanya dipakai jika tidak ada data form.
  const hasFormData = program > 0 || realisasi > 0;
  const hasDiv = divKpiRows.length > 0 && !hasFormData;

  const displayProgram   = hasDiv ? divKpiRows.reduce((s, r) => s + r.program, 0)   : program;
  const displayRealisasi = hasDiv ? divKpiRows.reduce((s, r) => s + r.realisasi, 0) : realisasi;

  // Apakah KPI ini memang belum ada datanya sama sekali
  const isEmpty = displayProgram === 0 && displayRealisasi === 0;

  // Hitung achievement hanya jika ada data
  const displayAch = isEmpty
    ? 0
    : displayProgram > 0
      ? Math.round((displayRealisasi / displayProgram) * 100)
      : achievement;

  // Indikator ↑↓ berdasarkan selisih realisasi vs periode sebelumnya
  const realDiff = (!isEmpty && prevRealisasi !== null)
    ? displayRealisasi - prevRealisasi
    : null;

  // Deteksi apakah angka kecil (< 1000) → selalu tampilkan keterangan satuan agar konsisten
  const showUnitNote = !isEmpty;

  return (
    <Card className={cn(
      "flex flex-col gap-0 overflow-hidden transition-all",
      editing && "ring-2 ring-amber-400 ring-offset-1"
    )}>
      {/* Header: label + icon */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn("size-4 shrink-0", color)} />
          <p className="text-xs font-semibold text-foreground truncate">{label}</p>
        </div>
      </div>

      {/* Periode + indikator ↑↓ di sebelahnya */}
      <div className="flex items-center gap-1.5 px-4 pb-2">
        <Calendar className="size-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[10px] text-muted-foreground">{periodLabel(period)}</span>
        {realDiff !== null && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold ml-0.5",
            realDiff > 0 ? "text-emerald-600" : realDiff < 0 ? "text-rose-600" : "text-muted-foreground"
          )}>
            {realDiff > 0
              ? <TrendingUp className="size-3" />
              : realDiff < 0
                ? <TrendingDown className="size-3" />
                : <Minus className="size-3" />}
            <span>{fmtMoney(Math.abs(realDiff))}</span>
          </div>
        )}
      </div>

      {/* Mini-tabel Prog | Real | Acvt */}
      <div className="mx-3 mb-1 rounded-md border border-border overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-3 bg-muted/50 divide-x divide-border">
          <p className="text-[9px] font-semibold text-muted-foreground text-center py-1.5 px-1 uppercase tracking-wide"><span className="sm:hidden">Prog</span><span className="hidden sm:inline">Program</span></p>
          <p className="text-[9px] font-semibold text-muted-foreground text-center py-1.5 px-1 uppercase tracking-wide"><span className="sm:hidden">Real</span><span className="hidden sm:inline">Realisasi</span></p>
          <p className="text-[9px] font-semibold text-muted-foreground text-center py-1.5 px-1 uppercase tracking-wide">Acvt</p>
        </div>
        {/* Divider */}
        <div className="h-px bg-border" />
        {/* Value row */}
        <div className="grid grid-cols-3 divide-x divide-border bg-background">
          <div className="flex flex-col items-center justify-center py-2 px-1 gap-0.5">
            <p className="text-[10px] font-bold text-foreground leading-none tabular-nums">
              {isEmpty ? <span className="text-muted-foreground">—</span> : fmtMoney(displayProgram)}
            </p>
            {hasDiv && <p className="text-[8px] text-muted-foreground leading-none">{divKpiRows.length} dept</p>}
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 gap-0.5">
            <p className={cn("text-[10px] font-bold leading-none tabular-nums", isEmpty ? "text-muted-foreground" : color)}>
              {isEmpty ? "—" : fmtMoney(displayRealisasi)}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 gap-0.5">
            {isEmpty ? (
              <p className="text-[10px] text-muted-foreground leading-none">—</p>
            ) : (
              <>
                <p className={cn("text-[11px] font-extrabold leading-none tabular-nums", achColor(displayAch))}>{displayAch}%</p>
                <div className="w-full h-1 rounded-full bg-muted overflow-hidden mt-1">
                  <div className={cn("h-full rounded-full", achBg(displayAch))} style={{ width: `${Math.min(displayAch, 100)}%` }} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Keterangan satuan — tampil di semua kartu yang berisi nilai uang */}
      {showUnitNote && (
        <p className="text-[8px] text-muted-foreground/70 text-right px-3 pb-2 italic">*dalam satuan ribu rupiah (×1.000)</p>
      )}
      {!showUnitNote && <div className="pb-2" />}
    </Card>
  );
}

// ── Line KPI Card (Pendapatan per Lini Bisnis) ───────────────────────────────

type LineKpiCardProps = {
  name: string;
  period: string;
  program: number;
  realisasi: number;
  prevRealisasi: number | null;
};

function LineKpiCard({ name, period, program, realisasi, prevRealisasi }: LineKpiCardProps) {
  const isEmpty = program === 0 && realisasi === 0;
  const ach = isEmpty ? 0 : program > 0 ? Math.round((realisasi / program) * 100) : 0;
  const realDiff = (!isEmpty && prevRealisasi !== null) ? realisasi - prevRealisasi : null;

  return (
    <Card className="flex flex-col gap-0 overflow-hidden transition-all">
      {/* Header: nama lini bisnis */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Banknote className="size-4 shrink-0 text-emerald-600" />
          <p className="text-xs font-semibold text-foreground truncate">{name}</p>
        </div>
      </div>

      {/* Periode + indikator ↑↓ */}
      <div className="flex items-center gap-1.5 px-4 pb-2">
        <Calendar className="size-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[10px] text-muted-foreground">{periodLabel(period)}</span>
        {realDiff !== null && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold ml-0.5",
            realDiff > 0 ? "text-emerald-600" : realDiff < 0 ? "text-rose-600" : "text-muted-foreground"
          )}>
            {realDiff > 0 ? <TrendingUp className="size-3" /> : realDiff < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
            <span>{fmtMoney(Math.abs(realDiff))}</span>
          </div>
        )}
      </div>

      {/* Mini-tabel Prog | Real | Acvt */}
      <div className="mx-3 mb-1 rounded-md border border-border overflow-hidden">
        <div className="grid grid-cols-3 bg-muted/50 divide-x divide-border">
          <p className="text-[9px] font-semibold text-muted-foreground text-center py-1.5 px-1 uppercase tracking-wide"><span className="sm:hidden">Prog</span><span className="hidden sm:inline">Program</span></p>
          <p className="text-[9px] font-semibold text-muted-foreground text-center py-1.5 px-1 uppercase tracking-wide"><span className="sm:hidden">Real</span><span className="hidden sm:inline">Realisasi</span></p>
          <p className="text-[9px] font-semibold text-muted-foreground text-center py-1.5 px-1 uppercase tracking-wide">Acvt</p>
        </div>
        <div className="h-px bg-border" />
        <div className="grid grid-cols-3 divide-x divide-border bg-background">
          <div className="flex flex-col items-center justify-center py-2 px-1 gap-0.5">
            <p className="text-[10px] font-bold text-foreground leading-none tabular-nums">
              {isEmpty ? <span className="text-muted-foreground">—</span> : fmtMoney(program)}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 gap-0.5">
            <p className={cn("text-[10px] font-bold leading-none tabular-nums", isEmpty ? "text-muted-foreground" : "text-emerald-600")}>
              {isEmpty ? "—" : fmtMoney(realisasi)}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 gap-0.5">
            {isEmpty ? (
              <p className="text-[10px] text-muted-foreground leading-none">—</p>
            ) : (
              <>
                <p className={cn("text-[11px] font-extrabold leading-none tabular-nums", achColor(ach))}>{ach}%</p>
                <div className="w-full h-1 rounded-full bg-muted overflow-hidden mt-1">
                  <div className={cn("h-full rounded-full", achBg(ach))} style={{ width: `${Math.min(ach, 100)}%` }} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {!isEmpty
        ? <p className="text-[8px] text-muted-foreground/70 text-right px-3 pb-2 italic">*dalam satuan ribu rupiah (×1.000)</p>
        : <div className="pb-2" />}
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RevenueTab({ period, onPeriodChange }: { period: string; onPeriodChange: (p: string) => void }) {
  const { isAuthenticated } = useConvexAuth();
  const [typeFilter, setTypeFilter] = useState<"all" | "jasa" | "manufaktur">("all");
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [trendMonths, setTrendMonths] = useState(6);
  const [activeKpi, setActiveKpi] = useState<"revenue" | "grossProfit" | "ebitda">("revenue");
  const [editMode, setEditMode] = useState(false);
  const [selectedKpiChart, setSelectedKpiChart] = useState<string>("total_revenue");
  const [selectedLineChart, setSelectedLineChart] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Hitung prev period (bulan sebelumnya)
  const [py, pm] = period.split("-").map(Number);
  const prevDate = new Date(py, pm - 2, 1);
  const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  // Hanya query jika sudah authenticated — mencegah ConvexError UNAUTHENTICATED crash komponen
  const authArg     = isAuthenticated ? { period }              : "skip" as const;
  const prevAuthArg = isAuthenticated ? { period: prevPeriod }  : "skip" as const;
  const trendArg    = isAuthenticated ? { months: trendMonths } : "skip" as const;
  const divArg      = isAuthenticated ? { period }              : "skip" as const;

  const summary     = useQuery(api.bodExtended.getRevenueSummary, authArg);
  const prevSummary = useQuery(api.bodExtended.getRevenueSummary, prevAuthArg);
  const trend       = useQuery(api.bodExtended.getRevenueTrend, trendArg);
  const divKpiRows  = useQuery(api.bodExtended.getDivisionKpiList, divArg);
  const bulkUpsert = useMutation(api.bodExtended.bulkUpsertKpiReports);
  const cfg = useResolvedConfig("revenue");

  const prevDivKpiRows = useQuery(api.bodExtended.getDivisionKpiList, isAuthenticated ? { period: prevPeriod } : "skip");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1).filter((l) => l.trim());
    const reports = lines.map((line) => {
      const parts = line.split(",").map((s) => s.trim().replace(/"/g, ""));
      const [division, type, revenue, budget, grossProfit, ebitda, cashFlow, ar, ap] = parts;
      return {
        division: division ?? "",
        divisionType: type === "manufaktur" ? "manufaktur" : "jasa",
        data: JSON.stringify({
          revenue: Number(revenue ?? 0),
          budget: Number(budget ?? 0),
          grossProfit: Number(grossProfit ?? 0),
          ebitda: Number(ebitda ?? 0),
          cashFlow: Number(cashFlow ?? 0),
          ar: Number(ar ?? 0),
          ap: Number(ap ?? 0),
        }),
      };
    }).filter((r) => r.division);
    if (!reports.length) { toast.error("Tidak ada data valid"); return; }
    try {
      const count = await bulkUpsert({ period, category: "revenue", reports });
      toast.success(`${count} data revenue berhasil diimpor`);
    } catch { toast.error("Gagal mengimpor data"); }
    e.target.value = "";
  }



  const filtered = (summary?.byDivision ?? []).filter(
    (d) => typeFilter === "all" || d.type === typeFilter
  );
  const barData = filtered.slice(0, 10).map((d) => ({
    name: d.division.replace(/^Divisi\s*/i, "").slice(0, 14),
    revenue: d.revenue, budget: d.budget, grossProfit: d.grossProfit, ebitda: d.ebitda,
  }));
  // Helper: get divKpiRows for a specific kpiKey
  function rowsFor(kpiKey: string): DivisionKpiRow[] {
    return (divKpiRows ?? []).filter((r) => r.kpiKey === kpiKey);
  }
  function prevAvgAch(kpiKey: string): number | null {
    const rows = (prevDivKpiRows ?? []).filter((r) => r.kpiKey === kpiKey);
    if (!rows.length) return null;
    return Math.round(rows.reduce((s, r) => s + r.achievement, 0) / rows.length);
  }

  const hasData = (summary?.byDivision?.length ?? 0) > 0;

  // Rincian pendapatan per lini bisnis (dari laporan keuangan)
  const revenueLines = summary?.revenueByLine ?? [];
  const lineNames = revenueLines.map((l) => l.name);
  const filteredLines = revenueLines.filter((l) => lineFilter === "all" || l.name === lineFilter);
  function prevLineRealisasi(name: string): number | null {
    const prev = (prevSummary?.revenueByLine ?? []).find((l) => l.name === name);
    return prev ? prev.realisasi : null;
  }

  // Lini bisnis yang dipilih untuk grafik tren (default: lini pertama)
  const effectiveLineChart = selectedLineChart && lineNames.includes(selectedLineChart)
    ? selectedLineChart
    : (lineNames[0] ?? "");

  // Data batang pendapatan per lini bisnis (untuk grafik berwarna + tabel pencapaian)
  const lineBarData = revenueLines.slice(0, 10).map((l) => ({
    name: l.name.slice(0, 16),
    revenue: l.realisasi,
    budget: l.program,
    ach: l.program > 0 ? Math.round((l.realisasi / l.program) * 100) : 0,
  }));

  return (
    <div className="space-y-6">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {editMode && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Mode Edit aktif — kartu yang dapat diedit ditandai kuning
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="secondary" className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white border-0">
            <Link to="/strategic-issues"><TriangleAlert className="size-4" /> Isu Strategis</Link>
          </Button>
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "jasa" | "manufaktur")}>
            <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="jasa">Jasa</SelectItem>
              <SelectItem value="manufaktur">Manufaktur</SelectItem>
            </SelectContent>
          </Select>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} className="cursor-pointer">
            <Upload className="size-4" /> Import CSV
          </Button>
          <PeriodSelector value={period} onChange={onPeriodChange} />
          <TabConfigEditor
            tabKey="revenue"
            defaultTabTitle="Revenue"
            kpiFields={KPI_FIELDS}
            sectionFields={SECTION_FIELDS}
            buttonIcon={Settings}
            buttonLabel="Pengaturan Finance"
            onEditModeChange={setEditMode}
          />
        </div>
      </div>

      {/* ── KPI Cards 4+4 grid ── */}
      {summary === undefined ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {KPI_META.map((m) => {
            const label       = cfg.label(m.key, m.defaultLabel);
            const rows        = rowsFor(m.key);
            const prog        = m.program(summary);
            const real        = m.realisasi(summary);
            const ach         = prog > 0 ? Math.round((real / prog) * 100) : 0;
            const prev        = prevAvgAch(m.key);
            // Realisasi periode sebelumnya dari prevSummary (financeReports bulan lalu)
            const prevReal    = prevSummary ? m.realisasi(prevSummary) : null;
            return (
              <KpiCard
                key={m.key}
                label={label}
                period={period}
                program={prog}
                realisasi={real}
                achievement={ach}
                prevRealisasi={prevReal}
                divKpiRows={rows}
                prevAvgAchievement={prev}
                icon={m.icon}
                color={m.color}
                editing={editMode}
              />
            );
          })}
        </div>
      )}

      {/* ── Grafik KPI (satu grafik, dropdown pilihan KPI) ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              {(() => {
                const kpi = KPI_META.find((m) => m.key === selectedKpiChart);
                const label = kpi ? cfg.label(kpi.key, kpi.defaultLabel) : "KPI";
                return `${label} — Program vs Realisasi`;
              })()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedKpiChart} onValueChange={setSelectedKpiChart}>
                <SelectTrigger className="w-52 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KPI_META.map((m) => (
                    <SelectItem key={m.key} value={m.key}>{cfg.label(m.key, m.defaultLabel)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(trendMonths)} onValueChange={(v) => setTrendMonths(Number(v))}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Bulan</SelectItem>
                  <SelectItem value="6">6 Bulan</SelectItem>
                  <SelectItem value="12">12 Bulan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trend === undefined ? <Skeleton className="h-52 w-full" /> : (() => {
            const kpi = KPI_META.find((m) => m.key === selectedKpiChart);
            if (!kpi) return null;
            const kpiChartData = (trend?.periods ?? []).map((p) => ({
              name: periodLabel(p.period),
              realisasi: kpi.trendRealisasi(p),
              program: kpi.trendProgram(p),
            }));
            const hasAnyData = kpiChartData.some((d) => d.realisasi > 0 || d.program > 0);
            if (!hasAnyData) {
              return <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Belum ada data tren</div>;
            }
            const chartColor = COLOR_MAP[kpi.color] ?? "#059669";
            return (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={kpiChartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v: number) => v.toLocaleString("id-ID")} tick={{ fontSize: 10 }} width={72} />
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
                  <Legend content={renderTrendLegend} />
                  <Line type="monotone" dataKey="realisasi" name="Realisasi" stroke={chartColor} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="program" name="Program" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
        </CardContent>
      </Card>

      {/* ── Bar chart divisi ── */}
      {hasData && barData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="size-4 text-violet-500" />
                {cfg.section("bar_chart", "Top Divisi")} — {activeKpi === "revenue" ? "Revenue vs Budget" : activeKpi === "grossProfit" ? "Laba Kotor" : "EBITDA"}
              </CardTitle>
              <div className="flex gap-1">
                {(["revenue", "grossProfit", "ebitda"] as const).map((k) => (
                  <Button key={k} size="sm" variant={activeKpi === k ? "default" : "secondary"}
                    className="h-7 px-2 text-xs cursor-pointer" onClick={() => setActiveKpi(k)}>
                    {k === "revenue" ? "Revenue" : k === "grossProfit" ? "Laba Kotor" : "EBITDA"}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tickFormatter={(v: number) => v.toLocaleString("id-ID")} tick={{ fontSize: 10 }} width={64} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} />
                {activeKpi === "revenue" && <>
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="budget" name="Budget" fill="#cbd5e1" radius={[3,3,0,0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </>}
                {activeKpi === "grossProfit" && <Bar dataKey="grossProfit" name="Laba Kotor" fill="#3b82f6" radius={[3,3,0,0]} />}
                {activeKpi === "ebitda" && <Bar dataKey="ebitda" name="EBITDA" fill="#8b5cf6" radius={[3,3,0,0]} />}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Kartu Pendapatan per Lini Bisnis ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-emerald-500" />
                {cfg.section("table_title", "Pendapatan per Lini Bisnis")}
              </CardTitle>
              <CardDescription>{cfg.section("table_desc", "Program vs Realisasi pendapatan per lini bisnis")}</CardDescription>
            </div>
            {lineNames.length > 0 && (
              <Select value={lineFilter} onValueChange={setLineFilter}>
                <SelectTrigger className="w-52 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lini Bisnis</SelectItem>
                  {lineNames.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {summary === undefined ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
            </div>
          ) : revenueLines.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Banknote /></EmptyMedia>
                <EmptyTitle>Belum ada rincian per lini bisnis</EmptyTitle>
                <EmptyDescription>
                  Buka <span className="font-medium">Laporan Keuangan</span> lalu isi bagian "Pendapatan per Lini Bisnis" pada form input untuk periode ini.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild size="sm" className="cursor-pointer">
                  <Link to="/laporan-keuangan"><FileSpreadsheet className="size-4" /> Buka Laporan Keuangan</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {filteredLines.map((l) => (
                <LineKpiCard
                  key={l.name}
                  name={l.name}
                  period={period}
                  program={l.program}
                  realisasi={l.realisasi}
                  prevRealisasi={prevLineRealisasi(l.name)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Grafik Pendapatan per Lini Bisnis (bar berwarna + tabel pencapaian) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="size-4 text-emerald-500" />
            Grafik Pendapatan per Lini Bisnis
          </CardTitle>
          <CardDescription>Realisasi vs Program per lini bisnis</CardDescription>
        </CardHeader>
        <CardContent>
          {summary === undefined ? (
            <Skeleton className="h-72 w-full" />
          ) : lineBarData.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Banknote /></EmptyMedia>
                <EmptyTitle>Belum ada data lini bisnis</EmptyTitle>
                <EmptyDescription>
                  Buka <span className="font-medium">Laporan Keuangan</span> lalu isi bagian "Pendapatan per Lini Bisnis" pada form input untuk periode ini.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild size="sm" className="cursor-pointer">
                  <Link to="/laporan-keuangan"><FileSpreadsheet className="size-4" /> Buka Laporan Keuangan</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Bar chart berwarna */}
              <div className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={lineBarData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tickFormatter={(v: number) => v.toLocaleString("id-ID")} tick={{ fontSize: 10 }} width={72} />
                    <Tooltip formatter={(v: number) => fmtMoney(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Realisasi" radius={[4,4,0,0]}>
                      {lineBarData.map((_, i) => <Cell key={i} fill={LINE_BAR_COLORS[i % LINE_BAR_COLORS.length]} />)}
                    </Bar>
                    <Bar dataKey="budget" name="Program" fill="#e2e8f0" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Tabel pencapaian */}
              <div className="rounded-xl border p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pencapaian</p>
                <div className="space-y-2">
                  {lineBarData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="text-[10px] w-4 tabular-nums text-muted-foreground/70">{i + 1}</span>
                      <span className="flex-1 truncate text-xs">{d.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative w-16 h-1.5 rounded-full bg-muted">
                          <div className={cn("h-full rounded-full", achBg(d.ach))} style={{ width: d.ach >= 100 ? `${Math.min(d.ach, 130) / 130 * 100}%` : `${d.ach}%` }} />
                          {d.ach > 100 && <div className="absolute top-0 bottom-0 w-px bg-foreground/50" style={{ left: `${100 / 130 * 100}%` }} />}
                        </div>
                        <span className={cn("text-xs font-bold tabular-nums w-9 text-right", achColor(d.ach))}>{d.ach}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground/70 text-right pt-2 italic">*dalam satuan ribu rupiah (×1.000)</p>
        </CardContent>
      </Card>

      {/* ── Grafik Tren Pendapatan per Lini Bisnis ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              {effectiveLineChart ? `${effectiveLineChart} — Program vs Realisasi` : "Tren Pendapatan per Lini Bisnis"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {lineNames.length > 0 && (
                <Select value={effectiveLineChart} onValueChange={setSelectedLineChart}>
                  <SelectTrigger className="w-52 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {lineNames.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={String(trendMonths)} onValueChange={(v) => setTrendMonths(Number(v))}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Bulan</SelectItem>
                  <SelectItem value="6">6 Bulan</SelectItem>
                  <SelectItem value="12">12 Bulan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trend === undefined ? <Skeleton className="h-52 w-full" /> : !effectiveLineChart ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Banknote /></EmptyMedia>
                <EmptyTitle>Belum ada rincian per lini bisnis</EmptyTitle>
                <EmptyDescription>
                  Buka <span className="font-medium">Laporan Keuangan</span> lalu isi bagian "Pendapatan per Lini Bisnis" pada form input.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild size="sm" className="cursor-pointer">
                  <Link to="/laporan-keuangan"><FileSpreadsheet className="size-4" /> Buka Laporan Keuangan</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (() => {
            const lineChartData = (trend?.periods ?? []).map((p) => {
              const found = p.revenueByLine.find((l) => l.name === effectiveLineChart);
              return {
                name: periodLabel(p.period),
                realisasi: found?.realisasi ?? 0,
                program: found?.program ?? 0,
              };
            });
            const hasAnyData = lineChartData.some((d) => d.realisasi > 0 || d.program > 0);
            if (!hasAnyData) {
              return <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Belum ada data tren untuk lini bisnis ini</div>;
            }
            return (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lineChartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v: number) => v.toLocaleString("id-ID")} tick={{ fontSize: 10 }} width={72} />
                    <Tooltip formatter={(v: number) => fmtMoney(v)} />
                    <Legend content={renderTrendLegend} />
                    <Line type="monotone" dataKey="realisasi" name="Realisasi" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="program" name="Program" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-muted-foreground/70 text-right pt-1 italic">*dalam satuan ribu rupiah (×1.000)</p>
              </>
            );
          })()}
        </CardContent>
      </Card>

    </div>
  );
}
