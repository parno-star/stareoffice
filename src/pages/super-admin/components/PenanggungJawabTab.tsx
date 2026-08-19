import React, { useState } from "react";
import {
  UserCheck,
  Search,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Edit,
  X,
  CreditCard,
  Building2,
  ExternalLink
} from "lucide-react";
import { SuperAdminDb, Organization } from "../mockDb";

interface Representative {
  userId: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: "admin" | "it_support" | "hr" | "director";
  isCreator: boolean;
}

interface PJRecord {
  organizationId: string;
  orgName: string;
  orgPlan: string;
  orgIsActive: boolean;
  billingStatus: "Aktif" | "Tenggang" | "Uji Coba";
  representative: Representative;
}

interface PenanggungJawabTabProps {
  db: SuperAdminDb;
  onChangeDb: (updated: SuperAdminDb) => void;
}

const INITIAL_PJS: Record<string, Representative> = {
  org1: {
    userId: "pj1",
    name: "Siti Aminah, S.Kom.",
    email: "siti.aminah@antwi.id",
    phone: "0812-4455-6677",
    jobTitle: "IT Administration Manager",
    role: "admin",
    isCreator: true
  },
  org2: {
    userId: "pj2",
    name: "Bimo Cahya Wibawa",
    email: "cahya@bima.wibawa.co.id",
    phone: "0812-3344-5566",
    jobTitle: "Direktur Utama",
    role: "director",
    isCreator: true
  },
  org3: {
    userId: "pj3",
    name: "Pratama Putra, M.T.",
    email: "putra@pratamaglobal.co.id",
    phone: "0813-8899-7711",
    jobTitle: "Kepala Sistem Informasi",
    role: "it_support",
    isCreator: false
  },
  org4: {
    userId: "pj4",
    name: "Siti Nurhaliza, S.E.",
    email: "siti.haliza@stareoffice.id",
    phone: "0813-9876-5432",
    jobTitle: "Finance & Accounting Lead",
    role: "admin",
    isCreator: false
  },
  org5: {
    userId: "pj5",
    name: "Median Siregar",
    email: "median@medianet.net.id",
    phone: "0819-3322-1100",
    jobTitle: "HR & General Affairs Manager",
    role: "hr",
    isCreator: true
  },
  org6: {
    userId: "pj6",
    name: "Rian Hidayat",
    email: "rian.hidayat@gkm.id",
    phone: "0852-5544-3322",
    jobTitle: "Operations Administrator",
    role: "admin",
    isCreator: true
  },
  org7: {
    userId: "pj7",
    name: "Hendrik Wijaya",
    email: "hendrik@integra.co.id",
    phone: "0811-2211-0099",
    jobTitle: "Support Coordinator",
    role: "it_support",
    isCreator: true
  },
  org8: {
    userId: "pj8",
    name: "Karno Sukarto",
    email: "karno@majubersama.org",
    phone: "0857-9988-7766",
    jobTitle: "Sekretaris Koperasi",
    role: "admin",
    isCreator: true
  }
};

