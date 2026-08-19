import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Mail,
  Plus,
  Search,
  FileText,
  Send,
  Inbox,
  FileEdit,
  CheckCircle2,
  GitFork,
  Settings,
  Calendar,
  Clock,
  Layers,
  User,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  LetterStatusBadge,
  LetterTypeBadge,
  ClassificationBadge,
} from "@/components/LetterStatusBadge.tsx";
import LetterDetailPanel from "@/components/LetterDetailPanel.tsx";
import LetterFormDialog from "@/components/LetterFormDialog.tsx";
import IncomingLetterDialog from "@/components/IncomingLetterDialog.tsx";
import DispositionTabPanel from "@/components/DispositionTabPanel.tsx";
import LetterSettingsPanel from "@/components/LetterSettingsPanel.tsx";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function LettersPage() {
  const [activeTab, setActiveTab] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog States
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formType, setFormType] = useState<"keluar" | "internal" | "nota">("keluar");
  const [showIncomingDialog, setShowIncomingDialog] = useState(false);
  const [selectedLetterId, setSelectedLetterId] = useState<Id<"letters"> | null>(null);

  // Queries
  const lettersQuery = useQuery(api.letters.listLetters, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  const rawLetters = Array.isArray(lettersQuery)
    ? lettersQuery
    : lettersQuery?.page || [];

  // Filter letters based on activeTab and search inputs
  const filteredLetters = rawLetters.filter((letter: any) => {
    // 1. Tab filter
    if (activeTab === "masuk" && letter.type !== "masuk") return false;
    if (activeTab === "keluar" && letter.type !== "keluar") return false;
    if (activeTab === "internal" && letter.type !== "internal") return false;
    if (activeTab === "nota" && letter.type !== "nota" && letter.type !== "memo") return false;
    if (activeTab === "konsep" && letter.status !== "draft") return false;
    if (activeTab === "persetujuan" && letter.status !== "review" && letter.approvalStatus !== "pending") return false;

    // 2. Category filter
    if (categoryFilter !== "all" && letter.category !== categoryFilter) return false;

    // 3. Status filter
    if (statusFilter !== "all" && letter.status !== statusFilter) return false;

    // 4. Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const num = (letter.letterNumber || letter.number || "").toLowerCase();
      const title = (letter.title || letter.subject || "").toLowerCase();
      const sender = (letter.senderName || letter.sender || "").toLowerCase();
      const recipient = (letter.recipientName || letter.recipient || "").toLowerCase();

      return (
        num.includes(q) ||
        title.includes(q) ||
        sender.includes(q) ||
        recipient.includes(q)
      );
    }

    return true;
  });

  const handleOpenCreate = (type: "keluar" | "internal" | "nota") => {
    setFormType(type);
    setShowFormDialog(true);
  };

  const countMasuk = rawLetters.filter((l: any) => l.type === "masuk").length;
  const countKeluar = rawLetters.filter((l: any) => l.type === "keluar").length;
  const countKonsep = rawLetters.filter((l: any) => l.status === "draft").length;
  const countMenunggu = rawLetters.filter((l: any) => l.status === "review" || l.approvalStatus === "pending").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 min-h-screen pb-24">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Manajemen Surat
        </h1>
      </div>

      {/* Metrics Cards (4 Stat Cards Grid) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
        {/* Masuk */}
        <div className="bg-[#f0f4f8] dark:bg-slate-900/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-0.5 border border-slate-200/50 dark:border-slate-800">
          <Inbox className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-lg sm:text-2xl font-bold text-foreground">
            {countMasuk}
          </span>
          <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
            Masuk
          </span>
        </div>

        {/* Keluar */}
        <div className="bg-[#f0f4f8] dark:bg-slate-900/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-0.5 border border-slate-200/50 dark:border-slate-800">
          <Send className="size-4 text-blue-600 dark:text-blue-400" />
          <span className="text-lg sm:text-2xl font-bold text-foreground">
            {countKeluar}
          </span>
          <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
            Keluar
          </span>
        </div>

        {/* Konsep */}
        <div className="bg-[#f0f4f8] dark:bg-slate-900/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-0.5 border border-slate-200/50 dark:border-slate-800">
          <FileText className="size-4 text-slate-600 dark:text-slate-300" />
          <span className="text-lg sm:text-2xl font-bold text-foreground">
            {countKonsep}
          </span>
          <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
            Konsep
          </span>
        </div>

        {/* Menunggu */}
        <div className="bg-[#f0f4f8] dark:bg-slate-900/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-0.5 border border-slate-200/50 dark:border-slate-800">
          <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          <span className="text-lg sm:text-2xl font-bold text-foreground">
            {countMenunggu}
          </span>
          <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
            Menunggu
          </span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          onClick={() => setShowIncomingDialog(true)}
          className="flex-1 sm:flex-none h-10 px-4 rounded-xl gap-2 text-xs sm:text-sm font-semibold bg-[#e8f0f8] hover:bg-[#dbe7f4] dark:bg-slate-800 text-foreground border-none shadow-none cursor-pointer"
        >
          <Inbox className="size-4 text-slate-700 dark:text-slate-300" />
          <span>Masuk</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => handleOpenCreate("nota")}
          className="flex-1 sm:flex-none h-10 px-4 rounded-xl gap-2 text-xs sm:text-sm font-semibold bg-[#e8f0f8] hover:bg-[#dbe7f4] dark:bg-slate-800 text-foreground border-none shadow-none cursor-pointer"
        >
          <FileText className="size-4 text-slate-700 dark:text-slate-300" />
          <span>Nota</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex-1 sm:flex-none h-10 px-5 rounded-xl gap-2 text-xs sm:text-sm font-semibold bg-[#004b87] hover:bg-[#003866] text-white shadow-xs cursor-pointer">
              <Plus className="size-4" />
              <span>Buat Surat</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => handleOpenCreate("keluar")}
              className="gap-2 cursor-pointer"
            >
              <Send className="size-4 text-blue-600" />
              <span>Buat Surat Keluar</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowIncomingDialog(true)}
              className="gap-2 cursor-pointer"
            >
              <Inbox className="size-4 text-emerald-600" />
              <span>Catat Surat Masuk</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenCreate("nota")}
              className="gap-2 cursor-pointer"
            >
              <FileText className="size-4 text-violet-600" />
              <span>Buat Nota Dinas</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenCreate("internal")}
              className="gap-2 cursor-pointer"
            >
              <FileEdit className="size-4 text-amber-600" />
              <span>Buat Surat Internal</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Cari perihal / no. surat / no. agenda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 text-xs sm:text-sm rounded-xl bg-card border-border/80 shadow-2xs"
        />
      </div>

      {/* Main Tabs (Semua, Surat Masuk, Surat Keluar, Nota, etc) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-11 p-1 bg-transparent border-b border-border/60 flex w-max min-w-full gap-1.5 rounded-none justify-start">
            <TabsTrigger
              value="semua"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <Layers className="size-3.5" />
              Semua
            </TabsTrigger>
            <TabsTrigger
              value="masuk"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <Inbox className="size-3.5" />
              Surat Masuk
            </TabsTrigger>
            <TabsTrigger
              value="keluar"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <Send className="size-3.5" />
              Surat Keluar
            </TabsTrigger>
            <TabsTrigger
              value="nota"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <FileText className="size-3.5" />
              Nota
            </TabsTrigger>
            <TabsTrigger
              value="internal"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              Internal
            </TabsTrigger>
            <TabsTrigger
              value="konsep"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              Konsep
            </TabsTrigger>
            <TabsTrigger
              value="persetujuan"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              Persetujuan
            </TabsTrigger>
            <TabsTrigger
              value="disposisi"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <GitFork className="size-3.5" />
              Disposisi
            </TabsTrigger>
            <TabsTrigger
              value="pengaturan"
              className="gap-2 px-3.5 h-9 text-xs font-semibold rounded-lg data-[state=active]:bg-[#004b87] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <Settings className="size-3.5" />
              Pengaturan
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab contents for List-based tabs */}
        {activeTab !== "disposisi" && activeTab !== "pengaturan" && (
          <div className="space-y-4">
            {filteredLetters.length === 0 ? (
              /* Empty State matching screenshot design exactly */
              <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl bg-card border border-border/50 shadow-2xs px-4">
                <div className="size-14 rounded-2xl bg-[#e8f0f8] dark:bg-slate-800 text-[#004b87] dark:text-blue-400 flex items-center justify-center">
                  <Mail className="size-7" />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-lg font-bold text-foreground">
                    Belum ada surat
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Mulai dengan membuat surat baru atau mencatat surat masuk
                  </p>
                </div>

                <Button
                  onClick={() => handleOpenCreate("keluar")}
                  className="h-10 px-6 gap-2 font-semibold bg-[#004b87] hover:bg-[#003866] text-white rounded-xl shadow-xs cursor-pointer mt-2"
                >
                  <Plus className="size-4" />
                  <span>Buat Surat</span>
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card text-card-foreground shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground border-b">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Nomor & Perihal</th>
                        <th className="py-3 px-4 font-semibold">Jenis</th>
                        <th className="py-3 px-4 font-semibold">Pengirim / Penerima</th>
                        <th className="py-3 px-4 font-semibold">Tanggal</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredLetters.map((letter: any) => {
                        const letterNum = letter.letterNumber || letter.number || "Draft / Belum Ada Nomor";
                        const letterTitle = letter.title || letter.subject || "Tanpa Perihal";
                        const letterDate = letter.date || (letter._creationTime ? format(new Date(letter._creationTime), "dd MMM yyyy", { locale: localeId }) : "-");

                        return (
                          <tr
                            key={letter._id}
                            onClick={() => setSelectedLetterId(letter._id)}
                            className="hover:bg-accent/40 transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-4 max-w-md">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                  {letterTitle}
                                </span>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {letterNum}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <LetterTypeBadge type={letter.type || "keluar"} />
                                {letter.classification && (
                                  <ClassificationBadge classification={letter.classification} />
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="text-xs space-y-0.5">
                                <div className="text-foreground font-medium flex items-center gap-1">
                                  <User className="size-3 text-muted-foreground" />
                                  <span>{letter.senderName || letter.sender || "Internal"}</span>
                                </div>
                                {(letter.recipientName || letter.recipient) && (
                                  <div className="text-muted-foreground flex items-center gap-1">
                                    <ChevronRight className="size-3" />
                                    <span>{letter.recipientName || letter.recipient}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                <span>{letterDate}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <LetterStatusBadge status={letter.status || "draft"} />
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLetterId(letter._id);
                                }}
                                className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                              >
                                Detail
                                <ChevronRight className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Disposisi */}
        <TabsContent value="disposisi" className="m-0 pt-2">
          <DispositionTabPanel
            onOpenLetter={(id) => setSelectedLetterId(id)}
          />
        </TabsContent>

        {/* Tab: Pengaturan */}
        <TabsContent value="pengaturan" className="m-0 pt-2">
          <LetterSettingsPanel />
        </TabsContent>
      </Tabs>

      {/* Dialog Modals */}
      {showFormDialog && (
        <LetterFormDialog
          open={showFormDialog}
          onClose={() => setShowFormDialog(false)}
          defaultType={formType}
        />
      )}

      {showIncomingDialog && (
        <IncomingLetterDialog
          open={showIncomingDialog}
          onClose={() => setShowIncomingDialog(false)}
        />
      )}

      {selectedLetterId && (
        <LetterDetailPanel
          letterId={selectedLetterId}
          onClose={() => setSelectedLetterId(null)}
        />
      )}
    </div>
  );
}
