import { useState, useRef } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  BarChart3, Factory, Users, ShieldAlert, ClipboardCheck, HardHat,
  TrendingUp, TrendingDown, Minus, Printer, AlertTriangle, AlertOctagon,
  CheckCircle2, ArrowRight, Info, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import PeriodSelector, { formatPeriod } from "./PeriodSelector.tsx";
import RagBadge from "./RagBadge.tsx";
import { useResolvedConfig } from "./TabConfigEditor.tsx";
import type {
  BodRevenueSummary, BodProductionSummary, BodHrSummary,
  BodRiskSummary, BodAuditSummary, BodHseSummary,
} from "@/convex/bodExtended.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(Number(v))) return "Rp 0";
  return `Rp ${Number(v).toLocaleString("id-ID")}`;
}
function fmtMoneyShort(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(Number(v))) return "Rp 0";
  const num = Number(v);
  if (Math.abs(num) >= 1_000_000_000_000) return `Rp ${(num / 1_000_000_000_000).toFixed(1)}T`;
  if (Math.abs(num) >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
  return fmtMoney(num);
}

function achColor(v: number): string {
  const val = Number(v) || 0;
  if (val >= 100) return "text-emerald-600";
  if (val >= 80) return "text-amber-600";
  return "text-rose-600";
}
function achBg(v: number): string {
  const val = Number(v) || 0;
  if (val >= 100) return "bg-emerald-500";
  if (val >= 80) return "bg-amber-500";
  return "bg-rose-500";
}

type RagLevel = "green" | "amber" | "red";

function revenueRag(s?: BodRevenueSummary | null): RagLevel {
  if (!s || typeof s !== "object") return "green";
  const ach = Number(s.achievement) || 0;
  const margin = Number(s.ebitdaMargin) || 0;
  if (ach < 80 || margin < 10) return "red";
  if (ach < 95 || margin < 15) return "amber";
  return "green";
}
function productionRag(s?: BodProductionSummary | null): RagLevel {
  if (!s || typeof s !== "object") return "green";
  const activeProjects = Number(s.activeProjects) || 0;
  const delayedProjects = Number(s.delayedProjects) || 0;
  const otdRate = Number(s.otdRate) || 0;
  const delayedPct = activeProjects > 0 ? (delayedProjects / activeProjects) * 100 : 0;
  if (otdRate < 75 || delayedPct > 15) return "red";
  if (otdRate < 90 || delayedPct > 5) return "amber";
  return "green";
}
function hrRag(s?: BodHrSummary | null): RagLevel {
  if (!s || typeof s !== "object") return "green";
  const att = Number(s.attendanceRate) || 0;
  const turnover = Number(s.turnoverRate) || 0;
  if (att < 88 || turnover > 6) return "red";
  if (att < 95 || turnover > 3) return "amber";
  return "green";
}
function riskRag(s?: BodRiskSummary | null): RagLevel {
  if (!s || typeof s !== "object") return "green";
  const critical = Number(s.critical) || 0;
  const high = Number(s.high) || 0;
  const openRisks = Number(s.openRisks) || 0;
  if (critical > 0) return "red";
  if (high > 0 || openRisks > 5) return "amber";
  return "green";
}
function auditRag(s?: BodAuditSummary | null): RagLevel {
  if (!s || typeof s !== "object") return "green";
  const total = Number(s.total) || 0;
  const closed = Number(s.closed) || 0;
  const critical = Number(s.critical) || 0;
  const overdue = Number(s.overdue) || 0;
  const rate = total > 0 ? (closed / total) * 100 : 100;
  if (rate < 50 || critical > 0 || overdue > 3) return "red";
  if (rate < 80 || overdue > 0) return "amber";
  return "green";
}
function hseRag(s?: BodHseSummary | null): RagLevel {
  if (!s || typeof s !== "object") return "green";
  const fatality = Number(s.fatality) || 0;
  const lostTime = Number(s.lostTime) || 0;
  const totalIncidents = Number(s.totalIncidents) || 0;
  if (fatality > 0 || lostTime > 0) return "red";
  if (totalIncidents > 2) return "amber";
  return "green";
}

