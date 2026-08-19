import React from "react";

export default function UserSettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pengaturan Pengguna
        </h1>
      </div>
      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-muted-foreground">
          Kelola peran pengguna, hak akses, dan pengaturan akun.
        </p>
      </div>
    </div>
  );
}
