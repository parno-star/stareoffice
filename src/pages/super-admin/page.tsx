import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  Tag,
  Receipt,
  FileSpreadsheet,
  Globe,
  LayoutDashboard,
  ArrowLeft,
  Sparkles
} from "lucide-react";

import { SuperAdminDb, getInitialSuperAdminDb } from "./mockDb";
import DashboardTab from "./components/DashboardTab";
import OrganisasiTab from "./components/OrganisasiTab";
import PenanggungJawabTab from "./components/PenanggungJawabTab";
import PlansTab from "./components/PlansTab";
import PromosTab from "./components/PromosTab";
import BillingTab from "./components/BillingTab";
import AuditLogTab from "./components/AuditLogTab";
import LandingFooterTab from "./components/LandingFooterTab";

type TabKey = "dashboard" | "orgs" | "pj" | "plans" | "promos" | "billing" | "audit" | "landing";

export default function SuperAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load database from localStorage if present, else fallback to initial mock
  const [db, setDb] = useState<SuperAdminDb>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("star_eoffice_superadmin_db");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return getInitialSuperAdminDb();
        }
      }
    }
    return getInitialSuperAdminDb();
  });

  // Save database changes to localStorage
  const handleDbChange = (updatedDb: SuperAdminDb) => {
    setDb(updatedDb);
    if (typeof window !== "undefined") {
      localStorage.setItem("star_eoffice_superadmin_db", JSON.stringify(updatedDb));
    }
  };

  // Determine active tab from URL query param `tab`
  const currentTabParam = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey =
    currentTabParam &&
    ["dashboard", "monitoring", "orgs", "pj", "plans", "promos", "billing", "audit", "landing"].includes(currentTabParam)
      ? currentTabParam === "monitoring" ? "dashboard" : currentTabParam
      : "dashboard";

  const handleTabChange = (key: TabKey) => {
    setSearchParams({ tab: key });
  };

  const pendingUpgradeCount = db.upgradeRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <ShieldAlert className="size-64 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="size-3.5 text-amber-400" />
              Super Admin Console • Platform HQ
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Pusat Kendali e-Office Multi-Tenant
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Kelola seluruh organisasi klien, lisensi perlangganan, penanggung jawab, invoice, promo, dan audit aktivitas platform secara terpusat.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-xl px-4 py-2.5 shrink-0 text-xs">
            <div className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Logged in as</span>
              <span className="font-semibold text-white">parno86@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="border-b border-border overflow-x-auto" id="super-admin-tabs">
        <nav className="flex space-x-1 min-w-max pb-px" aria-label="Tabs">
          <button
            onClick={() => handleTabChange("dashboard")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "dashboard"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <LayoutDashboard className="size-4" />
            Monitoring & Dashboard
          </button>

          <button
            onClick={() => handleTabChange("orgs")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "orgs"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Building2 className="size-4" />
            Organisasi Perusahaan
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-bold text-foreground">
              {db.organizations.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("pj")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "pj"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Users className="size-4" />
            Penanggung Jawab (PJ)
          </button>

          <button
            onClick={() => handleTabChange("plans")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "plans"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <CreditCard className="size-4" />
            Paket Keanggotaan
          </button>

          <button
            onClick={() => handleTabChange("promos")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "promos"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Tag className="size-4" />
            Kode Promo
          </button>

          <button
            onClick={() => handleTabChange("billing")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 relative ${
              activeTab === "billing"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Receipt className="size-4" />
            Billing & Upgrade
            {pendingUpgradeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {pendingUpgradeCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("audit")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "audit"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <FileSpreadsheet className="size-4" />
            Audit Log Platform
          </button>

          <button
            onClick={() => handleTabChange("landing")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === "landing"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Globe className="size-4" />
            Visibilitas Landing Page
          </button>
        </nav>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="pt-2">
        {activeTab === "dashboard" && <DashboardTab db={db} />}
        {activeTab === "orgs" && <OrganisasiTab db={db} onChangeDb={handleDbChange} />}
        {activeTab === "pj" && <PenanggungJawabTab db={db} onChangeDb={handleDbChange} />}
        {activeTab === "plans" && <PlansTab db={db} onChangeDb={handleDbChange} />}
        {activeTab === "promos" && <PromosTab db={db} onChangeDb={handleDbChange} />}
        {activeTab === "billing" && <BillingTab db={db} onChangeDb={handleDbChange} />}
        {activeTab === "audit" && <AuditLogTab db={db} />}
        {activeTab === "landing" && <LandingFooterTab db={db} onChangeDb={handleDbChange} />}
      </div>
    </div>
  );
}
