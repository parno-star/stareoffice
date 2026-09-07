import { ChevronRight, Users, Target } from "lucide-react";
import { Card } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import type { RagStatus } from "./BodKpiCard.tsx";

export type UnitKpi = {
  departmentId: string | null;
  name: string;
  color: string;
  headName: string | null;
  employeeCount: number;
  objectiveCount: number;
  averageProgress: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  achieved: number;
  riskCount: number;
  rag: RagStatus;
};

const RAG_BORDER: Record<RagStatus, string> = {
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-rose-500",
  neutral: "border-l-border",
};

const RAG_DOT: Record<RagStatus, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  neutral: "bg-muted-foreground/40",
};

const RAG_TEXT: Record<RagStatus, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-rose-600 dark:text-rose-400",
  neutral: "text-muted-foreground",
};

const RAG_LABEL: Record<RagStatus, string> = {
  green: "Aman",
  amber: "Perhatian",
  red: "Kritis",
  neutral: "Belum ada OKR",
};

const RAG_BAR: Record<RagStatus, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  neutral: "bg-muted-foreground/40",
};

export default function UnitKpiCard({
  unit,
  onClick,
}: {
  unit: UnitKpi;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer gap-0 border-l-4 p-4 transition-colors hover:border-primary/40 hover:shadow-md",
        RAG_BORDER[unit.rag],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", RAG_DOT[unit.rag])} />
            <h3 className="truncate font-semibold leading-tight">{unit.name}</h3>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {unit.headName ? `Kepala: ${unit.headName}` : "Belum ada kepala unit"}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold leading-none">
            {unit.objectiveCount > 0 ? `${unit.averageProgress}%` : "-"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Rata-rata progres</p>
        </div>
        <span className={cn("text-xs font-medium", RAG_TEXT[unit.rag])}>
          {RAG_LABEL[unit.rag]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {unit.objectiveCount > 0 ? (
          <div
            className={cn("h-full", RAG_BAR[unit.rag])}
            style={{ width: `${unit.averageProgress}%` }}
          />
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Target className="size-3" />
          {unit.objectiveCount} objektif
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3" />
          {unit.employeeCount} orang
        </span>
        {unit.riskCount > 0 ? (
          <span className={cn("inline-flex items-center gap-1 font-medium", RAG_TEXT.red)}>
            {unit.riskCount} berisiko
          </span>
        ) : null}
      </div>
    </Card>
  );
}
