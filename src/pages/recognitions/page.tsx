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
import { Heart, HeartHandshake, Sparkles, Users } from "lucide-react";
import CreateRecognitionDialog from "./_components/CreateRecognitionDialog.tsx";
import RecognitionCard from "./_components/RecognitionCard.tsx";
import LeaderboardWidget from "./_components/LeaderboardWidget.tsx";
import {
  CATEGORY_CONFIG,
  CATEGORY_VALUES,
} from "./_lib/recognitions-utils.ts";

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: typeof Heart;
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

export default function RecognitionsPage() {
  const [category, setCategory] = useState<string>("all");

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const recognitions = useQuery(api.recognitions.listRecognitions, {
    category,
    limit: 50,
  });
  const stats = useQuery(api.recognitions.getStats, {});

  const isAdmin = currentUser?.role === "admin";
  const currentUserId = currentUser?._id ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-purple-500/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-background shadow-sm">
              <HeartHandshake className="size-6 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Apresiasi Karyawan
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Tunjukkan penghargaan kepada rekan kerja atas kontribusi, kerja
                sama, dan dedikasi mereka.
              </p>
            </div>
          </div>
          <CreateRecognitionDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total Apresiasi"
          value={stats?.total ?? "-"}
          icon={Sparkles}
          accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
        <StatTile
          label="Bulan Ini"
          value={stats?.thisMonth ?? "-"}
          icon={Heart}
          accent="bg-rose-500/15 text-rose-600 dark:text-rose-400"
        />
        <StatTile
          label="Anda Berikan"
          value={stats?.givenByMe ?? "-"}
          icon={HeartHandshake}
          accent="bg-blue-500/15 text-blue-600 dark:text-blue-400"
        />
        <StatTile
          label="Anda Terima"
          value={stats?.receivedByMe ?? "-"}
          icon={Users}
          accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main feed */}
        <div className="space-y-4 lg:col-span-2">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">Semua</TabsTrigger>
              {CATEGORY_VALUES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                return (
                  <TabsTrigger key={cat} value={cat} className="gap-1.5">
                    <Icon className="size-3.5" />
                    {cfg.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {recognitions === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : recognitions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HeartHandshake />
                </EmptyMedia>
                <EmptyTitle>
                  {category === "all"
                    ? "Belum ada apresiasi"
                    : "Belum ada apresiasi di kategori ini"}
                </EmptyTitle>
                <EmptyDescription>
                  {category === "all"
                    ? "Jadilah yang pertama mengapresiasi rekan kerja."
                    : "Coba pilih kategori lain atau kirim apresiasi pertama."}
                </EmptyDescription>
              </EmptyHeader>
              {category === "all" ? (
                <EmptyContent>
                  <CreateRecognitionDialog />
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="space-y-3">
              {recognitions.map((r) => (
                <RecognitionCard
                  key={r._id}
                  recognition={r}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <LeaderboardWidget />
        </div>
      </div>
    </div>
  );
}
