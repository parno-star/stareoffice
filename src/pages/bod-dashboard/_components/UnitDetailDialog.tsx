import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { Users, UserCircle, Target, ArrowRight } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import { cn } from "@/lib/utils.ts";

const HEALTH_LABEL: Record<string, string> = {
  on_track: "On Track",
  at_risk: "Berisiko",
  off_track: "Menyimpang",
  achieved: "Tercapai",
};

const HEALTH_TEXT: Record<string, string> = {
  on_track: "text-emerald-600 dark:text-emerald-400",
  at_risk: "text-amber-600 dark:text-amber-400",
  off_track: "text-rose-600 dark:text-rose-400",
  achieved: "text-emerald-600 dark:text-emerald-400",
};

const CATEGORY_LABEL: Record<string, string> = {
  strategic: "Strategis",
  growth: "Pertumbuhan",
  product: "Produk",
  customer: "Pelanggan",
  people: "SDM",
  ops: "Operasional",
  finance: "Keuangan",
  other: "Lainnya",
};

export default function UnitDetailDialog({
  departmentId,
  open,
  onOpenChange,
}: {
  departmentId: Id<"departments"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useQuery(
    api.bod.getUnitDetail,
    open && departmentId ? { departmentId } : "skip",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {detail === undefined ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !detail || !detail.found ? (
          <>
            <DialogHeader>
              <DialogTitle>Unit tidak ditemukan</DialogTitle>
              <DialogDescription>
                Data unit ini tidak tersedia atau tidak dapat diakses.
              </DialogDescription>
            </DialogHeader>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{detail.name}</DialogTitle>
              <DialogDescription>
                Detail KPI unit pada {detail.periodLabel}.
              </DialogDescription>
            </DialogHeader>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserCircle className="size-4" />
                {detail.headName ?? "Belum ada kepala unit"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" />
                {detail.employeeCount} karyawan
              </span>
            </div>

            {/* Health summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Tercapai", value: detail.achieved, tone: "text-emerald-600 dark:text-emerald-400" },
                { label: "On Track", value: detail.onTrack, tone: "text-emerald-600 dark:text-emerald-400" },
                { label: "Berisiko", value: detail.atRisk, tone: "text-amber-600 dark:text-amber-400" },
                { label: "Menyimpang", value: detail.offTrack, tone: "text-rose-600 dark:text-rose-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3 text-center">
                  <p className={cn("text-xl font-bold leading-none", s.tone)}>
                    {s.value}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Average progress */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rata-rata progres</span>
                <span className="font-semibold">{detail.averageProgress}%</span>
              </div>
              <Progress value={detail.averageProgress} className="mt-2 h-2" />
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                Objektif Departemen ({detail.objectives.length})
              </h4>
              {detail.objectives.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Target />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada objektif</EmptyTitle>
                    <EmptyDescription>
                      Unit ini belum memiliki objektif departemen pada periode ini.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {detail.objectives.map((o) => (
                    <div key={o._id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{o.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {CATEGORY_LABEL[o.category] ?? o.category}
                            {o.ownerName ? ` · ${o.ownerName}` : ""}
                            {` · ${o.keyResultCount} key result`}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-medium",
                            HEALTH_TEXT[o.health] ?? "text-muted-foreground",
                          )}
                        >
                          {HEALTH_LABEL[o.health] ?? o.health}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={o.progress} className="h-1.5" />
                        <span className="w-9 shrink-0 text-right text-xs font-semibold">
                          {o.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button asChild variant="secondary">
                <Link to="/okr">
                  Buka modul OKR
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
