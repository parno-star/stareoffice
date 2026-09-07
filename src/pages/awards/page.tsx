import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
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
  Trophy,
  Award as AwardIcon,
  Plus,
  Sparkles,
  Calendar,
  User,
} from "lucide-react";
import AwardFormDialog from "./_components/AwardFormDialog.tsx";
import AwardCard from "./_components/AwardCard.tsx";
import HallOfFameWidget from "./_components/HallOfFameWidget.tsx";
import type { AwardListItem } from "@/convex/awards";
import {
  CATEGORY_CONFIG,
  CATEGORY_VALUES,
} from "./_lib/awards-utils.ts";
import { isAdminRole } from "@/convex/roles.ts";

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: typeof Trophy;
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

export default function AwardsPage() {
  const [category, setCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AwardListItem | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const awards = useQuery(api.awards.listAwards, { category, limit: 50 });
  const stats = useQuery(api.awards.getStats, {});

  const isAdmin = isAdminRole(currentUser?.role);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (award: AwardListItem) => {
    setEditing(award);
    setDialogOpen(true);
  };

  const featuredAward = awards?.find((a) => a.isFeatured) ?? null;
  const otherAwards = awards?.filter((a) => a._id !== featuredAward?._id) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/10 p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 size-48 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-lg ring-1 ring-amber-500/20">
              <Trophy className="size-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Penghargaan & Apresiasi Resmi
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Rayakan kontribusi luar biasa karyawan melalui penghargaan
                resmi. Employee of the Month, masa kerja, keunggulan, dan
                lainnya.
              </p>
            </div>
          </div>
          {isAdmin ? (
            <Button onClick={openCreate} className="cursor-pointer gap-2">
              <Plus className="size-4" />
              Berikan Penghargaan
            </Button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total Penghargaan"
          value={stats?.total ?? "-"}
          icon={Trophy}
          accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
        <StatTile
          label="Tahun Ini"
          value={stats?.thisYear ?? "-"}
          icon={Calendar}
          accent="bg-purple-500/15 text-purple-600 dark:text-purple-400"
        />
        <StatTile
          label="Bulan Ini"
          value={stats?.thisMonth ?? "-"}
          icon={Sparkles}
          accent="bg-rose-500/15 text-rose-600 dark:text-rose-400"
        />
        <StatTile
          label="Anda Terima"
          value={stats?.receivedByMe ?? "-"}
          icon={User}
          accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main feed */}
        <div className="space-y-4 lg:col-span-2">
          {/* Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Penghargaan Terbaru
            </h2>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {CATEGORY_VALUES.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        <Icon className="size-4" />
                        {cfg.shortLabel}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {awards === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full" />
              ))}
            </div>
          ) : awards.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AwardIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {category === "all"
                    ? "Belum ada penghargaan"
                    : "Belum ada penghargaan di kategori ini"}
                </EmptyTitle>
                <EmptyDescription>
                  {isAdmin
                    ? "Berikan penghargaan pertama untuk merayakan kontribusi karyawan."
                    : "Penghargaan akan muncul di sini setelah diberikan oleh administrator."}
                </EmptyDescription>
              </EmptyHeader>
              {isAdmin && category === "all" ? (
                <EmptyContent>
                  <Button
                    onClick={openCreate}
                    className="cursor-pointer gap-2"
                  >
                    <Plus className="size-4" />
                    Berikan Penghargaan Pertama
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="space-y-4">
              {featuredAward ? (
                <AwardCard
                  key={featuredAward._id}
                  award={featuredAward}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                  featured
                />
              ) : null}
              {otherAwards.map((award) => (
                <AwardCard
                  key={award._id}
                  award={award}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <HallOfFameWidget />
        </div>
      </div>

      <AwardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </div>
  );
}
