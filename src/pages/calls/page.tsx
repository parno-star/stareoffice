import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Phone, Mic, Users, History, Video } from "lucide-react";
import StartCallDialog from "./_components/StartCallDialog.tsx";
import CallRoom from "./_components/CallRoom.tsx";
import QuotaCard from "./_components/QuotaCard.tsx";
import ZoomMeetingsTab from "./_components/ZoomMeetingsTab.tsx";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

type ActiveCall = {
  sessionId: Id<"callSessions">;
  roomUrl: string;
  mode: string;
  title: string;
};

export default function CallsPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const activeCalls = useQuery(api.calls.listActiveCalls, {});
  const recentCalls = useQuery(api.calls.listRecentCalls, {});
  const quota = useQuery(api.calls.getQuota, {});
  const getJoinInfo = useAction(api.callActions.getJoinInfo);

  const [inCall, setInCall] = useState<ActiveCall | null>(null);
  const [joiningId, setJoiningId] = useState<Id<"callSessions"> | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [autoJoinHandled, setAutoJoinHandled] = useState(false);

  const activeTab = searchParams.get("tab") === "zoom" ? "zoom" : "voice";
  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "zoom") next.set("tab", "zoom");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };

  const joinSession = async (sessionId: Id<"callSessions">) => {
    setJoiningId(sessionId);
    try {
      const info = await getJoinInfo({ sessionId });
      setInCall({
        sessionId,
        roomUrl: info.roomUrl,
        mode: info.mode,
        title: info.title,
      });
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal bergabung ke panggilan");
      } else {
        toast.error("Gagal bergabung ke panggilan");
      }
    } finally {
      setJoiningId(null);
    }
  };

  // Auto-join when arriving via a shared invite link (/calls?join=<sessionId>).
  useEffect(() => {
    if (autoJoinHandled) return;
    const joinId = searchParams.get("join");
    if (!joinId) return;
    setAutoJoinHandled(true);
    // Clear the param so refreshes don't retry a possibly-ended call.
    const next = new URLSearchParams(searchParams);
    next.delete("join");
    setSearchParams(next, { replace: true });
    void joinSession(joinId as Id<"callSessions">);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, autoJoinHandled]);

  if (inCall) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
        <CallRoom
          roomUrl={inCall.roomUrl}
          mode={inCall.mode}
          title={inCall.title}
          sessionId={inCall.sessionId}
          userName={currentUser?.name ?? null}
          avatarUrl={currentUser?.avatarUrl ?? null}
          onLeave={() => setInCall(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-blue-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-background shadow-sm">
            <Mic className="size-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Online Meeting</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Rapat suara bawaan aplikasi, atau jadwalkan meeting via Zoom.
              Pilih tab sesuai kebutuhan Anda.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="voice" className="cursor-pointer">
            <Mic className="size-4" />
            Voice Meeting
          </TabsTrigger>
          <TabsTrigger value="zoom" className="cursor-pointer">
            <Video className="size-4" />
            Zoom Meeting
          </TabsTrigger>
        </TabsList>

        {/* ── Voice Meeting (Daily.co) ────────────────────────────────── */}
        <TabsContent value="voice" className="space-y-6 pt-2">
          <div className="flex justify-end">
            <StartCallDialog onStarted={(sessionId) => joinSession(sessionId)} />
          </div>

          {/* Quota */}
          {quota ? <QuotaCard quota={quota} /> : null}

          {/* Active calls */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Panggilan Aktif</h2>
            </div>

            {activeCalls === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : activeCalls.length === 0 ? (
              <Empty className="bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Phone />
                  </EmptyMedia>
                  <EmptyTitle>Belum ada panggilan aktif</EmptyTitle>
                  <EmptyDescription>
                    Mulai panggilan baru dan rekan Anda dapat bergabung dari
                    sini.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <StartCallDialog
                    onStarted={(sessionId) => joinSession(sessionId)}
                    trigger={
                      <Button size="sm">
                        <Phone className="size-4" />
                        Mulai Panggilan
                      </Button>
                    }
                  />
                </EmptyContent>
              </Empty>
            ) : (
              <div className="space-y-2">
                {activeCalls.map((call) => (
                  <Card key={call._id}>
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                        <Mic className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">
                            {call.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px]"
                          >
                            Suara
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="size-4">
                            {call.createdByAvatar ? (
                              <AvatarImage src={call.createdByAvatar} />
                            ) : null}
                            <AvatarFallback className="text-[8px]">
                              {getInitials(call.createdByName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {call.createdByName ?? "Seseorang"} ·{" "}
                            {formatDistanceToNow(new Date(call.startedAt), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => joinSession(call._id)}
                        disabled={joiningId === call._id}
                      >
                        {joiningId === call._id ? "Bergabung..." : "Gabung"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Recent calls */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Riwayat Panggilan</h2>
            </div>

            {recentCalls === undefined ? (
              <Skeleton className="h-24 w-full" />
            ) : recentCalls.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                Belum ada riwayat panggilan.
              </p>
            ) : (
              <div className="space-y-1.5">
                {recentCalls.map((call) => (
                  <div
                    key={call._id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Mic className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {call.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {call.createdByName ?? "Seseorang"} ·{" "}
                        {formatDistanceToNow(new Date(call.startedAt), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      Berakhir
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ── Zoom Meeting ────────────────────────────────────────────── */}
        <TabsContent value="zoom" className="pt-2">
          <ZoomMeetingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
