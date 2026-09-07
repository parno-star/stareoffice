import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Landmark, ShieldAlert, Target, AlertTriangle, TriangleAlert, Users, Wallet,
  Clock, CheckCircle2, ArrowRight, Building2, BarChart3, Factory, HardHat,
  ClipboardCheck, Settings, Maximize2, type LucideIcon,
} from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import BodKpiCard from "./_components/BodKpiCard.tsx";
import UnitKpiCard from "./_components/UnitKpiCard.tsx";
import UnitDetailDialog from "./_components/UnitDetailDialog.tsx";
import EscalationsPanel from "./_components/EscalationsPanel.tsx";
import RevenueTab from "./_components/RevenueTab.tsx";
import HrTab from "./_components/HrTab.tsx";
import ProductionTab from "./_components/ProductionTab.tsx";
import RiskTab from "./_components/RiskTab.tsx";
import AuditTab from "./_components/AuditTab.tsx";
import HseTab from "./_components/HseTab.tsx";
import DivisionsTab from "./_components/DivisionsTab.tsx";
import ExecSummaryTab from "./_components/ExecSummaryTab.tsx";
import { useResolvedConfig } from "./_components/TabConfigEditor.tsx";
import FullscreenPresentation, { type TabSlideDef } from "./_components/FullscreenPresentation.tsx";
import {
  SlideExecSummary,
  SlideFinanceKpi,
  SlideFinanceTrend,
  SlideFinanceDivisi,
  SlideFinanceLineTrend,
} from "./_components/PresentationSlides.tsx";

const KPI_ICONS: Record<string, LucideIcon> = {
  okr_progress: Target, okr_risk: AlertTriangle, headcount: Users,
  finance_approved: Wallet, finance_pending: Clock, okr_achieved: CheckCircle2,
};

function formatGeneratedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  } catch { return "-"; }
}

