import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
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
  ScrollText,
  Plus,
  Search,
  Pin,
  AlertCircle,
  FileEdit,
  CheckCircle2,
  ShieldCheck,
  Library,
} from "lucide-react";
import { isAdminRole } from "@/convex/roles.ts";
import { useDebounce } from "@/hooks/use-debounce.ts";
import PolicyCard from "./_components/PolicyCard.tsx";
import PolicyEditorDialog from "./_components/PolicyEditorDialog.tsx";
import { POLICY_CATEGORIES } from "./_lib/policy-utils.ts";
import type { PolicyListItem } from "@/convex/policies.ts";

function PoliciesContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const canManage = isAdminRole(currentUser?.role ?? null);

  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search.trim(), 300);
  const [tab, setTab] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PolicyListItem | null>(null);

  const policies = useQuery(api.policies.list, {
    category: category === "all" ? undefined : category,
    search: debouncedSearch || undefined,
    includeDrafts: canManage,
  });
  const stats = useQuery(api.policies.getStats, {});
  const editingPolicyDetail = useQuery(
    api.policies.getById,
    editing ? { policyId: editing._id } : "skip",
  );

  const filtered = useMemo<Array<PolicyListItem> | undefined>(() => {
    if (!policies) return undefined;
    if (tab === "pinned") return policies.filter((p) => p.isPinned);
    if (tab === "pending")
      return policies.filter(
        (p) => p.requiresAcknowledgment && !p.hasAcknowledged && p.status === "published",
      );
    if (tab === "drafts") return policies.filter((p) => p.status === "draft");
    return policies.filter(
      (p) => p.status === "published" || (canManage && p.status === "draft"),
    );
  }, [policies, tab, canManage]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (p: PolicyListItem) => {
    setEditing(p);
    setEditorOpen(true);
  };

  const statCards = [
    {
      label: "Total Kebijakan",
      value: stats?.totalPublished ?? 0,
      icon: Library,
      className: "text-primary bg-primary/10",
    },
    {
      label: "Wajib Dikonfirmasi",
      value: stats?.totalRequiringAck ?? 0,
      icon: ShieldCheck,
      className: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
    },
    {
      label: canManage ? "Diperbarui (30 hari)" : "Sudah Saya Setujui",
      value: canManage
        ? (stats?.recentlyUpdated ?? 0)
        : (stats?.myAcknowledged ?? 0),
      icon: CheckCircle2,
      className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      label: "Butuh Konfirmasi Saya",
      value: stats?.myPending ?? 0,
      icon: AlertCircle,
      className: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 lg:p-8">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ScrollText className="size-3.5" />
              Pusat Kebijakan Perusahaan
            </div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl text-balance">
              Kebijakan Perusahaan
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Baca, pahami, dan konfirmasi kebijakan perusahaan yang berlaku.
              Versi terbaru ditampilkan di bagian atas.
            </p>
          </div>
          {canManage ? (
            <Button size="lg" className="gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              Buat Kebijakan Baru
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
            placeholder="Cari kebijakan berdasarkan judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {POLICY_CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  <span className="flex items-center gap-2">
                    <c.icon className="size-4" />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="all" className="gap-1.5">
            <Library className="size-4" />
            Semua
          </TabsTrigger>
          <TabsTrigger value="pinned" className="gap-1.5">
            <Pin className="size-4" />
            Disematkan
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <AlertCircle className="size-4" />
            Butuh Konfirmasi
            {stats?.myPending ? (
              <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                {stats.myPending}
              </span>
            ) : null}
          </TabsTrigger>
          {canManage ? (
            <TabsTrigger value="drafts" className="gap-1.5">
              <FileEdit className="size-4" />
              Draf
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value={tab} className="mt-5">
          {filtered === undefined ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ScrollText />
                </EmptyMedia>
                <EmptyTitle>
                  {tab === "pending"
                    ? "Semua kebijakan sudah dikonfirmasi"
                    : "Belum ada kebijakan"}
                </EmptyTitle>
                <EmptyDescription>
                  {debouncedSearch
                    ? `Tidak ada kebijakan yang cocok dengan "${debouncedSearch}".`
                    : tab === "pending"
                      ? "Kerja bagus! Tidak ada kebijakan yang menunggu konfirmasi Anda."
                      : "Kebijakan perusahaan akan muncul di sini setelah admin mempublikasikannya."}
                </EmptyDescription>
              </EmptyHeader>
              {canManage && tab !== "pending" ? (
                <EmptyContent>
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Buat Kebijakan Pertama
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((p) => (
                <PolicyCard
                  key={p._id}
                  policy={p}
                  canManage={canManage}
                  onEdit={openEdit}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PolicyEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        fullPolicy={editing ? editingPolicyDetail ?? null : null}
      />
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-4 p-4 lg:p-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk melihat kebijakan perusahaan.
        </div>
      </Unauthenticated>
      <Authenticated>
        <PoliciesContent />
      </Authenticated>
    </>
  );
}
