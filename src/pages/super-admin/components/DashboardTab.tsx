import React from "react";
import {
  Building2,
  Users,
  CreditCard,
  FileText,
  Database,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { SuperAdminDb } from "../mockDb";

interface DashboardTabProps {
  db: SuperAdminDb;
}

export default function DashboardTab({ db }: DashboardTabProps) {
  const totalOrgs = db.organizations.length;
  const activeOrgs = db.organizations.filter((o) => o.isActive).length;
  const totalUsers = db.organizations.reduce((acc, curr) => acc + curr.usersCount, 0);
  const totalDocs = db.organizations.reduce((acc, curr) => acc + curr.documentsCount, 0);
  const totalStorageMb = db.organizations.reduce((acc, curr) => acc + curr.storageUsedMb, 0);

  const pendingUpgrades = db.upgradeRequests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Organisasi Klien
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-foreground">{totalOrgs}</span>
              <span className="text-xs text-emerald-600 font-semibold">{activeOrgs} Aktif</span>
            </div>
            <span className="text-[11px] text-muted-foreground block">Enterprise, Poc, & Free</span>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <Building2 className="size-6" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Pengguna / Karyawan
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-foreground">{totalUsers.toLocaleString("id-ID")}</span>
            </div>
            <span className="text-[11px] text-muted-foreground block">Terdaftar di seluruh tenant</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl shrink-0 dark:text-indigo-400">
            <Users className="size-6" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Dokumen & Surat Terproses
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-foreground">{totalDocs.toLocaleString("id-ID")}</span>
            </div>
            <span className="text-[11px] text-muted-foreground block">Surat Masuk, Keluar, & TTE</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0 dark:text-emerald-400">
            <FileText className="size-6" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Kapasitas Penyimpanan
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-foreground">{(totalStorageMb / 1024).toFixed(2)} GB</span>
            </div>
            <span className="text-[11px] text-muted-foreground block">Storage cloud terpakai</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl shrink-0 dark:text-amber-400">
            <Database className="size-6" />
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Subscription Overview */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Distribusi Lisensi Perlangganan Organisasi
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Breakdown paket aktif yang digunakan oleh organisasi perusahaan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center py-2">
            <div className="p-4 rounded-xl border bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border-fuchsia-200 dark:border-fuchsia-900/50">
              <span className="text-[10px] uppercase font-bold text-fuchsia-700 dark:text-fuchsia-400 block">
                Enterprise Plan
              </span>
              <span className="text-2xl font-extrabold text-fuchsia-900 dark:text-fuchsia-200 block mt-1">
                {db.organizations.filter((o) => o.plan === "Enterprise").length}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Maksimal / Custom</span>
            </div>

            <div className="p-4 rounded-xl border bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/50">
              <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400 block">
                Poc Plan (Trial Pro)
              </span>
              <span className="text-2xl font-extrabold text-sky-900 dark:text-sky-200 block mt-1">
                {db.organizations.filter((o) => o.plan === "Poc").length}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Uji Coba Fitur Full</span>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400 block">
                Free Tier
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-200 block mt-1">
                {db.organizations.filter((o) => o.plan === "Free").length}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Fitur Dasar</span>
            </div>
          </div>

          {/* Pending Upgrade Alert Banner if any */}
          {pendingUpgrades.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="size-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold block">
                    Ada {pendingUpgrades.length} Permintaan Upgrade Paket Pending
                  </span>
                  <span className="text-[11px] opacity-90">
                    Klien meminta persetujuan perubahan lisensi perusahaan.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Platform Health & System Status */}
        <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Activity className="size-4 text-emerald-600" />
              Status Sistem & Infras
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded text-[10px] font-bold">
              Operational 99.9%
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground font-medium">Database Multi-Tenant</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Normal
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground font-medium">Server TTE BSrE Service</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground font-medium">Penyimpanan Cloud Storage</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Normal
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground font-medium">Email Notification Relay</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
