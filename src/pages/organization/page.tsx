import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Card,
  CardContent,
} from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Network,
  Users,
  Building2,
  UserCog,
  UserMinus,
  Search,
  GitBranch,
  LayoutGrid,
  LayoutPanelLeft,
  BarChart3,
  Download,
  Image as ImageIcon,
  Route as RouteIcon,
  Sparkles,
  Target,
  Link2,
  History,
  Briefcase,
  Scale,
  Workflow,
  Gauge,
  Grid3x3,
  FileBadge,
  Orbit,
  Upload,
  Shield,
  Filter,
  BookOpen,
} from "lucide-react";
import EmployeeProfileDialog from "@/pages/directory/_components/EmployeeProfileDialog.tsx";
import OrgTreeView from "./_components/OrgTreeView.tsx";
import OrgChartView from "./_components/OrgChartView.tsx";
import DepartmentView from "./_components/DepartmentView.tsx";
import SetManagerDialog from "./_components/SetManagerDialog.tsx";
import DepartmentEditorDialog from "./_components/DepartmentEditorDialog.tsx";
import ReportingLineDialog from "./_components/ReportingLineDialog.tsx";
import OrgAnalyticsPanel from "./_components/OrgAnalyticsPanel.tsx";
import DottedLinesDialog from "./_components/DottedLinesDialog.tsx";
import SuccessionDialog from "./_components/SuccessionDialog.tsx";
import SkillsDialog from "./_components/SkillsDialog.tsx";
import OrgTimelinePanel from "./_components/OrgTimelinePanel.tsx";
import OrgInsightsPanel from "./_components/OrgInsightsPanel.tsx";
import HeadcountPanel from "./_components/HeadcountPanel.tsx";
import BenchmarkPanel from "./_components/BenchmarkPanel.tsx";
import SmartSearch from "./_components/SmartSearch.tsx";
import ScenariosPanel from "./_components/ScenariosPanel.tsx";
import SpanOfControlPanel from "./_components/SpanOfControlPanel.tsx";
import NineBoxPanel from "./_components/NineBoxPanel.tsx";
import NineBoxAssessmentDialog from "./_components/NineBoxAssessmentDialog.tsx";
import JobDescPanel from "./_components/JobDescPanel.tsx";
import AdvancedVizPanel from "./_components/AdvancedVizPanel.tsx";
import BulkIOPanel from "./_components/BulkIOPanel.tsx";
import JabatanPanel from "./_components/JabatanPanel.tsx";
import ExportDialog from "./_components/ExportDialog.tsx";
import type { ExportSettings } from "./_components/ExportDialog.tsx";
import { PAPER_SIZES } from "./_components/ExportDialog.tsx";
import { isAdminRole } from "@/convex/roles.ts";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  buildOrgTree,
  groupByDepartment,
  type OrgNode,
  type ColorToken,
  type PositionLevelMap,
} from "./_lib/org-utils.ts";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone: "primary" | "emerald" | "amber" | "sky" | "violet";
}) {
  const toneClasses: Record<typeof tone, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function filterTree(
  nodes: Array<OrgNode>,
  query: string,
): Array<OrgNode> {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();

  const filterNode = (node: OrgNode): OrgNode | null => {
    const match =
      (node.user.name ?? "").toLowerCase().includes(q) ||
      (node.user.jobTitle ?? "").toLowerCase().includes(q) ||
      (node.user.department ?? "").toLowerCase().includes(q);
    const filteredChildren: Array<OrgNode> = [];
    for (const c of node.children) {
      const f = filterNode(c);
      if (f) filteredChildren.push(f);
    }
    if (match || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  const result: Array<OrgNode> = [];
  for (const n of nodes) {
    const f = filterNode(n);
    if (f) result.push(f);
  }
  return result;
}

type AdvancedTab =
  | "hierarchy"
  | "chart"
  | "viz"
  | "departments"
  | "analytics"
  | "span"
  | "ninebox"
  | "jobdesk"
  | "jabatan"
  | "jenjang"
  | "succession"
  | "skills"
  | "headcount"
  | "benchmark"
  | "scenarios"
  | "insights"
  | "history"
  | "bulkio";

const ADVANCED_TABS: ReadonlyArray<AdvancedTab> = [
  "hierarchy",
  "chart",
  "viz",
  "departments",
  "analytics",
  "span",
  "ninebox",
  "jobdesk",
  "jabatan",
  "jenjang",
  "succession",
  "skills",
  "headcount",
  "benchmark",
  "scenarios",
  "insights",
  "history",
  "bulkio",
];

/** Resolve the initial advanced tab from a URL `tab` param, defaulting to the
 *  org chart when the value is missing or unknown. */
function resolveInitialTab(requested: string | null): AdvancedTab {
  return requested && ADVANCED_TABS.includes(requested as AdvancedTab)
    ? (requested as AdvancedTab)
    : "chart";
}

function OrganizationContent() {
  const users = useQuery(api.organization.listAll, {});
  const stats = useQuery(api.organization.getOrgStats, {});
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const myOrganization = useQuery(api.organizations.getMyOrganization, {});
  const officialDepartments = useQuery(api.organization.listDepartments, {});
  const allDottedLines = useQuery(api.orgAdvanced.dottedLines.listAllLines, {});
  const successionSummary = useQuery(api.orgAdvanced.succession.summary, {});
  const positionLevelMap = useQuery(api.organization.getPositionLevelMap, {}) as PositionLevelMap | undefined;
  const positionLevels = useQuery(api.positionLevels.listActive, {});
  const deleteDepartment = useMutation(api.organization.deleteDepartment);

  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [managerDialogTarget, setManagerDialogTarget] =
    useState<Doc<"users"> | null>(null);
  const [deptEditorOpen, setDeptEditorOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Doc<"departments"> | null>(null);
  const [deletingDept, setDeletingDept] = useState<Doc<"departments"> | null>(null);
  const [reportingUserId, setReportingUserId] = useState<Id<"users"> | null>(null);
  const [reportingLineOpen, setReportingLineOpen] = useState(false);
  const [dottedLinesTarget, setDottedLinesTarget] =
    useState<Doc<"users"> | null>(null);
  const [dottedLinesOpen, setDottedLinesOpen] = useState(false);
  const [successionTarget, setSuccessionTarget] = useState<Doc<"users"> | null>(
    null,
  );
  const [successionOpen, setSuccessionOpen] = useState(false);
  const [skillsTarget, setSkillsTarget] = useState<Doc<"users"> | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [nineBoxTarget, setNineBoxTarget] = useState<Doc<"users"> | null>(null);
  const [nineBoxOpen, setNineBoxOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  // Allow deep-linking straight to a specific advanced tab, e.g.
  // /organization?tab=jabatan (used by the role-access page's "Kelola Jabatan"
  // shortcut). Falls back to the default "chart" tab for unknown values.
  const [activeTab, setActiveTab] = useState<AdvancedTab>(() =>
    resolveInitialTab(searchParams.get("tab")),
  );
  const [dragDropEnabled, setDragDropEnabled] = useState(false);
  const [filterLevelCode, setFilterLevelCode] = useState<string>("all");

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Sembunyikan akun uji coba (isTestAccount) dari bagan organisasi.
  const chartUsers = useMemo(
    () => (users ? users.filter((u) => !u.isTestAccount) : users),
    [users],
  );
  const tree = useMemo(() => (chartUsers ? buildOrgTree(chartUsers, positionLevelMap ?? undefined) : []), [chartUsers, positionLevelMap]);
  const filteredTree = useMemo(() => {
    let result = filterTree(tree, search);
    // Apply position level filter
    if (filterLevelCode !== "all" && positionLevelMap) {
      const filterByLevel = (nodes: Array<OrgNode>): Array<OrgNode> => {
        const out: Array<OrgNode> = [];
        for (const n of nodes) {
          const levelInfo = positionLevelMap[n.user._id];
          const match = levelInfo?.code === filterLevelCode;
          const filteredChildren = filterByLevel(n.children);
          if (match || filteredChildren.length > 0) {
            out.push({ ...n, children: filteredChildren });
          }
        }
        return out;
      };
      result = filterByLevel(result);
    }
    return result;
  }, [tree, search, filterLevelCode, positionLevelMap]);
  const groups = useMemo(
    () => (users ? groupByDepartment(users) : []),
    [users],
  );

  const departmentColors = useMemo(() => {
    const map = new Map<string, ColorToken>();
    if (officialDepartments) {
      for (const d of officialDepartments) {
        map.set(d.department.name, (d.department.color as ColorToken) ?? "blue");
      }
    }
    return map;
  }, [officialDepartments]);

  const existingDepartmentNames = useMemo(() => {
    if (!users) return [];
    const set = new Set<string>();
    for (const u of users) {
      if (u.department && u.department.trim().length > 0) {
        set.add(u.department);
      }
    }
    return Array.from(set).sort();
  }, [users]);

  const dottedEdges = useMemo(() => {
    return (allDottedLines ?? []).map((d) => ({
      from: d.userId,
      to: d.managerId,
      type: d.relationshipType,
    }));
  }, [allDottedLines]);

  const isAdmin = isAdminRole(currentUser?.role);

  const handleSelectUser = (id: Id<"users">) => {
    setSelectedUserId(id);
    setProfileOpen(true);
  };

  const handleEditManager = (user: Doc<"users">) => {
    setManagerDialogTarget(user);
    setManagerDialogOpen(true);
  };

  const handleShowReportingLine = (id: Id<"users">) => {
    setReportingUserId(id);
    setReportingLineOpen(true);
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDept) return;
    try {
      await deleteDepartment({ departmentId: deletingDept._id });
      toast.success("Departemen dihapus");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus");
      } else {
        toast.error("Gagal menghapus");
      }
    } finally {
      setDeletingDept(null);
    }
  };

  const handleExport = async (settings: ExportSettings) => {
    const node = chartContainerRef.current?.querySelector(
      "[data-orgchart-export-root]",
    ) as HTMLElement | null;
    if (!node) {
      toast.error("Pindah ke tab 'Bagan' dulu untuk ekspor");
      return;
    }
    setIsExporting(true);

    // Temporarily strip pan/zoom transform so html-to-image gets full chart at 1:1
    const prevTransform = node.style.transform;
    const prevLeft = node.style.left;
    const prevTop = node.style.top;
    node.style.transform = "none";
    node.style.left = "0";
    node.style.top = "0";

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        backgroundColor: settings.bgColor,
        pixelRatio: settings.format === "png" ? settings.pixelRatio : 2,
        cacheBust: true,
      });

      if (settings.format === "png") {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `struktur-organisasi-${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
        toast.success("Bagan diunduh sebagai PNG");
      } else {
        const { jsPDF } = await import("jspdf");

        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("image load failed"));
        });

        const MARGIN = 40; // px margins in the pdf

        // ── Page width ──────────────────────────────────────────────────────
        // Determine the page width first so the title font (and therefore the
        // reserved title height) can be computed before we scale the chart.
        let pageW: number;
        if (settings.paperSize === "fit") {
          pageW =
            (settings.scaleMode === "custom"
              ? img.width * (settings.customScalePct / 100)
              : img.width) + MARGIN * 2;
        } else {
          const MM_TO_PX = 3.7795; // mm -> px at 96dpi
          const paper = PAPER_SIZES[settings.paperSize]!;
          const rawW = paper.w * MM_TO_PX;
          const rawH = paper.h * MM_TO_PX;
          const isLand = settings.orientation === "landscape";
          pageW = isLand ? Math.max(rawW, rawH) : Math.min(rawW, rawH);
        }

        // ── Title metrics ──────────────────────────────────────────────────
        // Two lines: org name on top (H1), "Struktur Organisasi" label below.
        const orgFontSize = settings.includeTitle
          ? Math.max(28, Math.min(72, Math.round(pageW * 0.035)))
          : 0;
        const labelFontSize = Math.round(orgFontSize * 0.6);
        const hasOrgName =
          settings.includeTitle && settings.titleText.trim().length > 0;
        const TITLE_TOP = 24;
        const TITLE_GAP = hasOrgName ? Math.round(labelFontSize * 0.5) : 0;
        const TITLE_BOTTOM = 28;
        const TITLE_H = settings.includeTitle
          ? TITLE_TOP +
            (hasOrgName ? orgFontSize : 0) +
            TITLE_GAP +
            labelFontSize +
            TITLE_BOTTOM
          : 0;

        // ── Page + image sizing (title height reserved at the top) ──────────
        let pdfW: number;
        let pdfH: number;
        let imgW: number;
        let imgH: number;

        if (settings.paperSize === "fit") {
          imgW =
            settings.scaleMode === "custom"
              ? img.width * (settings.customScalePct / 100)
              : img.width;
          imgH =
            settings.scaleMode === "custom"
              ? img.height * (settings.customScalePct / 100)
              : img.height;
          pdfW = imgW + MARGIN * 2;
          pdfH = imgH + MARGIN * 2 + TITLE_H;
        } else {
          const MM_TO_PX = 3.7795;
          const paper = PAPER_SIZES[settings.paperSize]!;
          const rawW = paper.w * MM_TO_PX;
          const rawH = paper.h * MM_TO_PX;
          const isLand = settings.orientation === "landscape";
          pdfW = isLand ? Math.max(rawW, rawH) : Math.min(rawW, rawH);
          pdfH = isLand ? Math.min(rawW, rawH) : Math.max(rawW, rawH);

          const usableW = pdfW - MARGIN * 2;
          // Reserve the title block at the top of the usable area.
          const usableH = pdfH - MARGIN * 2 - TITLE_H;

          if (settings.scaleMode === "fit") {
            const scale = Math.min(usableW / img.width, usableH / img.height);
            imgW = img.width * scale;
            imgH = img.height * scale;
          } else if (settings.scaleMode === "custom") {
            imgW = img.width * (settings.customScalePct / 100);
            imgH = img.height * (settings.customScalePct / 100);
          } else {
            imgW = img.width;
            imgH = img.height;
          }
        }

        const finalPdfH = pdfH;

        // Compose the title + chart onto a single canvas. Canvas text rendering
        // is far more reliable than jsPDF's text engine for multi-line headers,
        // and it guarantees the two lines always appear exactly as designed.
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(pdfW);
        canvas.height = Math.round(finalPdfH);
        const cctx = canvas.getContext("2d");
        if (!cctx) throw new Error("canvas context unavailable");

        // Background
        cctx.fillStyle = settings.bgColor;
        cctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title — two centered lines
        if (settings.includeTitle) {
          const titleX = canvas.width / 2;
          let cursorY = TITLE_TOP;
          cctx.textAlign = "center";
          cctx.textBaseline = "alphabetic";

          if (hasOrgName) {
            cctx.fillStyle = "#0f172a"; // slate-900
            cctx.font = `700 ${orgFontSize}px Helvetica, Arial, sans-serif`;
            cursorY += orgFontSize;
            cctx.fillText(settings.titleText, titleX, cursorY);
            cursorY += TITLE_GAP;
          }

          cctx.fillStyle = "#475569"; // slate-600
          cctx.font = `${hasOrgName ? 400 : 700} ${labelFontSize}px Helvetica, Arial, sans-serif`;
          cursorY += labelFontSize;
          cctx.fillText("Struktur Organisasi", titleX, cursorY);
        }

        // Chart image, centered horizontally beneath the title
        const imgX = (canvas.width - imgW) / 2;
        const imgY = TITLE_H + MARGIN;
        cctx.drawImage(img, imgX, imgY, imgW, imgH);

        const composed = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
          orientation: (pdfW > finalPdfH ? "landscape" : "portrait") as "landscape" | "portrait",
          unit: "px",
          format: [pdfW, finalPdfH],
        });
        pdf.addImage(composed, "PNG", 0, 0, pdfW, finalPdfH);

        pdf.save(
          `struktur-organisasi-${new Date().toISOString().slice(0, 10)}.pdf`,
        );
        toast.success("Bagan diunduh sebagai PDF");
      }
      setExportDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor bagan");
    } finally {
      node.style.transform = prevTransform;
      node.style.left = prevLeft;
      node.style.top = prevTop;
      setIsExporting(false);
    }
  };

  const handleOpenDottedLines = (user: Doc<"users">) => {
    setDottedLinesTarget(user);
    setDottedLinesOpen(true);
  };
  const handleOpenSuccession = (user: Doc<"users">) => {
    setSuccessionTarget(user);
    setSuccessionOpen(true);
  };
  const handleOpenSkills = (user: Doc<"users">) => {
    setSkillsTarget(user);
    setSkillsOpen(true);
  };
  const handleOpenNineBox = (user: Doc<"users">) => {
    setNineBoxTarget(user);
    setNineBoxOpen(true);
  };

  const isLoading = users === undefined || stats === undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Network className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Struktur Organisasi
          </h1>
          {myOrganization?.name ? (
            <p className="text-base font-semibold text-primary">
              {myOrganization.name}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Bagan, dotted line, suksesi, keahlian & headcount perusahaan.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Karyawan"
              value={stats?.totalEmployees ?? 0}
              tone="primary"
            />
            <StatCard
              icon={Building2}
              label="Departemen"
              value={stats?.totalDepartments ?? 0}
              tone="sky"
            />
            <StatCard
              icon={UserCog}
              label="Atasan/Manager"
              value={stats?.totalManagers ?? 0}
              tone="emerald"
            />
            <StatCard
              icon={UserMinus}
              label="Tanpa Atasan"
              value={stats?.unassignedCount ?? 0}
              tone="amber"
            />
            <StatCard
              icon={Target}
              label="Kandidat Suksesi"
              value={successionSummary?.totalPlans ?? 0}
              tone="violet"
            />
          </>
        )}
      </div>

      {/* Smart search */}
      <SmartSearch onSelectUser={handleSelectUser} />

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari karyawan, jabatan, atau departemen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterLevelCode} onValueChange={setFilterLevelCode}>
          <SelectTrigger className="w-full sm:w-56 gap-1.5">
            <Shield className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Semua Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Level Jabatan</SelectItem>
            {(positionLevels ?? []).map((pl) => (
              <SelectItem key={pl._id} value={pl.code}>
                {pl.code} — {pl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Views */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AdvancedTab)}
        className="space-y-4"
      >
        <Card className="p-0">
          <CardContent className="p-3">
            <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-1 h-auto p-0 bg-transparent w-full">
              <TabsTrigger value="chart" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <LayoutPanelLeft className="size-5" />
                <span>Bagan</span>
              </TabsTrigger>
              <TabsTrigger value="viz" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Orbit className="size-5" />
                <span>Visualisasi</span>
              </TabsTrigger>
              <TabsTrigger value="hierarchy" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <GitBranch className="size-5" />
                <span>Hierarki</span>
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <LayoutGrid className="size-5" />
                <span>Departemen</span>
              </TabsTrigger>
              <TabsTrigger value="jabatan" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <BookOpen className="size-5" />
                <span>Jabatan</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <BarChart3 className="size-5" />
                <span>Analitik</span>
              </TabsTrigger>
              <TabsTrigger value="span" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Gauge className="size-5" />
                <span>R. Kendali</span>
              </TabsTrigger>
              <TabsTrigger value="ninebox" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Grid3x3 className="size-5" />
                <span>9-Box</span>
              </TabsTrigger>
              <TabsTrigger value="jobdesk" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <FileBadge className="size-5" />
                <span>Jobdesk</span>
              </TabsTrigger>
              <TabsTrigger value="succession" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Target className="size-5" />
                <span>Suksesi</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Sparkles className="size-5" />
                <span>Keahlian</span>
              </TabsTrigger>
              <TabsTrigger value="headcount" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Briefcase className="size-5" />
                <span>Headcount</span>
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Scale className="size-5" />
                <span>Benchmark</span>
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Workflow className="size-5" />
                <span>Skenario</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Sparkles className="size-5" />
                <span>AI Insight</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <History className="size-5" />
                <span>Riwayat</span>
              </TabsTrigger>
              <TabsTrigger value="bulkio" className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Upload className="size-5" />
                <span>Import/Export</span>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="chart" ref={chartContainerRef}>
          {isAdmin ? (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-dashed bg-muted/20 p-3">
              <div>
                <Label className="text-sm font-medium">
                  Mode Tata Ulang Atasan
                </Label>
                <p className="text-xs text-muted-foreground">
                  Aktifkan lalu seret kartu ke atasan baru.
                </p>
              </div>
              <Switch
                checked={dragDropEnabled}
                onCheckedChange={setDragDropEnabled}
              />
            </div>
          ) : null}
          {isLoading ? (
            <Skeleton className="h-[640px] w-full" />
          ) : filteredTree.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Network />
                </EmptyMedia>
                <EmptyTitle>
                  {search
                    ? "Tidak ada yang cocok"
                    : "Belum ada bagan organisasi"}
                </EmptyTitle>
                <EmptyDescription>
                  {search
                    ? "Coba kata kunci lain atau hapus pencarian."
                    : "Admin perlu menetapkan atasan untuk membentuk bagan."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <OrgChartView
              nodes={filteredTree}
              onSelectUser={handleSelectUser}
              highlightUserId={currentUser?._id ?? null}
              departmentColors={departmentColors}
              allowDragDrop={isAdmin && dragDropEnabled}
              allowFreeLayout={isAdmin}
              dottedLineEdges={dottedEdges}
              orgName={myOrganization?.name}
            />
          )}
          {/* Actions below the chart canvas */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-4">
            {currentUser ? (
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => handleShowReportingLine(currentUser._id)}
              >
                <RouteIcon className="size-4" />
                Jalur Pelaporan Saya
              </Button>
            ) : null}
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="size-4" />
              Ekspor Bagan
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="viz">
          <AdvancedVizPanel
            allUsers={users ?? []}
            departmentColors={departmentColors}
            onSelectUser={handleSelectUser}
          />
        </TabsContent>

        <TabsContent value="hierarchy">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTree.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Network />
                </EmptyMedia>
                <EmptyTitle>
                  {search
                    ? "Tidak ada yang cocok"
                    : "Belum ada struktur organisasi"}
                </EmptyTitle>
                <EmptyDescription>
                  {search
                    ? "Coba kata kunci lain atau hapus pencarian."
                    : isAdmin
                      ? "Tetapkan atasan untuk setiap karyawan dari tab Departemen."
                      : "Admin belum mengatur hierarki pelaporan."}
                </EmptyDescription>
              </EmptyHeader>
              {search ? (
                <EmptyContent>
                  <button
                    onClick={() => setSearch("")}
                    className="text-sm text-primary hover:underline cursor-pointer"
                  >
                    Hapus pencarian
                  </button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <OrgTreeView
              nodes={filteredTree}
              onSelectUser={handleSelectUser}
              isAdmin={isAdmin}
              onEditManager={handleEditManager}
              highlightUserId={currentUser?._id ?? null}
            />
          )}
        </TabsContent>

        <TabsContent value="departments">
          {isLoading || officialDepartments === undefined ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          ) : groups.length === 0 && (!officialDepartments || officialDepartments.length === 0) ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 />
                </EmptyMedia>
                <EmptyTitle>Belum ada departemen</EmptyTitle>
                <EmptyDescription>
                  Isi departemen pada profil karyawan untuk melihat pengelompokan.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DepartmentView
              groups={(() => {
                // Merge official departments (may have 0 members) into groups
                const merged = [...(search
                  ? groups
                      .map((g) => ({
                        ...g,
                        members: g.members.filter((m) => {
                          const q = search.toLowerCase();
                          return (
                            (m.name ?? "").toLowerCase().includes(q) ||
                            (m.jobTitle ?? "").toLowerCase().includes(q) ||
                            (m.department ?? "").toLowerCase().includes(q)
                          );
                        }),
                      }))
                      .filter((g) => g.members.length > 0)
                  : groups)];
                // Add official departments that have no members yet
                if (officialDepartments) {
                  const existingNames = new Set(merged.map((g) => g.department));
                  for (const od of officialDepartments) {
                    if (!existingNames.has(od.department.name)) {
                      const matchesSearch = !search || od.department.name.toLowerCase().includes(search.toLowerCase());
                      if (matchesSearch) {
                        merged.push({ department: od.department.name, members: [] });
                      }
                    }
                  }
                }
                return merged;
              })()}
              officialDepartments={officialDepartments}
              allUsers={users ?? []}
              onSelectUser={handleSelectUser}
              isAdmin={isAdmin}
              onEditManager={handleEditManager}
              onAddOfficial={() => {
                setEditingDept(null);
                setDeptEditorOpen(true);
              }}
              onEditOfficial={(d) => {
                setEditingDept(d);
                setDeptEditorOpen(true);
              }}
              onDeleteOfficial={(d) => setDeletingDept(d)}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <OrgAnalyticsPanel allUsers={users ?? []} />
        </TabsContent>

        <TabsContent value="span">
          <SpanOfControlPanel
            onSelectUser={(u) => handleSelectUser(u._id)}
          />
        </TabsContent>

        <TabsContent value="ninebox">
          <NineBoxPanel
            allUsers={users ?? []}
            isAdmin={isAdmin}
            onAssessUser={handleOpenNineBox}
            onSelectUser={(u) => handleSelectUser(u._id)}
          />
        </TabsContent>

        <TabsContent value="jobdesk">
          <JobDescPanel
            allUsers={users ?? []}
            currentUser={currentUser ?? null}
            isAdmin={isAdmin}
            onSelectUser={(u) => handleSelectUser(u._id)}
          />
        </TabsContent>

        <TabsContent value="jabatan">
          <JabatanPanel isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="succession">
          <SuccessionTab
            users={users ?? []}
            onOpenPlan={handleOpenSuccession}
          />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsTab
            users={users ?? []}
            onOpenSkills={handleOpenSkills}
            onOpenDotted={handleOpenDottedLines}
          />
        </TabsContent>

        <TabsContent value="headcount">
          <HeadcountPanel allUsers={users ?? []} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="benchmark">
          <BenchmarkPanel allUsers={users ?? []} />
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenariosPanel
            allUsers={users ?? []}
            currentUserId={currentUser?._id ?? null}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="insights">
          <OrgInsightsPanel
            allUsers={users ?? []}
            onSelectUser={handleSelectUser}
          />
        </TabsContent>

        <TabsContent value="history">
          <OrgTimelinePanel />
        </TabsContent>

        <TabsContent value="bulkio">
          <BulkIOPanel isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>

      <EmployeeProfileDialog
        userId={selectedUserId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onOpenDottedLines={
          isAdmin
            ? (id) => {
                const target = (users ?? []).find((u) => u._id === id);
                if (target) handleOpenDottedLines(target);
              }
            : undefined
        }
      />

      <SetManagerDialog
        employee={managerDialogTarget}
        allUsers={users ?? []}
        open={managerDialogOpen}
        onOpenChange={(v) => {
          setManagerDialogOpen(v);
          if (!v) setManagerDialogTarget(null);
        }}
      />

      <DepartmentEditorDialog
        open={deptEditorOpen}
        onOpenChange={(v) => {
          setDeptEditorOpen(v);
          if (!v) setEditingDept(null);
        }}
        editing={editingDept}
        allUsers={users ?? []}
        existingDepartmentNames={existingDepartmentNames}
      />

      <ReportingLineDialog
        userId={reportingUserId}
        open={reportingLineOpen}
        onOpenChange={(v) => {
          setReportingLineOpen(v);
          if (!v) setReportingUserId(null);
        }}
      />

      <DottedLinesDialog
        employee={dottedLinesTarget}
        allUsers={users ?? []}
        open={dottedLinesOpen}
        onOpenChange={(v) => {
          setDottedLinesOpen(v);
          if (!v) setDottedLinesTarget(null);
        }}
        isAdmin={isAdmin}
      />

      <SuccessionDialog
        incumbent={successionTarget}
        allUsers={users ?? []}
        open={successionOpen}
        onOpenChange={(v) => {
          setSuccessionOpen(v);
          if (!v) setSuccessionTarget(null);
        }}
        isAdmin={isAdmin}
      />

      <SkillsDialog
        employee={skillsTarget}
        currentUserId={currentUser?._id ?? null}
        isAdmin={isAdmin}
        open={skillsOpen}
        onOpenChange={(v) => {
          setSkillsOpen(v);
          if (!v) setSkillsTarget(null);
        }}
      />

      <NineBoxAssessmentDialog
        employee={nineBoxTarget}
        open={nineBoxOpen}
        onOpenChange={(v) => {
          setNineBoxOpen(v);
          if (!v) setNineBoxTarget(null);
        }}
        isAdmin={isAdmin}
      />

      <AlertDialog
        open={deletingDept !== null}
        onOpenChange={(v) => !v && setDeletingDept(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus departemen?</AlertDialogTitle>
            <AlertDialogDescription>
              Departemen &ldquo;{deletingDept?.name}&rdquo; akan dihapus dari daftar
              resmi. Data karyawan tidak berubah, tetapi warna dan kepala departemen
              resmi akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDepartment}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        isExporting={isExporting}
        defaultTitle={myOrganization?.name ?? ""}
      />
    </div>
  );
}

function SuccessionTab({
  users,
  onOpenPlan,
}: {
  users: Array<Doc<"users">>;
  onOpenPlan: (user: Doc<"users">) => void;
}) {
  // Only show users who are managers (have direct reports)
  const keyPositions = useMemo(() => {
    const managerIds = new Set<string>();
    for (const u of users) {
      if (u.managerId) managerIds.add(u.managerId);
    }
    return users.filter(
      (u) => managerIds.has(u._id) || isAdminRole(u.role),
    );
  }, [users]);

  if (keyPositions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Target />
          </EmptyMedia>
          <EmptyTitle>Belum ada posisi kunci</EmptyTitle>
          <EmptyDescription>
            Tetapkan atasan agar posisi kunci muncul di sini.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {keyPositions.map((u) => (
        <SuccessionCard key={u._id} user={u} onOpenPlan={onOpenPlan} />
      ))}
    </div>
  );
}

function SuccessionCard({
  user,
  onOpenPlan,
}: {
  user: Doc<"users">;
  onOpenPlan: (user: Doc<"users">) => void;
}) {
  const plans = useQuery(api.orgAdvanced.succession.listForIncumbent, {
    incumbentId: user._id,
  });

  const count = plans?.length ?? 0;
  const readyNow = (plans ?? []).filter((p) => p.plan.readiness === "ready_now")
    .length;

  return (
    <Card
      onClick={() => onOpenPlan(user)}
      className="cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.jobTitle ?? "—"}
              {user.department ? ` · ${user.department}` : ""}
            </p>
          </div>
          <Target className="size-4 shrink-0 text-violet-500" />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="rounded-md bg-muted px-2 py-1 tabular-nums font-medium">
            {count} kandidat
          </span>
          {readyNow > 0 ? (
            <span className="rounded-md bg-emerald-500/10 px-2 py-1 tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
              {readyNow} siap
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SkillsTab({
  users,
  onOpenSkills,
  onOpenDotted,
}: {
  users: Array<Doc<"users">>;
  onOpenSkills: (user: Doc<"users">) => void;
  onOpenDotted: (user: Doc<"users">) => void;
}) {
  const matrix = useQuery(api.orgAdvanced.skills.getMatrix, {});

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-sm font-semibold">Keahlian Paling Umum</p>
            </div>
            {!matrix ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : matrix.skills.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Belum ada data keahlian
              </p>
            ) : (
              <div className="space-y-1.5">
                {matrix.skills.slice(0, 10).map((s) => (
                  <div
                    key={`${s.skill}-${s.category}`}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.skill}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {s.category} · avg Lv {s.avgLevel}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs tabular-nums">
                      <Users className="size-3" />
                      {s.holders}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              <p className="text-sm font-semibold">
                Karyawan dengan Keahlian Terbanyak
              </p>
            </div>
            {!matrix ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : matrix.topSkilledUsers.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Belum ada data keahlian
              </p>
            ) : (
              <div className="space-y-1.5">
                {matrix.topSkilledUsers.map((u) => {
                  const userDoc = users.find((x) => x._id === u.userId);
                  return (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => userDoc && onOpenSkills(userDoc)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card p-2 text-left transition-colors hover:border-primary/40 hover:bg-muted cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {userDoc?.jobTitle ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs tabular-nums text-amber-600 dark:text-amber-400">
                        {u.skillCount} keahlian · Lv {u.avgLevel}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <p className="text-sm font-semibold">Semua Karyawan</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Klik untuk kelola keahlian · Ikon ┈ untuk jalur sekunder
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-2 rounded-lg border bg-card p-2"
              >
                <button
                  type="button"
                  onClick={() => onOpenSkills(u)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {u.department ?? "—"}
                    </p>
                  </div>
                  <Sparkles className="size-4 shrink-0 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  title="Jalur sekunder"
                  onClick={() => onOpenDotted(u)}
                  className="flex size-7 items-center justify-center rounded hover:bg-muted cursor-pointer"
                >
                  <Link2 className="size-3.5 text-amber-500" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk melihat struktur organisasi.
        </div>
      </Unauthenticated>
      <Authenticated>
        <OrganizationContent />
      </Authenticated>
    </>
  );
}
