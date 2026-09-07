import { useState, useCallback } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import { DateField } from "@/components/ui/date-field.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Download,
  FileText,
  Activity,
  BarChart3,
  Users,
  Clock,
  Filter,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Send,
  RotateCcw,
  Banknote,
  CircleX,
  FilePlus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import Papa from "papaparse";
import {
  getActionConfig,
  formatTimestamp,
  formatCurrency,
  AUDIT_ACTION_OPTIONS,
} from "./_lib/audit-utils.ts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <FilePlus className="size-3.5" />,
  submitted: <Send className="size-3.5" />,
  approved: <CheckCircle2 className="size-3.5" />,
  rejected: <XCircle className="size-3.5" />,
  revision_requested: <RotateCcw className="size-3.5" />,
  resubmitted: <RefreshCw className="size-3.5" />,
  disbursed: <Banknote className="size-3.5" />,
  cancelled: <CircleX className="size-3.5" />,
};

const PIE_COLORS = [
  "#3b82f6", "#10b981", "#ef4444", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ec4899", "#6366f1",
];

export default function FinanceAuditPage() {
  const [activeTab, setActiveTab] = useState("log");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Stats query
  const stats = useQuery(api.financeAuditLog.getAuditStats, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Paginated audit logs
  const { results, status, loadMore } = usePaginatedQuery(
    api.financeAuditLog.listAuditLogs,
    {
      actionFilter: actionFilter !== "all" ? actionFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    { initialNumItems: 25 },
  );

  // Export data query
  const exportData = useQuery(api.financeAuditLog.getAuditLogsForExport, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    actionFilter: actionFilter !== "all" ? actionFilter : undefined,
  });

  const handleExportCSV = useCallback(() => {
    if (!exportData || exportData.length === 0) return;

    const mapped = exportData.map((log) => ({
      "Waktu": new Date(log.timestamp).toLocaleString("id-ID"),
      "Aksi": getActionConfig(log.action).label,
      "Pelaku": log.actorName,
      "Peran": log.actorRole ?? "-",
      "Level": log.approvalLevel ?? "-",
      "Judul Pengajuan": log.requestTitle,
      "Jumlah": log.requestAmount,
      "Status": log.requestStatus,
      "Kategori": log.requestCategory,
      "Tipe": log.requestType ?? "-",
      "Pengaju": log.submitterName ?? "-",
      "Departemen": log.submitterDepartment ?? "-",
      "Catatan": log.note ?? "-",
    }));

    const csv = Papa.unparse(mapped, { quotes: true });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-trail-keuangan-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportData]);

  // Prepare chart data
  const actionPieData = stats
    ? Object.entries(stats.byAction).map(([action, count]) => ({
        name: getActionConfig(action).label,
        value: count,
        action,
      }))
    : [];

  const monthlyBarData = stats
    ? Object.entries(stats.byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, actions]) => {
          const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
          const [y, m] = month.split("-");
          const label = `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
          return {
            month: label,
            total: Object.values(actions).reduce((s, c) => s + c, 0),
            approved: actions["approved"] ?? 0,
            rejected: actions["rejected"] ?? 0,
            submitted: actions["submitted"] ?? 0,
          };
        })
    : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Riwayat lengkap setiap aksi pada pengajuan dana
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 cursor-pointer"
          onClick={handleExportCSV}
          disabled={!exportData || exportData.length === 0}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="size-4 text-muted-foreground shrink-0" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48 cursor-pointer">
                  <SelectValue placeholder="Semua aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">Semua Aksi</SelectItem>
                  {AUDIT_ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground shrink-0" />
              <DateField
                value={dateFrom}
                onChange={(v) => setDateFrom(v)}
                className="w-40"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <DateField
                value={dateTo}
                onChange={(v) => setDateTo(v)}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="log" className="gap-1.5 cursor-pointer">
            <FileText className="size-4" />
            Log Aktivitas
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5 cursor-pointer">
            <BarChart3 className="size-4" />
            Statistik
          </TabsTrigger>
        </TabsList>

        {/* Log Tab */}
        <TabsContent value="log" className="space-y-4 mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Event</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {stats ? stats.totalEvents : <Skeleton className="h-7 w-16" />}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Disetujui</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {stats ? (stats.byAction["approved"] ?? 0) : <Skeleton className="h-7 w-16" />}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Ditolak</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {stats ? (stats.byAction["rejected"] ?? 0) : <Skeleton className="h-7 w-16" />}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Rata-rata Resolusi</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {stats ? (
                    stats.avgResolutionHours !== null
                      ? `${stats.avgResolutionHours}j`
                      : "—"
                  ) : <Skeleton className="h-7 w-16" />}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit log table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Waktu</TableHead>
                    <TableHead className="w-28">Aksi</TableHead>
                    <TableHead className="w-40">Pelaku</TableHead>
                    <TableHead>Pengajuan</TableHead>
                    <TableHead className="w-32 text-right">Jumlah</TableHead>
                    <TableHead className="w-24 text-center">Level</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results === undefined || results.length === 0 ? (
                    results === undefined ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                          Belum ada data audit trail
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    results.map((log) => {
                      const actionCfg = getActionConfig(log.action);
                      return (
                        <TableRow key={log._id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] gap-1",
                                actionCfg.bg,
                                actionCfg.color,
                                actionCfg.border,
                              )}
                            >
                              {ACTION_ICONS[log.action]}
                              {actionCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarImage src={log.actorAvatar ?? undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {getInitials(log.actorName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium truncate max-w-24">
                                {log.actorName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-40">
                            {log.requestTitle}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium">
                            {formatCurrency(log.requestAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {log.approvalLevel ? (
                              <Badge variant="secondary" className="text-[10px]">
                                L{log.approvalLevel}
                              </Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-32">
                            {log.note ?? "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {status === "CanLoadMore" && (
              <div className="p-4 border-t text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="cursor-pointer"
                  onClick={() => loadMore(25)}
                >
                  Muat Lebih Banyak
                </Button>
              </div>
            )}
            {status === "LoadingMore" && (
              <div className="p-4 border-t text-center">
                <Skeleton className="h-8 w-32 mx-auto" />
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Action distribution pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="size-4" />
                  Distribusi Aksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {actionPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={actionPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => {
                          const val = typeof percent === "number" && !isNaN(percent) ? percent * 100 : 0;
                          return `${name} ${val.toFixed(0)}%`;
                        }}
                      >
                        {actionPieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    Belum ada data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly trend bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Tren Bulanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyBarData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="submitted" name="Diajukan" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="approved" name="Disetujui" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="rejected" name="Ditolak" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    Belum ada data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top actors */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="size-4" />
                  Pelaku Paling Aktif
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && stats.topActors.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {stats.topActors.map((actor, idx) => (
                      <div
                        key={actor.id}
                        className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5"
                      >
                        <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{actor.name}</p>
                          <p className="text-[10px] text-muted-foreground">{actor.count} aksi</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Belum ada data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
