export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export const PROJECT_STATUSES: Array<{
  value: ProjectStatus;
  label: string;
}> = [
  { value: "active", label: "Aktif" },
  { value: "on_hold", label: "Ditunda" },
  { value: "completed", label: "Selesai" },
  { value: "archived", label: "Diarsipkan" },
];

export const PROJECT_COLORS = [
  { value: "blue", className: "bg-blue-500", lightBg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400" },
  { value: "green", className: "bg-green-500", lightBg: "bg-green-500/10", text: "text-green-700 dark:text-green-400" },
  { value: "violet", className: "bg-violet-500", lightBg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-400" },
  { value: "amber", className: "bg-amber-500", lightBg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400" },
  { value: "rose", className: "bg-rose-500", lightBg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-400" },
  { value: "cyan", className: "bg-cyan-500", lightBg: "bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-400" },
];

export function getProjectColor(value: string) {
  return PROJECT_COLORS.find((c) => c.value === value) ?? PROJECT_COLORS[0];
}

export function getInitials(name: string | undefined | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDueDate(date: string | undefined): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map((v) => parseInt(v, 10));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isOverdue(
  dueDate: string | undefined,
  isCompleted: boolean,
): boolean {
  if (!dueDate || isCompleted) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dueDate.split("-").map((v) => parseInt(v, 10));
  const due = new Date(y, m - 1, d);
  return due.getTime() < today.getTime();
}
