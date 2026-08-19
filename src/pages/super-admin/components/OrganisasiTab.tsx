import React, { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Users,
  FileText,
  Database,
  ExternalLink,
  X,
  CreditCard
} from "lucide-react";
import { SuperAdminDb, Organization } from "../mockDb";

interface OrganisasiTabProps {
  db: SuperAdminDb;
  onChangeDb: (updated: SuperAdminDb) => void;
}

export default function OrganisasiTab({ db, onChangeDb }: OrganisasiTabProps) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  // Modals state
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State for Create
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState("Enterprise");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const filteredOrgs = db.organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.code.toLowerCase().includes(search.toLowerCase()) ||
      org.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "all" || org.plan.toLowerCase() === planFilter.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newOrg: Organization = {
      _id: `org_${Date.now()}`,
      name,
      code: code.toUpperCase().trim(),
      plan,
      isActive: true,
      usersCount: 1,
      documentsCount: 0,
      storageUsedMb: 0,
      createdAt: new Date().toISOString().split("T")[0],
      subscriptionPaidUntil: new Date(Date.now() + 86400000 * 365).toISOString().split("T")[0],
      email: email || "info@" + code.toLowerCase() + ".co.id",
      phone: phone || "021-12345678",
      address: address || "Jakarta, Indonesia"
    };

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Created Organization: ${name} (${code})`,
      organization: name,
      category: "Organisasi",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      organizations: [newOrg, ...db.organizations],
      auditLogs: [newLog, ...db.auditLogs]
    });

    // Reset Form
    setName("");
    setCode("");
    setPlan("Enterprise");
    setEmail("");
    setPhone("");
    setAddress("");
    setIsCreateOpen(false);
  };

  const handleUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    const updatedOrgs = db.organizations.map((o) => (o._id === editingOrg._id ? editingOrg : o));

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Updated Organization: ${editingOrg.name}`,
      organization: editingOrg.name,
      category: "Organisasi",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      organizations: updatedOrgs,
      auditLogs: [newLog, ...db.auditLogs]
    });

    setEditingOrg(null);
  };

  const handleToggleActive = (org: Organization) => {
    const updatedOrgs = db.organizations.map((o) =>
      o._id === org._id ? { ...o, isActive: !o.isActive } : o
    );

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `${org.isActive ? "Deactivated" : "Activated"} Organization: ${org.name}`,
      organization: org.name,
      category: "Organisasi",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      organizations: updatedOrgs,
      auditLogs: [newLog, ...db.auditLogs]
    });
  };

  const handleDeleteOrg = (id: string, orgName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus organisasi "${orgName}"? Semua data tenant akan dibekukan.`)) {
      return;
    }

    const updatedOrgs = db.organizations.filter((o) => o._id !== id);

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Deleted Organization: ${orgName}`,
      organization: orgName,
      category: "Organisasi",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      organizations: updatedOrgs,
      auditLogs: [newLog, ...db.auditLogs]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" id="org-header-controls">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama perusahaan, kode, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-lg border bg-background w-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
          >
            <option value="all">Semua Paket Lisensi</option>
            <option value="enterprise">Enterprise</option>
            <option value="poc">Poc (Trial Pro)</option>
            <option value="free">Free</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="size-4" />
          Tambah Organisasi Baru
        </button>
      </div>

      {/* Organizations Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="p-4">Organisasi / Klien</th>
                <th className="p-4">Kode Tenant</th>
                <th className="p-4">Paket Lisensi</th>
                <th className="p-4">Statistik (User / Dokumen)</th>
                <th className="p-4">Berlaku S.D</th>
                <th className="p-4">Status Tenant</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-foreground">
              {filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <tr key={org._id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                          <Building2 className="size-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-foreground block">{org.name}</span>
                          <span className="text-[11px] text-muted-foreground block">{org.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-primary">
                      <span className="bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {org.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          org.plan === "Enterprise"
                            ? "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20 dark:bg-fuchsia-950/40 dark:text-fuchsia-400"
                            : org.plan === "Poc"
                            ? "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400"
                            : "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-900 dark:text-slate-400"
                        }`}
                      >
                        {org.plan}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono">
                          <Users className="size-3.5" /> {org.usersCount}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <FileText className="size-3.5" /> {org.documentsCount}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-muted-foreground">
                      {org.subscriptionPaidUntil}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(org)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                          org.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        {org.isActive ? (
                          <>
                            <CheckCircle className="size-3" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3" /> Inaktif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingOrg(org)}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors"
                          title="Lihat Detail Detail Tenant"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => setEditingOrg({ ...org })}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors"
                          title="Edit Organisasi"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(org._id, org.name)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 rounded hover:bg-muted transition-colors"
                          title="Hapus Tenant"
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
                    Tidak ada organisasi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Tambah Organisasi Baru
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrg} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Nama Perusahaan / Organisasi</label>
                <input
                  type="text"
                  required
                  placeholder="PT Nusantara Jaya Bersama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Kode Singkatan (Unique)</label>
                  <input
                    type="text"
                    required
                    placeholder="NJB"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none uppercase font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Paket Lisensi</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Poc">Poc (Trial Pro)</option>
                    <option value="Free">Free</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Email Kontak Utama</label>
                  <input
                    type="email"
                    required
                    placeholder="info@njb.co.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">No. Telepon Kantor</label>
                  <input
                    type="text"
                    placeholder="021-55443322"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Alamat Kantor Resmi</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Jendral Sudirman No. 1, Jakarta"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                  Simpan Organisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingOrg && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Edit className="size-5 text-primary" />
                Edit Data Organisasi
              </h3>
              <button onClick={() => setEditingOrg(null)} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateOrg} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Nama Perusahaan</label>
                <input
                  type="text"
                  required
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Kode Tenant</label>
                  <input
                    type="text"
                    required
                    value={editingOrg.code}
                    onChange={(e) => setEditingOrg({ ...editingOrg, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Paket Lisensi</label>
                  <select
                    value={editingOrg.plan}
                    onChange={(e) => setEditingOrg({ ...editingOrg, plan: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Poc">Poc (Trial Pro)</option>
                    <option value="Free">Free</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Email Kontak</label>
                  <input
                    type="email"
                    value={editingOrg.email}
                    onChange={(e) => setEditingOrg({ ...editingOrg, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Masa Lisensi s.d.</label>
                  <input
                    type="date"
                    value={editingOrg.subscriptionPaidUntil}
                    onChange={(e) => setEditingOrg({ ...editingOrg, subscriptionPaidUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
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

      {/* VIEW DETAIL MODAL */}
      {viewingOrg && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Detail Tenant Organisasi
              </h3>
              <button onClick={() => setViewingOrg(null)} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-muted/40 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Nama Perusahaan</span>
                <span className="text-sm font-bold text-foreground block">{viewingOrg.name}</span>
                <span className="text-xs text-primary font-mono block">Kode: {viewingOrg.code}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Paket Lisensi</span>
                  <span className="font-bold text-foreground">{viewingOrg.plan}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Status Tenant</span>
                  <span className={`font-bold ${viewingOrg.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                    {viewingOrg.isActive ? "Aktif (Active)" : "Nonaktif (Suspended)"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Jumlah Karyawan</span>
                  <span className="font-mono font-bold text-foreground">{viewingOrg.usersCount} Pengguna</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Dokumen</span>
                  <span className="font-mono font-bold text-foreground">{viewingOrg.documentsCount} Dokumen</span>
                </div>
              </div>

              <div className="space-y-1 border-t pt-3">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Kontak Resmi</span>
                <span className="block text-foreground">{viewingOrg.email} • {viewingOrg.phone}</span>
                <span className="block text-muted-foreground text-[11px]">{viewingOrg.address}</span>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={() => setViewingOrg(null)}
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
