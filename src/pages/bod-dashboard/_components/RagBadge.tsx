import { cn } from "@/lib/utils.ts";

type RagBadgeProps = {
  level: "critical" | "high" | "medium" | "low" | "green" | "amber" | "red" | "neutral" | string;
  label?: string;
  size?: "sm" | "md";
};

const COLORS: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  red:      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  high:     "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
  amber:    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  medium:   "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  low:      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  green:    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  neutral:  "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
};

const DOT_COLORS: Record<string, string> = {
  critical: "bg-rose-500", red: "bg-rose-500",
  high: "bg-orange-500", amber: "bg-amber-500",
  medium: "bg-amber-500", low: "bg-emerald-500",
  green: "bg-emerald-500", neutral: "bg-slate-400",
};

const LABELS: Record<string, string> = {
  critical: "Kritis", red: "Merah",
  high: "Tinggi", amber: "Kuning",
  medium: "Sedang", low: "Rendah",
  green: "Hijau", neutral: "Netral",
};

export default function RagBadge({ level, label, size = "sm" }: RagBadgeProps) {
  const key = level.toLowerCase();
  const color = COLORS[key] ?? COLORS.neutral;
  const dot = DOT_COLORS[key] ?? DOT_COLORS.neutral;
  const text = label ?? LABELS[key] ?? level;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      color,
    )}>
      <span className={cn("size-1.5 rounded-full shrink-0", dot)} />
      {text}
    </span>
  );
}
