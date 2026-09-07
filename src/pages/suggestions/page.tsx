import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { isAdminRole } from "@/convex/roles.ts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Lightbulb } from "lucide-react";
import CreateSuggestionDialog from "./_components/CreateSuggestionDialog.tsx";
import SuggestionCard from "./_components/SuggestionCard.tsx";
import {
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  STATUS_ORDER,
} from "./_lib/suggestions-utils.ts";

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  const displayValue =
    typeof value === "number" && Number.isNaN(value) ? "-" : value;

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-bold ${accent}`}>{displayValue}</p>
      </CardContent>
    </Card>
  );
}

export default function SuggestionsPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const suggestions = useQuery(api.suggestions.listSuggestions, {
    status,
    category,
    sortBy,
  });
  const stats = useQuery(api.suggestions.getStats, {});

  const isAdmin = isAdminRole(currentUser?.role);
  const currentUserId = currentUser?._id ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kotak Saran</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bagikan ide untuk meningkatkan perusahaan. Saran dapat dikirim
            secara anonim.
          </p>
        </div>
        <CreateSuggestionDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile
          label="Total"
          value={stats?.total ?? "-"}
          accent="text-foreground"
        />
        <StatTile
          label="Baru"
          value={stats?.new ?? "-"}
          accent="text-sky-600 dark:text-sky-400"
        />
        <StatTile
          label="Ditinjau"
          value={stats?.reviewing ?? "-"}
          accent="text-amber-600 dark:text-amber-400"
        />
        <StatTile
          label="Diterima"
          value={(stats ? stats.accepted + stats.implemented : "-") as
            | number
            | string}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <StatTile
          label="Ditolak"
          value={stats?.rejected ?? "-"}
          accent="text-destructive"
        />
      </div>

      {/* Status tabs */}
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Semua</TabsTrigger>
          {STATUS_ORDER.map((value) => {
            const cfg = STATUS_CONFIG[value];
            const Icon = cfg.icon;
            return (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                <Icon className="size-3.5" />
                {cfg.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-40 flex-1">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Semua kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {cfg.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-40 flex-1">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Terbaru</SelectItem>
              <SelectItem value="popular">Paling Didukung</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {!suggestions ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lightbulb />
            </EmptyMedia>
            <EmptyTitle>
              {status === "all" && category === "all"
                ? "Belum ada saran"
                : "Tidak ada saran cocok"}
            </EmptyTitle>
            <EmptyDescription>
              {status === "all" && category === "all"
                ? "Jadilah yang pertama mengirim ide untuk perusahaan."
                : "Coba ubah filter untuk melihat saran lainnya."}
            </EmptyDescription>
          </EmptyHeader>
          {status === "all" && category === "all" ? (
            <EmptyContent>
              <CreateSuggestionDialog />
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <SuggestionCard
              key={s._id}
              suggestion={s}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
