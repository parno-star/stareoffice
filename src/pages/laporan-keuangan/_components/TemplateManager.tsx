/**
 * TemplateManager — pengaturan kolom template Excel
 * User bisa rename label kolom, aktifkan/nonaktifkan kolom, dan reset ke default.
 * Konfigurasi disimpan di localStorage per-browser (cukup untuk kebutuhan ini).
 */
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { RotateCcw, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";

// ── Default column definitions ────────────────────────────────────────────────

export type TemplateColumn = {
  key: string;          // internal key matches FinanceReportData
  defaultLabel: string; // default column header in Excel
  label: string;        // customized header
  enabled: boolean;
  required: boolean;    // cannot be disabled
  unit: string;         // display hint
};

export const DEFAULT_COLUMNS: TemplateColumn[] = [
  // ── Wajib ───────────────────────────────────────────────────────────────────
  { key: "period",              defaultLabel: "Periode",                      label: "Periode",                      enabled: true,  required: true,  unit: "e.g. 2025-07" },
  { key: "periodType",          defaultLabel: "Tipe Periode",                 label: "Tipe Periode",                 enabled: true,  required: true,  unit: "bulan/triwulan/semester/tahun" },

  // ── KPI Keuangan (urutan sesuai dashboard Finance) ───────────────────────────
  { key: "totalRevenue_program",   defaultLabel: "Pendapatan - Anggaran",     label: "Pendapatan - Anggaran",        enabled: true,  required: false, unit: "Rp (Budget)" },
  { key: "totalRevenue_realisasi", defaultLabel: "Pendapatan - Realisasi",    label: "Pendapatan - Realisasi",       enabled: true,  required: false, unit: "Rp" },
  { key: "totalCost_program",      defaultLabel: "Biaya - Anggaran",          label: "Biaya - Anggaran",             enabled: true,  required: false, unit: "Rp" },
  { key: "totalCost_realisasi",    defaultLabel: "Biaya - Realisasi",         label: "Biaya - Realisasi",            enabled: true,  required: false, unit: "Rp" },
  { key: "grossProfit_program",    defaultLabel: "Laba Kotor - Anggaran",   label: "Laba Kotor - Anggaran",      enabled: true,  required: false, unit: "Rp" },
  { key: "grossProfit_realisasi",  defaultLabel: "Laba Kotor - Realisasi",  label: "Laba Kotor - Realisasi",     enabled: true,  required: false, unit: "Rp" },
  { key: "ebitda_program",         defaultLabel: "EBITDA - Anggaran",         label: "EBITDA - Anggaran",            enabled: true,  required: false, unit: "Rp" },
  { key: "ebitda_realisasi",       defaultLabel: "EBITDA - Realisasi",        label: "EBITDA - Realisasi",           enabled: true,  required: false, unit: "Rp" },
  { key: "netProfit_program",      defaultLabel: "Laba Bersih - Anggaran",    label: "Laba Bersih - Anggaran",       enabled: true,  required: false, unit: "Rp" },
  { key: "netProfit_realisasi",    defaultLabel: "Laba Bersih - Realisasi",   label: "Laba Bersih - Realisasi",      enabled: true,  required: false, unit: "Rp" },
  { key: "cashFlow_program",       defaultLabel: "Cash Flow - Anggaran",      label: "Cash Flow - Anggaran",         enabled: true,  required: false, unit: "Rp" },
  { key: "cashFlow_realisasi",     defaultLabel: "Cash Flow - Realisasi",     label: "Cash Flow - Realisasi",        enabled: true,  required: false, unit: "Rp" },
  { key: "ar_program",             defaultLabel: "Hutang - Anggaran",         label: "Hutang - Anggaran",            enabled: true,  required: false, unit: "Rp" },
  { key: "ar_realisasi",           defaultLabel: "Hutang - Realisasi",        label: "Hutang - Realisasi",           enabled: true,  required: false, unit: "Rp" },
  { key: "ap_program",             defaultLabel: "Tagihan - Anggaran",        label: "Tagihan - Anggaran",           enabled: true,  required: false, unit: "Rp" },
  { key: "ap_realisasi",           defaultLabel: "Tagihan - Realisasi",       label: "Tagihan - Realisasi",          enabled: true,  required: false, unit: "Rp" },

  // ── Opsional ─────────────────────────────────────────────────────────────────
  { key: "note",                   defaultLabel: "Catatan",                   label: "Catatan",                      enabled: true,  required: false, unit: "teks" },
];

const STORAGE_KEY = "finance_template_columns";

export function loadColumns(): TemplateColumn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMNS.map((c) => ({ ...c }));
    const saved = JSON.parse(raw) as Partial<TemplateColumn>[];
    // Merge saved labels/enabled into defaults (in case new columns were added)
    return DEFAULT_COLUMNS.map((def) => {
      const s = saved.find((x) => x.key === def.key);
      return s ? { ...def, label: s.label ?? def.label, enabled: s.enabled ?? def.enabled } : { ...def };
    });
  } catch {
    return DEFAULT_COLUMNS.map((c) => ({ ...c }));
  }
}

