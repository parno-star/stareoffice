/**
 * PeriodSelector — dua dropdown: Tipe Periode + Nilai Periode
 * Tipe: Tanggal | Bulan | Triwulan | Semester | Tahun
 *
 * Format value:
 *   Tanggal   → "YYYY-MM-DD"
 *   Bulan     → "YYYY-MM"
 *   Triwulan  → "YYYY-Q1" … "YYYY-Q4"
 *   Semester  → "YYYY-S1" | "YYYY-S2"
 *   Tahun     → "YYYY"
 */

import { useState } from "react";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PeriodType = "tanggal" | "bulan" | "triwulan" | "semester" | "tahun";

const PERIOD_TYPES: { value: PeriodType; label: string }[] = [
  { value: "tanggal",   label: "Tanggal"   },
  { value: "bulan",     label: "Bulan"     },
  { value: "triwulan",  label: "Triwulan"  },
  { value: "semester",  label: "Semester"  },
  { value: "tahun",     label: "Tahun"     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function formatPeriod(p: string): string {
  if (!p) return "";
  // Tanggal: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) {
    const [y, m, d] = p.split("-");
    return `${d} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
  }
  // Triwulan: YYYY-Q1..Q4
  if (/^\d{4}-Q[1-4]$/.test(p)) {
    const [y, q] = p.split("-");
    const labels: Record<string, string> = { Q1: "TW I", Q2: "TW II", Q3: "TW III", Q4: "TW IV" };
    return `${labels[q] ?? q} ${y}`;
  }
  // Semester: YYYY-S1..S2
  if (/^\d{4}-S[12]$/.test(p)) {
    const [y, s] = p.split("-");
    return `${s === "S1" ? "Sem I" : "Sem II"} ${y}`;
  }
  // Tahun: YYYY
  if (/^\d{4}$/.test(p)) return p;
  // Bulan: YYYY-MM (default / legacy)
  const [y, m] = p.split("-");
  return `${MONTHS[parseInt(m ?? "1", 10) - 1]} ${y}`;
}

/** Detect the period type from a value string */
export function detectPeriodType(value: string): PeriodType {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "tanggal";
  if (/^\d{4}-Q[1-4]$/.test(value))       return "triwulan";
  if (/^\d{4}-S[12]$/.test(value))        return "semester";
  if (/^\d{4}$/.test(value))              return "tahun";
  return "bulan";
}

/** Default value for a given type at the current date */
function defaultValueForType(type: PeriodType): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  if (type === "tanggal")  return `${y}-${m}-${d}`;
  if (type === "bulan")    return `${y}-${m}`;
  if (type === "triwulan") return `${y}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  if (type === "semester") return `${y}-${now.getMonth() < 6 ? "S1" : "S2"}`;
  return String(y);
}

/** Generate selectable options for a given type */
function generateOptions(type: PeriodType): { value: string; label: string }[] {
  const now = new Date();
  const curY = now.getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => curY - 5 + i); // curY-5 … curY

  if (type === "tanggal") {
    // Hanya tanggal dalam bulan berjalan
    const y = now.getFullYear();
    const m = now.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const opts: { value: string; label: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const v = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      opts.push({ value: v, label: formatPeriod(v) });
    }
    return opts.reverse(); // terbaru di atas
  }

  if (type === "bulan") {
    const opts: { value: string; label: string }[] = [];
    for (const y of years) {
      for (let m = 1; m <= 12; m++) {
        // Untuk tahun berjalan: tampilkan semua 12 bulan
        // Untuk tahun sebelumnya: tampilkan semua
        // Untuk tahun setelah tahun berjalan: tidak ditampilkan (years sudah dibatasi)
        const v = `${y}-${String(m).padStart(2, "0")}`;
        opts.push({ value: v, label: formatPeriod(v) });
      }
    }
    return opts.reverse(); // bulan terbaru di atas
  }

  if (type === "triwulan") {
    const opts: { value: string; label: string }[] = [];
    for (const y of years) {
      for (const q of ["Q1","Q2","Q3","Q4"]) {
        const v = `${y}-${q}`;
        opts.push({ value: v, label: formatPeriod(v) });
      }
    }
    return opts.reverse();
  }

  if (type === "semester") {
    const opts: { value: string; label: string }[] = [];
    for (const y of years) {
      for (const s of ["S1","S2"]) {
        const v = `${y}-${s}`;
        opts.push({ value: v, label: formatPeriod(v) });
      }
    }
    return opts.reverse();
  }

  // tahun
  return years.reverse().map((y) => ({ value: String(y), label: String(y) }));
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function PeriodSelector({ value, onChange }: Props) {
  const [periodType, setPeriodType] = useState<PeriodType>(() => detectPeriodType(value));

  const options = generateOptions(periodType);

  // When type changes, reset value to default for that type
  function handleTypeChange(t: PeriodType) {
    setPeriodType(t);
    onChange(defaultValueForType(t));
  }

  // Jika value saat ini tidak ada di opsi (misal dari periode lain), reset ke opsi pertama (bulan berjalan)
  const safeValue = options.find((o) => o.value === value)?.value ?? options[0]?.value ?? value;

  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground select-none shrink-0">Periode</Label>
      {/* Tipe dropdown */}
      <Select value={periodType} onValueChange={(v) => handleTypeChange(v as PeriodType)}>
        <SelectTrigger className="h-8 w-24 text-xs cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value} className="text-xs cursor-pointer">
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Nilai dropdown */}
      <Select value={safeValue} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-32 text-xs cursor-pointer">
          <SelectValue>{formatPeriod(safeValue)}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs cursor-pointer">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
