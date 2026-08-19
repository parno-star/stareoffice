import { useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Archive,
  Search,
  Download,
  Eye,
  ShieldCheck,
  Clock,
  Send,
  Inbox,
  FileText,
  ArrowLeftRight,
  User,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { LetterTypeBadge, LetterStatusBadge } from "@/components/LetterStatusBadge.tsx";
import LetterDetailPanel from "@/components/LetterDetailPanel.tsx";

type ArchivedLetter = Doc<"letters"> & { archiveUrl: string | null };

const TYPE_FILTERS = [
  { value: "all", label: "Semua Jenis" },
  { value: "masuk", label: "Surat Masuk" },
  { value: "keluar", label: "Surat Keluar" },
  { value: "memo", label: "Nota Dinas" },
  { value: "internal", label: "Surat Internal" },
];

function getTypeIcon(type: string) {
  if (type === "masuk") return <Inbox className="size-4 text-emerald-600" />;
  if (type === "keluar") return <Send className="size-4 text-blue-600" />;
  if (type === "memo" || type === "nota") return <FileText className="size-4 text-violet-600" />;
  return <ArrowLeftRight className="size-4 text-amber-600" />;
}

export default function DocumentArchivePage() {
  const [activeSubTab, setActiveSubTab] = useState<"arsip" | "audit">("arsip");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedLetterId, setSelectedLetterId] = useState<Id<"letters"> | null>(null);

  // Convex mutations & queries
  const logAccess = useMutation(api.letters.logArchiveAccess);

  // Paginated archived letters
  const { results: archivedLetters, status: archiveStatus, loadMore } = usePaginatedQuery(
    api.letters.listArchivedLetters,
    {
      type: typeFilter === "all" ? undefined : typeFilter,
      search: search.trim() || undefined,
    },
    { initialNumItems: 30 },
  );

  // Paginated archive audit logs
  const { results: auditLogs, status: auditStatus } = usePaginatedQuery(
    api.letters.listArchiveAudit,
    {},
    { initialNumItems: 30 },
  );

  const handleOpenDetail = (letterId: Id<"letters">) => {
    logAccess({ letterId, action: "view" }).catch(() => {});
    setSelectedLetterId(letterId);
  };

  const handleDownload = (letter: ArchivedLetter) => {
    if (!letter.archiveUrl) {
      toast.error("Salinan PDF arsip belum tersedia untuk dokumen ini.");
      return;
    }
    logAccess({ letterId: letter._id, action: "download" }).catch(() => {});
    const a = document.createElement("a");
    a.href = letter.archiveUrl;
    a.download = letter.archivePdfName ?? `${letter.subject || "Surat"}.pdf`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 min-h-screen pb-24">
      {/* Top Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="size-11 sm:size-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <Archive className="size-6" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Arsip Dokumen
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
            Pusat arsip surat final beserta salinan PDF permanen dan jejak audit akses.
          </p>
        </div>
      </div>

      {/* Read-Only GCG Info Notice Banner */}
      <div className="rounded-2xl bg-[#e6f7f0] dark:bg-emerald-950/30 border border-[#b3eacc] dark:border-emerald-800/60 p-3.5 sm:p-4 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="size-5 text-[#059669] dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Arsip ini bersifat <strong className="font-semibold">baca-saja (read-only)</strong> demi menjaga integritas dokumen (GCG). Isi surat final tidak dapat diubah. Setiap akses buka dan unduh arsip tercatat pada jejak audit.
        </p>
      </div>

      {/* Sub-Navigation Tabs Switcher */}
      <div className="bg-[#e8f0f8] dark:bg-slate-800/80 p-1 rounded-2xl flex gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab("arsip")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
            activeSubTab === "arsip"
              ? "bg-white dark:bg-slate-900 text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="size-4" />
          <span>Arsip Surat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("audit")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
            activeSubTab === "audit"
              ? "bg-white dark:bg-slate-900 text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="size-4" />
          <span>Jejak Audit</span>
        </button>
      </div>

      {/* TAB 1: ARSIP SURAT */}
      {activeSubTab === "arsip" && (
        <div className="space-y-4">
          {/* Search & Select Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari perihal / no. surat / no. agenda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-xs sm:text-sm rounded-xl bg-card border-border/80 shadow-2xs"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-52 h-11 rounded-xl bg-card border-border/80 text-xs sm:text-sm shadow-2xs">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value} className="text-xs sm:text-sm">
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Archived Letters Content / Empty State */}
          {archivedLetters === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : archivedLetters.length === 0 ? (
            /* Empty State Matching Screenshot */
            <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl bg-card border border-border/50 shadow-2xs px-4">
              <div className="size-14 rounded-2xl bg-[#e8f0f8] dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Archive className="size-7" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-bold text-foreground">
                  Belum ada surat di arsip
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Surat yang sudah dikirim atau difinalkan akan muncul di sini beserta salinan PDF-nya.
                </p>
              </div>
            </div>
          ) : (
            /* Archived Letters List */
            <div className="space-y-2.5">
              {archivedLetters.map((letter: ArchivedLetter) => (
                <div
                  key={letter._id}
                  className="bg-card border border-border/70 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      {getTypeIcon(letter.type)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {letter.subject}
                        </span>
                        {letter.letterNumber && (
                          <Badge variant="outline" className="text-[10px] rounded-md font-mono">
                            {letter.letterNumber}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {letter.type === "masuk"
                          ? `Dari: ${letter.fromName || letter.senderName || "-"}`
                          : `Kepada: ${letter.toName || letter.recipientName || "-"}`}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                        <LetterTypeBadge type={letter.type} />
                        <span>•</span>
                        <span>
                          {letter.letterDate
                            ? format(new Date(letter.letterDate), "dd MMMM yyyy", { locale: localeId })
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDetail(letter._id)}
                      className="h-9 px-3.5 rounded-xl text-xs gap-1.5 cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                      <span>Detail</span>
                    </Button>

                    <Button
                      size="sm"
                      disabled={!letter.archiveUrl}
                      onClick={() => handleDownload(letter)}
                      className="h-9 px-3.5 rounded-xl text-xs gap-1.5 bg-[#004b87] hover:bg-[#003866] text-white shadow-xs cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>PDF</span>
                    </Button>
                  </div>
                </div>
              ))}

              {archiveStatus === "CanLoadMore" && (
                <div className="pt-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMore(30)}
                    className="text-xs text-muted-foreground"
                  >
                    Muat Lebih Banyak
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JEJAK AUDIT */}
      {activeSubTab === "audit" && (
        <div className="space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari dalam log audit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 text-xs sm:text-sm rounded-xl bg-card border-border/80 shadow-2xs"
            />
          </div>

          {auditLogs === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            /* Empty State for Audit Logs */
            <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl bg-card border border-border/50 shadow-2xs px-4">
              <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Clock className="size-7" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-bold text-foreground">
                  Belum ada jejak audit
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Setiap aktivitas pembukaan dan pengunduhan arsip dokumen akan dicatat secara otomatis di sini.
                </p>
              </div>
            </div>
          ) : (
            /* Audit Log Table / List */
            <div className="rounded-2xl border bg-card text-card-foreground shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                      <th className="p-3.5 font-semibold">Waktu</th>
                      <th className="p-3.5 font-semibold">Pengguna</th>
                      <th className="p-3.5 font-semibold">Aksi</th>
                      <th className="p-3.5 font-semibold">Dokumen</th>
                      <th className="p-3.5 font-semibold">Nomor Surat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {auditLogs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 text-xs text-muted-foreground whitespace-nowrap font-mono">
                          {log.occurredAt
                            ? format(new Date(log.occurredAt), "dd/MM/yyyy HH:mm", { locale: localeId })
                            : "-"}
                        </td>
                        <td className="p-3.5 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <User className="size-3.5 text-muted-foreground" />
                            <span>{log.actorName || "Sistem / Pengguna"}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={log.action === "download" ? "default" : "secondary"}
                            className="text-[10px] uppercase tracking-wider"
                          >
                            {log.action === "download" ? "Unduh PDF" : "Buka Detail"}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-medium text-foreground max-w-xs truncate">
                          {log.letterSubject || "-"}
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground font-mono">
                          {log.letterNumber || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Letter Detail Panel Modal */}
      {selectedLetterId && (
        <LetterDetailPanel
          letterId={selectedLetterId}
          onClose={() => setSelectedLetterId(null)}
        />
      )}
    </div>
  );
}
