import React from "react";

export default function TalentPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Manajemen Talenta
        </h1>
      </div>
      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-muted-foreground">
          Pemetaan kompetensi dan pengembangan karir karyawan.
        </p>
      </div>
    </div>
  );
}
