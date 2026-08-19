import React, { useState } from "react";
import {
  ShieldAlert,
  Search,
  Clock,
  User,
  Building,
  Laptop,
  Filter
} from "lucide-react";
import { SuperAdminDb } from "../mockDb";

interface AuditLogTabProps {
  db: SuperAdminDb;
}

export default function AuditLogTab({ db }: AuditLogTabProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredLogs = db.auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.organization.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || log.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" id="audit-controls">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari user, aksi, atau organisasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-lg border bg-background w-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="Akses">Akses</option>
            <option value="Organisasi">Organisasi</option>
            <option value="Billing">Billing & Keuangan</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border">
          Total Log: <strong className="text-foreground">{filteredLogs.length}</strong> entri
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="p-4">Waktu</th>
                <th className="p-4">User / Peran</th>
                <th className="p-4">Tindakan / Aksi</th>
                <th className="p-4">Target Organisasi</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">IP & Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y text-foreground">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 text-muted-foreground font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground" />
                        <span>
                          {new Date(log.timestamp).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3.5 text-muted-foreground" />
                        <span>{log.user}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-primary">{log.action}</td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building className="size-3.5 text-muted-foreground" />
                        <span>{log.organization}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-semibold">
                        {log.category}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Laptop className="size-3.5 text-muted-foreground" />
                        <span>{log.ip} • {log.device}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Tidak ada log aktivitas sesuai kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
