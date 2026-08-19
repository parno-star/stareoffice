import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatClock(timeInput?: string | number | Date | null): string {
  if (!timeInput) return "--:--";
  const date = typeof timeInput === "object" ? timeInput : new Date(timeInput);
  if (isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function getMonthRange(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return {
    start: formatDateStr(firstDay),
    end: formatDateStr(lastDay),
    label: `${monthNames[month]} ${year}`
  };
}

export function formatMinutes(minutes?: number | null): string {
  if (minutes == null || isNaN(minutes)) return "0j 0m";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}j`;
  return `${hours}j ${mins}m`;
}

export function formatDateId(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const monthName = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export const PROJECT_COLORS = [
  { name: "blue", label: "Biru", bg: "bg-blue-500", text: "text-blue-500", ring: "ring-blue-500" },
  { name: "emerald", label: "Hijau", bg: "bg-emerald-500", text: "text-emerald-500", ring: "ring-emerald-500" },
  { name: "violet", label: "Ungu", bg: "bg-violet-500", text: "text-violet-500", ring: "ring-violet-500" },
  { name: "amber", label: "Kuning", bg: "bg-amber-500", text: "text-amber-500", ring: "ring-amber-500" },
  { name: "rose", label: "Merah", bg: "bg-rose-500", text: "text-rose-500", ring: "ring-rose-500" },
  { name: "cyan", label: "Sian", bg: "bg-cyan-500", text: "text-cyan-500", ring: "ring-cyan-500" },
];

export function getProjectColor(colorName?: string) {
  const found = PROJECT_COLORS.find((c) => c.name === colorName);
  return found || PROJECT_COLORS[0];
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDueDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function isOverdue(dueDate?: string | Date | null, status?: string): boolean {
  if (!dueDate) return false;
  if (status === "completed" || status === "done" || status === "closed") return false;
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes == null || isNaN(bytes) || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
