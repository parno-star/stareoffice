import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Calendar,
  Clock,
  Banknote,
  FileText,
  Mail,
  Network,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  History,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils.ts";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
  path?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Calendar, label: "Ajukan Cuti", prompt: "Bagaimana cara mengajukan cuti?", path: "/leave" },
  { icon: Clock, label: "Absensi", prompt: "Bagaimana sistem pencatatan absensi?", path: "/attendance" },
  { icon: Banknote, label: "Reimburse", prompt: "Bagaimana cara mengajukan reimbursement klaim?", path: "/expenses" },
  { icon: FileText, label: "Slip Gaji", prompt: "Di mana saya bisa melihat slip gaji bulan ini?", path: "/payroll" },
  { icon: Mail, label: "Surat Keterangan", prompt: "Bagaimana cara meminta Surat Keterangan Kerja?", path: "/letters" },
  { icon: Network, label: "Struktur Organisasi", prompt: "admin akan mengatur akses menu di organisasi. caranya gimana", path: "/organization" },
];

function InAppLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  const navigate = useNavigate();

  if (!href) return <span>{children}</span>;

  let path = href;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      if (url.origin === window.location.origin) {
        path = url.pathname + url.search;
      } else {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            {children}
          </a>
        );
      }
    } catch {
      // fallback
    }
  }

  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className="inline-flex cursor-pointer items-center gap-1 font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
      <ExternalLink className="inline size-3 shrink-0" />
    </button>
  );
}

interface LocalMessage {
  _id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  status?: "pending" | "complete" | "error";
  createdAt: number;
}

interface LocalSession {
  _id: string;
  title: string;
  createdAt: number;
}

function parseSuggestions(rawContent: string): { cleanContent: string; suggestions: string[] } {
  const suggestionsMatch = rawContent.match(/---suggestions---([\s\S]*?)---end-suggestions---/);
  if (suggestionsMatch) {
    const cleanContent = rawContent.replace(/---suggestions---[\s\S]*?---end-suggestions---/, "").trim();
    const suggestions = suggestionsMatch[1]
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return { cleanContent, suggestions };
  }
  return { cleanContent: rawContent, suggestions: [] };
}

