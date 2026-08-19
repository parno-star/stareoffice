import React from "react";

export default function OrganizationsManagementPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Manajemen Organisasi
        </h1>
      </div>
      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-muted-foreground">
          Kelola tenant, organisasi, dan kapasitas lisensi.
        </p>
      </div>
    </div>
  );
}
