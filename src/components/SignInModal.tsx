import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Crown,
  Building2,
  UserCheck,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
  LogIn,
  KeyRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useAuth } from "@/hooks/use-auth.ts";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const navigate = useNavigate();
  const { signinRedirect, setDemoLogin } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleDemoSignIn = async (roleKey: string, roleName: string) => {
    try {
      setLoadingRole(roleKey);
      setDemoLogin(roleKey);
      toast.success(`Berhasil Masuk sebagai ${roleName}!`, {
        description: "Anda sekarang berada dalam Mode Demo / Quick Access.",
      });
      onOpenChange(false);
      navigate("/home");
    } catch (err) {
      console.error("Demo signin error:", err);
      toast.error("Gagal masuk mode demo");
    } finally {
      setLoadingRole(null);
    }
  };

  const handleSsoSignIn = async () => {
    try {
      toast.info("Mengalihkan ke server SSO / OIDC...");
      await signinRedirect({ prompt: "select_account" });
    } catch (err) {
      console.error("SSO error:", err);
      toast.error("Gagal menghubungkan ke SSO", {
        description: "Silakan gunakan Mode Demo jika server SSO belum terkonfigurasi.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 sm:rounded-2xl">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-5 border-b border-border/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Masuk ke Star e-Office
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Pilih metode masuk untuk menguji dan menggunakan aplikasi
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Mode Demo / Quick Access */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="mr-1 size-3" /> Rekomendasi
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Mode Demo & Quick Access
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">Direct 1-Click Access</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Akses instan tanpa password untuk menguji seluruh dashboard, manajemen surat, HRD, dan fitur aplikasi secara lengkap.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Card 1: Super Admin */}
              <button
                type="button"
                onClick={() => handleDemoSignIn("super_admin", "Super Admin")}
                disabled={loadingRole !== null}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md hover:shadow-primary/5 cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Crown className="size-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Akses Penuh
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    Super Admin
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    Platform Owner: Kelola seluruh organisasi, billing, dan pengaturan sistem.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>Masuk Akun</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Card 2: Admin HRD */}
              <button
                type="button"
                onClick={() => handleDemoSignIn("hr_manager", "Admin HRD")}
                disabled={loadingRole !== null}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md hover:shadow-primary/5 cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Building2 className="size-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Manager HR
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    Admin HRD
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    Kelola data pegawai, rekrutmen, payroll, surat resmi, & persetujuan cuti.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>Masuk Akun</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              {/* Card 3: Pegawai / Staff */}
              <button
                type="button"
                onClick={() => handleDemoSignIn("employee", "Pegawai / Staff")}
                disabled={loadingRole !== null}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md hover:shadow-primary/5 cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <UserCheck className="size-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Karyawan
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    Pegawai / Staff
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    Portal mandiri karyawan: pengajuan cuti, absensi, slip gaji, & dokumen.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>Masuk Akun</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">
                Atau gunakan SSO resmi
              </span>
            </div>
          </div>

          {/* Section 2: OIDC / SSO */}
          <div className="rounded-xl border border-border/60 bg-muted/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-sm">
                <ShieldCheck className="size-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Login SSO (Single Sign-On)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Otentikasi aman via Hercules OIDC / Corporate OAuth.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSsoSignIn}
              variant="default"
              size="sm"
              className="w-full sm:w-auto cursor-pointer gap-2 shadow-md shadow-primary/15"
            >
              <LogIn className="size-4" />
              Masuk via SSO
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
