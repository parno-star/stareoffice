/**
 * ExcelUploader — upload file Excel/CSV laporan keuangan
 * Fitur:
 * 1. Download template Excel (kolom sesuai pengaturan)
 * 2. Upload file → parse → preview tabel
 * 3. Konfirmasi → upsert ke database → sync ke dashboard BoD
 */
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import * as XLSX from "xlsx";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table.tsx";
import {
  FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import type { FinanceReportData, KpiPR, RevenueLine } from "@/convex/bodExtended.ts";
import { loadColumns, type TemplateColumn } from "./TemplateManager.tsx";
import { detectPeriodType, formatPeriod } from "@/pages/bod-dashboard/_components/PeriodSelector.tsx";

// ── Types ─────────────────────────────────────────────────────────────────────

type ParsedRow = {
  period: string;
  periodType: string;
  data: FinanceReportData;
  note?: string;
  valid: boolean;
  error?: string;
};

// ── Parser ────────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseRows(rawRows: Record<string, unknown>[], cols: TemplateColumn[]): ParsedRow[] {
  const enabledCols = cols.filter((c) => c.enabled);

  // Build label→key map (case-insensitive)
  const labelToKey = new Map<string, string>();
  for (const col of enabledCols) {
    labelToKey.set(col.label.toLowerCase().trim(), col.key);
    labelToKey.set(col.defaultLabel.toLowerCase().trim(), col.key);
  }
  // Alias lama (backward-compat) — template sebelumnya memakai label berbeda
  const ALIASES: Record<string, string> = {
    "total revenue - program":        "totalRevenue_program",
    "total revenue - realisasi":      "totalRevenue_realisasi",
    "total revenue - anggaran":       "totalRevenue_program",
    "gross profit - program":         "grossProfit_program",
    "gross profit - realisasi":       "grossProfit_realisasi",
    "gross profit - anggaran":        "grossProfit_program",
    "ebitda - program":               "ebitda_program",
    "ebitda - realisasi":             "ebitda_realisasi",
    "ebitda - anggaran":              "ebitda_program",
    "cash flow - program":            "cashFlow_program",
    "cash flow - realisasi":          "cashFlow_realisasi",
    "cash flow - anggaran":           "cashFlow_program",
    "accounts receivable - program":  "ar_program",
    "accounts receivable - realisasi":"ar_realisasi",
    "accounts payable - program":     "ap_program",
    "accounts payable - realisasi":   "ap_realisasi",
    "piutang (ar) - program":         "ar_program",
    "piutang (ar) - anggaran":        "ar_program",
    "piutang (ar) - realisasi":       "ar_realisasi",
    "hutang (ap) - program":          "ap_program",
    "hutang (ap) - anggaran":         "ap_program",
    "hutang (ap) - realisasi":        "ap_realisasi",
    "hutang - program":               "ar_program",
    "hutang - anggaran":              "ar_program",
    "hutang - realisasi":             "ar_realisasi",
    "tagihan - program":              "ap_program",
    "tagihan - anggaran":             "ap_program",
    "tagihan - realisasi":            "ap_realisasi",
    "revenue jasa - program":         "totalRevenue_program",
    "revenue jasa - realisasi":       "totalRevenue_realisasi",
    "revenue manufaktur - program":   "totalRevenue_program",
    "revenue manufaktur - realisasi": "totalRevenue_realisasi",
    "total biaya - program":          "totalCost_program",
    "total biaya - realisasi":        "totalCost_realisasi",
    "laba bersih - program":          "netProfit_program",
    "laba bersih - realisasi":        "netProfit_realisasi",
  };
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (!labelToKey.has(alias)) labelToKey.set(alias, key);
  }

  return rawRows.map((raw) => {
    // Normalize keys
    const norm: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      const mapped = labelToKey.get(k.toLowerCase().trim());
      if (mapped) norm[mapped] = v;
    }

    const period = String(norm["period"] ?? "").trim();
    if (!period) {
      return { period: "", periodType: "", data: emptyData(), valid: false, error: "Kolom 'Periode' kosong" };
    }

    const pr = (base: string): KpiPR => ({
      program: parseNum(norm[`${base}_program`]),
      realisasi: parseNum(norm[`${base}_realisasi`]),
    });

    // Pendapatan per lini bisnis — kolom dinamis: "Lini: <Nama> - Program" / "- Realisasi"
    const lineMap = new Map<string, { program: number; realisasi: number }>();
    for (const [k, v] of Object.entries(raw)) {
      const m = k.trim().match(/^lini\s*:\s*(.+?)\s*-\s*(program|realisasi)$/i);
      if (!m) continue;
      const name = m[1].trim();
      if (!name) continue;
      const part = m[2].toLowerCase();
      const entry = lineMap.get(name) ?? { program: 0, realisasi: 0 };
      if (part === "program") entry.program = parseNum(v);
      else entry.realisasi = parseNum(v);
      lineMap.set(name, entry);
    }
    const revenueByLine: RevenueLine[] = Array.from(lineMap.entries())
      .map(([name, val]) => ({ name, program: val.program, realisasi: val.realisasi }));

    const data: FinanceReportData = {
      totalRevenue:      pr("totalRevenue"),
      grossProfit:       pr("grossProfit"),
      ebitda:            pr("ebitda"),
      cashFlow:          pr("cashFlow"),
      ar:                pr("ar"),
      ap:                pr("ap"),
      totalCost: pr("totalCost"),
      netProfit:  pr("netProfit"),
      ...(revenueByLine.length > 0 ? { revenueByLine } : {}),
    };

    const periodType = String(norm["periodType"] ?? detectPeriodType(period)).trim();
    const note = norm["note"] ? String(norm["note"]).trim() : undefined;

    return { period, periodType, data, note, valid: true };
  }).filter((r) => r.period !== "" || !r.valid);
}

