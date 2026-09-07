/**
 * PresentationSlides — Komponen slide khusus untuk mode Command Center.
 * Setiap slide hanya menampilkan data/angka/chart, TANPA tombol aksi.
 * Dirancang untuk layar besar, teks lebih besar, layout lega.
 */

import { useState, useMemo, createContext, useContext } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Banknote, Receipt, Percent,
  ArrowRightLeft, Wallet, FileSpreadsheet, Calendar,
  BarChart3, Factory, Users, ShieldAlert, ClipboardCheck, HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useResolvedConfig } from "./TabConfigEditor.tsx";

// ── Theme Context ─────────────────────────────────────────────────────────────

type SlideTheme = {
  isDark: boolean;
  bg: string;
  card: string;
  cardBorder: string;
  headerBorder: string;
  text: string;
  textMuted: string;
  textFaint: string;
  gridStroke: string;
  tickFill: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  trackBg: string;
  tableHeaderBg: string;
  tableRowBg: string;
  tableDivide: string;
  selectBg: string;
  selectBorder: string;
  selectText: string;
  legendText: string;
  pulseBg: string;
};

const DARK_THEME: SlideTheme = {
  isDark: true,
  bg: "bg-gray-950",
  card: "bg-gray-900",
  cardBorder: "border-gray-800",
  headerBorder: "border-gray-800",
  text: "text-white",
  textMuted: "text-gray-400",
  textFaint: "text-gray-600",
  gridStroke: "#374151",
  tickFill: "#9ca3af",
  tooltipBg: "#111827",
  tooltipBorder: "#374151",
  tooltipText: "#f9fafb",
  trackBg: "bg-gray-800",
  tableHeaderBg: "bg-gray-900",
  tableRowBg: "bg-gray-950",
  tableDivide: "divide-gray-800",
  selectBg: "bg-gray-800",
  selectBorder: "border-gray-700",
  selectText: "text-gray-200",
  legendText: "#9ca3af",
  pulseBg: "bg-gray-800",
};

const LIGHT_THEME: SlideTheme = {
  isDark: false,
  bg: "bg-slate-50",
  card: "bg-white",
  cardBorder: "border-slate-200",
  headerBorder: "border-slate-200",
  text: "text-slate-800",
  textMuted: "text-slate-500",
  textFaint: "text-slate-400",
  gridStroke: "#e2e8f0",
  tickFill: "#64748b",
  tooltipBg: "#ffffff",
  tooltipBorder: "#cbd5e1",
  tooltipText: "#1e293b",
  trackBg: "bg-slate-200",
  tableHeaderBg: "bg-slate-100",
  tableRowBg: "bg-white",
  tableDivide: "divide-slate-200",
  selectBg: "bg-white",
  selectBorder: "border-slate-300",
  selectText: "text-slate-700",
  legendText: "#64748b",
  pulseBg: "bg-slate-200",
};