const RAG_STYLES: Record<RagLevel, { bg: string; border: string; dot: string; label: string; text: string }> = {
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", label: "Baik",      text: "text-emerald-700 dark:text-emerald-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30",     border: "border-amber-200 dark:border-amber-800",     dot: "bg-amber-500",   label: "Perhatian", text: "text-amber-700 dark:text-amber-400"   },
  red:   { bg: "bg-rose-50 dark:bg-rose-950/30",        border: "border-rose-200 dark:border-rose-800",        dot: "bg-rose-500",    label: "Waspada",   text: "text-rose-700 dark:text-rose-400"   },
};

// ---------------------------------------------------------------------------
// Compact domain mini-card (5 per baris)
// ---------------------------------------------------------------------------
type MiniMetric = { label: string; value: string };
type DomainMiniCardProps = {
  icon: React.ElementType;
  title: string;
  rag: RagLevel | undefined;
  metrics: MiniMetric[];
  alerts?: string[];
  onGoTo?: () => void;
  isLoading?: boolean;
};

function DomainMiniCard({ icon: Icon, title, rag, metrics, alerts = [], onGoTo, isLoading }: DomainMiniCardProps) {
  const style = rag ? RAG_STYLES[rag] : RAG_STYLES.green;
  if (isLoading) {
    return <div className="rounded-lg border p-2 space-y-1.5"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full" /></div>;
  }
  return (
    <div className={cn("rounded-lg border-2 transition-shadow", style.border, style.bg)}>
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-inherit">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3 text-foreground/60 shrink-0" />
          <span className="text-[11px] font-semibold leading-none">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {rag && (
            <span className={cn("text-[9px] font-bold uppercase tracking-wide", style.text)}>{style.label}</span>
          )}
          {onGoTo && (
            <button onClick={onGoTo} className="cursor-pointer print:hidden">
              <ArrowRight className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-px px-2 py-1.5">
        {metrics.map((m) => (
          <div key={m.label} className="min-w-0">
            <p className="text-[9px] text-muted-foreground leading-none truncate">{m.label}</p>
            <p className="text-[11px] font-bold leading-tight truncate">{m.value}</p>
          </div>
        ))}
      </div>
      {/* Alerts — hanya satu baris */}
      {alerts.length > 0 && (
        <div className="px-2 pb-1.5">
          <div className="flex items-start gap-1 rounded bg-rose-100/80 dark:bg-rose-950/50 px-1.5 py-1">
            <AlertTriangle className="size-2.5 text-rose-600 mt-px shrink-0" />
            <p className="text-[9px] text-rose-700 dark:text-rose-400 leading-tight line-clamp-1">{alerts[0]}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escalation item — single-line compact
// ---------------------------------------------------------------------------
type EscalationProps = { level: "critical" | "high" | "medium"; message: string; domain: string };

function EscalationItem({ level, message, domain }: EscalationProps) {
  const styles = {
    critical: "border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400",
    high:     "border-orange-200 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400",
    medium:   "border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  };
  const icons = {
    critical: <AlertOctagon className="size-3 shrink-0" />,
    high:     <AlertTriangle className="size-3 shrink-0" />,
    medium:   <Info className="size-3 shrink-0" />,
  };
  return (
    <div className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5", styles[level])}>
      {icons[level]}
      <p className="text-[11px] font-medium flex-1 leading-tight">{message}</p>
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70 shrink-0">{domain}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overall health bar
// ---------------------------------------------------------------------------
function OverallScoreBar({ rag }: { rag: Record<string, RagLevel> }) {
  const vals = Object.values(rag);
  const greens = vals.filter((v) => v === "green").length;
  const ambers = vals.filter((v) => v === "amber").length;
  const reds   = vals.filter((v) => v === "red").length;
  const total  = vals.length;
  const overall: RagLevel = reds > 0 ? "red" : ambers > 1 ? "amber" : "green";
  const label  = overall === "red" ? "Butuh Perhatian Segera" : overall === "amber" ? "Perlu Perhatian" : "Organisasi Sehat";
  const style  = RAG_STYLES[overall];
  return (
    <div className={cn("rounded-lg border-2 px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2", style.border, style.bg)}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={cn("size-3 rounded-full shrink-0 animate-pulse", style.dot)} />
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Status Organisasi</p>
          <p className="text-sm font-bold leading-tight">{label}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {[{ color: "bg-emerald-500", count: greens, label: "baik" }, { color: "bg-amber-500", count: ambers, label: "perhatian" }, { color: "bg-rose-500", count: reds, label: "waspada" }].map((s) => (
          <div key={s.label} className="flex items-center gap-1 text-xs">
            <span className={cn("size-2 rounded-full shrink-0", s.color)} />
            <span className="font-semibold">{s.count}</span>
            <span className="text-muted-foreground text-[10px]">{s.label}</span>
          </div>
        ))}
        <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          {greens > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(greens / total) * 100}%` }} />}
          {ambers > 0 && <div className="bg-amber-500 h-full" style={{ width: `${(ambers / total) * 100}%` }} />}
          {reds > 0 && <div className="bg-rose-500 h-full" style={{ width: `${(reds / total) * 100}%` }} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Finance KPI mini item
// ---------------------------------------------------------------------------
type FinanceKpiItem = {
  key: string; defaultLabel: string; color: string;
  prog: number; real: number;
};
function FinanceKpiCell({ kpi, label }: { kpi: FinanceKpiItem; label: string }) {
  const prog = Number(kpi?.prog) || 0;
  const real = Number(kpi?.real) || 0;
  const ach = prog > 0 ? Math.round((real / prog) * 100) : 0;
  const isEmpty = prog === 0 && real === 0;
  return (
    <div className="rounded border bg-background/60 px-2 py-1.5 space-y-0.5">
      <p className={cn("text-[10px] font-semibold leading-tight truncate", kpi?.color)}>{label}</p>
      {isEmpty ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-1">
            <p className={cn("text-xs font-bold tabular-nums leading-tight", kpi?.color)}>{fmtMoneyShort(real)}</p>
            <span className={cn("text-[10px] font-bold", achColor(ach))}>{ach}%</span>
          </div>
          <div className="relative h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full rounded-full", achBg(ach))}
              style={{ width: ach >= 100 ? `${Math.min(ach, 130) / 130 * 100}%` : `${ach}%` }} />
            {ach > 100 && <div className="absolute top-0 bottom-0 w-px bg-white/70" style={{ left: `${100 / 130 * 100}%` }} />}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ExecSummaryTab({ onGoToTab }: { onGoToTab?: (tab: string) => void }) {
  const [period, setPeriod] = useState(currentPeriod());
  const printRef = useRef<HTMLDivElement>(null);
  const cfg = useResolvedConfig("revenue");
  const { isAuthenticated } = useConvexAuth();
  const orgData = useQuery(api.welcomePage.getContent, isAuthenticated ? {} : "skip");

  const revData   = useQuery(api.bodExtended.getRevenueSummary,    { period });
  const prodData  = useQuery(api.bodExtended.getProductionSummary, { period });
  const hrData    = useQuery(api.bodExtended.getHrSummary,         { period });
  const riskData  = useQuery(api.bodExtended.getRiskSummary,       { period });
  const auditData = useQuery(api.bodExtended.getAuditSummary,      { period });
  const hseData   = useQuery(api.bodExtended.getHseSummary,        { period });

  const isObj = (x: unknown) => x && typeof x === "object" && !Array.isArray(x);
  const isLoading = !revData || !prodData || !hrData || !riskData || !auditData || !hseData;

  const validRev = isObj(revData) ? (revData as BodRevenueSummary) : null;
  const validProd = isObj(prodData) ? (prodData as BodProductionSummary) : null;
  const validHr = isObj(hrData) ? (hrData as BodHrSummary) : null;
  const validRisk = isObj(riskData) ? (riskData as BodRiskSummary) : null;
  const validAudit = isObj(auditData) ? (auditData as BodAuditSummary) : null;
  const validHse = isObj(hseData) ? (hseData as BodHseSummary) : null;

  const ragMap: Record<string, RagLevel> = {};
  if (validRev)   ragMap.revenue    = revenueRag(validRev);
  if (validProd)  ragMap.production = productionRag(validProd);
  if (validHr)    ragMap.hr         = hrRag(validHr);
  if (validRisk)  ragMap.risk       = riskRag(validRisk);
  if (validAudit) ragMap.audit      = auditRag(validAudit);
  if (validHse)   ragMap.hse        = hseRag(validHse);

  // ---- escalations -----------------------------------------------------------
  type Esc = EscalationProps;
  const escalations: Esc[] = [];
  if (validHse?.fatality && validHse.fatality > 0)
    escalations.push({ level: "critical", domain: "HSE", message: `${validHse.fatality} Fatality tercatat — eskalasi segera` });
  if (validHse && validHse.lostTime > 0)
    escalations.push({ level: "high", domain: "HSE", message: `${validHse.lostTime} LTI — ${validHse.totalLostDays} hari kerja hilang` });
  if (validRisk?.critical && validRisk.critical > 0)
    escalations.push({ level: "critical", domain: "Risk", message: `${validRisk.critical} risiko KRITIS terbuka — mitigasi segera` });
  if (validRisk?.high && validRisk.high > 0)
    escalations.push({ level: "high", domain: "Risk", message: `${validRisk.high} risiko TINGGI perlu dipantau BoD` });
  if (validAudit?.overdue && validAudit.overdue > 0)
    escalations.push({ level: "high", domain: "Audit", message: `${validAudit.overdue} temuan audit melewati due date` });
  if (validAudit?.critical && validAudit.critical > 0)
    escalations.push({ level: "high", domain: "Audit", message: `${validAudit.critical} temuan KRITIS belum diselesaikan` });
  if (validRev && validRev.achievement < 80)
    escalations.push({ level: "high", domain: cfg?.config?.tabTitle ?? "Keuangan", message: `Revenue ${validRev.achievement}% — di bawah threshold 80%` });
  if (validProd && validProd.otdRate < 75)
    escalations.push({ level: "high", domain: "Operasional", message: `OTD ${validProd.otdRate}% — di bawah standar 75%` });
  if (validHr && validHr.turnoverRate > 6)
    escalations.push({ level: "medium", domain: "SDM", message: `Turnover ${validHr.turnoverRate}% — di atas batas 6%` });
  if (validHr && validHr.attendanceRate < 88)
    escalations.push({ level: "medium", domain: "SDM", message: `Kehadiran ${validHr.attendanceRate}% — di bawah standar 88%` });

  // ---- finance KPIs ----------------------------------------------------------
  const financeKpis: FinanceKpiItem[] = validRev ? [
    { key: "total_revenue", defaultLabel: "Total Pendapatan",         color: "text-emerald-600", prog: Number(validRev.totalBudget) || 0,        real: Number(validRev.totalRevenue) || 0     },
    { key: "total_cost",    defaultLabel: "Total Biaya Pokok",        color: "text-rose-600",    prog: Number(validRev.totalCostProgram) || 0,   real: Number(validRev.totalCost) || 0        },
    { key: "gross_profit",  defaultLabel: "Laba Kotor",               color: "text-blue-600",    prog: Number(validRev.grossProfitProgram) || 0, real: Number(validRev.totalGrossProfit) || 0 },
    { key: "ebitda",        defaultLabel: "EBITDA",                   color: "text-violet-600",  prog: Number(validRev.ebitdaProgram) || 0,      real: Number(validRev.totalEbitda) || 0      },
    { key: "net_profit",    defaultLabel: "Laba Bersih",              color: "text-teal-600",    prog: Number(validRev.netProfitProgram) || 0,   real: Number(validRev.totalNetProfit) || 0   },
    { key: "cash_flow",     defaultLabel: "Arus Kas",                 color: "text-cyan-600",    prog: Number(validRev.cashFlowProgram) || 0,    real: Number(validRev.totalCashFlow) || 0    },
    { key: "ar",            defaultLabel: "AR",                       color: "text-orange-600",  prog: Number(validRev.arProgram) || 0,          real: Number(validRev.totalAr) || 0          },
    { key: "ap",            defaultLabel: "AP",                       color: "text-pink-600",    prog: Number(validRev.apProgram) || 0,          real: Number(validRev.totalAp) || 0          },
  ] : [];

  // ---- domain mini-cards data ------------------------------------------------
  const prodMetrics: MiniMetric[] = validProd ? [
    { label: "OTD Rate",     value: `${validProd.otdRate ?? 0}%` },
    { label: "Proyek Aktif", value: `${validProd.activeProjects ?? 0} (${validProd.delayedProjects ?? 0} terlambat)` },
    { label: "Kapasitas",    value: `${validProd.avgCapacityUtilization ?? 0}%` },
    { label: "Selesai",      value: String(validProd.completedProjects ?? 0) },
  ] : [];

  const hrMetrics: MiniMetric[] = validHr ? [
    { label: "Headcount",    value: String(validHr.totalHeadcount ?? 0) },
    { label: "Kehadiran",    value: `${validHr.attendanceRate ?? 0}%` },
    { label: "Produktivitas",value: `${validHr.productivityScore ?? 0}%` },
    { label: "Turnover",     value: `${validHr.turnoverRate ?? 0}%` },
  ] : [];

  const riskMetrics: MiniMetric[] = validRisk ? [
    { label: "Total Risiko", value: String(validRisk.totalRisks ?? 0) },
    { label: "Kritis",       value: (validRisk.critical ?? 0) === 0 ? "Nihil ✓" : String(validRisk.critical) },
    { label: "Tinggi",       value: String(validRisk.high ?? 0) },
    { label: "Terbuka",      value: String(validRisk.openRisks ?? 0) },
  ] : [];

  const auditMetrics: MiniMetric[] = validAudit ? [
    { label: "Total Temuan",  value: String(validAudit.total ?? 0) },
    { label: "Closure Rate",  value: (validAudit.total ?? 0) > 0 ? `${Math.round(((validAudit.closed ?? 0) / validAudit.total) * 100)}%` : "N/A" },
    { label: "Terlambat",     value: (validAudit.overdue ?? 0) === 0 ? "Nihil ✓" : String(validAudit.overdue) },
    { label: "Kritis+Mayor",  value: String((validAudit.critical ?? 0) + (validAudit.major ?? 0)) },
  ] : [];

  const hseMetrics: MiniMetric[] = validHse ? [
    { label: "Insiden",  value: (validHse.totalIncidents ?? 0) === 0 ? "Zero ✓" : String(validHse.totalIncidents) },
    { label: "Fatality", value: (validHse.fatality ?? 0) === 0 ? "Nihil ✓" : `⚠ ${validHse.fatality}` },
    { label: "LTI",      value: String(validHse.lostTime ?? 0) },
    { label: "Near Miss",value: String(validHse.nearMiss ?? 0) },
  ] : [];

  // ---- KPI table rows (ringkas) -----------------------------------------------
  const financeTableRows = financeKpis.slice(0, 5).map((kpi) => {
    const prog = Number(kpi?.prog) || 0;
    const real = Number(kpi?.real) || 0;
    const ach = prog > 0 ? Math.round((real / prog) * 100) : 0;
    const rag: RagLevel = ach >= 100 ? "green" : ach >= 80 ? "amber" : "red";
    return {
      domain: cfg?.config?.tabTitle ?? "Keuangan",
      kpi: `${cfg?.label(kpi.key, kpi.defaultLabel)}  ${prog === 0 && real === 0 ? "" : `(P: ${fmtMoneyShort(prog)} / R: ${fmtMoneyShort(real)})`}`,
      value: prog === 0 && real === 0 ? "—" : `${ach}%`,
      rag: (prog === 0 && real === 0 ? undefined : rag) as RagLevel | undefined,
    };
  });

  return (
    <div ref={printRef} className="exec-summary-root space-y-3">
      {/* ── Kop Cetak — hanya muncul saat print ── */}
      <div className="hidden print:flex print:items-center print:justify-between print:border-b-2 print:border-gray-800 print:pb-3 print:mb-1">
        <div className="flex items-center gap-3">
          {orgData?.organizationLogo && (
            <img src={orgData.organizationLogo} alt="Logo" className="h-10 w-auto object-contain" />
          )}
          <div>
            <p className="text-base font-bold leading-tight">{orgData?.organizationName ?? "—"}</p>
            <p className="text-xs text-gray-500">Dashboard Direksi (BoD) — Ringkasan Eksekutif</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Periode: {formatPeriod(period)}</p>
          <p className="text-xs text-gray-500">Dicetak: {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
        </div>
      </div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold leading-tight">Executive Summary<span className="hidden sm:inline text-sm font-normal text-muted-foreground"> — Ringkasan Satu Halaman</span></h2>
          <p className="text-xs text-muted-foreground">Agregasi seluruh domain KPI untuk rapat Direksi</p>
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
          <PeriodSelector value={period} onChange={setPeriod} />
          <Button size="sm" variant="outline" onClick={() => window.print()} className="cursor-pointer h-8 px-2 sm:px-3 gap-1.5 print:hidden shrink-0 ml-auto sm:ml-0">
            <Printer className="size-4" />
            <span className="hidden sm:inline text-xs">Cetak / Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block border-b pb-3 mb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard Direksi (BoD)</h1>
            <p className="text-xs text-gray-600">Executive Summary · 25 Divisi · Jasa &amp; Manufaktur</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold">Periode: {formatPeriod(period)}</p>
            <p>Dicetak: {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
          </div>
        </div>
      </div>

      {/* 1. Overall health */}
      {!isLoading ? <OverallScoreBar rag={ragMap} /> : <Skeleton className="h-12 w-full rounded-lg" />}

      {/* 2. Escalations */}
      {escalations.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <AlertOctagon className="size-3.5 text-rose-600" />
            <span className="text-xs font-semibold">Eskalasi &amp; Isu Kritis ({escalations.length})</span>
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">Perlu Tindakan BoD</Badge>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 exec-escalation-grid">
            {escalations.map((e, i) => <EscalationItem key={i} {...e} />)}
          </div>
        </div>
      )}
      {escalations.length === 0 && !isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 px-3 py-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Tidak Ada Eskalasi Kritis — Semua domain dalam kondisi terpantau baik untuk {formatPeriod(period)}.</p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t" />

      {/* 3. Scorecard label */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scorecard per Domain</p>

      {/* 4. Finance block — compact 8-col grid */}
      {!revData ? (
        <Skeleton className="h-28 w-full rounded-lg" />
      ) : (
        <div className={cn("rounded-lg border-2", (ragMap.revenue ? RAG_STYLES[ragMap.revenue] : RAG_STYLES.green).border, (ragMap.revenue ? RAG_STYLES[ragMap.revenue] : RAG_STYLES.green).bg)}>
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-inherit">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="size-3 text-foreground/60" />
              <span className="text-[11px] font-semibold">{cfg.config.tabTitle ?? "Keuangan"}</span>
            </div>
            <div className="flex items-center gap-2">
              {ragMap.revenue && (
                <span className={cn("text-[9px] font-bold uppercase tracking-wide", RAG_STYLES[ragMap.revenue].text)}>{RAG_STYLES[ragMap.revenue].label}</span>
              )}
              <button onClick={() => onGoToTab?.("revenue")} className="cursor-pointer print:hidden">
                <ArrowRight className="size-3 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 exec-finance-grid">
            {financeKpis.map((kpi) => (
              <FinanceKpiCell key={kpi.key} kpi={kpi} label={cfg.label(kpi.key, kpi.defaultLabel)} />
            ))}
          </div>
        </div>
      )}

      {/* 5. Domain mini cards — 5 kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 exec-domain-grid">
        <DomainMiniCard icon={Factory}       title="Operasional" rag={ragMap.production} metrics={prodMetrics}  alerts={prodData && prodData.delayedProjects > 0 ? [`${prodData.delayedProjects} proyek terlambat`] : []}   isLoading={!prodData}  onGoTo={() => onGoToTab?.("production")} />
        <DomainMiniCard icon={Users}         title="SDM"         rag={ragMap.hr}         metrics={hrMetrics}    alerts={hrData && hrData.turnoverRate > 6 ? [`Turnover ${hrData.turnoverRate}%`] : []}                     isLoading={!hrData}    onGoTo={() => onGoToTab?.("hr")} />
        <DomainMiniCard icon={ShieldAlert}   title="Risk"        rag={ragMap.risk}        metrics={riskMetrics}  alerts={riskData && riskData.critical > 0 ? [`${riskData.critical} risiko kritis`] : []}                   isLoading={!riskData}  onGoTo={() => onGoToTab?.("risk")} />
        <DomainMiniCard icon={ClipboardCheck} title="Audit"      rag={ragMap.audit}       metrics={auditMetrics} alerts={auditData && auditData.overdue > 0 ? [`${auditData.overdue} temuan terlambat`] : []}               isLoading={!auditData} onGoTo={() => onGoToTab?.("audit")} />
        <DomainMiniCard icon={HardHat}       title="HSE"         rag={ragMap.hse}         metrics={hseMetrics}   alerts={hseData && hseData.fatality > 0 ? [`FATALITY: ${hseData.fatality}`] : hseData && hseData.lostTime > 0 ? [`${hseData.lostTime} LTI`] : []} isLoading={!hseData}   onGoTo={() => onGoToTab?.("hse")} />
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* 6. KPI summary table */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ringkasan KPI Utama — {formatPeriod(period)}</p>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-muted-foreground w-16">Domain</th>
                <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">Indikator</th>
                <th className="text-right px-2 py-1.5 text-[10px] font-semibold text-muted-foreground w-12">Nilai</th>
                <th className="text-center px-2 py-1.5 text-[10px] font-semibold text-muted-foreground w-12">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ...financeTableRows,
                { domain: "Operasional", kpi: "On-Time Delivery (OTD)", value: prodData ? `${prodData.otdRate}%` : "—", rag: ragMap.production },
                { domain: "Operasional", kpi: "Proyek Terlambat", value: prodData ? String(prodData.delayedProjects) : "—", rag: (prodData && prodData.delayedProjects === 0 ? "green" : prodData && prodData.delayedProjects < 3 ? "amber" : "red") as RagLevel },
                { domain: "SDM",         kpi: "Tingkat Kehadiran", value: hrData ? `${hrData.attendanceRate}%` : "—", rag: (hrData && hrData.attendanceRate >= 95 ? "green" : hrData && hrData.attendanceRate >= 88 ? "amber" : "red") as RagLevel },
                { domain: "SDM",         kpi: "Turnover Rate",     value: hrData ? `${hrData.turnoverRate}%` : "—", rag: (hrData && hrData.turnoverRate < 3 ? "green" : hrData && hrData.turnoverRate < 6 ? "amber" : "red") as RagLevel },
                { domain: "Risk",        kpi: "Risiko Kritis",      value: riskData ? String(riskData.critical) : "—", rag: (riskData && riskData.critical === 0 ? "green" : "red") as RagLevel },
                { domain: "Audit",       kpi: "Closure Rate",       value: auditData && auditData.total > 0 ? `${Math.round((auditData.closed / auditData.total) * 100)}%` : "N/A", rag: ragMap.audit },
                { domain: "Audit",       kpi: "Temuan Terlambat",   value: auditData ? String(auditData.overdue) : "—", rag: (auditData && auditData.overdue === 0 ? "green" : auditData && auditData.overdue <= 2 ? "amber" : "red") as RagLevel },
                { domain: "HSE",         kpi: "Total Insiden",      value: hseData ? String(hseData.totalIncidents) : "—", rag: ragMap.hse },
                { domain: "HSE",         kpi: "Fatality",            value: hseData ? String(hseData.fatality) : "—", rag: (hseData && hseData.fatality === 0 ? "green" : "red") as RagLevel },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-2 py-1 text-[10px] text-muted-foreground font-medium whitespace-nowrap">{row.domain}</td>
                  <td className="px-2 py-1 text-[10px] break-words">{row.kpi}</td>
                  <td className="px-2 py-1 text-right font-mono font-semibold text-[10px] whitespace-nowrap">{row.value}</td>
                  <td className="px-2 py-1 text-center">
                    {row.rag ? <RagBadge level={row.rag} /> : <span className="text-[10px] text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print footer */}
      <div className="hidden print:flex border-t pt-2 mt-2 text-[8pt] text-gray-500 justify-between">
        <span>Dokumen Konfidensial — Hanya untuk Rapat Direksi (BoD)</span>
        <span>Dashboard Direksi · {new Date().toLocaleString("id-ID")}</span>
      </div>
    </div>
  );
}
