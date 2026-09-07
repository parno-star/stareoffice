import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { useDebounce } from "@/hooks/use-debounce.ts";
import {
  Search,
  Users,
  UserX,
  LayoutGrid,
  List,
  Table as TableIcon,
  Building2,
  Network,
  Sparkles,
  Download,
  Filter,
  X,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  UserPlus,
  FileUp,
  Settings2,
  Printer,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EditProfileDialog from "./_components/EditProfileDialog.tsx";
import AddEmployeeDialog from "./_components/AddEmployeeDialog.tsx";
import ImportExcelDialog from "./_components/ImportExcelDialog.tsx";
import ManageFieldsDialog from "./_components/ManageFieldsDialog.tsx";
import DirectoryGridView from "./_components/DirectoryGridView.tsx";
import DirectoryListView from "./_components/DirectoryListView.tsx";
import DirectoryTableView from "./_components/DirectoryTableView.tsx";
import DirectoryDepartmentView from "./_components/DirectoryDepartmentView.tsx";
import DirectoryTreeView from "./_components/DirectoryTreeView.tsx";
import DirectorySkillsView from "./_components/DirectorySkillsView.tsx";
import { exportDirectoryPdf } from "./_lib/directory-utils.ts";
import type { DirectoryView } from "./_lib/directory-utils.ts";
import { formatIsoFullDate } from "@/pages/celebrations/_lib/celebrations-utils.ts";
import {
  buildOrderedColumns,
  builtInValue,
  computeAge,
  computeTenure,
  filterColumnsForViewer,
  isMasaKerjaLabel,
  isUsiaLabel,
} from "./_lib/directory-columns.ts";
import { computeCompleteness } from "./_lib/directory-completeness.ts";
import { toast } from "sonner";
import { isAdminRole } from "@/convex/roles.ts";
import { useTenant } from "@/hooks/use-tenant.ts";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [jobTitle, setJobTitle] = useState<string>("all");
  const [skill, setSkill] = useState<string>("all");
  const [hasManager, setHasManager] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [view, setView] = useState<DirectoryView>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [importExcelOpen, setImportExcelOpen] = useState(false);
  const [manageFieldsOpen, setManageFieldsOpen] = useState(false);
  // Admin-only quick filter: show only employees with incomplete data.
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  const navigate = useNavigate();
  const [debouncedSearch] = useDebounce(search, 200);

  const { organization, organizationId: tenantOrgId, isSuperAdmin } = useTenant();

  // super_admin scopes the directory to whichever organization is selected in
  // the top header switcher. The directory has no picker of its own.
  const orgIdArg =
    isSuperAdmin && tenantOrgId
      ? (tenantOrgId as Id<"organizations">)
      : undefined;

  const entries = useQuery(api.directory.listAdvanced, {
    search: debouncedSearch,
    department,
    location,
    jobTitle,
    skill,
    hasManager,
    sortBy,
    sortDir,
    organizationId: orgIdArg,
  });
  const filterOptions = useQuery(api.directory.listFilterOptions, {
    organizationId: orgIdArg,
  });
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const customFieldDefs = useQuery(api.directoryFields.list, {});
  const columnOrder = useQuery(api.directoryFields.getColumnOrder, {});
  const isAdmin = isAdminRole(currentUser?.role);

  // Compute data-completeness stats across all currently loaded employees.
  // Only meaningful for admins, who see the summary banner and quick filter.
  const completenessStats = useMemo(() => {
    if (!entries) return { total: 0, incomplete: 0, percent: 100 };
    const defs = customFieldDefs ?? [];
    let complete = 0;
    for (const e of entries) {
      if (computeCompleteness(e.user, defs).isComplete) complete++;
    }
    const total = entries.length;
    return {
      total,
      incomplete: total - complete,
      percent: total === 0 ? 100 : Math.round((complete / total) * 100),
    };
  }, [entries, customFieldDefs]);

  // Apply the admin-only "incomplete data" quick filter on top of the query.
  const visibleEntries = useMemo(() => {
    if (!entries) return entries;
    if (!incompleteOnly) return entries;
    const defs = customFieldDefs ?? [];
    return entries.filter(
      (e) => !computeCompleteness(e.user, defs).isComplete,
    );
  }, [entries, customFieldDefs, incompleteOnly]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (department !== "all") n++;
    if (location !== "all") n++;
    if (jobTitle !== "all") n++;
    if (skill !== "all") n++;
    if (hasManager !== "all") n++;
    return n;
  }, [department, location, jobTitle, skill, hasManager]);

  const clearFilters = () => {
    setDepartment("all");
    setLocation("all");
    setJobTitle("all");
    setSkill("all");
    setHasManager("all");
  };

  const openProfile = (id: Id<"users">) => {
    navigate(`/directory/${id}`);
  };

  const handleExportExcel = async () => {
    if (!entries || entries.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    toast.info("Memproses ekspor...");
    try {
      const XLSX = await import("xlsx");
      const orderedColumns = filterColumnsForViewer(
        buildOrderedColumns(customFieldDefs ?? [], columnOrder ?? []),
        isAdmin,
      );
      // Build rows following the same column order shown in the table.
      const data = entries.map((e, index) => {
        const user = e.user;
        const row: Record<string, string> = {};
        for (const col of orderedColumns) {
          if (col.kind === "builtin") {
            const label = col.builtin.label;
            if (col.builtin.key === "no") {
              row[label] = String(index + 1);
              continue;
            }
            const raw = builtInValue(user, col.builtin.key, e.managerName);
            row[label] =
              raw && raw.trim().length > 0
                ? col.builtin.type === "date"
                  ? formatIsoFullDate(raw)
                  : raw
                : "-";
          } else {
            if (isMasaKerjaLabel(col.custom.label)) {
              // Always computed from the start date, never the stored value.
              row[col.custom.label] = computeTenure(user.startDate) ?? "-";
              continue;
            }
            if (isUsiaLabel(col.custom.label)) {
              // Always computed from the date of birth, never the stored value.
              row[col.custom.label] = computeAge(user.dateOfBirth) ?? "-";
              continue;
            }
            const raw = (user.customFields ?? {})[col.custom._id];
            row[col.custom.label] =
              raw && raw.trim().length > 0
                ? col.custom.type === "date"
                  ? formatIsoFullDate(raw)
                  : raw
                : "-";
          }
        }
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = orderedColumns.map((col) =>
        col.kind === "builtin" && col.builtin.key === "no"
          ? { wch: 6 }
          : col.kind === "builtin" && col.builtin.key === "nama"
            ? { wch: 24 }
            : { wch: 18 },
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Direktori Karyawan");
      const date = new Date().toISOString().slice(0, 10);
      const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbOut], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      // Try standard download link approach
      const a = document.createElement("a");
      a.href = url;
      a.download = `direktori-karyawan-${date}.xlsx`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      // Also try window.open for iframe/sandbox environments
      try {
        window.open(url, "_blank");
      } catch {
        // Ignore if blocked
      }
      // Delay cleanup to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      toast.success(`Berhasil mengekspor ${entries.length} karyawan`);
    } catch (error) {
      console.error("Export Excel error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal mengekspor Excel: ${msg}`);
    }
  };

  const isLoading = entries === undefined || filterOptions === undefined;

  const handlePrintPdf = async () => {
    if (!entries || entries.length === 0) {
      toast.error("Tidak ada data untuk dicetak");
      return;
    }
    toast.info("Menyiapkan PDF...");
    try {
      await exportDirectoryPdf(
        entries,
        organization?.name,
        isAdmin ? (customFieldDefs ?? []) : [],
      );
      toast.success(`PDF berhasil dibuat (${entries.length} karyawan)`);
    } catch (error) {
      console.error("Export PDF error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Gagal membuat PDF: ${msg}`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-5 md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15">
              <Users className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Direktori Karyawan
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Cari, jelajahi, dan terhubung dengan rekan kerja di seluruh
                perusahaan.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            {isAdmin ? (
              <>
                <Button size="sm" className="gap-1.5" onClick={() => setAddEmployeeOpen(true)}>
                  <UserPlus className="size-4" />
                  Tambah Karyawan
                </Button>
                <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setImportExcelOpen(true)}>
                  <FileUp className="size-4" />
                  Impor Excel
                </Button>
                <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setManageFieldsOpen(true)}>
                  <Settings2 className="size-4" />
                  Kelola Field
                </Button>
              </>
            ) : null}
            {currentUser ? <EditProfileDialog currentUser={currentUser} /> : null}
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 cursor-pointer"
              onClick={() => { void handleExportExcel(); }}
            >
              <Download className="size-4" />
              Ekspor Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 cursor-pointer"
              onClick={() => { void handlePrintPdf(); }}
            >
              <Printer className="size-4" />
              Cetak PDF
            </Button>
          </div>
        </div>

        {/* Quick stats — hidden for super admin */}
        {!isSuperAdmin ? (
          <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBadge
              icon={<Users className="size-4" />}
              label="Total Karyawan"
              value={filterOptions?.totalEmployees ?? 0}
              loading={isLoading}
            />
            <StatBadge
              icon={<Building2 className="size-4" />}
              label="Departemen"
              value={filterOptions?.departments?.length ?? 0}
              loading={isLoading}
            />
            <StatBadge
              icon={<MapPin className="size-4" />}
              label="Lokasi"
              value={filterOptions?.locations?.length ?? 0}
              loading={isLoading}
            />
            <StatBadge
              icon={<Sparkles className="size-4" />}
              label="Keahlian Unik"
              value={filterOptions?.skills?.length ?? 0}
              loading={isLoading}
            />
          </div>
        ) : null}
      </div>

      <DataAccessBanner category="directory" />

      {/* Search & filters */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, jabatan, email, departemen, keahlian..."
                className="pl-9"
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <SlidersHorizontal className="size-4" />
                    Filter Lanjutan
                    {activeFilterCount > 0 ? (
                      <Badge
                        variant="default"
                        className="ml-1 h-5 px-1.5 text-xs"
                      >
                        {activeFilterCount}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 space-y-3" align="end">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Filter</p>
                    {activeFilterCount > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={clearFilters}
                      >
                        Reset
                      </Button>
                    ) : null}
                  </div>

                  <FilterSelect
                    label="Departemen"
                    value={department}
                    onChange={setDepartment}
                    options={filterOptions?.departments ?? []}
                    placeholder="Semua Departemen"
                  />
                  <FilterSelect
                    label="Lokasi"
                    value={location}
                    onChange={setLocation}
                    options={filterOptions?.locations ?? []}
                    placeholder="Semua Lokasi"
                  />
                  <FilterSelect
                    label="Jabatan"
                    value={jobTitle}
                    onChange={setJobTitle}
                    options={filterOptions?.jobTitles ?? []}
                    placeholder="Semua Jabatan"
                  />
                  <FilterSelect
                    label="Keahlian"
                    value={skill}
                    onChange={setSkill}
                    options={
                      filterOptions?.skills.map((s) => ({
                        value: s.value,
                        count: s.count,
                      })) ?? []
                    }
                    placeholder="Semua Keahlian"
                  />
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Atasan
                    </p>
                    <Select value={hasManager} onValueChange={setHasManager}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="yes">Memiliki atasan</SelectItem>
                        <SelectItem value="no">Tanpa atasan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    <ArrowUpDown className="size-4" />
                    Urut
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Urutkan berdasarkan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setSortBy("name")}
                  >
                    Nama {sortBy === "name" ? "✓" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setSortBy("department")}
                  >
                    Departemen {sortBy === "department" ? "✓" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setSortBy("jobTitle")}
                  >
                    Jabatan {sortBy === "jobTitle" ? "✓" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setSortBy("reports")}
                  >
                    Jumlah Bawahan {sortBy === "reports" ? "✓" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      setSortDir(sortDir === "asc" ? "desc" : "asc")
                    }
                  >
                    {sortDir === "asc" ? "Naik (A-Z)" : "Turun (Z-A)"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">
                <Filter className="mr-1 inline size-3" />
                Aktif:
              </span>
              {department !== "all" ? (
                <FilterChip
                  label={`Dept: ${department}`}
                  onClear={() => setDepartment("all")}
                />
              ) : null}
              {location !== "all" ? (
                <FilterChip
                  label={`Lokasi: ${location}`}
                  onClear={() => setLocation("all")}
                />
              ) : null}
              {jobTitle !== "all" ? (
                <FilterChip
                  label={`Jabatan: ${jobTitle}`}
                  onClear={() => setJobTitle("all")}
                />
              ) : null}
              {skill !== "all" ? (
                <FilterChip
                  label={`Keahlian: ${skill}`}
                  onClear={() => setSkill("all")}
                />
              ) : null}
              {hasManager !== "all" ? (
                <FilterChip
                  label={
                    hasManager === "yes" ? "Memiliki atasan" : "Tanpa atasan"
                  }
                  onClear={() => setHasManager("all")}
                />
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Admin data-completeness summary banner */}
      {isAdmin && !isLoading && completenessStats.total > 0 ? (
        completenessStats.incomplete > 0 ? (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    {completenessStats.incomplete} dari {completenessStats.total}{" "}
                    karyawan datanya belum lengkap
                  </p>
                  <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
                    Kelengkapan data keseluruhan: {completenessStats.percent}%.
                    Lengkapi data yang kosong agar direktori lebih akurat.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={incompleteOnly ? "default" : "secondary"}
                className="shrink-0 gap-1.5"
                onClick={() => setIncompleteOnly((v) => !v)}
              >
                <Filter className="size-4" />
                {incompleteOnly
                  ? "Tampilkan semua"
                  : "Tampilkan yang belum lengkap"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <CheckCircle2 className="size-5" />
              </div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Semua data karyawan sudah lengkap. Kerja bagus!
              </p>
            </CardContent>
          </Card>
        )
      ) : null}

      {/* View tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as DirectoryView)}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-1.5">
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Kartu</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="size-4" />
              <span className="hidden sm:inline">Daftar</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5">
              <TableIcon className="size-4" />
              <span className="hidden sm:inline">Tabel</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-1.5">
              <Building2 className="size-4" />
              <span className="hidden sm:inline">Departemen</span>
            </TabsTrigger>
            <TabsTrigger value="tree" className="gap-1.5">
              <Network className="size-4" />
              <span className="hidden sm:inline">Hierarki</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-1.5">
              <Sparkles className="size-4" />
              <span className="hidden sm:inline">Keahlian</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {visibleEntries !== undefined ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {visibleEntries.length}
            </span>{" "}
            karyawan ditemukan
            {incompleteOnly ? " (belum lengkap)" : ""}
          </p>
        ) : null}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : visibleEntries === undefined || visibleEntries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {debouncedSearch || activeFilterCount > 0 || incompleteOnly ? (
                <UserX />
              ) : (
                <Users />
              )}
            </EmptyMedia>
            <EmptyTitle>
              {incompleteOnly
                ? "Semua data sudah lengkap"
                : debouncedSearch || activeFilterCount > 0
                  ? "Tidak ada hasil"
                  : "Belum ada karyawan"}
            </EmptyTitle>
            <EmptyDescription>
              {incompleteOnly
                ? "Tidak ada karyawan dengan data yang belum lengkap pada tampilan ini."
                : debouncedSearch || activeFilterCount > 0
                  ? "Coba ubah kata kunci atau filter Anda."
                  : "Ajak rekan kerja untuk bergabung dan lengkapi profil mereka."}
            </EmptyDescription>
          </EmptyHeader>
          {incompleteOnly ? (
            <EmptyContent>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIncompleteOnly(false)}
              >
                Tampilkan semua karyawan
              </Button>
            </EmptyContent>
          ) : activeFilterCount > 0 || debouncedSearch ? (
            <EmptyContent>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch("");
                  clearFilters();
                }}
              >
                Reset semua filter
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <>
          {view === "grid" ? (
            <DirectoryGridView
              entries={visibleEntries}
              onSelect={openProfile}
              currentUserId={currentUser?._id ?? null}
              canManage={isAdmin}
              customFieldDefs={customFieldDefs ?? []}
            />
          ) : null}
          {view === "list" ? (
            <DirectoryListView
              entries={visibleEntries}
              onSelect={openProfile}
              currentUserId={currentUser?._id ?? null}
              canManage={isAdmin}
              customFieldDefs={customFieldDefs ?? []}
            />
          ) : null}
          {view === "table" ? (
            <DirectoryTableView
              entries={visibleEntries}
              onSelect={openProfile}
              currentUserId={currentUser?._id ?? null}
              canManage={isAdmin}
              customFieldDefs={customFieldDefs ?? []}
              columnOrder={columnOrder ?? []}
            />
          ) : null}
          {view === "departments" ? (
            <DirectoryDepartmentView entries={visibleEntries} onSelect={openProfile} />
          ) : null}
          {view === "tree" ? (
            <DirectoryTreeView entries={visibleEntries} onSelect={openProfile} />
          ) : null}
          {view === "skills" ? (
            <DirectorySkillsView
              entries={visibleEntries}
              onSelect={openProfile}
              onPickSkill={(s) => {
                setSkill(s);
                setView("grid");
              }}
            />
          ) : null}
        </>
      )}

      <AddEmployeeDialog
        open={addEmployeeOpen}
        onOpenChange={setAddEmployeeOpen}
      />
      <ImportExcelDialog
        open={importExcelOpen}
        onOpenChange={setImportExcelOpen}
        entries={entries}
      />
      <ManageFieldsDialog
        open={manageFieldsOpen}
        onOpenChange={setManageFieldsOpen}
      />
    </div>
  );
}

function StatBadge({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-background/60 px-3 py-2.5 backdrop-blur">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="h-5 w-10" />
        ) : (
          <p className="text-lg font-bold leading-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; count: number }>;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate">{opt.value}</span>
                <span className="text-xs text-muted-foreground">
                  ({opt.count})
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {label}
      <button
        onClick={onClear}
        className="cursor-pointer rounded-full p-0.5 hover:bg-primary/20"
        aria-label="Hapus filter"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