// ---- Executive Overview (existing section) ---------------------------------
function ExecutiveOverview() {
  const summary = useQuery(api.bod.getExecutiveSummary, {});
  const unitGrid = useQuery(api.bod.getUnitKpis, {});
  const escalations = useQuery(api.bod.getEscalations, {});
  const [selectedDeptId, setSelectedDeptId] = useState<Id<"departments"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openUnit = (id: Id<"departments"> | null) => { if (!id) return; setSelectedDeptId(id); setDialogOpen(true); };

  if (summary === undefined) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!summary || !summary.hasAccess) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><ShieldAlert /></EmptyMedia>
          <EmptyTitle>Akses dibatasi</EmptyTitle>
          <EmptyDescription>Dashboard Direksi hanya dapat diakses oleh direksi (C-Level) dan administrator.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const okrHealth = summary.okrHealth ?? { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, achieved: 0, averageProgress: 0 };
  const hasOkr = (okrHealth?.total ?? 0) > 0;
  const healthSegments = [
    { key: "achieved", label: "Tercapai", count: okrHealth.achieved ?? 0, className: "bg-emerald-600 dark:bg-emerald-500" },
    { key: "on_track", label: "On Track", count: okrHealth.onTrack ?? 0, className: "bg-emerald-400 dark:bg-emerald-400/80" },
    { key: "at_risk", label: "Berisiko", count: okrHealth.atRisk ?? 0, className: "bg-amber-500" },
    { key: "off_track", label: "Menyimpang", count: okrHealth.offTrack ?? 0, className: "bg-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <p className="text-xs text-muted-foreground">Diperbarui otomatis &middot; {formatGeneratedAt(summary.generatedAt)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(summary.kpis ?? []).map((kpi) => (
          <BodKpiCard key={kpi.key} icon={KPI_ICONS[kpi.key] ?? Target} label={kpi.label} value={kpi.value}
            sublabel={kpi.sublabel} rag={kpi.rag} deltaLabel={kpi.deltaLabel}
            deltaDirection={kpi.deltaDirection} higherIsBetter={kpi.higherIsBetter} />
        ))}
      </div>
      <EscalationsPanel data={escalations} />
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Kesehatan OKR Strategis</CardTitle>
            <CardDescription>Objektif tingkat perusahaan &amp; departemen pada {summary.periodLabel}.</CardDescription>
          </div>
          <Button asChild size="sm" variant="secondary" className="shrink-0 cursor-pointer">
            <Link to="/okr">Buka OKR <ArrowRight className="size-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasOkr ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Target /></EmptyMedia>
                <EmptyTitle>Belum ada objektif strategis</EmptyTitle>
                <EmptyDescription>Buat objektif di modul OKR agar kesehatannya terpantau di sini.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Button asChild size="sm"><Link to="/okr">Kelola OKR</Link></Button></EmptyContent>
            </Empty>
          ) : (
            <>
              <div><p className="text-3xl font-bold leading-none">{okrHealth.averageProgress}%</p><p className="mt-1 text-xs text-muted-foreground">Rata-rata progres {okrHealth.total} objektif strategis</p></div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {healthSegments.map((seg) => seg.count > 0 ? (
                  <div key={seg.key} className={seg.className} style={{ width: `${(seg.count / okrHealth.total) * 100}%` }} title={`${seg.label}: ${seg.count}`} />
                ) : null)}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {healthSegments.map((seg) => (
                  <div key={seg.key} className="flex items-center gap-2 rounded-lg border p-2">
                    <span className={`size-3 shrink-0 rounded-full ${seg.className}`} />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] text-muted-foreground">{seg.label}</p>
                      <p className="text-sm font-semibold leading-tight">{seg.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Pemantauan KPI per Unit</CardTitle>
            <CardDescription>Status setiap departemen berdasarkan OKR unit.</CardDescription>
          </div>
          <Button asChild size="sm" variant="secondary" className="shrink-0 cursor-pointer">
            <Link to="/organization">Struktur Organisasi <ArrowRight className="size-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {unitGrid === undefined ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
          ) : (unitGrid?.units?.length ?? 0) === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Building2 /></EmptyMedia>
                <EmptyTitle>Belum ada unit</EmptyTitle>
                <EmptyDescription>Tambahkan departemen pada struktur organisasi agar KPI per unit dapat dipantau.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Button asChild size="sm"><Link to="/organization">Kelola Struktur Organisasi</Link></Button></EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(unitGrid.units ?? []).map((unit) => (
                <UnitKpiCard key={unit.departmentId ?? unit.name} unit={unit}
                  onClick={() => openUnit(unit.departmentId as Id<"departments"> | null)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <UnitDetailDialog departmentId={selectedDeptId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

// ---- Main dashboard content ------------------------------------------------
function BodDashboardContent() {
  // Support URL hash to deep-link to a specific tab: /bod-dashboard#finance → tab "revenue"
  const hashMap: Record<string, string> = { finance: "revenue", revenue: "revenue" };
  const initialTab = hashMap[window.location.hash.replace("#", "")] ?? "exec";
  const [tab, setTab] = useState(initialTab);
  const [fullscreen, setFullscreen] = useState(false);

  // Periode global — dipakai di tab Finance (halaman normal) DAN Dashboard View
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ESC key exits fullscreen
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setFullscreen(false);
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Fetch custom tab title for Revenue tab (other tabs can be added later)
  const revenueCfg = useResolvedConfig("revenue");
  const revenueTabLabel = revenueCfg.config.tabTitle ?? "Keuangan";

  const TABS = [
    { value: "exec",       label: "Executive Summary",              fullLabel: "Executive Summary",                      icon: Landmark },
    { value: "overview",   label: "Overview",                       fullLabel: "Kinerja Overview Strategis",             icon: Target },
    { value: "revenue",    label: revenueTabLabel,                  fullLabel: `Kinerja ${revenueTabLabel}`,             icon: BarChart3 },
    { value: "production", label: "Operasional",                    fullLabel: "Kinerja Operasional",                    icon: Factory },
    { value: "hr",         label: "SDM",                            fullLabel: "Kinerja Sumber Daya Manusia (SDM)",      icon: Users },
    { value: "risk",       label: "Risk",                           fullLabel: "Kinerja Manajemen Risiko",               icon: ShieldAlert },
    { value: "audit",      label: "Audit",                          fullLabel: "Kinerja Temuan & Tindak Lanjut Audit",  icon: ClipboardCheck },
    { value: "hse",        label: "HSE",                            fullLabel: "Kinerja Health, Safety & Environment",  icon: HardHat },
    { value: "divisions",  label: "Departemen",                     fullLabel: "Kinerja per Departemen",                 icon: Settings },
  ];

  const activeTab = TABS.find((t) => t.value === tab);

  // Shared tab content renderer
  const tabContent = (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="flex items-start gap-2 print:hidden">
        <TabsList className="flex-1 grid grid-cols-5 h-auto gap-0.5 bg-muted/50 p-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-1 cursor-pointer text-xs px-2 py-1.5">
              <Icon className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <Button size="sm" className="cursor-pointer gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 shrink-0 self-start mt-0.5" onClick={() => setFullscreen(true)}>
          <Maximize2 className="size-3.5" />
          <span className="hidden sm:inline">Dashboard View</span>
        </Button>
      </div>
      {/* Tab page header — judul lengkap tab aktif */}
      {activeTab && tab !== "exec" && (
        <div className="mt-6 flex items-center gap-3 border-b pb-4 print:hidden">
          <activeTab.icon className="size-5 text-muted-foreground shrink-0" />
          <h2 className="text-xl font-semibold leading-tight">{activeTab.fullLabel}</h2>
        </div>
      )}
      <TabsContent value="exec" className="mt-4"><ExecSummaryTab onGoToTab={setTab} /></TabsContent>
      <TabsContent value="overview" className="mt-4"><ExecutiveOverview /></TabsContent>
      <TabsContent value="revenue" className="mt-4"><RevenueTab period={period} onPeriodChange={setPeriod} /></TabsContent>
      <TabsContent value="production" className="mt-4"><ProductionTab /></TabsContent>
      <TabsContent value="hr" className="mt-4"><HrTab /></TabsContent>
      <TabsContent value="risk" className="mt-4"><RiskTab /></TabsContent>
      <TabsContent value="audit" className="mt-4"><AuditTab /></TabsContent>
      <TabsContent value="hse" className="mt-4"><HseTab /></TabsContent>
      <TabsContent value="divisions" className="mt-4"><DivisionsTab /></TabsContent>
    </Tabs>
  );

  // Fullscreen presentation slides — slide khusus per tema tanpa tombol aksi
  const fsTabs: TabSlideDef[] = [
    {
      tabValue: "exec", tabLabel: "Executive Summary", tabIcon: Landmark,
      slides: [
        { id: "exec-1", title: "Ringkasan Eksekutif", content: (p) => <SlideExecSummary period={p} /> },
      ],
    },
    {
      tabValue: "revenue", tabLabel: revenueTabLabel, tabIcon: BarChart3,
      slides: [
        { id: "rev-kpi",   title: "KPI Keuangan",         content: (p) => <SlideFinanceKpi period={p} /> },
        { id: "rev-trend", title: "Tren Pendapatan",       content: () => <SlideFinanceTrend /> },
        { id: "rev-div",   title: "Pendapatan per Lini Bisnis",    content: (p) => <SlideFinanceDivisi period={p} /> },
        { id: "rev-line-trend", title: "Tren per Lini Bisnis",    content: () => <SlideFinanceLineTrend /> },
      ],
    },
    { tabValue: "production", tabLabel: "Operasional",       tabIcon: Factory,        slides: [{ id: "prod-1",  title: "Operasional",  content: () => <ProductionTab /> }] },
    { tabValue: "hr",         tabLabel: "SDM",               tabIcon: Users,          slides: [{ id: "hr-1",    title: "SDM",          content: () => <HrTab /> }] },
    { tabValue: "risk",       tabLabel: "Risk",              tabIcon: ShieldAlert,    slides: [{ id: "risk-1",  title: "Risk",         content: () => <RiskTab /> }] },
    { tabValue: "audit",      tabLabel: "Audit",             tabIcon: ClipboardCheck, slides: [{ id: "audit-1", title: "Audit",        content: () => <AuditTab /> }] },
    { tabValue: "hse",        tabLabel: "HSE",               tabIcon: HardHat,        slides: [{ id: "hse-1",   title: "HSE",          content: () => <HseTab /> }] },
    { tabValue: "divisions",  tabLabel: "Departemen",        tabIcon: Settings,       slides: [{ id: "div-1",   title: "Departemen",   content: () => <DivisionsTab /> }] },
  ];

  return (
    <>
      {/* ── Fullscreen presentation ── */}
      {fullscreen && (
        <FullscreenPresentation tabs={fsTabs} initialTab={tab} initialPeriod={period} onClose={() => setFullscreen(false)} />
      )}

      {/* ── Normal view ── */}
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Landmark className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Direksi (BoD)</h1>
            <p className="text-xs text-muted-foreground">Ringkasan Kinerja strategis untuk eksekutif</p>
          </div>
        </div>

        {/* Tabs — spasi atas diperbesar */}
        <div className="pt-2">
          {tabContent}
        </div>
      </div>
    </>
  );
}

export default function BodDashboardPage() {
  return (
    <>
      <Authenticated><BodDashboardContent /></Authenticated>
      <Unauthenticated>
        <div className="mx-auto w-full max-w-2xl p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Landmark /></EmptyMedia>
              <EmptyTitle>Masuk untuk melanjutkan</EmptyTitle>
              <EmptyDescription>Silakan masuk untuk mengakses Dashboard Direksi.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><SignInButton /></EmptyContent>
          </Empty>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        </div>
      </AuthLoading>
    </>
  );
}