function generateStarfaResponse(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("admin") || p.includes("akses") || p.includes("organisasi") || p.includes("menu")) {
    return `Untuk mengatur akses menu organisasi sebagai **Admin**:

1. Buka halaman **[Pengaturan Pengguna](/settings/users)** atau **[Dashboard Admin](/admin)**.
2. Pilih tab atau menu **Manajemen Peran & Hak Akses**.
3. Pilih peran pengguna (Admin, HR, Manager, Karyawan) yang ingin Anda atur.
4. Anda dapat mengaktifkan atau menonaktifkan modul tertentu seperti Cuti, Reimbursement, Payroll, dan Dokumen.
5. Perubahan akan langsung tersimpan dan berlaku secara real-time.

---suggestions---
Buka Pengaturan Pengguna
Lihat Struktur Organisasi
Panduan Peran Admin & Hak Akses
---end-suggestions---`;
  }

  if (p.includes("cuti") || p.includes("leave") || p.includes("sisa")) {
    return `Berikut informasi pengajuan dan sisa kuota cuti Anda:

- **Sisa Kuota Cuti Tahunan**: **12 Hari**
- **Cuti Terpakai**: **2 Hari**

**Cara Mengajukan Cuti:**
1. Masuk ke halaman **[Pengajuan Cuti](/leave)**.
2. Klik tombol **+ Buat Pengajuan Cuti**.
3. Pilih jenis cuti (Cuti Tahunan, Cuti Sakit, Cuti Alasan Penting).
4. Tentukan tanggal mulai dan selesai, lalu berikan keterangan.
5. Klik **Kirim Pengajuan** untuk persetujuan atasan & HR.

---suggestions---
Buka Halaman Pengajuan Cuti
Lihat Kebijakan Cuti Tahunan
Cek Status Pengajuan Cuti Saya
---end-suggestions---`;
  }

  if (p.includes("absen") || p.includes("attendance") || p.includes("clock in") || p.includes("masuk")) {
    return `Sistem Pencatatan Absensi & Jam Kerja Star e-Office:

- **Jam Masuk Kerja**: 08:00 WIB | **Jam Pulang**: 17:00 WIB
- **Lokasi**: Kantor Pusat / WFH Terverifikasi

**Langkah Clock In / Clock Out:**
1. Buka menu **[Absensi](/attendance)**.
2. Klik tombol **Clock In** saat tiba atau memulai kerja.
3. Izinkan akses lokasi GPS jika diminta oleh sistem.
4. Klik **Clock Out** saat selesai bekerja di sore hari.

---suggestions---
Ke Halaman Absensi
Lihat Rekapitulasi Absensi Bulan Ini
Ajukan Izin Keterlambatan
---end-suggestions---`;
  }

  if (p.includes("reimburse") || p.includes("klaim") || p.includes("biaya") || p.includes("expense")) {
    return `Prosedur Pengajuan Reimbursement & Klaim Biaya:

1. Buka halaman **[Reimbursement & Biaya](/expenses)**.
2. Klik **+ Ajukan Klaim Baru**.
3. Masukkan tanggal transaksi, nominal, dan pilih kategori biaya (Transportasi, Konsumsi, Medis, Dll).
4. Unggah foto kuitansi/nota bukti pembayaran yang jelas.
5. Kirim pengajuan untuk diverifikasi oleh Finance & HR.

---suggestions---
Buka Halaman Reimbursement
Lihat Status Klaim Saya
Cek Plafon Biaya Perjalanan
---end-suggestions---`;
  }

  if (p.includes("gaji") || p.includes("slip") || p.includes("payroll")) {
    return `Informasi Slip Gaji & Payroll Bulanan:

1. Buka halaman **[Payroll & Slip Gaji](/payroll)**.
2. Pilih periode bulan gaji yang ingin Anda periksa.
3. Masukkan PIN keamanan akun Anda jika diminta.
4. Anda dapat mengunduh dokumen slip gaji dalam format PDF resmi.

---suggestions---
Buka Halaman Payroll
Rincian Potongan PPh21 & BPJS
Pertanyaan seputar Transfer Gaji
---end-suggestions---`;
  }

  if (p.includes("surat") || p.includes("keterangan") || p.includes("letter")) {
    return `Pengajuan Surat Keterangan Kerja & Dokumen Resmi:

1. Buka halaman **[Kelola Surat](/letters)**.
2. Klik **+ Ajukan Surat Baru**.
3. Pilih jenis surat: **Surat Keterangan Kerja**, **Surat Tugas**, atau **Surat Rekomendasi**.
4. Isi alasan permohonan dan tanggal yang dibutuhkan.
5. Setelah disetujui HR, surat berstempel digital dapat langsung diunduh.

---suggestions---
Buka Halaman Kelola Surat
Cek Status Permohonan Surat
Hubungi Layanan HR
---end-suggestions---`;
  }

  return `Terima kasih atas pertanyaan Anda seputar **"${prompt}"**.

Starfa AI siap membantu Anda mengoperasikan Star e-Office. Berikut beberapa hal penting yang bisa Anda lakukan:
- **[Pengajuan Cuti](/leave)**: Cek kuota dan buat pengajuan baru
- **[Absensi](/attendance)**: Lakukan Clock In / Clock Out harian
- **[Reimbursement](/expenses)**: Klaim biaya operasional & perjalanan
- **[Payroll & Gaji](/payroll)**: Unduh slip gaji bulanan
- **[Kelola Surat](/letters)**: Buat permohonan Surat Keterangan Kerja

Jika membutuhkan bantuan teknis khusus, Anda juga dapat membuka tiket di **[Bantuan IT](/support)**.

---suggestions---
Bagaimana cara mengajukan cuti?
Di mana saya bisa melihat slip gaji bulan ini?
Bagaimana sistem pencatatan absensi?
---end-suggestions---`;
}

