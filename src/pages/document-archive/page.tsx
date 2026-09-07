import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty.tsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import {
  Archive, Search, Download, Send, ArrowLeftRight, FileText, Inbox, Eye,
  ShieldCheck, History, Lock, Info,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { LetterTypeBadge, LetterStatusBadge } from "@/pages/letters/_components/LetterStatusBadge.tsx";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";
import { ROLE_LABELS, isAdminRole, isRole } from "@/convex/roles.ts";

type ArchivedLetter = Doc<"letters"> & { archiveUrl: string | null };

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Semua Jenis" },
  { value: "keluar", label: "Surat Keluar" },
  { value: "internal", label: "Internal" },
  { value: "memo", label: "Nota" },
  { value: "masuk", label: "Surat Masuk" },
];

function typeIcon(type: string) {
  if (type === "masuk") return <Inbox className="size-4 text-teal-600" />;
  if (type === "keluar") return <Send className="size-4 text-blue-600" />;
  if (type === "memo") return <FileText className="size-4 text-violet-600" />;
  return <ArrowLeftRight className="size-4 text-orange-600" />;
}

export default function DocumentArchivePage() {
  return (
    <Authenticated>
      <DocumentArchiveContent />
    </Authenticated>
  );
}

function DocumentArchiveContent() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const canSeeAudit = isAdminRole(currentUser?.role ?? null);

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
          <Archive className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Arsip Dokumen</h1>
          <p className="text-xs text-muted-foreground">
            Pusat arsip surat final beserta salinan PDF permanen dan jejak audit akses.
          </p>
        </div>
      </div>

      <DataAccessBanner category="letters" className="mb-3" />

      {/* GCG note */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p className="text-xs">
          Arsip ini bersifat <span className="font-semibold">baca-saja (read-only)</span> demi menjaga
          integritas dokumen (GCG). Isi surat final tidak dapat diubah. Setiap akses buka dan unduh
          arsip tercatat pada jejak audit.
        </p>
      </div>

      {canSeeAudit ? (
        <Tabs defaultValue="archive" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mb-3 w-full justify-start sm:w-auto">
            <TabsTrigger value="archive" className="cursor-pointer gap-1.5">
              <Archive className="size-4" /> Arsip Surat
            </TabsTrigger>
            <TabsTrigger value="audit" className="cursor-pointer gap-1.5">
              <History className="size-4" /> Jejak Audit
            </TabsTrigger>
          </TabsList>
          <TabsContent value="archive" className="flex-1 overflow-hidden">
            <ArchiveList />
          </TabsContent>
          <TabsContent value="audit" className="flex-1 overflow-hidden">
            <AuditTrail />
          </TabsContent>
        </Tabs>
      ) : (
        <ArchiveList />
      )}
    </div>
  );
}

function ArchiveList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const logAccess = useMutation(api.letters.logArchiveAccess);

  const { results, status, loadMore } = usePaginatedQuery(
    api.letters.listArchivedLetters,
    {
      type: typeFilter === "all" ? undefined : typeFilter,
      search: search.trim() || undefined,
    },
    { initialNumItems: 30 },
  );

  const openDetail = (letter: ArchivedLetter) => {
    void logAccess({ letterId: letter._id, action: "view" });
    navigate(`/letters?letterId=${letter._id}`);
  };

  const download = (letter: ArchivedLetter) => {
    if (!letter.archiveUrl) {
      toast.error("Arsip PDF belum tersedia untuk surat ini.");
      return;
    }
    void logAccess({ letterId: letter._id, action: "download" });
    const a = document.createElement("a");
    a.href = letter.archiveUrl;
    a.download = letter.archivePdfName ?? `${letter.subject}.pdf`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari perihal / no. surat / no. agenda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {results === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Archive />
              </EmptyMedia>
              <EmptyTitle>Belum ada surat di arsip</EmptyTitle>
              <EmptyDescription>
                Surat yang sudah dikirim atau difinalkan akan muncul di sini beserta salinan PDF-nya.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-2">
            {results.map((letter: ArchivedLetter) => (
              <div
                key={letter._id}
                className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {typeIcon(letter.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium">{letter.subject}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {format(new Date(letter.letterDate), "d MMM yyyy", { locale: localeId })}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {letter.type === "masuk" ? `Dari: ${letter.fromName}` : `Kepada: ${letter.toName}`}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <LetterTypeBadge type={letter.type} />
                    <LetterStatusBadge status={letter.status} />
                    <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                      <Lock className="size-2.5" /> Terkunci
                    </Badge>
                    {letter.letterNumber && (
                      <Badge variant="outline" className="text-[10px]">{letter.letterNumber}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 cursor-pointer"
                    onClick={() => openDetail(letter)}
                    title="Lihat detail surat"
                  >
                    <Eye className="size-4" />
                    <span className="hidden sm:inline">Detail</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 cursor-pointer"
                    disabled={!letter.archiveUrl}
                    onClick={() => download(letter)}
                    title="Unduh Arsip PDF"
                  >
                    <Download className="size-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                </div>
              </div>
            ))}
            {status === "CanLoadMore" && (
              <div className="pt-1">
                <Button
                  variant="ghost"
                  className="w-full cursor-pointer"
                  size="sm"
                  onClick={() => loadMore(30)}
                >
                  Muat lebih banyak
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type AuditRow = Doc<"letterArchiveAudit"> & {
  actorName: string | null;
  actorRole: string | null;
};

function roleLabel(role: string | null): string | null {
  if (!role) return null;
  return isRole(role) ? ROLE_LABELS[role] : role;
}

function AuditTrail() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.letters.listArchiveAudit,
    {},
    { initialNumItems: 40 },
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p className="text-xs">
          Catatan akses arsip: siapa yang membuka atau mengunduh salinan PDF surat final, dan kapan.
          Digunakan untuk kebutuhan audit dan akuntabilitas (GCG). Catatan tidak dapat diubah.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <History />
              </EmptyMedia>
              <EmptyTitle>Belum ada aktivitas akses arsip</EmptyTitle>
              <EmptyDescription>
                Setiap kali seseorang membuka atau mengunduh arsip dokumen, catatannya akan muncul di sini.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-2">
            {results.map((row: AuditRow) => {
              const isDownload = row.action === "download";
              return (
                <div
                  key={row._id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <div
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      isDownload
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDownload ? <Download className="size-4" /> : <Eye className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">{row.actorName ?? "Pengguna"}</span>
                      {roleLabel(row.actorRole) && (
                        <Badge variant="outline" className="text-[10px]">
                          {roleLabel(row.actorRole)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {isDownload ? "mengunduh" : "membuka"} arsip
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {row.letterSubject ?? "(tanpa perihal)"}
                      {row.letterNumber ? ` — ${row.letterNumber}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {format(new Date(row.occurredAt), "d MMM yyyy HH:mm", { locale: localeId })}
                  </span>
                </div>
              );
            })}
            {status === "CanLoadMore" && (
              <div className="pt-1">
                <Button
                  variant="ghost"
                  className="w-full cursor-pointer"
                  size="sm"
                  onClick={() => loadMore(40)}
                >
                  Muat lebih banyak
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
