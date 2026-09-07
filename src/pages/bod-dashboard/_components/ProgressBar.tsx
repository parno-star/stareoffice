import { cn } from "@/lib/utils.ts";

type Props = {
  value: number;
  max?: number;
  colorClass?: string;
  showLabel?: boolean;
  height?: string;
};

function getColor(pct: number): string {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-emerald-400";
  if (pct >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export default function ProgressBar({ value, max = 100, colorClass, showLabel = false, height = "h-2" }: Props) {
  const pct = Math.min(100, Math.max(0, max > 0 ? Math.round((value / max) * 100) : 0));
  const barColor = colorClass ?? getColor(pct);
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex-1 rounded-full bg-muted overflow-hidden", height)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium tabular-nums text-muted-foreground w-8 text-right">
          {pct}%
        </span>
      )}
    </div>
  );
}
