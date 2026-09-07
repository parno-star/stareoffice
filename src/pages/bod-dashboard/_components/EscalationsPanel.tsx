import { Link } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  Target,
  TriangleAlert,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

type EscalationItem = {
  key: string;
  source: "okr" | "issue";
  severity: "critical" | "high";
  title: string;
  reason: string;
  context: string | null;
  link: string;
};

type EscalationsResult = {
  hasAccess: boolean;
  generatedAt: string;
  criticalCount: number;
  highCount: number;
  items: Array<EscalationItem>;
};

const SEVERITY_STYLE: Record<
  "critical" | "high",
  { border: string; dot: string; badge: string; label: string }
> = {
  critical: {
    border: "border-l-rose-500",
    dot: "bg-rose-500",
    badge:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    label: "Kritis",
  },
  high: {
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    label: "Perlu Perhatian",
  },
};

export default function EscalationsPanel({
  data,
}: {
  data: EscalationsResult | undefined;
}) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <TriangleAlert className="size-4.5 text-primary" />
          </div>
          <div>
            <CardTitle>Perlu Perhatian Direksi</CardTitle>
            <CardDescription>
              Sinyal berisiko yang otomatis diangkat: OKR menyimpang/berisiko
              dan isu strategis mendesak.
            </CardDescription>
          </div>
        </div>
        {data && (data.items?.length ?? 0) > 0 ? (
          <div className="flex shrink-0 items-center gap-2">
            {(data.criticalCount ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                <AlertOctagon className="size-3.5" />
                {data.criticalCount} Kritis
              </span>
            ) : null}
            {(data.highCount ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <AlertTriangle className="size-3.5" />
                {data.highCount} Perhatian
              </span>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (data.items?.length ?? 0) === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">
                Tidak ada eskalasi
              </p>
              <p className="text-emerald-700/80 dark:text-emerald-300/80">
                Semua OKR strategis sehat dan tidak ada isu strategis mendesak.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(data.items ?? []).map((item) => {
              const style = SEVERITY_STYLE[item.severity];
              const SourceIcon = item.source === "okr" ? Target : TriangleAlert;
              return (
                <Link
                  key={item.key}
                  to={item.link}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border border-l-4 bg-card p-3 transition-colors hover:bg-accent",
                    style.border,
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        style.dot,
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            style.badge,
                          )}
                        >
                          {style.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <SourceIcon className="size-3" />
                          {item.source === "okr" ? "OKR" : "Isu Strategis"}
                        </span>
                        {item.context ? (
                          <span className="text-[11px] text-muted-foreground">
                            · {item.context}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate font-medium leading-tight">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
