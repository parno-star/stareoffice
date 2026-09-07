/**
 * LineManager — kelola daftar nama Lini Bisnis (master list, per organisasi).
 * Menambah nama di sini otomatis:
 *  1. memunculkan baris berlabel di form input laporan keuangan, dan
 *  2. memunculkan kartu di kelompok "Pendapatan per Lini Bisnis" pada Dashboard Direksi.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Layers, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LineManager({ open, onClose }: Props) {
  const names = useQuery(api.bodExtended.getRevenueLineNames, open ? {} : "skip");
  const save = useMutation(api.bodExtended.saveRevenueLineNames);

  const [items, setItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Seed dari server saat dibuka
  useEffect(() => {
    if (open && names !== undefined) {
      setItems(names.length > 0 ? names : [""]);
    }
  }, [open, names]);

  function setItem(idx: number, val: string) {
    setItems((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }
  function addItem() {
    setItems((prev) => [...prev, ""]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await save({ names: items });
      toast.success("Daftar lini bisnis disimpan");
      onClose();
    } catch {
      toast.error("Gagal menyimpan daftar lini bisnis");
    } finally {
      setSaving(false);
    }
  }

  const loading = names === undefined;
  const filledCount = items.filter((v) => v.trim() !== "").length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-4 text-emerald-600" />
            Kelola Lini Bisnis
          </DialogTitle>
          <DialogDescription>
            Tetapkan daftar lini bisnis perusahaan. Setiap nama akan otomatis muncul sebagai baris di form input laporan (untuk diisi Program &amp; Realisasi) dan sebagai kartu di kelompok <strong>Pendapatan per Lini Bisnis</strong> pada Dashboard Direksi.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {items.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                  <Input
                    value={val}
                    onChange={(e) => setItem(idx, e.target.value)}
                    placeholder="contoh : Jasa Konstruksi"
                    className="h-9 text-sm"
                    autoFocus={idx === items.length - 1 && val === ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    className="size-8 cursor-pointer text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addItem}
              className="cursor-pointer gap-1.5 w-full"
            >
              <Plus className="size-4" /> Tambah Lini Bisnis
            </Button>
          </>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">{filledCount} lini bisnis</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving} className="cursor-pointer">
              Batal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || loading} className="cursor-pointer gap-1.5">
              <Save className="size-3.5" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