export default function PenanggungJawabTab({ db, onChangeDb }: PenanggungJawabTabProps) {
  const [search, setSearch] = useState("");
  const [editingPj, setEditingPj] = useState<{ orgId: string; pj: Representative } | null>(null);

  // Load custom PJ list from localStorage if modified, otherwise use static
  const [pjs, setPjs] = useState<Record<string, Representative>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("star_eoffice_pj_contacts");
      if (stored) {
        try { return JSON.parse(stored); } catch { return INITIAL_PJS; }
      }
    }
    return INITIAL_PJS;
  });

  const savePjs = (updatedPjs: Record<string, Representative>) => {
    setPjs(updatedPjs);
    if (typeof window !== "undefined") {
      localStorage.setItem("star_eoffice_pj_contacts", JSON.stringify(updatedPjs));
    }
  };

  // Compile full directory records
  const directory: PJRecord[] = db.organizations.map((org) => {
    const representative = pjs[org._id] || {
      userId: `pj_gen_${org._id}`,
      name: "Belum Ditugaskan",
      email: org.email || "info@" + org.code.toLowerCase() + ".co.id",
      phone: org.phone || "—",
      jobTitle: "Administrator Platform",
      role: "admin",
      isCreator: false
    };

    let billingStatus: "Aktif" | "Tenggang" | "Uji Coba" = "Aktif";
    if (org.plan === "Poc") {
      billingStatus = "Uji Coba";
    }

    return {
      organizationId: org._id,
      orgName: org.name,
      orgPlan: org.plan,
      orgIsActive: org.isActive,
      billingStatus,
      representative
    };
  });

  const filteredDirectory = directory.filter((rec) => {
    const term = search.toLowerCase();
    return (
      rec.orgName.toLowerCase().includes(term) ||
      rec.representative.name.toLowerCase().includes(term) ||
      rec.representative.email.toLowerCase().includes(term)
    );
  });

  const handleUpdatePj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPj) return;

    const updatedPjs = {
      ...pjs,
      [editingPj.orgId]: editingPj.pj
    };

    savePjs(updatedPjs);

    // Write audit log
    const orgName = db.organizations.find((o) => o._id === editingPj.orgId)?.name || "Organisasi";
    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Updated PJ Contact: ${editingPj.pj.name}`,
      organization: orgName,
      category: "Organisasi",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      auditLogs: [newLog, ...db.auditLogs]
    });

    setEditingPj(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" id="pj-header">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama PJ, email, atau perusahaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-lg border bg-background w-full focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border">
          Menampilkan <span className="font-semibold text-foreground">{filteredDirectory.length}</span> penanggung jawab
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="pj-grid">
        {filteredDirectory.map((rec) => (
          <div
            key={rec.organizationId}
            className={`rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between transition-all ${
              !rec.orgIsActive ? "opacity-60 border-rose-100" : "hover:border-primary/40"
            }`}
          >
            {/* Upper half: Org header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Building2 className="size-4 text-muted-foreground" />
                    {rec.orgName}
                  </h3>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                      rec.orgPlan === "Enterprise"
                        ? "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/10 dark:bg-fuchsia-950/40 dark:text-fuchsia-400"
                        : rec.orgPlan === "Poc"
                        ? "bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-950/40 dark:text-sky-400"
                        : "bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-950/40 dark:text-slate-400"
                    }`}>
                      {rec.orgPlan}
                    </span>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                      rec.billingStatus === "Aktif"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : rec.billingStatus === "Uji Coba"
                        ? "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-400"
                        : "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/40 dark:text-rose-400"
                    }`}>
                      {rec.billingStatus}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingPj({ orgId: rec.organizationId, pj: { ...rec.representative } })}
                  className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors"
                  title="Update Penanggung Jawab"
                >
                  <Edit className="size-4" />
                </button>
              </div>

              {/* Representative info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/5 rounded-full text-primary">
                    <UserCheck className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium block">
                      Nama Kontak PJ {rec.representative.isCreator && <span className="text-emerald-600 text-[10px] font-semibold font-sans bg-emerald-50 px-1 rounded ml-1 dark:bg-emerald-950/40 dark:text-emerald-400">Pemilik Org</span>}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{rec.representative.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Mail className="size-3" /> Email
                    </span>
                    <span className="text-xs text-foreground block truncate" title={rec.representative.email}>
                      {rec.representative.email}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Phone className="size-3" /> Telepon
                    </span>
                    <span className="text-xs text-foreground block">
                      {rec.representative.phone}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Briefcase className="size-3" /> Jabatan
                    </span>
                    <span className="text-xs text-foreground block truncate">
                      {rec.representative.jobTitle}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Shield className="size-3" /> Hak Akses
                    </span>
                    <span className="text-xs text-foreground block capitalize font-medium">
                      {rec.representative.role === "admin"
                        ? "Org. Administrator"
                        : rec.representative.role === "it_support"
                        ? "IT Administrator"
                        : rec.representative.role === "director"
                        ? "Director / C-Level"
                        : "HR Manager"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT PJ MODAL */}
      {editingPj && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Edit className="size-5 text-primary" />
                Edit Kontak Penanggung Jawab
              </h3>
              <button onClick={() => setEditingPj(null)} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePj} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Nama Lengkap PJ</label>
                <input
                  type="text"
                  required
                  value={editingPj.pj.name}
                  onChange={(e) =>
                    setEditingPj({
                      ...editingPj,
                      pj: { ...editingPj.pj, name: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Email Kontak</label>
                  <input
                    type="email"
                    required
                    value={editingPj.pj.email}
                    onChange={(e) =>
                      setEditingPj({
                        ...editingPj,
                        pj: { ...editingPj.pj, email: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">No Handphone</label>
                  <input
                    type="text"
                    required
                    value={editingPj.pj.phone}
                    onChange={(e) =>
                      setEditingPj({
                        ...editingPj,
                        pj: { ...editingPj.pj, phone: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Jabatan Resmi</label>
                  <input
                    type="text"
                    required
                    value={editingPj.pj.jobTitle}
                    onChange={(e) =>
                      setEditingPj({
                        ...editingPj,
                        pj: { ...editingPj.pj, jobTitle: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">Hak Akses Sistem</label>
                  <select
                    value={editingPj.pj.role}
                    onChange={(e) =>
                      setEditingPj({
                        ...editingPj,
                        pj: { ...editingPj.pj, role: e.target.value as any }
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                  >
                    <option value="admin">Administrator Organisasi</option>
                    <option value="it_support">IT Administrator</option>
                    <option value="hr">HR Manager</option>
                    <option value="director">Director / C-Level</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPj(null)}
                  className="px-4 py-2 text-xs rounded-lg border hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Update Kontak PJ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
