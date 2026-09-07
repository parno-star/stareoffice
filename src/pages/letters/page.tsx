import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
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
  Plus, Search, Mail, Send, FileText, ArrowLeftRight, Inbox,
  Clock, FileStack, ChevronRight, Settings, Flag, Archive, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { LetterStatusBadge, LetterTypeBadge, ClassificationBadge } from "./_components/LetterStatusBadge.tsx";
import LetterFormDialog from "./_components/LetterFormDialog.tsx";
import IncomingLetterDialog from "./_components/IncomingLetterDialog.tsx";
import LetterDetailPanel from "./LetterDetailPanel.tsx";
import MemoDetailPanel from "./MemoDetailPanel.tsx";
import LetterSettingsPanel from "./_components/LetterSettingsPanel.tsx";
import DispositionTabPanel from "./_components/DispositionTabPanel.tsx";
import ArchivePanel from "./_components/ArchivePanel.tsx";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";
import BulkActionBar from "@/components/BulkActionBar.tsx";

type TabValue = "all" | "masuk" | "keluar" | "memo" | "draft" | "review" | "disposisi" | "arsip" | "settings";

const TABS: { value: TabValue; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: "all",       label: "Semua",       icon: FileStack },
  { value: "masuk",     label: "Surat Masuk",  icon: Inbox },
  { value: "keluar",    label: "Surat Keluar", icon: Send },
  { value: "memo",      label: "Nota",         icon: FileText },
  { value: "draft",     label: "Konsep",       icon: FileText },
  { value: "review",    label: "Persetujuan",  icon: Clock },
  { value: "disposisi", label: "Disposisi",    icon: Flag },
  { value: "arsip",     label: "Arsip",        icon: Archive },
  { value: "settings",  label: "Pengaturan",   icon: Settings },
];

// Per-tab empty state config
const EMPTY_STATE: Record<TabValue, { title: string; desc: string; action?: string; actionType?: string }> = {
  all:      { title: "Belum ada surat",        desc: "Mulai dengan membuat surat baru atau mencatat surat masuk",   action: "Buat Surat",  actionType: "keluar" },
  masuk:    { title: "Tidak ada surat masuk",  desc: "Belum ada surat masuk yang dicatat di sistem",                action: "Catat Surat Masuk", actionType: "masuk" },
  keluar:   { title: "Tidak ada surat keluar", desc: "Belum ada surat keluar yang dibuat",                          action: "Buat Surat Keluar", actionType: "keluar" },
  memo:     { title: "Tidak ada nota",         desc: "Belum ada nota yang dibuat",                                  action: "Buat Nota",   actionType: "memo" },
  draft:     { title: "Tidak ada konsep surat", desc: "Surat yang disimpan sebagai konsep akan tampil di sini" },
  review:    { title: "Tidak ada surat dalam persetujuan", desc: "Surat yang diajukan untuk persetujuan akan tampil di sini" },
  disposisi: { title: "", desc: "" },
  arsip:     { title: "", desc: "" },
  settings:  { title: "", desc: "" },
};

export default function LettersPage() {
  return (
    <Authenticated>
      <LettersContent />
    </Authenticated>
  );
}

