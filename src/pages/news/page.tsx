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
  Newspaper,
  Plus,
  Search,
  Pin,
  AlertTriangle,
  FileEdit,
  TrendingUp,
} from "lucide-react";
import { isAdminRole } from "@/convex/roles.ts";
import { useDebounce } from "@/hooks/use-debounce.ts";
import NewsCard from "./_components/NewsCard.tsx";
import NewsEditorDialog from "./_components/NewsEditorDialog.tsx";
import { CATEGORIES, PRIORITY_META } from "./_lib/news-utils.ts";
import type { EnrichedAnnouncement } from "@/convex/announcements";

export default function NewsPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const canManage = isAdminRole(currentUser?.role ?? null);

  const [category, setCategory] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search.trim(), 300);
  const [tab, setTab] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EnrichedAnnouncement | null>(null);

  const newsList = useQuery(api.announcements.listNews, {
    category: category === "all" ? undefined : category,
    priority: priority === "all" ? undefined : priority,
    search: debouncedSearch || undefined,
    includeDrafts: canManage,
  });
  const stats = useQuery(api.announcements.getStats, {});

  const filtered = useMemo<Array<EnrichedAnnouncement> | undefined>(() => {
    if (!newsList) return undefined;
    if (tab === "pinned") return newsList.filter((n) => n.isPinned);
    if (tab === "urgent") return newsList.filter((n) => n.priority === "urgent");
    if (tab === "drafts")
      return newsList.filter((n) => (n.status ?? "published") === "draft");
    return newsList.filter((n) => (n.status ?? "published") === "published");
  }, [newsList, tab]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (n: EnrichedAnnouncement) => {
    setEditing(n);
    setEditorOpen(true);
  };

  const statCards = [
    {
      label: "Total Berita",
      value: stats?.totalPublished ?? 0,
      icon: Newspaper,
      className: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    },
    {
      label: "30 Hari Terakhir",
      value: stats?.totalThisMonth ?? 0,
      icon: TrendingUp,
      className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      label: "Disematkan",
      value: stats?.totalPinned ?? 0,
      icon: Pin,
      className: "text-primary bg-primary/10",
    },
    {
      label: "Mendesak",
      value: stats?.totalUrgent ?? 0,
      icon: AlertTriangle,
      className: "text-red-600 dark:text-red-400 bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 lg:p-8">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Newspaper className="size-3.5" />
              Pusat Informasi Internal
            </div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl text-balance">
              Berita & Pengumuman
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Tetap terhubung dengan berita terbaru, pengumuman penting, dan
              update perusahaan.
            </p>
          </div>
          {canManage ? (
            <Button size="lg" className="gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              Buat Berita Baru
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

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari berita berdasarkan judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  <span className="flex items-center gap-2">
                    <c.icon className="size-4" />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prioritas</SelectItem>
              {Object.entries(PRIORITY_META).map(([key, meta]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <meta.icon className="size-4" />
                    {meta.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">
            <Newspaper className="size-4" />
            Semua
          </TabsTrigger>
          <TabsTrigger value="pinned">
            <Pin className="size-4" />
            Disematkan
          </TabsTrigger>
          <TabsTrigger value="urgent">
            <AlertTriangle className="size-4" />
            Mendesak
          </TabsTrigger>
          {canManage ? (
            <TabsTrigger value="drafts">
              <FileEdit className="size-4" />
              Draf {stats?.totalDrafts ? `(${stats.totalDrafts})` : ""}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value={tab} className="mt-5">
          {filtered === undefined ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Newspaper />
                </EmptyMedia>
                <EmptyTitle>Belum ada berita</EmptyTitle>
                <EmptyDescription>
                  {debouncedSearch
                    ? `Tidak ada berita yang cocok dengan "${debouncedSearch}".`
                    : "Berita dan pengumuman perusahaan akan muncul di sini."}
                </EmptyDescription>
              </EmptyHeader>
              {canManage ? (
                <EmptyContent>
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Buat Berita Pertama
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((n, idx) => (
                <NewsCard
                  key={n._id}
                  news={n}
                  canManage={canManage}
                  canEditOwn={n.authorId === currentUser?._id}
                  onEdit={openEdit}
                  featured={idx === 0 && !!n.isPinned && filtered.length > 1}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewsEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
      />
    </div>
  );
}
