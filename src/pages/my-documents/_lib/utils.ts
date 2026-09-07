import {
  FileText,
  IdCard,
  Award,
  Receipt,
  Landmark,
  HeartPulse,
  FileStack,
  Briefcase,
} from "lucide-react";

export type EmployeeDocCategory =
  | "contract"
  | "id"
  | "certificate"
  | "payslip"
  | "tax"
  | "medical"
  | "other";

export type EmployeeDocCategoryConfig = {
  label: string;
  description: string;
  icon: typeof FileText;
  dot: string;
  badge: string;
  tint: string;
};

export const EMPLOYEE_DOC_CATEGORIES: Record<
  EmployeeDocCategory,
  EmployeeDocCategoryConfig
> = {
  contract: {
    label: "Kontrak Kerja",
    description: "Surat perjanjian, addendum, NDA",
    icon: Briefcase,
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  id: {
    label: "Identitas",
    description: "KTP, NPWP, paspor, SIM",
    icon: IdCard,
    dot: "bg-violet-500",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  certificate: {
    label: "Sertifikat",
    description: "Pelatihan, pendidikan, penghargaan",
    icon: Award,
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  payslip: {
    label: "Slip Gaji",
    description: "Slip gaji bulanan, THR, bonus",
    icon: Receipt,
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  tax: {
    label: "Pajak",
    description: "SPT, bukti potong PPh21",
    icon: Landmark,
    dot: "bg-sky-500",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  medical: {
    label: "Kesehatan",
    description: "Surat dokter, MCU, asuransi",
    icon: HeartPulse,
    dot: "bg-rose-500",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  other: {
    label: "Lainnya",
    description: "Dokumen pribadi lain",
    icon: FileStack,
    dot: "bg-slate-500",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    tint: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
};

export const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getCategoryConfig(
  category: string,
): EmployeeDocCategoryConfig {
  if (category in EMPLOYEE_DOC_CATEGORIES) {
    return EMPLOYEE_DOC_CATEGORIES[category as EmployeeDocCategory];
  }
  return EMPLOYEE_DOC_CATEGORIES.other;
}

export function formatIsoDate(date: string | undefined): string {
  if (!date) return "-";
  const [y, m, d] = date.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export type ExpiryStatus = "none" | "ok" | "soon" | "expired";

export function getExpiryStatus(expiry: string | undefined): ExpiryStatus {
  if (!expiry) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30 = new Date(today);
  in30.setDate(today.getDate() + 30);
  const [y, m, d] = expiry.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return "none";
  const exp = new Date(y, m - 1, d);
  exp.setHours(0, 0, 0, 0);
  if (exp.getTime() < today.getTime()) return "expired";
  if (exp.getTime() <= in30.getTime()) return "soon";
  return "ok";
}
