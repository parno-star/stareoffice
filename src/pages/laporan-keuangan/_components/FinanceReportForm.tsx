/**
 * Form input laporan keuangan — dipakai untuk Input Manual dan Edit.
 * Setiap KPI mempunyai Program (target) + Realisasi (aktual).
 * Pencapaian (%) dihitung otomatis: round(realisasi / program * 100).
 */
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Save, Send, Info, Layers, Settings2 } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

import type { FinanceReportData, KpiPR, FinanceReportRow } from "@/convex/bodExtended.ts";
import PeriodSelector, { detectPeriodType } from "@/pages/bod-dashboard/_components/PeriodSelector.tsx";

// ── Input angka dengan separator titik ribuan ─────────────────────────────────
function NumInput({ value, onChange, placeholder = "0", className }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  function toDisplay(raw: string) {
    const n = raw.replace(/\D/g, "");
    if (!n) return "";
    return Number(n).toLocaleString("id-ID");
  }
  function fromDisplay(display: string) {
    return display.replace(/\./g, "").replace(/\D/g, "");
  }
  return (
    <input
      inputMode="numeric"
      placeholder={placeholder}
      value={toDisplay(value)}
      onChange={(e) => onChange(fromDisplay(e.target.value))}
      className={cn(
        "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono text-right shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseNum(v: string | undefined) {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatNum(v: number) {
  return v === 0 ? "" : String(v);
}

function pencapaian(program: number, realisasi: number): number {
  return program > 0 ? Math.round((realisasi / program) * 100) : 0;
}

function achBadgeCls(v: number) {
  if (v >= 100) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (v >= 80)  return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
}

// Hanya key KPI (bertipe KpiPR); revenueByLine ditangani terpisah
type FieldKey = Exclude<keyof FinanceReportData, "revenueByLine">;

// Urutan & label sesuai dashboard Finance (KPI_META di RevenueTab.tsx)
const FIELDS: { key: FieldKey; label: string; sub?: string }[] = [
  { key: "totalRevenue", label: "Pendapatan",  sub: "Total Pendapatan" },
  { key: "totalCost",    label: "Biaya",       sub: "Total Biaya Pokok Pendapatan" },
  { key: "grossProfit",  label: "Laba Kotor" },
  { key: "ebitda",       label: "EBITDA" },
  { key: "netProfit",    label: "Laba Bersih" },
  { key: "cashFlow",     label: "Arus Kas" },
  { key: "ar",           label: "Hutang" },
  { key: "ap",           label: "Tagihan" },
];

type DraftEntry = { program: string; realisasi: string };
type Draft = Record<string, DraftEntry>;

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  editRow?: FinanceReportRow | null;
  onManageLines?: () => void;
};

export default function FinanceReportForm({ open, onClose, editRow, onManageLines }: Props) {
  const upsert = useMutation(api.bodExtended.upsertFinanceReport);
  const lineNames = useQuery(api.bodExtended.getRevenueLineNames, open ? {} : "skip");

  const [period, setPeriod] = useState(currentPeriod());
  const [draft, setDraft] = useState<Draft>({});
  // Nilai per lini bisnis, dikunci berdasarkan nama: name -> { program, realisasi }
  const [lineValues, setLineValues] = useState<Record<string, DraftEntry>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Seed from editRow when opened
  useEffect(() => {
    if (open) {
      if (editRow) {
        setPeriod(editRow.period);
        const d: Draft = {};
        for (const f of FIELDS) {
          const pr = editRow.data[f.key];
          d[f.key] = {
            program: formatNum(pr?.program ?? 0),
            realisasi: formatNum(pr?.realisasi ?? 0),
          };
        }
        setDraft(d);
        const lv: Record<string, DraftEntry> = {};
        for (const l of editRow.data.revenueByLine ?? []) {
          lv[l.name.toLowerCase()] = {
            program: formatNum(l.program),
            realisasi: formatNum(l.realisasi),
          };
        }
        setLineValues(lv);
        setNote(editRow.note ?? "");
      } else {
        setPeriod(currentPeriod());
        setDraft({});
        setLineValues({});
        setNote("");
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function setField(key: string, part: keyof DraftEntry, val: string) {
    setDraft((prev) => ({
      ...prev,
      [key]: { program: prev[key]?.program ?? "", realisasi: prev[key]?.realisasi ?? "", [part]: val },
    }));
  }

  function setLineValue(name: string, part: keyof DraftEntry, val: string) {
    const key = name.toLowerCase();
    setLineValues((prev) => ({
      ...prev,
      [key]: { program: prev[key]?.program ?? "", realisasi: prev[key]?.realisasi ?? "", [part]: val },
    }));
  }

  function prOf(key: string): KpiPR {
    return { program: parseNum(draft[key]?.program), realisasi: parseNum(draft[key]?.realisasi) };
  }

  async function handleSave(status: "draft" | "final") {
    setSaving(true);
    try {
      const revenueByLine = (lineNames ?? [])
        .map((name) => {
          const v = lineValues[name.toLowerCase()];
          return {
            name: name.trim(),
            program: parseNum(v?.program),
            realisasi: parseNum(v?.realisasi),
          };
        })
        .filter((l) => l.name !== "");
      const data: FinanceReportData = {
        totalRevenue:      prOf("totalRevenue"),
        grossProfit:       prOf("grossProfit"),
        ebitda:            prOf("ebitda"),
        cashFlow:          prOf("cashFlow"),
        ar:                prOf("ar"),
        ap:                prOf("ap"),
        totalCost:         prOf("totalCost"),
        netProfit:         prOf("netProfit"),
        ...(revenueByLine.length > 0 ? { revenueByLine } : {}),
      };
      await upsert({
        period,
        periodType: detectPeriodType(period),
        data: JSON.stringify(data),
        note: note.trim() || undefined,
        status,
      });
      toast.success(status === "final"
        ? "Laporan dikirim ke Dashboard Direksi"
        : "Draft laporan disimpan");
      onClose();
    } catch (err) {
      toast.error("Gagal menyimpan laporan");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!editRow;

  // Ringkasan pencapaian keseluruhan (berdasarkan Total Revenue)
  const revPR = prOf("totalRevenue");
  const overallAch = pencapaian(revPR.program, revPR.realisasi);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardListIcon />
            {isEdit ? "Edit Laporan Keuangan" : "Input Dashboard Direksi - Keuangan"}
          </DialogTitle>
          <DialogDescription>
            Isi <strong>Program (Target)</strong> dan <strong>Realisasi (Aktual)</strong> untuk tiap KPI. <strong>Pencapaian</strong> dihitung otomatis. Simpan sebagai <strong>Draft</strong> atau <strong>Kirim ke Direksi</strong> agar langsung muncul di Dashboard.
          </DialogDescription>
        </DialogHeader>

        {/* Periode */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Periode Laporan</Label>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {/* KPI Fields */}
        <div className="rounded-lg border overflow-hidden">
          {/* Header */}
          <div className="bg-muted/60 px-4 py-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">KPI Keuangan</p>
          </div>
          <div className="divide-y">
            {FIELDS.map((f) => {
              const pr = prOf(f.key);
              const ach = pencapaian(pr.program, pr.realisasi);
              return (
                <div key={f.key} className="px-4 py-3 space-y-2">
                  {/* Nama KPI + Pencapaian */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground">{f.label}</p>
                      {f.sub && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="size-3 text-muted-foreground/60 cursor-help shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">
                              {f.sub}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <Badge className={cn("text-[11px] px-2 py-0.5 tabular-nums font-bold shrink-0", achBadgeCls(ach))}>
                      {ach}%
                    </Badge>
                  </div>
                  {/* Program & Realisasi */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Program (Target)</Label>
                      <NumInput
                        value={draft[f.key]?.program ?? ""}
                        onChange={(v) => setField(f.key, "program", v)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Realisasi (Aktual)</Label>
                      <NumInput
                        value={draft[f.key]?.realisasi ?? ""}
                        onChange={(v) => setField(f.key, "realisasi", v)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Pencapaian */}
        <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold">Ringkasan Pencapaian</p>
            <p className="text-[11px] text-muted-foreground">
              Berdasarkan Total Revenue (Realisasi / Program)
            </p>
          </div>
          <Badge className={cn("text-sm px-3 py-1 tabular-nums font-bold", achBadgeCls(overallAch))}>
            {overallAch}%
          </Badge>
        </div>

        {/* Pendapatan per Lini Bisnis */}
        <div className="rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between gap-2 bg-muted/60 px-4 py-2">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5 text-emerald-600" />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Pendapatan per Lini Bisnis
              </p>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 text-muted-foreground/60 cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-[240px]">
                    Daftar lini bisnis dikelola terpusat. Isi Program &amp; Realisasi tiap lini bisnis di sini; masing-masing akan tampil sebagai kartu di dashboard. Untuk menambah/menghapus nama lini bisnis, klik "Kelola Lini Bisnis".
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {onManageLines && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onManageLines}
                className="cursor-pointer h-7 gap-1 text-xs"
              >
                <Settings2 className="size-3.5" /> Kelola Lini Bisnis
              </Button>
            )}
          </div>

          {lineNames === undefined ? (
            <p className="text-[11px] text-muted-foreground text-center py-4 px-4">Memuat daftar lini bisnis...</p>
          ) : lineNames.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-4 px-4">
              Belum ada lini bisnis. Klik <strong>"Kelola Lini Bisnis"</strong> untuk menetapkan daftar lini bisnis perusahaan (opsional). Setelah ditambahkan, baris isian akan muncul otomatis di sini.
            </p>
          ) : (
            <div className="divide-y">
              {lineNames.map((name) => {
                const v = lineValues[name.toLowerCase()];
                const ach = pencapaian(parseNum(v?.program), parseNum(v?.realisasi));
                return (
                  <div key={name} className="px-4 py-3 space-y-2">
                    {/* Nama lini bisnis + Pencapaian */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <Badge className={cn("text-[11px] px-2 py-0.5 tabular-nums font-bold shrink-0", achBadgeCls(ach))}>
                        {ach}%
                      </Badge>
                    </div>
                    {/* Program & Realisasi */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Program (Target)</Label>
                        <NumInput value={v?.program ?? ""} onChange={(val) => setLineValue(name, "program", val)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Realisasi (Aktual)</Label>
                        <NumInput value={v?.realisasi ?? ""} onChange={(val) => setLineValue(name, "realisasi", val)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Catatan */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Catatan (opsional)</Label>
          <Textarea
            placeholder="Tambahkan keterangan atau catatan laporan..."
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving} className="cursor-pointer">
            Batal
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="cursor-pointer gap-1.5"
            >
              <Save className="size-3.5" />
              Simpan Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave("final")}
              disabled={saving}
              className="cursor-pointer gap-1.5"
            >
              <Send className="size-3.5" />
              {saving ? "Mengirim..." : "Kirim ke Direksi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClipboardListIcon() {
  return (
    <svg className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