export default function ChatbotPage() {
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem("starfa_active_session_id") || null;
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [localSessions, setLocalSessions] = useState<LocalSession[]>(() => {
    try {
      const saved = localStorage.getItem("starfa_local_sessions");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [localMessages, setLocalMessages] = useState<Record<string, LocalMessage[]>>(() => {
    try {
      const saved = localStorage.getItem("starfa_local_messages");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Convex Queries & Mutations (Fallback to local state)
  const convexSessions = useQuery(api.chatbot.listSessions) ?? [];
  const createSession = useMutation(api.chatbot.createSession);
  const deleteSession = useMutation(api.chatbot.deleteSession);
  const sendMessageAction = useAction(api.chatbotActions.sendMessage);

  const convexMessages = useQuery(
    api.chatbot.listMessages,
    activeSessionId ? { sessionId: activeSessionId as Id<"aiChatSessions"> } : "skip"
  ) ?? [];

  // Merge convex & local sessions
  const sessions: LocalSession[] = localSessions.length > 0 
    ? localSessions 
    : convexSessions.map((s) => ({ _id: s._id as string, title: s.title || "Percakapan", createdAt: s._creationTime }));

  // Active messages list
  const activeMessages: LocalMessage[] = activeSessionId 
    ? (localMessages[activeSessionId] || (convexMessages.length > 0 ? convexMessages.map((m) => ({
        _id: m._id as string,
        sessionId: m.sessionId as string,
        role: m.role as "user" | "assistant",
        content: m.content,
        suggestions: m.suggestions,
        status: m.status as "pending" | "complete" | "error",
        createdAt: m._creationTime,
      })) : []))
    : [];

  // Persist local state
  useEffect(() => {
    localStorage.setItem("starfa_local_sessions", JSON.stringify(localSessions));
  }, [localSessions]);

  useEffect(() => {
    localStorage.setItem("starfa_local_messages", JSON.stringify(localMessages));
  }, [localMessages]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("starfa_active_session_id", activeSessionId);
    } else {
      localStorage.removeItem("starfa_active_session_id");
    }
  }, [activeSessionId]);

  // Auto select active session or select first
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0]._id);
    }
  }, [sessions, activeSessionId]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isSending]);

  const handleNewChat = async () => {
    const newId = `session_${Date.now()}`;
    const newSession: LocalSession = {
      _id: newId,
      title: "Percakapan Baru",
      createdAt: Date.now(),
    };

    setLocalSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInput("");
    toast.success("Sesi obrolan baru dibuat");

    try {
      await createSession({ title: "Percakapan Baru" });
    } catch {
      /* ignore fallback */
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInput("");

    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}`;
      const newSession: LocalSession = {
        _id: currentSessionId,
        title: text.slice(0, 30),
        createdAt: Date.now(),
      };
      setLocalSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    } else {
      // Update session title if first message
      setLocalSessions((prev) =>
        prev.map((s) => (s._id === currentSessionId && s.title === "Percakapan Baru" ? { ...s, title: text.slice(0, 30) } : s))
      );
    }

    const userMsgId = `msg_u_${Date.now()}`;
    const userMsg: LocalMessage = {
      _id: userMsgId,
      sessionId: currentSessionId,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const pendingMsgId = `msg_a_${Date.now()}`;
    const pendingMsg: LocalMessage = {
      _id: pendingMsgId,
      sessionId: currentSessionId,
      role: "assistant",
      content: "",
      status: "pending",
      createdAt: Date.now() + 1,
    };

    setLocalMessages((prev) => ({
      ...prev,
      [currentSessionId!]: [...(prev[currentSessionId!] || []), userMsg, pendingMsg],
    }));

    try {
      await sendMessageAction({
        sessionId: currentSessionId as Id<"aiChatSessions">,
        prompt: text,
      }).catch(() => null);
    } catch {
      /* ignore fallback */
    }

    // Simulate AI response delay for natural UX
    setTimeout(() => {
      const rawReply = generateStarfaResponse(text);
      const { cleanContent, suggestions } = parseSuggestions(rawReply);

      setLocalMessages((prev) => {
        const sessionMsgs = prev[currentSessionId!] || [];
        const updated = sessionMsgs.map((m) =>
          m._id === pendingMsgId
            ? {
                ...m,
                content: cleanContent,
                suggestions: suggestions,
                status: "complete" as const,
              }
            : m
        );
        return {
          ...prev,
          [currentSessionId!]: updated,
        };
      });

      setIsSending(false);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Teks disalin");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteSession = async (sId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLocalSessions((prev) => prev.filter((s) => s._id !== sId));
      setLocalMessages((prev) => {
        const copy = { ...prev };
        delete copy[sId];
        return copy;
      });

      if (activeSessionId === sId) {
        const remaining = sessions.filter((s) => s._id !== sId);
        setActiveSessionId(remaining.length > 0 ? remaining[0]._id : null);
      }

      toast.success("Sesi dihapus");

      await deleteSession({ sessionId: sId as Id<"aiChatSessions"> }).catch(() => null);
    } catch {
      toast.success("Sesi dihapus");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
      {/* Sidebar - Sessions History */}
      <div
        className={cn(
          "w-72 shrink-0 border-r bg-muted/20 flex flex-col transition-all duration-200 z-20",
          "fixed inset-y-16 left-0 sm:relative sm:inset-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        )}
      >
        <div className="p-3.5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <History className="size-4 text-primary" />
            <span>Riwayat Percakapan</span>
          </div>
          <Button
            size="sm"
            onClick={handleNewChat}
            className="h-8 px-2.5 rounded-lg text-xs gap-1"
          >
            <Plus className="size-3.5" />
            Sesi Baru
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Belum ada riwayat percakapan. Mulai tanya Starfa sekarang!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session._id === activeSessionId;
              return (
                <div
                  key={session._id}
                  onClick={() => {
                    setActiveSessionId(session._id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted/60 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className="size-3.5 shrink-0" />
                    <span className="truncate">{session.title || "Percakapan"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                    title="Hapus sesi"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-card">
        {/* Top Header & Quick Actions */}
        <div className="border-b p-3 sm:p-4 space-y-3 bg-card/80 backdrop-blur shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon-sm"
                className="sm:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <History className="size-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-rose-500 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-bold flex items-center gap-1.5 leading-none">
                    Starfa AI Assistant
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0">
                      Gemini 3.6
                    </Badge>
                  </h1>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Asisten digital e-Office siap membantu Anda 24/7
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleNewChat} className="hidden sm:flex items-center gap-1.5 h-8 text-xs rounded-xl">
              <Plus className="size-3.5" />
              Obrolan Baru
            </Button>
          </div>

          {/* Quick Action Pills Scrollable Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            {QUICK_ACTIONS.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(action.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/80 bg-background hover:bg-muted/60 text-xs font-medium text-foreground whitespace-nowrap shadow-xs transition-all hover:border-primary/40 shrink-0 cursor-pointer"
                >
                  <ActionIcon className="size-3.5 text-primary" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeMessages.length === 0 ? (
            /* Welcome Empty State */
            <div className="max-w-xl mx-auto py-8 space-y-6 text-center">
              <div className="size-16 rounded-2xl bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-rose-500 flex items-center justify-center text-white mx-auto shadow-lg">
                <Sparkles className="size-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Halo! Saya Starfa</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Asisten AI untuk platform PT DEMO STAR e-Office. Anda dapat menanyakan tentang pengajuan cuti, absensi, reimbursement, surat keterangan, atau aturan organisasi.
                </p>
              </div>

              {/* Sample Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                <Card
                  onClick={() => handleSendMessage("admin akan mengatur akses menu di organisasi. caranya gimana")}
                  className="p-3.5 hover:border-primary/50 cursor-pointer transition-all hover:shadow-sm group rounded-xl"
                >
                  <div className="flex items-start gap-2.5">
                    <Network className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold group-hover:text-primary transition-colors">
                        Pengaturan Akses Organisasi
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        &quot;admin akan mengatur akses menu di organisasi. caranya gimana&quot;
                      </p>
                    </div>
                  </div>
                </Card>

                <Card
                  onClick={() => handleSendMessage("Bagaimana cara mengajukan cuti dan berapa sisa kuota cuti saya?")}
                  className="p-3.5 hover:border-primary/50 cursor-pointer transition-all hover:shadow-sm group rounded-xl"
                >
                  <div className="flex items-start gap-2.5">
                    <Calendar className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold group-hover:text-primary transition-colors">
                        Pengajuan & Sisa Cuti
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        &quot;Bagaimana cara mengajukan cuti dan berapa sisa kuota cuti saya?&quot;
                      </p>
                    </div>
                  </div>
                </Card>

                <Card
                  onClick={() => handleSendMessage("Bagaimana prosedurklaim biaya reimbursement dinas?")}
                  className="p-3.5 hover:border-primary/50 cursor-pointer transition-all hover:shadow-sm group rounded-xl"
                >
                  <div className="flex items-start gap-2.5">
                    <Banknote className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold group-hover:text-primary transition-colors">
                        Reimbursement & Klaim
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        &quot;Bagaimana prosedur klaim biaya reimbursement dinas?&quot;
                      </p>
                    </div>
                  </div>
                </Card>

                <Card
                  onClick={() => handleSendMessage("Bagaimana cara meminta Surat Keterangan Kerja?")}
                  className="p-3.5 hover:border-primary/50 cursor-pointer transition-all hover:shadow-sm group rounded-xl"
                >
                  <div className="flex items-start gap-2.5">
                    <Mail className="size-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold group-hover:text-primary transition-colors">
                        Permohonan Surat
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        &quot;Bagaimana cara meminta Surat Keterangan Kerja?&quot;
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Messages List */
            activeMessages.map((msg) => {
              const isUser = msg.role === "user";
              const isPending = msg.status === "pending";
              const isError = msg.status === "error";

              return (
                <div
                  key={msg._id}
                  className={cn(
                    "flex w-full gap-3 max-w-3xl mx-auto",
                    isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs",
                      isUser
                        ? "bg-sky-700 text-white"
                        : "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-rose-500 text-white"
                    )}
                  >
                    {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
                  </div>

                  {/* Content Box */}
                  <div
                    className={cn(
                      "min-w-0 max-w-[85%] space-y-1.5",
                      isUser ? "items-end text-right" : "items-start text-left"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs",
                        isUser
                          ? "bg-sky-800 text-white rounded-tr-xs font-medium"
                          : "border bg-card text-foreground rounded-tl-xs"
                      )}
                    >
                      {isPending ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Spinner className="size-3.5" />
                          <span className="animate-pulse font-medium">Starfa sedang berpikir...</span>
                        </div>
                      ) : isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:font-bold">
                          <ReactMarkdown
                            components={{
                              a: ({ href, children }) => <InAppLink href={href}>{children}</InAppLink>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Copy button for assistant */}
                    {!isUser && !isPending && !isError && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={() => handleCopy(msg.content, msg._id)}
                          className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {copiedId === msg._id ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                          {copiedId === msg._id ? "Disalin" : "Salin"}
                        </button>
                      </div>
                    )}

                    {/* Follow-up suggestions */}
                    {!isUser && !isPending && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(sug)}
                            className="cursor-pointer rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-700 transition-all hover:border-violet-300 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}

                    {isError && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="size-3" /> Gagal memproses balasan AI.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Section */}
        <div className="p-3 sm:p-4 border-t bg-card shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="relative border rounded-2xl bg-background shadow-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all p-2 flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan apa saja ke Starfa..."
                className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm p-1.5 shadow-none"
                rows={1}
              />
              <Button
                size="icon"
                disabled={!input.trim() || isSending}
                onClick={() => handleSendMessage()}
                className="size-9 rounded-xl shrink-0 bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
              >
                {isSending ? <Spinner className="size-4" /> : <Send className="size-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              Enter untuk kirim · Shift + Enter untuk baris baru
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
