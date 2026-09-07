export function getLocalDateString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getMonthRange(ref: Date = new Date()): {
  start: string;
  end: string;
  label: string;
} {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const label = start.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  return {
    start: getLocalDateString(start),
    end: getLocalDateString(end),
    label,
  };
}

export function formatClock(iso: string | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateId(date: string): string {
  // date is YYYY-MM-DD
  const [y, m, d] = date.split("-").map((v) => parseInt(v, 10));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMinutes(min: number | undefined): string {
  if (!min || min <= 0) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h}j ${m}m`;
}
