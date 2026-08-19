import React, { useState } from "react";
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Percent,
  DollarSign,
  X
} from "lucide-react";
import { SuperAdminDb, Promo } from "../mockDb";

interface PromosTabProps {
  db: SuperAdminDb;
  onChangeDb: (updated: SuperAdminDb) => void;
}

export default function PromosTab({ db, onChangeDb }: PromosTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<number>(10);
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    const newPromo: Promo = {
      _id: `promo_${Date.now()}`,
      code: code.toUpperCase().trim(),
      discount,
      type,
      active: true,
      usageCount: 0,
      expiryDate
    };

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Created Promo Code: ${newPromo.code}`,
      organization: "Platform-wide",
      category: "Billing",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      promos: [newPromo, ...db.promos],
      auditLogs: [newLog, ...db.auditLogs]
    });

    setCode("");
    setDiscount(10);
    setType("percentage");
    setIsCreateOpen(false);
  };

  const handleTogglePromo = (id: string) => {
    const updatedPromos = db.promos.map((p) => (p._id === id ? { ...p, active: !p.active } : p));
    onChangeDb({ ...db, promos: updatedPromos });
  };

  const handleDeletePromo = (id: string, codeName: string) => {
    if (!confirm(`Hapus kode promo ${codeName}?`)) return;
    const updatedPromos = db.promos.filter((p) => p._id !== id);
    onChangeDb({ ...db, promos: updatedPromos });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" id="promos-header">
        <div>
          <h2 className="text-base font-semibold text-foreground">Kode Promo & Potongan Diskon</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Buat voucher diskon persentase atau nominal tetap untuk organisasi yang ingin upgrade lisensi.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          Buat Kode Promo
        </button>
      </div>

      {/* Promos Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="p-4">Kode Promo</th>
                <th className="p-4">Nilai Diskon</th>
                <th className="p-4">Tipe Potongan</th>
                <th className="p-4">Masa Berlaku</th>
                <th className="p-4">Digunakan</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-foreground">
              {db.promos.length > 0 ? (
                db.promos.map((promo) => (
                  <tr key={promo._id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">
                      <span className="bg-primary/10 px-2 py-1 rounded border border-primary/20">
                        {promo.code}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-sm">
                      {promo.type === "percentage"
                        ? `${promo.discount}%`
                        : `Rp ${promo.discount.toLocaleString("id-ID")}`}
                    </td>
                    <td className="p-4 text-muted-foreground capitalize">
                      {promo.type === "percentage" ? "Persentase (%)" : "Nominal Tetap (Rp)"}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground" />
                        <span>{promo.expiryDate}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">{promo.usageCount} kali</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          promo.active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                        }`}
                      >
                        {promo.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePromo(promo._id)}
                          className={`p-1.5 rounded hover:bg-muted transition-colors ${
                            promo.active ? "text-amber-600" : "text-emerald-600"
                          }`}
                          title={promo.active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {promo.active ? <XCircle className="size-4" /> : <CheckCircle className="size-4" />}
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo._id, promo.code)}
                          className="p-1.5 text-rose-600 rounded hover:bg-muted transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Belum ada kode promo dibuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PROMO MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Tag className="size-5 text-primary" />
                Buat Kode Promo Baru
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePromo} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Kode Voucher (Kapital)</label>
                <input
                  type="text"
                  required
                  placeholder="STAREOFFICE_DISCOUNT"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Tipe Diskon</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Nilai Potongan</label>
                  <input
                    type="number"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Tanggal Kadaluarsa</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs rounded-lg border hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Simpan Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