const SlideThemeContext = createContext<SlideTheme>(DARK_THEME);
export function useSlideTheme() { return useContext(SlideThemeContext); }
export function SlideThemeProvider({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  return (
    <SlideThemeContext.Provider value={isDark ? DARK_THEME : LIGHT_THEME}>
      {children}
    </SlideThemeContext.Provider>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Mapping tailwind → hex for dark mode */
const COLOR_MAP: Record<string, string> = {
  "text-emerald-400": "#34d399",
  "text-rose-400":    "#fb7185",
  "text-blue-400":    "#60a5fa",
  "text-violet-400":  "#a78bfa",
  "text-teal-400":    "#2dd4bf",
  "text-cyan-400":    "#22d3ee",
  "text-orange-400":  "#fb923c",
  "text-pink-400":    "#f472b6",
};

/** Mapping tailwind → hex for light mode (darker, more contrast) */
const COLOR_MAP_LIGHT: Record<string, string> = {
  "text-emerald-400": "#059669",
  "text-rose-400":    "#e11d48",
  "text-blue-400":    "#2563eb",
  "text-violet-400":  "#7c3aed",
  "text-teal-400":    "#0d9488",
  "text-cyan-400":    "#0891b2",
  "text-orange-400":  "#ea580c",
  "text-pink-400":    "#db2777",
};

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

type KpiChartMeta = {
  key: string;
  label: string;
  color: string;
  trendRealisasi: (p: TrendPeriod) => number;
  trendProgram: (p: TrendPeriod) => number;
};

const KPI_CHART_META: KpiChartMeta[] = [
  { key: "total_revenue", label: "Total Pendapatan",         color: "text-emerald-400", trendRealisasi: (p) => p.totalRevenue, trendProgram: (p) => p.totalBudget         },
  { key: "total_cost",    label: "Total Biaya Pokok",        color: "text-rose-400",    trendRealisasi: (p) => p.totalCost,    trendProgram: (p) => p.totalCostProgram    },
  { key: "gross_profit",  label: "Laba Kotor",               color: "text-blue-400",    trendRealisasi: (p) => p.grossProfit,  trendProgram: (p) => p.grossProfitProgram  },
  { key: "ebitda",        label: "EBITDA",                   color: "text-violet-400",  trendRealisasi: (p) => p.ebitda,       trendProgram: (p) => p.ebitdaProgram       },
  { key: "net_profit",    label: "Laba Bersih",              color: "text-teal-400",    trendRealisasi: (p) => p.netProfit,    trendProgram: (p) => p.netProfitProgram    },
  { key: "cash_flow",     label: "Arus Kas",                 color: "text-cyan-400",    trendRealisasi: (p) => p.cashFlow,     trendProgram: (p) => p.cashFlowProgram     },
  { key: "ar",            label: "Hutang", color: "text-orange-400",  trendRealisasi: (p) => p.ar,           trendProgram: (p) => p.arProgram           },
  { key: "ap",            label: "Tagihan",    color: "text-pink-400",    trendRealisasi: (p) => p.ap,           trendProgram: (p) => p.apProgram           },
];

/** Custom legend — garis penuh Realisasi + putus-putus Program */
function SlideLegend() {
  const t = useSlideTheme();
  return (
    <div className="flex items-center justify-center gap-4 mt-1">
      <div className="flex items-center gap-1.5">
        <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#10b981" strokeWidth="2" /></svg>
        <span style={{ fontSize: 12, color: t.legendText }}>Realisasi</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={t.isDark ? "#6b7280" : "#94a3b8"} strokeWidth="1.5" strokeDasharray="4 2" /></svg>
        <span style={{ fontSize: 12, color: t.legendText }}>Program</span>
      </div>
    </div>
  );
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
function periodLabel(p: string) {
  const [y, m] = p.split("-");
  return `${MONTH_NAMES[(parseInt(m) - 1)] ?? m} ${y}`;
}

function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(Number(v))) return "Rp 0";
  return `Rp ${Number(v).toLocaleString("id-ID")}`;
}

/** Achievement color class — theme-aware */
function achColorClass(v: number, isDark: boolean) {
  if (v >= 100) return isDark ? "text-emerald-400" : "text-emerald-600";
  if (v >= 80) return isDark ? "text-amber-400" : "text-amber-600";
  return isDark ? "text-rose-400" : "text-rose-600";
}

function achBg(v: number) {
  if (v >= 100) return "bg-emerald-500";
  if (v >= 80) return "bg-amber-500";
  return "bg-rose-500";
}

/** KPI text color class — theme-aware (switches -400 → -600 for light) */
function kpiColorClass(tailwindClass: string, isDark: boolean) {
  if (isDark) return tailwindClass;
  return tailwindClass.replace("-400", "-600");
}

// Slide wrapper — padding lega untuk layar besar
function SlideWrapper({ children }: { children: React.ReactNode }) {
  const t = useSlideTheme();
  return (
    <div className={cn("h-full w-full overflow-auto px-6 py-4 lg:px-10 lg:py-6", t.bg)}>
      {children}
    </div>
  );
}

// Slide header
function SlideHeader({ title, subtitle, period }: { title: string; subtitle?: string; period?: string }) {
  const t = useSlideTheme();
  return (
    <div className={cn("mb-6 flex items-end justify-between border-b pb-4", t.headerBorder)}>
      <div>
        <h2 className={cn("text-2xl font-bold tracking-tight", t.text)}>{title}</h2>
        {subtitle && <p className={cn("text-sm mt-0.5", t.textMuted)}>{subtitle}</p>}
      </div>
      {period && (
        <div className={cn("flex items-center gap-1.5 text-sm", t.textMuted)}>
          <Calendar className="size-3.5" />
          <span>{periodLabel(period)}</span>
        </div>
      )}
    </div>
  );
}

// Big KPI block — untuk presentasi
function BigKpiBlock({
  label, icon: Icon, color,
  program, realisasi, prevRealisasi,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  program: number;
  realisasi: number;
  prevRealisasi: number | null;
}) {
  const t = useSlideTheme();
  const isEmpty = program === 0 && realisasi === 0;
  const ach = !isEmpty && program > 0 ? Math.round((realisasi / program) * 100) : 0;
  const diff = !isEmpty && prevRealisasi !== null ? realisasi - prevRealisasi : null;

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-5", t.cardBorder, t.card)}>
      {/* Label + icon */}
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", kpiColorClass(color, t.isDark))} />
        <span className={cn("text-xs font-semibold uppercase tracking-widest", t.textMuted)}>{label}</span>
      </div>

      {/* Realisasi — angka besar */}
      <div className="flex items-end gap-3">
        <p className={cn("text-3xl font-extrabold tabular-nums leading-none", isEmpty ? t.textFaint : t.text)}>
          {isEmpty ? "—" : fmtMoney(realisasi)}
        </p>
        {diff !== null && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-bold mb-0.5",
            diff > 0
              ? (t.isDark ? "text-emerald-400" : "text-emerald-600")
              : diff < 0
                ? (t.isDark ? "text-rose-400" : "text-rose-600")
                : t.textMuted
          )}>
            {diff > 0 ? <TrendingUp className="size-3.5" /> : diff < 0 ? <TrendingDown className="size-3.5" /> : <Minus className="size-3.5" />}
            {fmtMoney(Math.abs(diff))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={cn("h-px", t.trackBg)} />

      {/* Program vs Achievement */}
      {isEmpty ? (
        <p className={cn("text-xs", t.textFaint)}>Belum ada data</p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={t.textMuted}>Program: <span className={cn("font-semibold", t.text)}>{fmtMoney(program)}</span></span>
            <span className={cn("font-extrabold text-sm", achColorClass(ach, t.isDark))}>{ach}%</span>
          </div>
          {/* Progress bar dengan marker 100% */}
          <div className={cn("relative h-2 w-full rounded-full", t.trackBg)}>
            <div
              className={cn("h-full rounded-full transition-all", achBg(ach))}
              style={{ width: ach >= 100 ? `${Math.min(ach, 130) / 130 * 100}%` : `${ach}%` }}
            />
            {/* Garis marker 100% — hanya tampil jika melebihi target */}
            {ach > 100 && (
              <div
                className={cn("absolute top-0 bottom-0 w-0.5 rounded-full", t.isDark ? "bg-white/70" : "bg-slate-800/70")}
                style={{ left: `${100 / 130 * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Satuan */}
      {!isEmpty && <p className={cn("text-[10px] italic", t.textFaint)}>*dalam satuan ribu rupiah (×1.000)</p>}
    </div>
  );
}

// ── SLIDE: Finance KPI Cards ─────────────────────────────────────────────────

export function SlideFinanceKpi({ period }: { period: string }) {
  const t = useSlideTheme();
  const { isAuthenticated } = useConvexAuth();
  const [py, pm] = period.split("-").map(Number);
  const prevDate = new Date(py, pm - 2, 1);
  const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const summary = useQuery(api.bodExtended.getRevenueSummary, isAuthenticated ? { period } : "skip");
  const prev    = useQuery(api.bodExtended.getRevenueSummary, isAuthenticated ? { period: prevPeriod } : "skip");
  const cfg     = useResolvedConfig("revenue");

  if (summary === undefined) {
    return (
      <SlideWrapper>
        <SlideHeader title="Kinerja Keuangan" period={period} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length: 8}).map((_,i) => <div key={i} className={cn("h-40 rounded-xl animate-pulse", t.pulseBg)} />)}
        </div>
      </SlideWrapper>
    );
  }

  const KPIs = [
    { key: "total_revenue", defaultLabel: "Total Pendapatan",         icon: Banknote,        color: "text-emerald-400", prog: summary.totalBudget,        real: summary.totalRevenue,     prevReal: prev?.totalRevenue ?? null },
    { key: "total_cost",    defaultLabel: "Total Biaya Pokok",        icon: Receipt,         color: "text-rose-400",    prog: summary.totalCostProgram,   real: summary.totalCost,        prevReal: prev?.totalCost ?? null },
    { key: "gross_profit",  defaultLabel: "Laba Kotor",               icon: TrendingUp,      color: "text-blue-400",    prog: summary.grossProfitProgram, real: summary.totalGrossProfit, prevReal: prev?.totalGrossProfit ?? null },
    { key: "ebitda",        defaultLabel: "EBITDA",                   icon: Percent,         color: "text-violet-400",  prog: summary.ebitdaProgram,      real: summary.totalEbitda,      prevReal: prev?.totalEbitda ?? null },
    { key: "net_profit",    defaultLabel: "Laba Bersih",              icon: Wallet,          color: "text-teal-400",    prog: summary.netProfitProgram,   real: summary.totalNetProfit,   prevReal: prev?.totalNetProfit ?? null },
    { key: "cash_flow",     defaultLabel: "Arus Kas",                 icon: ArrowRightLeft,  color: "text-cyan-400",    prog: summary.cashFlowProgram,    real: summary.totalCashFlow,    prevReal: prev?.totalCashFlow ?? null },
    { key: "ar",            defaultLabel: "Hutang", icon: FileSpreadsheet, color: "text-orange-400",  prog: summary.arProgram,          real: summary.totalAr,          prevReal: prev?.totalAr ?? null },
    { key: "ap",            defaultLabel: "Tagihan",    icon: FileSpreadsheet, color: "text-pink-400",    prog: summary.apProgram,          real: summary.totalAp,          prevReal: prev?.totalAp ?? null },
  ];

  return (
    <SlideWrapper>
      <SlideHeader title="Kinerja Keuangan" subtitle="Program vs Realisasi per KPI" period={period} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIs.map((k) => (
          <BigKpiBlock key={k.key} label={cfg.label(k.key, k.defaultLabel)} icon={k.icon} color={k.color}
            program={k.prog} realisasi={k.real} prevRealisasi={k.prevReal} />
        ))}
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE: Finance Trend Chart ───────────────────────────────────────────────

export function SlideFinanceTrend() {
  const t = useSlideTheme();
  const { isAuthenticated } = useConvexAuth();
  const [selectedKpi, setSelectedKpi] = useState("total_revenue");
  const [trendMonths, setTrendMonths] = useState(6);
  const trend = useQuery(api.bodExtended.getRevenueTrend, isAuthenticated ? { months: trendMonths } : "skip");
  const cfg = useResolvedConfig("revenue");

  const kpi = KPI_CHART_META.find((m) => m.key === selectedKpi) ?? KPI_CHART_META[0];
  const kpiLabel = cfg.label(kpi.key, kpi.label);
  const colorMap = t.isDark ? COLOR_MAP : COLOR_MAP_LIGHT;
  const chartColor = colorMap[kpi.color] ?? "#059669";

  const trendData = (trend?.periods ?? []).map((p) => ({
    name: periodLabel(p.period),
    realisasi: kpi.trendRealisasi(p),
    program: kpi.trendProgram(p),
  }));
  const hasData = trendData.some((d) => d.realisasi > 0 || d.program > 0);

  return (
    <SlideWrapper>
      <div className={cn("rounded-xl border p-6 h-full flex flex-col", t.cardBorder, t.card)}>
        {/* Header */}
        <div className={cn("flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b", t.headerBorder)}>
          <div className="flex items-center gap-2">
            <TrendingUp className={cn("size-4 shrink-0", kpiColorClass(kpi.color, t.isDark))} />
            <span className={cn("text-sm font-semibold", t.text)}>
              {kpiLabel} — Program vs Realisasi
            </span>
          </div>
          {/* Dua dropdown: pilih KPI + rentang bulan */}
          <div className="flex items-center gap-2">
            <select
              value={selectedKpi}
              onChange={(e) => setSelectedKpi(e.target.value)}
              className={cn("rounded-md border text-xs px-3 py-1.5 h-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400", t.selectBorder, t.selectBg, t.selectText)}
            >
              {KPI_CHART_META.map((m) => (
                <option key={m.key} value={m.key}>{cfg.label(m.key, m.label)}</option>
              ))}
            </select>
            <select
              value={String(trendMonths)}
              onChange={(e) => setTrendMonths(Number(e.target.value))}
              className={cn("rounded-md border text-xs px-3 py-1.5 h-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400", t.selectBorder, t.selectBg, t.selectText)}
            >
              <option value="3">3 Bulan</option>
              <option value="6">6 Bulan</option>
              <option value="12">12 Bulan</option>
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          {trend === undefined ? (
            <div className={cn("h-72 animate-pulse rounded-lg", t.pulseBg)} />
          ) : !hasData ? (
            <div className={cn("flex h-72 items-center justify-center", t.textMuted)}>Belum ada data tren</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
                <XAxis dataKey="name" tick={{ fill: t.tickFill, fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => v.toLocaleString("id-ID")} tick={{ fill: t.tickFill, fontSize: 11 }} width={80} />
                <Tooltip
                  formatter={(v: number) => fmtMoney(v)}
                  contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, color: t.tooltipText }}
                />
                <Legend content={() => <SlideLegend />} />
                <Line type="monotone" dataKey="realisasi" name="Realisasi" stroke={chartColor} strokeWidth={3} dot={{ r: 5, fill: chartColor }} />
                <Line type="monotone" dataKey="program" name="Program" stroke={t.isDark ? "#6b7280" : "#94a3b8"} strokeWidth={2} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE: Finance per Lini Bisnis ───────────────────────────────────────────

const BAR_COLORS = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ec4899","#06b6d4","#f97316","#84cc16","#a78bfa","#fb923c"];

export function SlideFinanceDivisi({ period }: { period: string }) {
  const t = useSlideTheme();
  const { isAuthenticated } = useConvexAuth();
  const summary = useQuery(api.bodExtended.getRevenueSummary, isAuthenticated ? { period } : "skip");

  const lines = summary?.revenueByLine ?? [];
  const cardData = lines.map((l) => ({
    name: l.name,
    program: l.program,
    realisasi: l.realisasi,
    ach: l.program > 0 ? Math.round((l.realisasi / l.program) * 100) : 0,
  }));
  const barData = lines.slice(0, 10).map((l) => ({
    name: l.name.slice(0, 16),
    revenue: l.realisasi,
    budget: l.program,
    ach: l.program > 0 ? Math.round((l.realisasi / l.program) * 100) : 0,
  }));

  return (
    <SlideWrapper>
      <SlideHeader title="Pendapatan per Lini Bisnis" subtitle="Realisasi vs Program per lini bisnis" period={period} />
      {summary === undefined ? (
        <div className={cn("h-72 animate-pulse rounded-xl", t.pulseBg)} />
      ) : barData.length === 0 ? (
        <div className={cn("flex h-72 items-center justify-center", t.textMuted)}>Belum ada data lini bisnis</div>
      ) : (
        <div className="space-y-6">
          {/* Kartu per lini bisnis (seperti tampilan normal) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cardData.map((c, i) => {
              const isEmpty = c.program === 0 && c.realisasi === 0;
              return (
                <div key={c.name} className={cn("rounded-xl border overflow-hidden", t.cardBorder, t.card)}>
                  <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                    <p className={cn("text-xs font-semibold truncate", t.text)}>{c.name}</p>
                  </div>
                  <div className={cn("mx-3 mb-3 rounded-md border overflow-hidden", t.cardBorder)}>
                    <div className={cn("grid grid-cols-3", t.tableHeaderBg)}>
                      <p className={cn("text-[9px] font-semibold text-center py-1.5 uppercase tracking-wide", t.textMuted)}>Program</p>
                      <p className={cn("text-[9px] font-semibold text-center py-1.5 uppercase tracking-wide", t.textMuted)}>Realisasi</p>
                      <p className={cn("text-[9px] font-semibold text-center py-1.5 uppercase tracking-wide", t.textMuted)}>Acvt</p>
                    </div>
                    <div className={cn("grid grid-cols-3", t.tableRowBg)}>
                      <div className="flex items-center justify-center py-2 px-1">
                        <p className={cn("text-[10px] font-bold leading-none tabular-nums", t.text)}>
                          {isEmpty ? <span className={t.textMuted}>—</span> : (c.program ?? 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="flex items-center justify-center py-2 px-1">
                        <p className={cn("text-[10px] font-bold leading-none tabular-nums", isEmpty ? t.textMuted : (t.isDark ? "text-emerald-400" : "text-emerald-600"))}>
                          {isEmpty ? "—" : (c.realisasi ?? 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center py-2 px-1 gap-1">
                        {isEmpty ? (
                          <p className={cn("text-[10px] leading-none", t.textMuted)}>—</p>
                        ) : (
                          <>
                            <p className={cn("text-[11px] font-extrabold leading-none tabular-nums", achColorClass(c.ach, t.isDark))}>{c.ach}%</p>
                            <div className={cn("w-full h-1 rounded-full overflow-hidden", t.trackBg)}>
                              <div className={cn("h-full rounded-full", achBg(c.ach))} style={{ width: `${Math.min(c.ach, 100)}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Bar chart */}
            <div className={cn("lg:col-span-2 rounded-xl border p-6", t.cardBorder, t.card)}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
                  <XAxis dataKey="name" tick={{ fill: t.tickFill, fontSize: 10 }} interval={0} />
                  <YAxis tickFormatter={(v: number) => v.toLocaleString("id-ID")} tick={{ fill: t.tickFill, fontSize: 10 }} width={72} />
                  <Tooltip
                    formatter={(v: number) => fmtMoney(v)}
                    contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, color: t.tooltipText }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: t.legendText }} />
                  <Bar dataKey="revenue" name="Realisasi" radius={[4,4,0,0]}>
                    {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                  <Bar dataKey="budget" name="Program" fill={t.isDark ? "#374151" : "#e2e8f0"} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Achievement table */}
            <div className={cn("rounded-xl border p-5", t.cardBorder, t.card)}>
              <p className={cn("mb-3 text-xs font-semibold uppercase tracking-widest", t.textMuted)}>Pencapaian</p>
              <div className="space-y-2">
                {barData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className={cn("text-[10px] w-4 tabular-nums", t.textFaint)}>{i + 1}</span>
                    <span className={cn("flex-1 truncate text-xs", t.text)}>{d.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className={cn("relative w-16 h-1.5 rounded-full", t.trackBg)}>
                        <div className={cn("h-full rounded-full", achBg(d.ach))} style={{ width: d.ach >= 100 ? `${Math.min(d.ach, 130) / 130 * 100}%` : `${d.ach}%` }} />
                        {d.ach > 100 && <div className={cn("absolute top-0 bottom-0 w-px", t.isDark ? "bg-white/60" : "bg-slate-800/60")} style={{ left: `${100 / 130 * 100}%` }} />}
                      </div>
                      <span className={cn("text-xs font-bold tabular-nums w-8 text-right", achColorClass(d.ach, t.isDark))}>{d.ach}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </SlideWrapper>
  );
}

// ── SLIDE: Finance Trend per Lini Bisnis ─────────────────────────────────────

export function SlideFinanceLineTrend() {
  const t = useSlideTheme();
  const { isAuthenticated } = useConvexAuth();
  const [selectedLine, setSelectedLine] = useState("");
  const [trendMonths, setTrendMonths] = useState(6);
  const trend = useQuery(api.bodExtended.getRevenueTrend, isAuthenticated ? { months: trendMonths } : "skip");

  // Nama lini bisnis dari periode terakhir yang punya data
  const lineNames = useMemo(() => {
    const periods = trend?.periods ?? [];
    for (let i = periods.length - 1; i >= 0; i--) {
      if (periods[i].revenueByLine.length > 0) return periods[i].revenueByLine.map((l) => l.name);
    }
    return [];
  }, [trend]);

  const effectiveLine = selectedLine && lineNames.includes(selectedLine) ? selectedLine : (lineNames[0] ?? "");

  const trendData = (trend?.periods ?? []).map((p) => {
    const found = p.revenueByLine.find((l) => l.name === effectiveLine);
    return {
      name: periodLabel(p.period),
      realisasi: found?.realisasi ?? 0,
      program: found?.program ?? 0,
    };
  });
  const hasData = trendData.some((d) => d.realisasi > 0 || d.program > 0);
  const chartColor = t.isDark ? "#34d399" : "#059669";

  return (
    <SlideWrapper>
      <div className={cn("rounded-xl border p-6 h-full flex flex-col", t.cardBorder, t.card)}>
        {/* Header */}
        <div className={cn("flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b", t.headerBorder)}>
          <div className="flex items-center gap-2">
            <TrendingUp className={cn("size-4 shrink-0", t.isDark ? "text-emerald-400" : "text-emerald-600")} />
            <span className={cn("text-sm font-semibold", t.text)}>
              {effectiveLine ? `${effectiveLine} — Program vs Realisasi` : "Tren Pendapatan per Lini Bisnis"}
            </span>
          </div>
          {/* Dua dropdown: pilih lini bisnis + rentang bulan */}
          <div className="flex items-center gap-2">
            {lineNames.length > 0 && (
              <select
                value={effectiveLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className={cn("rounded-md border text-xs px-3 py-1.5 h-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400", t.selectBorder, t.selectBg, t.selectText)}
              >
                {lineNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
            <select
              value={String(trendMonths)}
              onChange={(e) => setTrendMonths(Number(e.target.value))}
              className={cn("rounded-md border text-xs px-3 py-1.5 h-7 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400", t.selectBorder, t.selectBg, t.selectText)}
            >
              <option value="3">3 Bulan</option>
              <option value="6">6 Bulan</option>
              <option value="12">12 Bulan</option>
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          {trend === undefined ? (
            <div className={cn("h-72 animate-pulse rounded-lg", t.pulseBg)} />
          ) : !hasData ? (
            <div className={cn("flex h-72 items-center justify-center", t.textMuted)}>Belum ada data tren untuk lini bisnis ini</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
                <XAxis dataKey="name" tick={{ fill: t.tickFill, fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => v.toLocaleString("id-ID")} tick={{ fill: t.tickFill, fontSize: 11 }} width={80} />
                <Tooltip
                  formatter={(v: number) => fmtMoney(v)}
                  contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, color: t.tooltipText }}
                />
                <Legend content={() => <SlideLegend />} />
                <Line type="monotone" dataKey="realisasi" name="Realisasi" stroke={chartColor} strokeWidth={3} dot={{ r: 5, fill: chartColor }} />
                <Line type="monotone" dataKey="program" name="Program" stroke={t.isDark ? "#6b7280" : "#94a3b8"} strokeWidth={2} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE: Executive Summary (ringkasan KPI lintas tab) ──────────────────────
type SlideRag = "green" | "amber" | "red";

const RAG_DARK: Record<SlideRag, { border: string; bg: string; dot: string; label: string; text: string }> = {
  green: { border: "border-emerald-800", bg: "bg-emerald-950/20", dot: "bg-emerald-500", label: "Baik",      text: "text-emerald-400" },
  amber: { border: "border-amber-800",   bg: "bg-amber-950/20",   dot: "bg-amber-500",   label: "Perhatian", text: "text-amber-400"   },
  red:   { border: "border-rose-800",    bg: "bg-rose-950/20",    dot: "bg-rose-500",    label: "Waspada",   text: "text-rose-400"    },
};

const RAG_LIGHT: Record<SlideRag, { border: string; bg: string; dot: string; label: string; text: string }> = {
  green: { border: "border-emerald-300", bg: "bg-emerald-50",  dot: "bg-emerald-500", label: "Baik",      text: "text-emerald-700" },
  amber: { border: "border-amber-300",   bg: "bg-amber-50",    dot: "bg-amber-500",   label: "Perhatian", text: "text-amber-700"   },
  red:   { border: "border-rose-300",    bg: "bg-rose-50",     dot: "bg-rose-500",    label: "Waspada",   text: "text-rose-700"    },
};

export function SlideExecSummary({ period }: { period: string }) {
  const t = useSlideTheme();
  const RAG = t.isDark ? RAG_DARK : RAG_LIGHT;

  const { isAuthenticated } = useConvexAuth();
  const revData   = useQuery(api.bodExtended.getRevenueSummary,    isAuthenticated ? { period } : "skip");
  const prodData  = useQuery(api.bodExtended.getProductionSummary, isAuthenticated ? { period } : "skip");
  const hrData    = useQuery(api.bodExtended.getHrSummary,         isAuthenticated ? { period } : "skip");
  const riskData  = useQuery(api.bodExtended.getRiskSummary,       isAuthenticated ? { period } : "skip");
  const auditData = useQuery(api.bodExtended.getAuditSummary,      isAuthenticated ? { period } : "skip");
  const hseData   = useQuery(api.bodExtended.getHseSummary,        isAuthenticated ? { period } : "skip");
  const cfg       = useResolvedConfig("revenue");

  // ---- RAG per domain -------------------
  const ragMap: Partial<Record<"revenue" | "production" | "hr" | "risk" | "audit" | "hse", SlideRag>> = {};
  if (revData) {
    ragMap.revenue = revData.achievement < 80 || revData.ebitdaMargin < 10 ? "red"
      : revData.achievement < 95 || revData.ebitdaMargin < 15 ? "amber" : "green";
  }
  if (prodData) {
    const delayedPct = prodData.activeProjects > 0 ? (prodData.delayedProjects / prodData.activeProjects) * 100 : 0;
    ragMap.production = prodData.otdRate < 75 || delayedPct > 15 ? "red"
      : prodData.otdRate < 90 || delayedPct > 5 ? "amber" : "green";
  }
  if (hrData) {
    ragMap.hr = hrData.attendanceRate < 88 || hrData.turnoverRate > 6 ? "red"
      : hrData.attendanceRate < 95 || hrData.turnoverRate > 3 ? "amber" : "green";
  }
  if (riskData) {
    ragMap.risk = riskData.critical > 0 ? "red"
      : riskData.high > 0 || riskData.openRisks > 5 ? "amber" : "green";
  }
  if (auditData) {
    const rate = auditData.total > 0 ? (auditData.closed / auditData.total) * 100 : 100;
    ragMap.audit = rate < 50 || auditData.critical > 0 || auditData.overdue > 3 ? "red"
      : rate < 80 || auditData.overdue > 0 ? "amber" : "green";
  }
  if (hseData) {
    ragMap.hse = hseData.fatality > 0 || hseData.lostTime > 0 ? "red"
      : hseData.totalIncidents > 2 ? "amber" : "green";
  }

  const ragValues = Object.values(ragMap);
  const greens = ragValues.filter((v) => v === "green").length;
  const ambers = ragValues.filter((v) => v === "amber").length;
  const reds   = ragValues.filter((v) => v === "red").length;
  const total  = ragValues.length;
  const overall: SlideRag = reds > 0 ? "red" : ambers > 1 ? "amber" : "green";
  const overallLabel = overall === "red" ? "Butuh Perhatian Segera" : overall === "amber" ? "Perlu Perhatian" : "Organisasi Sehat";

  // ---- finance KPI cards -----------------------------------------------------
  const financeKpis = revData ? [
    { key: "total_revenue", defaultLabel: "Total Pendapatan",         color: "text-emerald-400", prog: revData.totalBudget,        real: revData.totalRevenue     },
    { key: "total_cost",    defaultLabel: "Total Biaya Pokok",        color: "text-rose-400",    prog: revData.totalCostProgram,   real: revData.totalCost        },
    { key: "gross_profit",  defaultLabel: "Laba Kotor",               color: "text-blue-400",    prog: revData.grossProfitProgram, real: revData.totalGrossProfit },
    { key: "ebitda",        defaultLabel: "EBITDA",                   color: "text-violet-400",  prog: revData.ebitdaProgram,      real: revData.totalEbitda      },
    { key: "net_profit",    defaultLabel: "Laba Bersih",              color: "text-teal-400",    prog: revData.netProfitProgram,   real: revData.totalNetProfit   },
    { key: "cash_flow",     defaultLabel: "Arus Kas",                 color: "text-cyan-400",    prog: revData.cashFlowProgram,    real: revData.totalCashFlow    },
    { key: "ar",            defaultLabel: "Hutang", color: "text-orange-400",  prog: revData.arProgram,          real: revData.totalAr          },
    { key: "ap",            defaultLabel: "Tagihan",    color: "text-pink-400",    prog: revData.apProgram,          real: revData.totalAp          },
  ] : [];

  // ---- domain cards (5 lainnya) ---------------------------------------------
  type DomainMetric = { label: string; value: string };
  const domainCards: Array<{ key: string; icon: React.ElementType; title: string; rag: SlideRag | undefined; metrics: DomainMetric[]; alerts: string[] }> = [
    {
      key: "production", icon: Factory, title: "Operasional", rag: ragMap.production,
      metrics: prodData ? [
        { label: "OTD Rate", value: `${prodData.otdRate}%` },
        { label: "Proyek Aktif", value: String(prodData.activeProjects) },
        { label: "Kapasitas", value: `${prodData.avgCapacityUtilization}%` },
        { label: "Terlambat", value: String(prodData.delayedProjects) },
      ] : [],
      alerts: prodData && prodData.delayedProjects > 0 ? [`${prodData.delayedProjects} proyek terlambat`] : [],
    },
    {
      key: "hr", icon: Users, title: "SDM", rag: ragMap.hr,
      metrics: hrData ? [
        { label: "Karyawan", value: String(hrData.totalHeadcount) },
        { label: "Kehadiran", value: `${hrData.attendanceRate}%` },
        { label: "Produktivitas", value: `${hrData.productivityScore}%` },
        { label: "Turnover", value: `${hrData.turnoverRate}%` },
      ] : [],
      alerts: hrData && hrData.turnoverRate > 6 ? [`Turnover ${hrData.turnoverRate}% — tinggi`] : [],
    },
    {
      key: "risk", icon: ShieldAlert, title: "Risk", rag: ragMap.risk,
      metrics: riskData ? [
        { label: "Total Risiko", value: String(riskData.totalRisks) },
        { label: "Kritis", value: String(riskData.critical) },
        { label: "Tinggi", value: String(riskData.high) },
        { label: "Terbuka", value: String(riskData.openRisks) },
      ] : [],
      alerts: riskData && riskData.critical > 0 ? [`${riskData.critical} risiko kritis terbuka`] : [],
    },
    {
      key: "audit", icon: ClipboardCheck, title: "Audit", rag: ragMap.audit,
      metrics: auditData ? [
        { label: "Total Temuan", value: String(auditData.total) },
        { label: "Closure", value: auditData.total > 0 ? `${Math.round((auditData.closed / auditData.total) * 100)}%` : "N/A" },
        { label: "Terlambat", value: String(auditData.overdue) },
        { label: "Kritis+Mayor", value: String(auditData.critical + auditData.major) },
      ] : [],
      alerts: auditData && auditData.overdue > 0 ? [`${auditData.overdue} temuan melewati due date`] : [],
    },
    {
      key: "hse", icon: HardHat, title: "HSE", rag: ragMap.hse,
      metrics: hseData ? [
        { label: "Total Insiden", value: String(hseData.totalIncidents) },
        { label: "Fatality", value: String(hseData.fatality) },
        { label: "Lost Time", value: String(hseData.lostTime) },
        { label: "Near Miss", value: String(hseData.nearMiss) },
      ] : [],
      alerts: [
        ...(hseData && hseData.fatality > 0 ? [`FATALITY: ${hseData.fatality} korban jiwa`] : []),
        ...(hseData && hseData.lostTime > 0 ? [`${hseData.lostTime} LTI — ${hseData.totalLostDays} hari hilang`] : []),
      ],
    },
  ];

  // ---- escalations -----------------------------------------------------------
  const escalations: Array<{ domain: string; message: string }> = [];
  if (hseData && hseData.fatality > 0) escalations.push({ domain: "HSE", message: `${hseData.fatality} Fatality tercatat — eskalasi segera ke Direksi` });
  if (hseData && hseData.lostTime > 0) escalations.push({ domain: "HSE", message: `${hseData.lostTime} Lost Time Injury — ${hseData.totalLostDays} hari kerja hilang` });
  if (riskData && riskData.critical > 0) escalations.push({ domain: "Risk", message: `${riskData.critical} risiko KRITIS masih terbuka` });
  if (auditData && auditData.overdue > 0) escalations.push({ domain: "Audit", message: `${auditData.overdue} temuan audit melewati due date` });
  if (revData && revData.achievement < 80) escalations.push({ domain: cfg.config.tabTitle ?? "Keuangan", message: `Pencapaian revenue ${revData.achievement}% — di bawah threshold 80%` });
  if (prodData && prodData.otdRate < 75) escalations.push({ domain: "Operasional", message: `OTD hanya ${prodData.otdRate}% — di bawah standar 75%` });
  if (hrData && hrData.turnoverRate > 6) escalations.push({ domain: "SDM", message: `Turnover rate ${hrData.turnoverRate}% — di atas batas aman 6%` });

  // ---- KPI summary table rows -----------------------------------------------
  const tableRows: Array<{ domain: string; kpi: string; value: string; rag: SlideRag | undefined }> = [
    ...financeKpis.map((k) => {
      const ach = k.prog > 0 ? Math.round((k.real / k.prog) * 100) : 0;
      const empty = k.prog === 0 && k.real === 0;
      const rag: SlideRag = ach >= 100 ? "green" : ach >= 80 ? "amber" : "red";
      return { domain: cfg.config.tabTitle ?? "Keuangan", kpi: cfg.label(k.key, k.defaultLabel), value: empty ? "—" : `${ach}%`, rag: empty ? undefined : rag };
    }),
    { domain: "Operasional", kpi: "On-Time Delivery (OTD)", value: prodData ? `${prodData.otdRate}%` : "—", rag: ragMap.production },
    { domain: "SDM", kpi: "Tingkat Kehadiran", value: hrData ? `${hrData.attendanceRate}%` : "—", rag: ragMap.hr },
    { domain: "Risk", kpi: "Risiko Kritis Terbuka", value: riskData ? String(riskData.critical) : "—", rag: ragMap.risk },
    { domain: "Audit", kpi: "Closure Rate", value: auditData && auditData.total > 0 ? `${Math.round((auditData.closed / auditData.total) * 100)}%` : "N/A", rag: ragMap.audit },
    { domain: "HSE", kpi: "Total Insiden", value: hseData ? String(hseData.totalIncidents) : "—", rag: ragMap.hse },
  ];

  // ---- render ----------------------------------------------------------------
  // Mobile: overflow-auto (scroll), Desktop: overflow-hidden (no scroll, full-fit)
  const financeCardCls = t.isDark
    ? "rounded border border-gray-800 bg-gray-950 px-2 py-1.5 space-y-0.5"
    : "rounded border border-slate-200 bg-white px-2 py-1.5 space-y-0.5";
  const metricCls = t.isDark
    ? "rounded border border-gray-800 bg-gray-950 px-2 py-1"
    : "rounded border border-slate-200 bg-white px-2 py-1";
  return (
    <div className={cn("h-full w-full overflow-y-auto lg:overflow-hidden flex flex-col gap-2 px-3 py-3 sm:px-5 lg:px-8 lg:py-4", t.bg)}>

      {/* ── Row 1: Header + Status bar ── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* title */}
        <div className={cn("border-l-4 border-blue-500 pl-3")}>
          <p className={cn("text-[10px] font-medium uppercase tracking-widest", t.textMuted)}>Dashboard Direksi · Ringkasan Eksekutif</p>
          <p className={cn("text-base font-bold leading-tight", t.text)}>Snapshot KPI — {periodLabel(period)}</p>
        </div>
        {/* overall status pill */}
        {total > 0 && (
          <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-1.5 self-start sm:self-auto", RAG[overall].border, RAG[overall].bg)}>
            <span className={cn("size-2.5 shrink-0 animate-pulse rounded-full", RAG[overall].dot)} />
            <div>
              <p className={cn("text-[9px] font-medium uppercase tracking-widest leading-none", t.textMuted)}>Status Organisasi</p>
              <p className={cn("text-xs font-bold leading-tight", t.text)}>{overallLabel}</p>
            </div>
            <div className={cn("h-6 w-px mx-1", t.isDark ? "bg-gray-700" : "bg-slate-200")} />
            <div className="flex items-center gap-2 text-xs">
              {[{ c: "bg-emerald-500", n: greens, l: "baik" }, { c: "bg-amber-500", n: ambers, l: "perhatian" }, { c: "bg-rose-500", n: reds, l: "waspada" }].map((s) => (
                <div key={s.l} className="flex items-center gap-1">
                  <span className={cn("size-2 rounded-full", s.c)} />
                  <span className={cn("font-bold tabular-nums text-xs", t.text)}>{s.n}</span>
                  <span className={cn("text-[10px]", t.textMuted)}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Row 2: Escalations (hanya muncul jika ada) ── */}
      {escalations.length > 0 && (
        <div className={cn("shrink-0 rounded-lg border px-3 py-1.5", t.isDark ? "border-rose-800 bg-rose-950/20" : "border-rose-300 bg-rose-50")}>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-x-4 gap-y-1">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider shrink-0", t.isDark ? "text-rose-400" : "text-rose-600")}>
              ⚠ Eskalasi Kritis ({escalations.length})
            </span>
            {escalations.map((e, i) => (
              <span key={i} className={cn("text-[11px]", t.isDark ? "text-rose-300" : "text-rose-700")}>
                <span className="font-semibold">[{e.domain}]</span> {e.message}
                {i < escalations.length - 1 && <span className={cn("mx-2 hidden sm:inline", t.isDark ? "text-rose-800" : "text-rose-300")}>·</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 3: Finance KPI grid — 2 kolom mobile, 4 sm, 8 lg ── */}
      <div className={cn("shrink-0 rounded-lg border", (ragMap.revenue ? RAG[ragMap.revenue] : RAG.green).border, (ragMap.revenue ? RAG[ragMap.revenue] : RAG.green).bg)}>
        {/* subheader */}
        <div className={cn("flex items-center justify-between px-3 py-1.5 border-b", t.isDark ? "border-gray-800/60" : "border-slate-200/60")}>
          <div className="flex items-center gap-1.5">
            <BarChart3 className={cn("size-3.5", t.isDark ? "text-emerald-400" : "text-emerald-600")} />
            <span className={cn("text-xs font-semibold", t.text)}>{cfg.config.tabTitle ?? "Keuangan"}</span>
          </div>
          {ragMap.revenue && (
            <div className="flex items-center gap-1">
              <span className={cn("size-2 rounded-full", RAG[ragMap.revenue].dot)} />
              <span className={cn("text-[10px] font-semibold", RAG[ragMap.revenue].text)}>{RAG[ragMap.revenue].label}</span>
            </div>
          )}
        </div>
        {/* 8 KPI grid */}
        {revData === undefined ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 p-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className={cn("h-14 animate-pulse rounded", t.pulseBg)} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 p-2">
            {financeKpis.map((kpi) => {
              const ach = kpi.prog > 0 ? Math.round((kpi.real / kpi.prog) * 100) : 0;
              const empty = kpi.prog === 0 && kpi.real === 0;
              return (
                <div key={kpi.key} className={financeCardCls}>
                  <p className={cn("truncate text-[9px] font-semibold leading-tight", kpiColorClass(kpi.color, t.isDark))}>{cfg.label(kpi.key, kpi.defaultLabel)}</p>
                  {empty ? (
                    <p className={cn("text-xs", t.textFaint)}>—</p>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-0.5">
                        <p className={cn("text-xs font-bold tabular-nums truncate", kpiColorClass(kpi.color, t.isDark))}>{fmtMoney(kpi.real)}</p>
                        <span className={cn("text-[9px] font-bold shrink-0", achColorClass(ach, t.isDark))}>{ach}%</span>
                      </div>
                      <div className={cn("relative h-1 w-full overflow-hidden rounded-full", t.trackBg)}>
                        <div className={cn("h-full rounded-full", achBg(ach))}
                          style={{ width: ach >= 100 ? `${Math.min(ach, 130) / 130 * 100}%` : `${ach}%` }} />
                        {ach > 100 && <div className={cn("absolute top-0 bottom-0 w-px", t.isDark ? "bg-white/70" : "bg-slate-800/70")} style={{ left: `${100 / 130 * 100}%` }} />}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Row 4: Domain cards — 1 kolom mobile, 2-3 sm, 5 lg ── */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {domainCards.map((d) => {
          const style = d.rag ? RAG[d.rag] : RAG.green;
          return (
            <div key={d.key} className={cn("rounded-lg border", style.border, style.bg)}>
              {/* header */}
              <div className={cn("flex items-center justify-between px-2 py-1 border-b", t.isDark ? "border-gray-800/60" : "border-slate-200/60")}>
                <div className="flex items-center gap-1">
                  <d.icon className={cn("size-3 shrink-0", t.textMuted)} />
                  <span className={cn("text-[11px] font-semibold", t.text)}>{d.title}</span>
                </div>
                {d.rag && (
                  <div className="flex items-center gap-1">
                    <span className={cn("size-1.5 rounded-full", style.dot)} />
                    <span className={cn("text-[9px] font-bold", style.text)}>{style.label}</span>
                  </div>
                )}
              </div>
              {/* 2×2 metrics */}
              <div className="grid grid-cols-2 gap-1 p-1.5">
                {d.metrics.map((m) => (
                  <div key={m.label} className={metricCls}>
                    <p className={cn("text-[8px] leading-none truncate", t.textMuted)}>{m.label}</p>
                    <p className={cn("text-xs font-bold tabular-nums leading-tight", t.text)}>{m.value}</p>
                  </div>
                ))}
              </div>
              {/* alert satu baris */}
              {d.alerts.length > 0 && (
                <div className={cn("mx-1.5 mb-1.5 rounded px-1.5 py-0.5 text-[9px] leading-tight line-clamp-1", t.isDark ? "bg-rose-950/50 text-rose-300" : "bg-rose-100 text-rose-700")}>
                  ⚠ {d.alerts[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Row 5: KPI Summary Table ── */}
      <div className={cn("shrink-0 lg:flex-1 lg:min-h-0 lg:overflow-hidden rounded-lg border", t.cardBorder)}>
        <table className="w-full text-xs">
          <thead>
            <tr className={cn("border-b", t.cardBorder, t.tableHeaderBg)}>
              <th className={cn("w-20 px-2 py-1.5 text-left text-[10px] font-semibold", t.textMuted)}>Domain</th>
              <th className={cn("px-2 py-1.5 text-left text-[10px] font-semibold", t.textMuted)}>Indikator</th>
              <th className={cn("w-14 px-2 py-1.5 text-right text-[10px] font-semibold", t.textMuted)}>Nilai</th>
              <th className={cn("w-12 px-2 py-1.5 text-center text-[10px] font-semibold", t.textMuted)}>Status</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y", t.tableDivide)}>
            {tableRows.map((row, i) => (
              <tr key={i} className={t.tableRowBg}>
                <td className={cn("px-2 py-1 text-[10px] font-medium whitespace-nowrap", t.textMuted)}>{row.domain}</td>
                <td className={cn("px-2 py-1 text-[10px] break-words", t.text)}>{row.kpi}</td>
                <td className={cn("px-2 py-1 text-right font-mono font-semibold text-[10px] whitespace-nowrap", t.text)}>{row.value}</td>
                <td className="px-2 py-1 text-center">
                  {row.rag ? <span className={cn("inline-block size-2 rounded-full", RAG[row.rag].dot)} /> : <span className={cn("text-[10px]", t.textFaint)}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ── SLIDE: periode selector wrapper ─────────────────────────────────────────

export function usePresentationPeriod() {
  return useState(currentPeriod());
}
