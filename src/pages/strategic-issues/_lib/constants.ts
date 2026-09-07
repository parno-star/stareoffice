// Shared labels & visual tokens for the Strategic Issues board.
// Kept in a plain module (no component export) so it can be imported by
// multiple components without tripping react-refresh.

export const URGENCY_OPTIONS = [
  { value: "critical", label: "Kritis" },
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
] as const;

export const IMPACT_OPTIONS = [
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
] as const;

export const STATUS_OPTIONS = [
  { value: "needs_decision", label: "Perlu Keputusan Direksi" },
  { value: "in_progress", label: "Dalam Pengerjaan" },
  { value: "monitoring", label: "Terpantau" },
  { value: "resolved", label: "Selesai" },
] as const;

export const URGENCY_LABEL: Record<string, string> = {
  critical: "Kritis",
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

export const IMPACT_LABEL: Record<string, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

export const STATUS_LABEL: Record<string, string> = {
  needs_decision: "Perlu Keputusan Direksi",
  in_progress: "Dalam Pengerjaan",
  monitoring: "Terpantau",
  resolved: "Selesai",
};

// Tailwind classes for urgency badges (readable in light + dark).
export const URGENCY_BADGE: Record<string, string> = {
  critical:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 border-orange-200 dark:border-orange-500/30",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 border-slate-200 dark:border-slate-500/30",
};

// Left border accent per status column.
export const STATUS_ACCENT: Record<string, string> = {
  needs_decision: "border-l-rose-500",
  in_progress: "border-l-sky-500",
  monitoring: "border-l-amber-500",
  resolved: "border-l-emerald-500",
};

export const STATUS_DOT: Record<string, string> = {
  needs_decision: "bg-rose-500",
  in_progress: "bg-sky-500",
  monitoring: "bg-amber-500",
  resolved: "bg-emerald-500",
};
