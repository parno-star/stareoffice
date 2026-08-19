import React from "react";

export default function ProfileVerificationPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profile Verification
        </h1>
      </div>
      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm space-y-4">
        <p className="text-muted-foreground">
          Verify your employee profile information, credentials, and documentation status.
        </p>
      </div>
    </div>
  );
}
