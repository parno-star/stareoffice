import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { MessageSquarePlus, MessagesSquare, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { cn } from "@/lib/utils.ts";
import ConversationListItem from "@/pages/messages/_components/ConversationListItem.tsx";
import ChatView from "@/pages/messages/_components/ChatView.tsx";
import NewConversationDialog from "@/pages/messages/_components/NewConversationDialog.tsx";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";

export default function MessagesPage() {
  const params = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const activeId = (params.conversationId ?? null) as Id<"conversations"> | null;
  const [search, setSearch] = useState("");

  const conversations = useQuery(api.messages.listConversations, {});
  const currentUser = useQuery(api.users.getCurrentUser, {});

  const filtered = useMemo(() => {
    if (!conversations) return conversations;
    const q = search.trim().toLowerCase();
    if (q.length === 0) return conversations;
    return conversations.filter((c) =>
      (c.otherUser.name ?? "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const handleSelect = (id: Id<"conversations">) => {
    navigate(`/messages/${id}`);
  };

  const handleBack = () => {
    navigate("/messages");
  };

  const showSidebar = !activeId; // on mobile, hide list when chat open

  return (
    <div className="flex h-[calc(100vh-4rem-4rem)] flex-col lg:h-[calc(100vh-4rem)]">
      <div className="flex h-full flex-1 overflow-hidden">
        {/* Conversation list */}
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-r bg-card md:w-80 lg:w-96",
            showSidebar ? "flex" : "hidden md:flex",
          )}
        >
          <div className="border-b px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold tracking-tight">Pesan</h1>
                <p className="text-xs text-muted-foreground">
                  Obrolan langsung dengan rekan kerja
                </p>
              </div>
              <NewConversationDialog
                trigger={
                  <Button size="icon-sm" aria-label="Percakapan baru">
                    <MessageSquarePlus className="size-4" />
                  </Button>
                }
                onStarted={(id) => {
                  navigate(`/messages/${id}`);
                }}
              />
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari percakapan..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <DataAccessBanner category="messages" className="mx-2 mb-2" />
            {filtered === undefined ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessagesSquare />
                    </EmptyMedia>
                    <EmptyTitle>
                      {search ? "Tidak ditemukan" : "Belum ada pesan"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {search
                        ? "Coba kata kunci lain untuk menemukan percakapan."
                        : "Mulai obrolan pertama Anda dengan rekan kerja."}
                    </EmptyDescription>
                  </EmptyHeader>
                  {!search ? (
                    <EmptyContent>
                      <NewConversationDialog
                        trigger={
                          <Button size="sm" className="gap-2">
                            <MessageSquarePlus className="size-4" />
                            Mulai percakapan
                          </Button>
                        }
                        onStarted={(id) => {
                          navigate(`/messages/${id}`);
                        }}
                      />
                    </EmptyContent>
                  ) : null}
                </Empty>
              </div>
            ) : (
              filtered.map((c) => (
                <ConversationListItem
                  key={c._id}
                  item={c}
                  active={activeId === c._id}
                  isMine={c.lastMessageSenderId === currentUser?._id}
                  onClick={() => handleSelect(c._id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Chat area */}
        <section
          className={cn(
            "flex-1 bg-background",
            showSidebar ? "hidden md:flex md:flex-col" : "flex flex-col",
          )}
        >
          <ChatView
            conversationId={activeId}
            currentUser={currentUser}
            onBack={handleBack}
            onConversationDeleted={handleBack}
          />
        </section>
      </div>
    </div>
  );
}
