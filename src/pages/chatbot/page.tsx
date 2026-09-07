import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Card } from "@/components/ui/card.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquarePlus,
  Trash2,
  Pin,
  PinOff,
  Pencil,
  MoreHorizontal,
  MessageSquare,
  Bot,
  Menu,
  X,
  Info,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import type { Id } from "@/convex/_generated/dataModel.js";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import ChatMessageItem from "./_components/ChatMessageItem.tsx";
import SuggestionGrid from "./_components/SuggestionGrid.tsx";
import QuickActionsBar from "./_components/QuickActionsBar.tsx";
import { cn } from "@/lib/utils.ts";
import { motion, AnimatePresence } from "motion/react";

function formatRelative(ts: string): string {
  try {
    return formatDistanceToNow(new Date(ts), {
      addSuffix: true,
      locale: idLocale,
    });
  } catch {
    return "";
  }
}

function ChatbotInner() {
  const sessions = useQuery(api.chatbot.listSessions, {});
  const createSession = useMutation(api.chatbot.createSession);
  const deleteSession = useMutation(api.chatbot.deleteSession);
  const renameSession = useMutation(api.chatbot.renameSession);
  const togglePin = useMutation(api.chatbot.togglePin);
  const sendMessage = useAction(api.chatbotActions.sendMessage);

  const [activeSessionId, setActiveSessionId] =
    useState<Id<"aiChatSessions"> | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] =
    useState<Id<"aiChatSessions"> | null>(null);
  const [renamingId, setRenamingId] =
    useState<Id<"aiChatSessions"> | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const messages = useQuery(
    api.chatbot.listMessages,
    activeSessionId ? { sessionId: activeSessionId } : "skip",
  );

  // Auto-select the most recent session when sessions load
  useEffect(() => {
    if (activeSessionId) return;
    if (!sessions) return;
    if (sessions.length > 0) {
      const pinned = sessions.filter((s) => s.isPinned);
      setActiveSessionId((pinned[0] ?? sessions[0])._id);
    }
  }, [sessions, activeSessionId]);

  const orderedSessions = useMemo(() => {
    if (!sessions) return [];
    const copy = [...sessions];
    copy.sort((a, b) => {
      if ((b.isPinned ? 1 : 0) !== (a.isPinned ? 1 : 0)) {
        return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      }
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      );
    });
    return copy;
  }, [sessions]);

  // Auto scroll to bottom when new messages appear
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages?.length, activeSessionId, isSending]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleCreateSession = useCallback(
    async (): Promise<Id<"aiChatSessions"> | null> => {
      try {
        const id = await createSession({});
        setActiveSessionId(id);
        setSidebarOpen(false);
        return id;
      } catch (error) {
        toast.error(
          error instanceof ConvexError
            ? String((error.data as { message?: string })?.message ?? "Gagal membuat sesi")
            : "Gagal membuat sesi",
        );
        return null;
      }
    },
    [createSession],
  );

  const handleSend = useCallback(
    async (promptOverride?: string) => {
      const prompt = (promptOverride ?? input).trim();
      if (!prompt || isSending) return;

      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = await handleCreateSession();
        if (!sessionId) return;
      }

      setInput("");
      setIsSending(true);
      try {
        await sendMessage({ sessionId, prompt });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Gagal mengirim pesan";
        toast.error(message);
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, activeSessionId, handleCreateSession, sendMessage],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingId) return;
    try {
      await deleteSession({ sessionId: deletingId });
      if (activeSessionId === deletingId) {
        setActiveSessionId(null);
      }
      toast.success("Sesi dihapus");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus sesi",
      );
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, deleteSession, activeSessionId]);

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingId) return;
    const title = renameValue.trim();
    if (!title) {
      toast.error("Judul tidak boleh kosong");
      return;
    }
    try {
      await renameSession({ sessionId: renamingId, title });
      toast.success("Judul diperbarui");
      setRenamingId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah judul",
      );
    }
  }, [renameSession, renamingId, renameValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      void handleSend(suggestion);
    },
    [handleSend],
  );

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Starfa</p>
            <p className="text-xs text-muted-foreground">Asisten AI Cerdas</p>
          </div>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="p-3">
        <Button
          className="w-full cursor-pointer gap-2"
          onClick={() => {
            void handleCreateSession();
          }}
        >
          <MessageSquarePlus className="size-4" />
          Percakapan Baru
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {sessions === undefined ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : orderedSessions.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Belum ada percakapan. Mulai dengan menekan tombol di atas.
          </p>
        ) : (
          <ul className="space-y-1">
            {orderedSessions.map((s) => (
              <li key={s._id}>
                <button
                  onClick={() => {
                    setActiveSessionId(s._id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "group flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    s._id === activeSessionId
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <div className="mt-0.5">
                    <MessageSquare className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">
                      {s.title}
                    </p>
                    {s.lastMessagePreview ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {s.lastMessagePreview}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatRelative(s.lastMessageAt)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        role="button"
                      >
                        <MoreHorizontal className="size-4" />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenamingId(s._id);
                          setRenameValue(s.title);
                        }}
                      >
                        <Pencil className="mr-2 size-3.5" /> Ubah judul
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          void togglePin({ sessionId: s._id });
                        }}
                      >
                        {s.isPinned ? (
                          <>
                            <PinOff className="mr-2 size-3.5" /> Lepas pin
                          </>
                        ) : (
                          <>
                            <Pin className="mr-2 size-3.5" /> Pin sesi
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingId(s._id)}
                      >
                        <Trash2 className="mr-2 size-3.5" /> Hapus sesi
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t p-3 text-[11px] text-muted-foreground">
        <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-2">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Starfa bisa membuat kesalahan. Periksa kembali informasi penting.
          </p>
        </div>
      </div>
    </div>
  );

  const hasNoMessages = !activeSessionId || (messages && messages.length === 0);

  return (
    <div className="relative flex h-[calc(100vh-57px)] overflow-hidden bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r bg-card lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw] bg-card">
            {SidebarContent}
          </aside>
        </div>
      ) : null}

      {/* Chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-2 border-b bg-card/80 px-3 py-2 backdrop-blur lg:px-4">
          <Button
            size="icon-sm"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <div className="flex flex-1 items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
              <Bot className="size-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight">
                {orderedSessions.find((s) => s._id === activeSessionId)?.title ??
                  "Starfa — Asisten AI Cerdas"}
              </h1>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="size-3 text-violet-500" />
                HR, Navigasi, Produktivitas, Pembelajaran
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="cursor-pointer gap-1"
            onClick={() => {
              void handleCreateSession();
            }}
          >
            <Plus className="size-4" /> Baru
          </Button>
        </header>

        {/* Quick Actions Bar */}
        <div className="border-b bg-card/50 px-3 py-2 lg:px-4">
          <QuickActionsBar />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
            {hasNoMessages ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" as const }}
                  className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg"
                >
                  <Sparkles className="size-10" />
                </motion.div>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" as const }}
                  className="space-y-2"
                >
                  <h2 className="text-2xl font-bold tracking-tight">
                    Halo, saya Starfa
                  </h2>
                  <p className="max-w-lg text-sm text-muted-foreground">
                    Asisten AI cerdas Anda untuk HR, navigasi platform, produktivitas,
                    dan pembelajaran. Tanyakan apa saja atau pilih topik di bawah.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" as const }}
                  className="w-full max-w-xl"
                >
                  <SuggestionGrid
                    disabled={isSending}
                    onPick={(p) => {
                      void handleSend(p);
                    }}
                  />
                </motion.div>
              </div>
            ) : messages === undefined ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" as const }}
                  >
                    <ChatMessageItem
                      message={m}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t bg-card p-3 lg:p-4">
          <div className="mx-auto max-w-3xl">
            <Card className="flex items-end gap-2 p-2 shadow-sm">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan apa saja ke Starfa..."
                rows={1}
                className="min-h-10 max-h-40 resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0"
                disabled={isSending}
              />
              <Button
                size="icon"
                className={cn(
                  "cursor-pointer transition-all",
                  isSending && "animate-pulse",
                )}
                onClick={() => {
                  void handleSend();
                }}
                disabled={isSending || !input.trim()}
              >
                <Send className="size-4" />
              </Button>
            </Card>
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              Enter untuk kirim &middot; Shift + Enter untuk baris baru
            </p>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus sesi percakapan?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh riwayat pesan di sesi ini akan dihapus permanen dan tidak
              bisa dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <AlertDialog
        open={renamingId !== null}
        onOpenChange={(open) => {
          if (!open) setRenamingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah judul sesi</AlertDialogTitle>
            <AlertDialogDescription>
              Beri nama yang mudah dikenali untuk percakapan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={120}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Contoh: Kebijakan cuti tahunan"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleRenameSubmit();
              }}
            >
              Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-4 md:p-6">
          <Skeleton className="h-[70vh] w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-[60vh] items-center justify-center p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyTitle>Masuk untuk menggunakan Starfa</EmptyTitle>
              <EmptyDescription>
                Asisten AI cerdas tersedia hanya untuk karyawan yang sudah masuk.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <SignInButton signInText="Masuk" />
            </EmptyContent>
          </Empty>
        </div>
      </Unauthenticated>
      <Authenticated>
        <ChatbotInner />
      </Authenticated>
    </>
  );
}