function saveColumns(cols: TemplateColumn[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (cols: TemplateColumn[]) => void;
};

export default function TemplateManager({ open, onClose, onSaved }: Props) {
  const [cols, setCols] = useState<TemplateColumn[]>([]);

  useEffect(() => {
    if (open) setCols(loadColumns());
  }, [open]);

  function setLabel(key: string, label: string) {
    setCols((prev) => prev.map((c) => c.key === key ? { ...c, label } : c));
  }

  function toggleEnabled(key: string) {
    setCols((prev) => prev.map((c) => c.key === key && !c.required ? { ...c, enabled: !c.enabled } : c));
  }

  function handleReset() {
    setCols(DEFAULT_COLUMNS.map((c) => ({ ...c })));
  }

  function handleSave() {
    saveColumns(cols);
    onSaved(cols);
    toast.success("Pengaturan template disimpan");
    onClose();
  }

  const enabledCount = cols.filter((c) => c.enabled).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="size-4 text-blue-600" />
            Pengaturan Template Excel
          </DialogTitle>
          <DialogDescription>
            Aktifkan/nonaktifkan kolom dan ubah nama header kolom di template Excel. Kolom yang dinonaktifkan tidak akan muncul di template download maupun saat upload.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
          <span>{enabledCount} kolom aktif dari {cols.length} total</span>
          <Button variant="ghost" size="sm" onClick={handleReset} className="cursor-pointer gap-1 text-xs h-7">
            <RotateCcw className="size-3" /> Reset Default
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_180px_60px] bg-muted/60 text-[11px] font-semibold text-muted-foreground px-3 py-2 gap-2">
            <div>Aktif</div>
            <div>Nama Kolom di Excel</div>
            <div>Unit / Contoh Nilai</div>
            <div>Wajib</div>
          </div>
          <div className="divide-y">
            {cols.map((col) => (
              <div
                key={col.key}
                className={`grid grid-cols-[40px_1fr_180px_60px] items-center px-3 py-2 gap-2 ${
                  !col.enabled ? "opacity-50 bg-muted/20" : "bg-background"
                }`}
              >
                <Switch
                  checked={col.enabled}
                  onCheckedChange={() => toggleEnabled(col.key)}
                  disabled={col.required}
                  className="cursor-pointer"
                />
                <Input
                  value={col.label}
                  onChange={(e) => setLabel(col.key, e.target.value)}
                  disabled={!col.enabled}
                  className="h-7 text-sm"
                  placeholder={col.defaultLabel}
                />
                <span className="text-[11px] text-muted-foreground truncate">{col.unit}</span>
                <div className="flex justify-center">
                  {col.required && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">Wajib</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">Batal</Button>
          <Button size="sm" onClick={handleSave} className="cursor-pointer gap-1.5">
            <Save className="size-3.5" />
            Simpan Pengaturan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