function LettersContent() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateIncoming, setShowCreateIncoming] = useState(false);
  const [createType, setCreateType] = useState("keluar");
  const [selectedId, setSelectedId] = useState<Id<"letters"> | null>(null);
  const [selectedType, setSelectedType] = useState<string>("keluar");
  const [selection, setSelection] = useState<Set<Id<"letters">>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState<"archive" | "delete" | null>(
    null,
  );

  const stats = useQuery(api.letters.getLetterStats);
  const dispositionUnread = useQuery(api.letters.getMyDispositionUnreadCount, {});

  const bulkArchive = useMutation(api.letters.bulkArchiveLetters);
  const bulkDelete = useMutation(api.letters.bulkDeleteLetters);

  const toggleSelect = (letterId: Id<"letters">) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(letterId)) next.delete(letterId);
      else next.add(letterId);
      return next;
    });
  };
  const clearSelection = () => setSelection(new Set());

  const runBulkArchive = async () => {
    try {
      const { count } = await bulkArchive({ letterIds: [...selection] });
      toast.success(`${count} surat diarsipkan`);
      clearSelection();
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal mengarsipkan");
      } else {
        toast.error("Gagal mengarsipkan");
      }
    } finally {
      setConfirmBulk(null);
    }
  };

  const runBulkDelete = async () => {
    try {
      const { count } = await bulkDelete({ letterIds: [...selection] });
      toast.success(`${count} surat dihapus`);
      clearSelection();
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus");
      } else {
        toast.error("Gagal menghapus");
      }
    } finally {
      setConfirmBulk(null);
    }
  };

  // Clear the sidebar "surat masuk" arrival badge once the page is opened.
  const markSeen = useMutation(api.letters.markIncomingLettersSeen);
  const markLetterRead = useMutation(api.letters.markLetterRead);
  useEffect(() => {
    void markSeen({});
  }, [markSeen]);

  const openLetter = (letterId: Id<"letters">, type: string, isRead: boolean) => {
    setSelectedId(letterId);
    setSelectedType(type);
    // Record the letter as read so it renders in normal weight afterwards.
    if (!isRead) void markLetterRead({ letterId });
  };

  // Deep-link support: open a specific letter when arriving via a notification
  // link like /letters?letterId=<id>. We fetch the letter to learn its type
  // (memo vs. regular) so the correct detail panel renders, then clear the param.
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkId = searchParams.get("letterId");
  const deepLinkLetter = useQuery(
    api.letters.getLetter,
    deepLinkId ? { letterId: deepLinkId as Id<"letters"> } : "skip",
  );
  useEffect(() => {
    if (!deepLinkId) return;
    if (deepLinkLetter === undefined) return; // still loading
    if (deepLinkLetter) {
      setSelectedId(deepLinkLetter.letter._id);
      setSelectedType(deepLinkLetter.letter.type);
      void markLetterRead({ letterId: deepLinkLetter.letter._id });
    }
    // Remove the param whether or not the letter was found/visible.
    const next = new URLSearchParams(searchParams);
    next.delete("letterId");
    setSearchParams(next, { replace: true });
  }, [deepLinkId, deepLinkLetter, markLetterRead, searchParams, setSearchParams]);

  // Determine filters from tab
  const typeFilter = (["masuk", "keluar", "memo"] as TabValue[]).includes(activeTab)
    ? activeTab : undefined;
  const statusFilter = activeTab === "draft" ? "draft" : activeTab === "review" ? "review" : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.letters.listLetters,
    activeTab === "settings"
      ? "skip"
      : {
          type: typeFilter,
          status: statusFilter,
          search: search.trim() || undefined,
        },
    { initialNumItems: 30 },
  );

  const handleCreate = (type: string) => {
    if (type === "masuk") {
      setShowCreateIncoming(true);
    } else {
      // Nota kini memakai formulir lengkap yang sama dengan surat (jenis "memo").
      setCreateType(type);
      setShowCreate(true);
    }
  };

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setSelectedId(null);
    clearSelection();
  };

  // If settings tab: full-width settings panel
  if (activeTab === "settings") {
    return (
      <div className="flex h-full flex-col">
        {/* Tab bar only */}
        <div className="shrink-0 border-b bg-card px-2 py-1">
          <div className="flex gap-0.5 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`relative flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
                {tab.value === "disposisi" && dispositionUnread !== undefined && dispositionUnread > 0 && (
                  <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-violet-500 text-white text-[9px] font-bold">
                    {dispositionUnread > 9 ? "9+" : dispositionUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <LetterSettingsPanel />
        </div>
      </div>
    );
  }

  // If disposisi tab: full-width disposition panel
  if (activeTab === "disposisi") {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b bg-card px-2 py-1">
          <div className="flex gap-0.5 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`relative flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
                {tab.value === "disposisi" && dispositionUnread !== undefined && dispositionUnread > 0 && (
                  <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-violet-500 text-white text-[9px] font-bold">
                    {dispositionUnread > 9 ? "9+" : dispositionUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <DispositionTabPanel
            onOpenLetter={(letterId, type) => {
              setSelectedId(letterId);
              setSelectedType(type);
              handleTabChange("all");
            }}
          />
        </div>
      </div>
    );
  }

  // If arsip tab: full-width archive panel
  if (activeTab === "arsip") {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b bg-card px-2 py-1">
          <div className="flex gap-0.5 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`relative flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
                {tab.value === "disposisi" && dispositionUnread !== undefined && dispositionUnread > 0 && (
                  <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-violet-500 text-white text-[9px] font-bold">
                    {dispositionUnread > 9 ? "9+" : dispositionUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ArchivePanel
            onOpenLetter={(letterId, type) => {
              setSelectedId(letterId);
              setSelectedType(type);
              handleTabChange("all");
            }}
          />
        </div>
      </div>
    );
  }

  const emptyState = EMPTY_STATE[activeTab];
  const isMemoTab = activeTab === "memo";

  return (
    <div className="flex h-full">
      {/* Left panel: list */}
      <div className={`flex flex-col border-r ${selectedId ? "hidden md:flex md:w-[420px]" : "w-full"} shrink-0`}>
        {/* Header */}
        <div className="border-b bg-card px-4 py-4">
          <div className="mb-3">
            <h1 className="text-xl font-bold">Manajemen Surat</h1>
          </div>

          <DataAccessBanner category="letters" className="mb-3" />

          {/* Stats — hide on memo tab */}
          {!isMemoTab && stats && (
            <div className="mb-3 grid grid-cols-4 gap-2">
              {[
                { label: "Masuk",    value: stats.totalMasuk,       icon: Inbox,    color: "text-teal-600" },
                { label: "Keluar",   value: stats.totalKeluar,      icon: Send,     color: "text-blue-600" },
                { label: "Konsep",   value: stats.draft,            icon: FileText, color: "text-gray-600" },
                { label: "Menunggu", value: stats.pendingApproval,  icon: Clock,    color: "text-yellow-600" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center rounded-lg bg-muted/40 p-2">
                  <s.icon className={`size-4 ${s.color}`} />
                  <span className="text-base font-bold">{s.value}</span>
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contextual action buttons per tab */}
          <div className="mb-3 flex flex-wrap gap-2">
            {isMemoTab ? (
              <Button size="sm" className="flex-1" onClick={() => handleCreate("memo")}>
                <Plus className="size-4" /> Buat Nota
              </Button>
            ) : (
              <>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleCreate("masuk")}>
                  <Inbox className="size-4" /> Masuk
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleCreate("memo")}>
                  <FileText className="size-4" /> Nota
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handleCreate("keluar")}>
                  <Plus className="size-4" /> Buat Surat
                </Button>
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={isMemoTab ? "Cari perihal / no. nota / no. agenda..." : "Cari perihal / no. surat / no. agenda..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-card px-2 py-1">
          <div className="flex gap-0.5 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`relative flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
                {tab.value === "disposisi" && dispositionUnread !== undefined && dispositionUnread > 0 && (
                  <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-violet-500 text-white text-[9px] font-bold">
                    {dispositionUnread > 9 ? "9+" : dispositionUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        {results !== undefined && results.length > 0 && !selectedId ? (
          <div className="border-b bg-card px-3 py-2">
            <BulkActionBar
              allSelected={
                results.length > 0 &&
                results.every((l) => selection.has(l._id))
              }
              onToggleAll={() => {
                const allSel =
                  results.length > 0 &&
                  results.every((l) => selection.has(l._id));
                setSelection(
                  allSel
                    ? new Set()
                    : new Set(results.map((l) => l._id)),
                );
              }}
              selectedCount={selection.size}
              totalCount={results.length}
              onClear={clearSelection}
            >
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirmBulk("archive")}
                className="gap-1 cursor-pointer"
              >
                <Archive className="size-4" />
                Arsipkan
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmBulk("delete")}
                className="gap-1 cursor-pointer"
              >
                <Trash2 className="size-4" />
                Hapus
              </Button>
            </BulkActionBar>
          </div>
        ) : null}

        {/* Letter list */}
        <div className="flex-1 overflow-y-auto">
          {results === undefined ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : results.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {isMemoTab ? <FileText /> : <Mail />}
                </EmptyMedia>
                <EmptyTitle>{emptyState.title}</EmptyTitle>
                <EmptyDescription>{emptyState.desc}</EmptyDescription>
              </EmptyHeader>
              {emptyState.action && emptyState.actionType && (
                <EmptyContent>
                  <Button size="sm" onClick={() => handleCreate(emptyState.actionType!)}>
                    <Plus className="size-4" /> {emptyState.action}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="divide-y">
              {results.map((letter: Doc<"letters"> & { isRead: boolean }) => {
                const unread = !letter.isRead;
                const isChecked = selection.has(letter._id);
                return (
                <div
                  key={letter._id}
                  className={`flex items-start ${selectedId === letter._id ? "bg-primary/5 border-r-2 border-r-primary" : unread ? "bg-primary/[0.03]" : ""} ${isChecked ? "bg-primary/10" : ""}`}
                >
                  <div className="pl-3 pt-4">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelect(letter._id)}
                      aria-label="Pilih surat"
                      className="cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openLetter(letter._id, letter.type, letter.isRead)}
                    className="flex flex-1 cursor-pointer items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50"
                  >
                    {/* Unread indicator dot */}
                    <div className="mt-4 flex w-2 shrink-0 justify-center">
                      {unread && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {letter.type === "masuk"    ? <Inbox         className="size-4 text-teal-600"   /> :
                       letter.type === "keluar"   ? <Send          className="size-4 text-blue-600"   /> :
                       letter.type === "memo"     ? <FileText      className="size-4 text-violet-600" /> :
                                                    <ArrowLeftRight className="size-4 text-orange-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className={`line-clamp-1 text-sm ${unread ? "font-bold text-foreground" : "font-medium text-foreground/90"}`}>{letter.subject}</p>
                        <span className={`shrink-0 text-[11px] ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {format(new Date(letter.letterDate), "d MMM yy", { locale: localeId })}
                        </span>
                      </div>
                      <p className={`line-clamp-1 text-xs ${unread ? "font-semibold text-foreground/80" : "text-muted-foreground"}`}>
                        {letter.type === "masuk" ? `Dari: ${letter.fromName}` : `Kepada: ${letter.toName}`}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {/* Hide type badge on specific tabs since it's redundant */}
                        {activeTab === "all" && <LetterTypeBadge type={letter.type} />}
                        <LetterStatusBadge status={letter.status} />
                        {letter.classification !== "biasa" && (
                          <ClassificationBadge classification={letter.classification} />
                        )}
                        {letter.letterNumber && (
                          <Badge variant="outline" className="text-[10px]">{letter.letterNumber}</Badge>
                        )}
                        {(letter as { isPhysical?: boolean }).isPhysical && (
                          <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">Fisik</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </button>
                </div>
                );
              })}
              {status === "CanLoadMore" && (
                <div className="p-3">
                  <Button variant="ghost" className="w-full" size="sm" onClick={() => loadMore?.(30)}>
                    Muat lebih banyak
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: detail */}
      {selectedId ? (
        <div className="flex-1 overflow-hidden">
          {selectedType === "memo" ? (
            <MemoDetailPanel
              letterId={selectedId}
              onClose={() => { setSelectedId(null); setSelectedType("keluar"); }}
            />
          ) : (
            <LetterDetailPanel
              letterId={selectedId}
              onClose={() => { setSelectedId(null); setSelectedType("keluar"); }}
            />
          )}
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="text-center text-muted-foreground">
            {isMemoTab
              ? <FileText className="mx-auto mb-3 size-12 opacity-30" />
              : <Mail className="mx-auto mb-3 size-12 opacity-30" />}
            <p className="text-sm">{isMemoTab ? "Pilih nota untuk melihat detail" : "Pilih surat untuk melihat detail"}</p>
          </div>
        </div>
      )}

      {/* Create dialogs */}
      {showCreate && (
        <LetterFormDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          defaultType={createType}
        />
      )}
      {showCreateIncoming && (
        <IncomingLetterDialog
          open={showCreateIncoming}
          onClose={() => setShowCreateIncoming(false)}
        />
      )}

      {/* Bulk confirm dialog */}
      <AlertDialog
        open={confirmBulk !== null}
        onOpenChange={(v) => {
          if (!v) setConfirmBulk(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmBulk === "delete"
                ? `Hapus ${selection.size} surat?`
                : `Arsipkan ${selection.size} surat?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmBulk === "delete"
                ? "Surat terpilih beserta lampiran dan riwayatnya akan dihapus permanen. Surat yang tidak dapat Anda hapus akan dilewati."
                : "Surat terpilih akan dipindahkan ke arsip. Hanya surat final (sudah dikirim/diterima) yang akan diarsipkan, lainnya dilewati."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmBulk === "delete"
                  ? "cursor-pointer bg-destructive text-white hover:bg-destructive/90"
                  : "cursor-pointer"
              }
              onClick={confirmBulk === "delete" ? runBulkDelete : runBulkArchive}
            >
              {confirmBulk === "delete" ? "Hapus" : "Arsipkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
