import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Wrench,
  User,
  Archive,
} from "lucide-react";
import { isAdminRole } from "@/convex/roles.ts";
import { useDebounce } from "@/hooks/use-debounce.ts";
import AssetCard from "./_components/AssetCard.tsx";
import AssetFormDialog from "./_components/AssetFormDialog.tsx";
import {
  CATEGORY_CONFIG,
  getCategoryConfig,
} from "./_lib/asset-utils.ts";
import type { EnrichedAsset } from "@/convex/assets";
import { Badge } from "@/components/ui/badge.tsx";

export default function AssetsPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const canManage = isAdminRole(currentUser?.role ?? null);

  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search.trim(), 300);
  const [tab, setTab] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EnrichedAsset | null>(null);

  const assets = useQuery(api.assets.list, {
    category: category === "all" ? undefined : category,
    search: debouncedSearch || undefined,
  });
  const stats = useQuery(api.assets.getStats, {});
  const myAssets = useQuery(api.assets.listMine, {});

  const filtered = useMemo<Array<EnrichedAsset> | undefined>(() => {
    if (!assets) return undefined;
    if (tab === "all") return assets;
    if (tab === "mine") {
      if (!myAssets) return undefined;
      return myAssets;
    }
    return assets.filter((a) => a.status === tab);
  }, [assets, tab, myAssets]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: EnrichedAsset) => {
    setEditing(a);
    setFormOpen(true);
  };

  const statCards = [
    {
      label: "Total Aset",
      value: stats?.total ?? 0,
      icon: Package,
      className: "text-primary bg-primary/10",
    },
    {
      label: "Tersedia",
      value: stats?.available ?? 0,
      icon: CheckCircle2,
      className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      label: "Ditugaskan",
      value: stats?.assigned ?? 0,
      icon: User,
      className: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    },
    {
      label: "Perbaikan",
      value: stats?.inRepair ?? 0,
      icon: Wrench,
      className: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 lg:p-8">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Package className="size-3.5" />
              Inventaris Perusahaan
            </div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl text-balance">
              Inventaris & Aset
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Kelola semua aset perusahaan: laptop, monitor, furnitur, dan
              perangkat lainnya. Tugaskan ke karyawan dan lacak riwayatnya.
            </p>
          </div>
          {canManage ? (
            <Button size="lg" className="gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Aset
            </Button>
          ) : null}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex size-11 items-center justify-center rounded-lg ${s.className}`}
              >
                <s.icon className="size-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-2xl font-bold tabular-nums">
                  {stats === undefined ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    s.value
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      {stats && stats.byCategory.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 text-sm font-medium text-muted-foreground">
              Breakdown per kategori
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.byCategory.map((c) => {
                const cfg = getCategoryConfig(c.category);
                return (
                  <Badge
                    key={c.category}
                    variant="outline"
                    className={`gap-1.5 ${cfg.bg} ${cfg.color} border-transparent`}
                  >
                    <cfg.icon className="size-3.5" />
                    {cfg.label}
                    <span className="ml-1 rounded-full bg-background/60 px-1.5 text-[10px] font-semibold">
                      {c.count}
                    </span>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari aset berdasarkan nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <cfg.icon className="size-4" />
                  {cfg.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">
            <Package className="size-4" />
            Semua
          </TabsTrigger>
          <TabsTrigger value="available">
            <CheckCircle2 className="size-4" />
            Tersedia
          </TabsTrigger>
          <TabsTrigger value="assigned">
            <User className="size-4" />
            Ditugaskan
          </TabsTrigger>
          <TabsTrigger value="in_repair">
            <Wrench className="size-4" />
            Perbaikan
          </TabsTrigger>
          <TabsTrigger value="retired">
            <Archive className="size-4" />
            Pensiun
          </TabsTrigger>
          <TabsTrigger value="mine">
            <User className="size-4" />
            Aset Saya
            {myAssets && myAssets.length > 0 ? (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                {myAssets.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-5">
          {filtered === undefined ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : (filtered ?? []).length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>
                  {tab === "mine"
                    ? "Belum ada aset untuk Anda"
                    : "Belum ada aset"}
                </EmptyTitle>
                <EmptyDescription>
                  {tab === "mine"
                    ? "Aset yang ditugaskan kepada Anda akan muncul di sini."
                    : debouncedSearch
                      ? `Tidak ada aset yang cocok dengan "${debouncedSearch}".`
                      : "Aset perusahaan akan muncul di sini."}
                </EmptyDescription>
              </EmptyHeader>
              {canManage && tab !== "mine" ? (
                <EmptyContent>
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah Aset Pertama
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(filtered ?? []).map((a) => (
                <AssetCard
                  key={a._id}
                  asset={a}
                  canManage={canManage}
                  onEdit={openEdit}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />
    </div>
  );
}
