import React from "react";

export default function ReportsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Laporan & Analitik
        </h1>
      </div>
      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-muted-foreground">
          Laporan komprehensif kinerja dan kegiatan operasional.
        </p>
      </div>
    </div>
  );
}
