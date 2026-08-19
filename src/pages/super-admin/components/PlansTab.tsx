import React, { useState } from "react";
import {
  CreditCard,
  Plus,
  Edit,
  Check,
  X,
  Users,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { SuperAdminDb, Plan } from "../mockDb";

interface PlansTabProps {
  db: SuperAdminDb;
  onChangeDb: (updated: SuperAdminDb) => void;
}

export default function PlansTab({ db, onChangeDb }: PlansTabProps) {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Plan Form state
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState<number>(0);
  const [newPlanUsersLimit, setNewPlanUsersLimit] = useState<number>(10);
  const [newPlanFeatures, setNewPlanFeatures] = useState<string>("");

  const handleUpdatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const updatedPlans = db.plans.map((p) => (p._id === editingPlan._id ? editingPlan : p));

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Updated Plan: ${editingPlan.name}`,
      organization: "Platform-wide",
      category: "Billing",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      plans: updatedPlans,
      auditLogs: [newLog, ...db.auditLogs]
    });

    setEditingPlan(null);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName) return;

    const featuresList = newPlanFeatures
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const newPlan: Plan = {
      _id: `plan_${Date.now()}`,
      name: newPlanName,
      price: newPlanPrice,
      usersLimit: newPlanUsersLimit,
      features: featuresList.length > 0 ? featuresList : ["Akses Standar"],
      subscribersCount: 0
    };

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Created Plan: ${newPlanName}`,
      organization: "Platform-wide",
      category: "Billing",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      plans: [...db.plans, newPlan],
      auditLogs: [newLog, ...db.auditLogs]
    });

    setNewPlanName("");
    setNewPlanPrice(0);
    setNewPlanUsersLimit(10);
    setNewPlanFeatures("");
    setIsCreateOpen(false);
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus paket "${name}"?`)) return;

    const updatedPlans = db.plans.filter((p) => p._id !== id);

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Deleted Plan: ${name}`,
      organization: "Platform-wide",
      category: "Billing",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      plans: updatedPlans,
      auditLogs: [newLog, ...db.auditLogs]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" id="plans-header">
        <div>
          <h2 className="text-base font-semibold text-foreground">Paket Keanggotaan Platform</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola pilihan paket lisensi, batas kuota pengguna, serta daftar fitur untuk setiap tier perlangganan.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          Tambah Paket Baru
        </button>
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="plans-grid">
        {db.plans.map((plan) => {
          // Count active subscribers for this plan
          const activeOrgsCount = db.organizations.filter(
            (o) => o.plan.toLowerCase() === plan.name.toLowerCase()
          ).length;

          return (
            <div
              key={plan._id}
              className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
            >
              {plan.name === "Enterprise" && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  Populer / Rekomendasi
                </div>
              )}

              <div>
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                      <Users className="size-3.5" />
                      Maks. {plan.usersLimit >= 999 ? "Unlimited" : `${plan.usersLimit} Karyawan`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary">
                      {plan.price === 0
                        ? "Gratis"
                        : `Rp ${plan.price.toLocaleString("id-ID")}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {plan.price === 0 ? "Selamanya" : plan.name === "Enterprise" ? "/ tahun" : "/ bulan"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Fitur & Akses Modul:
                  </span>
                  <ul className="space-y-2 text-xs">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground">{activeOrgsCount}</strong> Organisasi Menggunakan
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPlan({ ...plan })}
                    className="p-2 text-slate-600 rounded hover:bg-muted transition-colors"
                    title="Edit Paket"
                  >
                    <Edit className="size-4" />
                  </button>
                  {plan.name !== "Free" && (
                    <button
                      onClick={() => handleDeletePlan(plan._id, plan.name)}
                      className="p-2 text-rose-600 rounded hover:bg-muted transition-colors"
                      title="Hapus Paket"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE PLAN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground">Tambah Paket Keanggotaan Baru</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Nama Paket</label>
                <input
                  type="text"
                  required
                  placeholder="Pro Business"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Batas Karyawan</label>
                  <input
                    type="number"
                    required
                    value={newPlanUsersLimit}
                    onChange={(e) => setNewPlanUsersLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Fitur (1 per baris)</label>
                <textarea
                  rows={4}
                  placeholder={"Akses E-Office Full\nSupport Email 24/7\nMaksimal 50 Karyawan"}
                  value={newPlanFeatures}
                  onChange={(e) => setNewPlanFeatures(e.target.value)}
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
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground">Edit Paket Keanggotaan</h3>
              <button onClick={() => setEditingPlan(null)} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Nama Paket</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Batas Karyawan</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.usersLimit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, usersLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Fitur (1 per baris)</label>
                <textarea
                  rows={4}
                  value={editingPlan.features.join("\n")}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split("\n").filter((f) => f.trim().length > 0)
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs rounded-lg border hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
