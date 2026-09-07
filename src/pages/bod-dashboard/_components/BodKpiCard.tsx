import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";

export type RagStatus = "green" | "amber" | "red" | "neutral";

// Map a RAG status to the accent used for the status dot + left border.
const RAG_ACCENT: Record<RagStatus, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  neutral: "bg-muted-foreground/40",
};

const RAG_BORDER: Record<RagStatus, string> = {
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-rose-500",
  neutral: "border-l-border",
};

const RAG_ICON_TONE: Record<RagStatus, string> = {
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  neutral: "bg-primary/10 text-primary",
};

const RAG_LABEL: Record<RagStatus, string> = {
  green: "Aman",
  amber: "Perhatian",
  red: "Kritis",
  neutral: "Netral",
};

export default function BodKpiCard({
  icon: Icon,
  label,
  value,
  sublabel,
  rag,
  deltaLabel,
  deltaDirection,
  higherIsBetter,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel: string;
  rag: RagStatus;
  deltaLabel: string | null;
  deltaDirection: "up" | "down" | "flat" | null;
  higherIsBetter: boolean;
}) {
  // Color the delta by whether the movement is favorable for this metric.
  const isFavorable =
    deltaDirection === "flat" || deltaDirection === null
      ? null
      : (deltaDirection === "up") === higherIsBetter;
  const DeltaIcon =
    deltaDirection === "up"
      ? ArrowUpRight
      : deltaDirection === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <Card className={cn("border-l-4", RAG_BORDER[rag])}>
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            RAG_ICON_TONE[rag],
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs text-muted-foreground">{label}</p>
            <span
              className={cn("size-2 shrink-0 rounded-full", RAG_ACCENT[rag])}
              title={RAG_LABEL[rag]}
            />
          </div>
          <p className="mt-0.5 text-2xl font-bold leading-tight">{value}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[11px] text-muted-foreground">{sublabel}</p>
            {deltaLabel ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-medium",
                  isFavorable === null
                    ? "text-muted-foreground"
                    : isFavorable
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400",
                )}
              >
                <DeltaIcon className="size-3" />
                {deltaLabel}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
