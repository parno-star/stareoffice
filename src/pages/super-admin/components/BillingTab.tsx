import React, { useState } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Building,
  ArrowUpRight,
  X,
  AlertCircle
} from "lucide-react";
import { SuperAdminDb, BankAccount, Invoice, UpgradeRequest } from "../mockDb";

interface BillingTabProps {
  db: SuperAdminDb;
  onChangeDb: (updated: SuperAdminDb) => void;
}

export default function BillingTab({ db, onChangeDb }: BillingTabProps) {
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);

  // Form State for Bank
  const [bank, setBank] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [branch, setBranch] = useState("");

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bank || !accountNo) return;

    const newBank: BankAccount = {
      _id: `bank_${Date.now()}`,
      bank,
      accountNo,
      accountName: accountName || "PT Star Nusantara Digital",
      branch: branch || "KCP Sudirman"
    };

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Added Bank Account: ${bank}`,
      organization: "Platform-wide",
      category: "Billing",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      bankAccounts: [...db.bankAccounts, newBank],
      auditLogs: [newLog, ...db.auditLogs]
    });

    setBank("");
    setAccountNo("");
    setAccountName("");
    setBranch("");
    setIsAddBankOpen(false);
  };

  const handleDeleteBank = (id: string) => {
    if (!confirm("Hapus rekening pembayaran ini?")) return;
    const updated = db.bankAccounts.filter((b) => b._id !== id);
    onChangeDb({ ...db, bankAccounts: updated });
  };

  const handleApproveRequest = (req: UpgradeRequest) => {
    // 1. Mark request as approved
    const updatedRequests = db.upgradeRequests.map((r) =>
      r._id === req._id ? { ...r, status: "approved" as const } : r
    );

    // 2. Update Org plan
    const updatedOrgs = db.organizations.map((o) => {
      if (o.name.toLowerCase() === req.orgName.toLowerCase()) {
        return {
          ...o,
          plan: req.requestedPlan,
          subscriptionPaidUntil: new Date(Date.now() + 86400000 * 365).toISOString()
        };
      }
      return o;
    });

    // 3. Generate Paid Invoice
    const planPrice = req.requestedPlan === "Poc" ? 1500000 : 5000000;
    const newInvoice: Invoice = {
      _id: `inv_${Date.now()}`,
      orgName: req.orgName,
      plan: req.requestedPlan,
      amount: planPrice,
      date: new Date().toISOString().split("T")[0],
      status: "Paid",
      billingPeriod: "1 Tahun Lisensi"
    };

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Approved Upgrade Request (${req.requestedPlan})`,
      organization: req.orgName,
      category: "Billing",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      upgradeRequests: updatedRequests,
      organizations: updatedOrgs,
      invoices: [newInvoice, ...db.invoices],
      auditLogs: [newLog, ...db.auditLogs]
    });
  };

  const handleRejectRequest = (req: UpgradeRequest) => {
    const updatedRequests = db.upgradeRequests.map((r) =>
      r._id === req._id ? { ...r, status: "rejected" as const } : r
    );

    const newLog = {
      _id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "CIP 2017 (parno86@gmail.com)",
      action: `Rejected Upgrade Request`,
      organization: req.orgName,
      category: "Billing",
      ip: "182.23.10.99",
      device: "Chrome (Windows 11)"
    };

    onChangeDb({
      ...db,
      upgradeRequests: updatedRequests,
      auditLogs: [newLog, ...db.auditLogs]
    });
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: PERMINTAAN UPGRADE PLAN */}
      <div className="space-y-4" id="upgrade-requests-section">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ArrowUpRight className="size-5 text-indigo-600" />
              Permintaan Upgrade Lisensi Perusahaan
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daftar permohonan peningkatan paket dari klien yang menunggu persetujuan Super Admin.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Organisasi / Klien</th>
                  <th className="p-4">Paket Asal → Diajukan</th>
                  <th className="p-4">Alasan Upgrade</th>
                  <th className="p-4">Tanggal Pengajuan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y text-foreground">
                {db.upgradeRequests.length > 0 ? (
                  db.upgradeRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-sm">{req.orgName}</td>
                      <td className="p-4">
                        <span className="font-mono text-muted-foreground">{req.currentPlan}</span>
                        <span className="mx-1 text-primary">→</span>
                        <span className="font-bold text-primary font-mono">{req.requestedPlan}</span>
                      </td>
                      <td className="p-4 text-muted-foreground max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(req.requestedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            req.status === "pending"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              : req.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          }`}
                        >
                          {req.status === "pending" ? "Menunggu Approval" : req.status === "approved" ? "Disetujui" : "Ditolak"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveRequest(req)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded font-semibold text-[11px] hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req)}
                              className="px-3 py-1 bg-muted border text-muted-foreground rounded font-semibold text-[11px] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Tidak ada permintaan upgrade pending saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: REKENING PEMBAYARAN PLATFORM */}
      <div className="space-y-4" id="bank-accounts-section">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              Rekening Bank Tujuan Pembayaran Lisensi
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daftar rekening bank resmi yang ditampilkan ke pengguna saat melakukan perpanjangan paket.
            </p>
          </div>
          <button
            onClick={() => setIsAddBankOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="size-4" />
            Tambah Rekening Bank
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.bankAccounts.map((b) => (
            <div
              key={b._id}
              className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wide block">{b.bank}</span>
                <span className="text-lg font-mono font-bold text-foreground block">{b.accountNo}</span>
                <span className="text-xs text-muted-foreground block">a.n. {b.accountName} ({b.branch})</span>
              </div>
              <button
                onClick={() => handleDeleteBank(b._id)}
                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Hapus Rekening"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: RIWAYAT INVOICE & BILLING */}
      <div className="space-y-4" id="invoices-section">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-5 text-muted-foreground" />
            Riwayat Invoice Pembayaran Organisasi
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar faktur / tagihan pembelian lisensi perlangganan di platform.
          </p>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Organisasi</th>
                  <th className="p-4">Paket</th>
                  <th className="p-4">Periode</th>
                  <th className="p-4">Jumlah Tagihan</th>
                  <th className="p-4">Tanggal Faktur</th>
                  <th className="p-4 text-right">Status Faktur</th>
                </tr>
              </thead>
              <tbody className="divide-y text-foreground">
                {db.invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-bold">{inv.orgName}</td>
                    <td className="p-4 font-mono">{inv.plan}</td>
                    <td className="p-4 text-muted-foreground">{inv.billingPeriod}</td>
                    <td className="p-4 font-bold font-mono">
                      {inv.amount === 0 ? "Gratis" : `Rp ${inv.amount.toLocaleString("id-ID")}`}
                    </td>
                    <td className="p-4 text-muted-foreground">{inv.date}</td>
                    <td className="p-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                          inv.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                        }`}
                      >
                        {inv.status === "Paid" ? "Lunas" : "Menunggu Pembayaran"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD BANK MODAL */}
      {isAddBankOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <CreditCard className="size-5 text-primary" />
                Tambah Rekening Bank
              </h3>
              <button onClick={() => setIsAddBankOpen(false)} className="text-muted-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleAddBank} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Nama Bank</label>
                <input
                  type="text"
                  required
                  placeholder="Bank Central Asia (BCA)"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Nomor Rekening</label>
                <input
                  type="text"
                  required
                  placeholder="123-456-7890"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Atas Nama (A/N)</label>
                <input
                  type="text"
                  placeholder="PT Star Nusantara Digital"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground">Cabang Bank</label>
                <input
                  type="text"
                  placeholder="KCP Sudirman Jakarta"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBankOpen(false)}
                  className="px-4 py-2 text-xs rounded-lg border hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
