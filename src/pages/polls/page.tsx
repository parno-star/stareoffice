import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  BarChart3,
  CheckCircle2,
  Lock,
  Vote,
  type LucideIcon,
} from "lucide-react";
import CreatePollDialog from "./_components/CreatePollDialog.tsx";
import PollCard from "./_components/PollCard.tsx";

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
}) {
  const displayValue =
    typeof value === "number" && Number.isNaN(value) ? "-" : value;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums">{displayValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PollsPage() {
  const [filter, setFilter] = useState<string>("active");

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const polls = useQuery(api.polls.listPolls, { filter });
  const stats = useQuery(api.polls.getStats, {});

  const isAdmin = currentUser?.role === "admin";
  const currentUserId = currentUser?._id ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-purple-500/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-background shadow-sm">
              <BarChart3 className="size-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Polling & Survei
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Kumpulkan pendapat rekan kerja dan ambil keputusan bersama lewat
                polling cepat.
              </p>
            </div>
          </div>
          <CreatePollDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total Polling"
          value={stats?.total ?? "-"}
          icon={BarChart3}
          accent="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
        />
        <StatTile
          label="Aktif"
          value={stats?.active ?? "-"}
          icon={Vote}
          accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <StatTile
          label="Ditutup"
          value={stats?.closed ?? "-"}
          icon={Lock}
          accent="bg-slate-500/15 text-slate-600 dark:text-slate-400"
        />
        <StatTile
          label="Anda Sudah Vote"
          value={stats?.myVotes ?? "-"}
          icon={CheckCircle2}
          accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="active">Aktif</TabsTrigger>
          <TabsTrigger value="closed">Ditutup</TabsTrigger>
          <TabsTrigger value="mine">Polling Saya</TabsTrigger>
          <TabsTrigger value="all">Semua</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {polls === undefined ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BarChart3 />
            </EmptyMedia>
            <EmptyTitle>
              {filter === "mine"
                ? "Anda belum membuat polling"
                : filter === "closed"
                  ? "Belum ada polling yang ditutup"
                  : filter === "active"
                    ? "Belum ada polling aktif"
                    : "Belum ada polling"}
            </EmptyTitle>
            <EmptyDescription>
              Buat polling baru untuk mengumpulkan pendapat rekan kerja.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreatePollDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-4">
          {polls.map((p) => (
            <PollCard
              key={p._id}
              poll={p}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