function emptyData(): FinanceReportData {
  const zero: KpiPR = { program: 0, realisasi: 0 };
  return {
    totalRevenue: { ...zero }, grossProfit: { ...zero }, ebitda: { ...zero },
    cashFlow: { ...zero }, ar: { ...zero }, ap: { ...zero },
    totalCost: { ...zero }, netProfit: { ...zero },
  };
}

// ── Template generator ────────────────────────────────────────────────────────

function downloadTemplate(cols: TemplateColumn[]) {
  const enabled = cols.filter((c) => c.enabled);
  // Contoh kolom lini bisnis (dinamis) — pengguna bisa tambah/ubah nama lini bisnis
  const LINE_EXAMPLES = ["Divisi Penjualan", "Divisi Produksi"];
  const lineHeaders: string[] = [];
  for (const name of LINE_EXAMPLES) {
    lineHeaders.push(`Lini: ${name} - Program`, `Lini: ${name} - Realisasi`);
  }
  const headers = [...enabled.map((c) => c.label), ...lineHeaders];

  // Sample row
  const sample: Record<string, string | number> = {};
  for (const col of enabled) {
    if (col.key === "period")     { sample[col.label] = "2025-07"; continue; }
    if (col.key === "periodType") { sample[col.label] = "bulan"; continue; }
    if (col.key === "note")       { sample[col.label] = "Contoh catatan"; continue; }
    sample[col.label] = 0;
  }
  for (const h of lineHeaders) sample[h] = 0;

  const ws = XLSX.utils.json_to_sheet([sample], { header: headers });

  // Style header row width
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
  XLSX.writeFile(wb, "template_laporan_keuangan.xlsx");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-10 px-6 cursor-pointer transition-colors",
        dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-muted-foreground/30 hover:border-blue-400 hover:bg-muted/30"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
    >
      <FileSpreadsheet className="size-10 text-muted-foreground/60" />
      <div className="text-center">
        <p className="text-sm font-medium">Seret file Excel/CSV ke sini</p>
        <p className="text-xs text-muted-foreground mt-0.5">atau klik untuk pilih file (.xlsx, .xls, .csv)</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

function formatIDR(v: number) {
  if (v === 0) return "—";
  if (v >= 1e9)  return `${(v / 1e9).toFixed(1)}M`;
  if (v >= 1e6)  return `${(v / 1e6).toFixed(1)}Jt`;
  return v.toLocaleString("id-ID");
}

function formatPR(pr: KpiPR) {
  return `${formatIDR(pr.program)} / ${formatIDR(pr.realisasi)}`;
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ExcelUploader({ open, onClose }: Props) {
  const upsert = useMutation(api.bodExtended.upsertFinanceReport);
  const [cols] = useState<TemplateColumn[]>(() => loadColumns());
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  function reset() {
    setParsed(null);
    setFileName("");
    setStep("upload");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    if (!rawRows.length) {
      toast.error("File kosong atau format tidak valid");
      return;
    }
    const rows = parseRows(rawRows, cols);
    if (!rows.length) {
      toast.error("Tidak ada baris data yang dapat dibaca");
      return;
    }
    setParsed(rows);
    setStep("preview");
  }

  async function handleConfirm(status: "draft" | "final") {
    if (!parsed) return;
    const valid = parsed.filter((r) => r.valid);
    if (!valid.length) {
      toast.error("Tidak ada baris valid untuk disimpan");
      return;
    }
    setSaving(true);
    try {
      let count = 0;
      for (const row of valid) {
        await upsert({
          period: row.period,
          periodType: row.periodType || detectPeriodType(row.period),
          data: JSON.stringify(row.data),
          note: row.note,
          status,
        });
        count++;
      }
      toast.success(
        status === "final"
          ? `${count} laporan berhasil dikirim ke Dashboard Direksi`
          : `${count} laporan disimpan sebagai Draft`
      );
      handleClose();
    } catch (err) {
      toast.error("Gagal menyimpan laporan");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const validCount   = parsed?.filter((r) => r.valid).length ?? 0;
  const invalidCount = parsed?.filter((r) => !r.valid).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-4 text-blue-600" />
            Upload Excel — Laporan Keuangan
          </DialogTitle>
          <DialogDescription>
            Upload file Excel dengan format template yang sudah ditentukan. Pastikan kolom sesuai sebelum upload.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            {/* Download template */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-sm font-medium">Download Template Excel</p>
                <p className="text-xs text-muted-foreground">Isi template ini lalu upload kembali</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadTemplate(cols)}
                className="cursor-pointer gap-1.5 shrink-0"
              >
                <Download className="size-3.5" />
                Download Template
              </Button>
            </div>

            <DropZone onFile={handleFile} />

            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Pendapatan per Lini Bisnis (opsional):</span> tambahkan kolom bernama
              {" "}<span className="font-mono">Lini: &lt;Nama&gt; - Program</span> dan
              {" "}<span className="font-mono">Lini: &lt;Nama&gt; - Realisasi</span> untuk tiap lini bisnis.
              Contohnya sudah ada di template.
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Format yang didukung: .xlsx, .xls, .csv — Maksimal 1000 baris per file
            </div>
          </div>
        )}

        {step === "preview" && parsed && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="size-4 text-blue-600 shrink-0" />
                <span className="text-sm font-medium truncate">{fileName}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[11px] gap-1">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  {validCount} valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="text-[11px] gap-1">
                    <AlertCircle className="size-3 text-destructive" />
                    {invalidCount} error
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="size-7 cursor-pointer" onClick={reset}>
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Preview table */}
            <ScrollArea className="h-72 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-6">#</TableHead>
                    <TableHead className="text-xs">Periode</TableHead>
                    <TableHead className="text-xs text-right">Pendapatan (P/R)</TableHead>
                    <TableHead className="text-xs text-right">Biaya (P/R)</TableHead>
                    <TableHead className="text-xs text-right">Laba Kotor (P/R)</TableHead>
                    <TableHead className="text-xs text-right">EBITDA (P/R)</TableHead>
                    <TableHead className="text-xs text-right">Laba Bersih (P/R)</TableHead>
                    <TableHead className="text-xs text-center">Lini Bisnis</TableHead>
                    <TableHead className="text-xs text-right">Pencapaian</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((row, i) => {
                    const rev = row.data.totalRevenue;
                    const ach = rev.program > 0 ? Math.round((rev.realisasi / rev.program) * 100) : 0;
                    return (
                      <TableRow key={i} className={row.valid ? "" : "bg-destructive/5"}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {row.period ? formatPeriod(row.period) : <span className="text-destructive">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatPR(rev)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatPR(row.data.totalCost)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatPR(row.data.grossProfit)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatPR(row.data.ebitda)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{formatPR(row.data.netProfit)}</TableCell>
                        <TableCell className="text-xs text-center tabular-nums">
                          {row.data.revenueByLine && row.data.revenueByLine.length > 0
                            ? <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{row.data.revenueByLine.length} lini</Badge>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-right tabular-nums font-semibold">
                          {rev.program > 0 ? `${ach}%` : "—"}
                        </TableCell>
                        <TableCell>
                          {row.valid
                            ? <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">OK</Badge>
                            : <Badge variant="destructive" className="text-[9px] px-1.5 py-0">{row.error ?? "Error"}</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            {invalidCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Baris dengan error akan dilewati saat menyimpan.
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={saving} className="cursor-pointer">
            Batal
          </Button>
          {step === "preview" && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleConfirm("draft")}
                disabled={saving || validCount === 0}
                className="cursor-pointer gap-1.5"
              >
                Simpan sebagai Draft
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirm("final")}
                disabled={saving || validCount === 0}
                className="cursor-pointer gap-1.5"
              >
                {saving ? "Mengirim..." : `Kirim ${validCount} Laporan ke Direksi`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
