import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Building2,
  Users,
  Lock,
  Save,
  UserPlus,
  RefreshCw,
  Crown,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  Globe,
  Mail,
  Clock,
  Sparkles,
  FileCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface AdminUser {
  _id: string;
  id?: number | string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string;
  department?: string;
  organizationId?: string | number | null;
  orgName?: string;
  accountStatus: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  _creationTime?: number;
}

interface OrganizationOption {
  _id?: string;
  id?: number | string;
  name: string;
  slug?: string;
  plan?: string;
  isActive?: boolean;
}

export default function InitialPlatformSetup() {
  // Query platform settings and admin lists from Convex
  const convexSettings = useQuery(api.platformSettings.getPlatformSettings, {});
  const convexAdminsData = useQuery(api.platformSettings.listSuperAdminsAndOrgAdmins, {});
  const updateSettingsMutation = useMutation(api.platformSettings.updatePlatformSettings);
  const designateAdminMutation = useMutation(api.platformSettings.designateSuperAdmin);

  // Local fallback states
  const [loading, setLoading] = useState(false);
  const [restAdminsData, setRestAdminsData] = useState<{
    superAdmins: AdminUser[];
    orgAdmins: AdminUser[];
    organizations: OrganizationOption[];
  } | null>(null);

  // Platform Form State
  const [platformName, setPlatformName] = useState("Sistem Informasi Manajemen Terpadu (SIM Enterprise)");
  const [platformDescription, setPlatformDescription] = useState("Platform Tata Kelola Organisasi, HRIS, E-Surat & Dashboard Eksekutif Terpadu");
  const [supportEmail, setSupportEmail] = useState("admin@enterprise.local");
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(true);
  const [requireOrgApproval, setRequireOrgApproval] = useState(true);
  const [defaultTrialDays, setDefaultTrialDays] = useState("30");
  const [defaultMaxEmployees, setDefaultMaxEmployees] = useState("25");
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState("60");
  const [enforceTwoFactorForAdmins, setEnforceTwoFactorForAdmins] = useState(false);
  const [strictTenantIsolation, setStrictTenantIsolation] = useState(true);
  const [auditLogRetentionDays, setAuditLogRetentionDays] = useState("365");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [primarySuperAdminEmail, setPrimarySuperAdminEmail] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Designation Modal & Form State
  const [designateDialogOpen, setDesignateDialogOpen] = useState(false);
  const [designateMode, setDesignateMode] = useState<"existing" | "new">("existing");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminJobTitle, setNewAdminJobTitle] = useState("Super Administrator");
  const [targetOrgId, setTargetOrgId] = useState<string>("global");
  const [selectedRole, setSelectedRole] = useState<"super_admin" | "admin">("super_admin");
  const [setAsPrimary, setSetAsPrimary] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [designating, setDesignating] = useState(false);

  // Fetch REST API fallback if Convex not connected
  const fetchRestData = useCallback(async () => {
    try {
      const [settingsRes, adminsRes] = await Promise.all([
        fetch("/api/platform/settings"),
        fetch("/api/platform/super-admins"),
      ]);
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (!isInitialized) {
          setPlatformName(sData.platformName || "Sistem Informasi Manajemen Terpadu (SIM Enterprise)");
          setPlatformDescription(sData.platformDescription || "");
          setSupportEmail(sData.supportEmail || "admin@enterprise.local");
          setAllowSelfRegistration(sData.allowSelfRegistration ?? true);
          setRequireOrgApproval(sData.requireOrgApproval ?? true);
          setDefaultTrialDays(String(sData.defaultTrialDays || 30));
          setDefaultMaxEmployees(String(sData.defaultMaxEmployees || 25));
          setSessionTimeoutMinutes(String(sData.sessionTimeoutMinutes || 60));
          setEnforceTwoFactorForAdmins(sData.enforceTwoFactorForAdmins ?? false);
          setStrictTenantIsolation(sData.strictTenantIsolation ?? true);
          setAuditLogRetentionDays(String(sData.auditLogRetentionDays || 365));
          setMaintenanceMode(sData.maintenanceMode ?? false);
          setPrimarySuperAdminEmail(sData.primarySuperAdminEmail || "");
        }
      }
      if (adminsRes.ok) {
        const aData = await adminsRes.json();
        setRestAdminsData(aData);
      }
    } catch {
      // ignore
    }
  }, [isInitialized]);

  // Sync convex query results
  useEffect(() => {
    if (convexSettings && !isInitialized) {
      setPlatformName(convexSettings.platformName);
      setPlatformDescription(convexSettings.platformDescription);
      setSupportEmail(convexSettings.supportEmail);
      setAllowSelfRegistration(convexSettings.allowSelfRegistration);
      setRequireOrgApproval(convexSettings.requireOrgApproval);
      setDefaultTrialDays(String(convexSettings.defaultTrialDays));
      setDefaultMaxEmployees(String(convexSettings.defaultMaxEmployees));
      setSessionTimeoutMinutes(String(convexSettings.sessionTimeoutMinutes));
      setEnforceTwoFactorForAdmins(convexSettings.enforceTwoFactorForAdmins);
      setStrictTenantIsolation(convexSettings.strictTenantIsolation);
      setAuditLogRetentionDays(String(convexSettings.auditLogRetentionDays));
      setMaintenanceMode(convexSettings.maintenanceMode);
      if (convexSettings.primarySuperAdminEmail) {
        setPrimarySuperAdminEmail(convexSettings.primarySuperAdminEmail);
      }
      setIsInitialized(true);
    }
  }, [convexSettings, isInitialized]);

  useEffect(() => {
    fetchRestData();
  }, [fetchRestData]);

  const superAdminsList: AdminUser[] = useMemo(() => {
    if (convexAdminsData?.superAdmins && convexAdminsData.superAdmins.length > 0) {
      return convexAdminsData.superAdmins as unknown as AdminUser[];
    }
    if (restAdminsData?.superAdmins) {
      return restAdminsData.superAdmins;
    }
    return [
      {
        _id: "sa_1",
        name: "Super Administrator Utama",
        email: "parno86@gmail.com",
        role: "super_admin",
        jobTitle: "Super Administrator & Head of System",
        department: "Executive & Governance",
        orgName: "Platform Global",
        accountStatus: "active",
      },
    ];
  }, [convexAdminsData, restAdminsData]);

  const orgAdminsList: AdminUser[] = useMemo(() => {
    if (convexAdminsData?.orgAdmins && convexAdminsData.orgAdmins.length > 0) {
      return convexAdminsData.orgAdmins as unknown as AdminUser[];
    }
    if (restAdminsData?.orgAdmins) {
      return restAdminsData.orgAdmins;
    }
    return [];
  }, [convexAdminsData, restAdminsData]);

  const organizationsList: OrganizationOption[] = useMemo(() => {
    if (convexAdminsData?.organizations && convexAdminsData.organizations.length > 0) {
      return convexAdminsData.organizations as unknown as OrganizationOption[];
    }
    if (restAdminsData?.organizations) {
      return restAdminsData.organizations;
    }
    return [
      { _id: "org_1", id: 1, name: "PT Multi Solusi Digital", plan: "enterprise", isActive: true },
      { _id: "org_2", id: 2, name: "PT Maju Bersama", plan: "pro", isActive: true },
    ];
  }, [convexAdminsData, restAdminsData]);

  // Handle Save Platform Settings
  const handleSavePlatformSettings = async () => {
    setLoading(true);
    try {
      if (updateSettingsMutation) {
        await updateSettingsMutation({
          platformName,
          platformDescription,
          supportEmail,
          allowSelfRegistration,
          requireOrgApproval,
          defaultTrialDays: parseInt(defaultTrialDays) || 30,
          defaultMaxEmployees: parseInt(defaultMaxEmployees) || 25,
          sessionTimeoutMinutes: parseInt(sessionTimeoutMinutes) || 60,
          enforceTwoFactorForAdmins,
          strictTenantIsolation,
          auditLogRetentionDays: parseInt(auditLogRetentionDays) || 365,
          maintenanceMode,
          primarySuperAdminEmail: primarySuperAdminEmail || undefined,
        });
      }

      // Also persist to REST backend
      await fetch("/api/platform/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName,
          platformDescription,
          supportEmail,
          allowSelfRegistration,
          requireOrgApproval,
          defaultTrialDays: parseInt(defaultTrialDays) || 30,
          defaultMaxEmployees: parseInt(defaultMaxEmployees) || 25,
          sessionTimeoutMinutes: parseInt(sessionTimeoutMinutes) || 60,
          enforceTwoFactorForAdmins,
          strictTenantIsolation,
          auditLogRetentionDays: parseInt(auditLogRetentionDays) || 365,
          maintenanceMode,
          primarySuperAdminEmail,
        }),
      });

      toast.success("Pengaturan platform dan kebijakan sistem berhasil disimpan");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan pengaturan";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Super Admin Designation
  const handleDesignateSubmit = async () => {
    const requiredPhrase = "KONFIRMASI SUPER ADMIN";
    if (confirmationPhrase.trim().toUpperCase() !== requiredPhrase && confirmationPhrase.trim().toUpperCase() !== "SETUJU") {
      toast.error(`Harap ketik frasa verifikasi "${requiredPhrase}" dengan tepat.`);
      return;
    }

    if (designateMode === "existing" && !selectedUserId) {
      toast.error("Pilih pengguna yang ingin ditetapkan sebagai administrator.");
      return;
    }

    if (designateMode === "new" && (!newAdminEmail || !newAdminName)) {
      toast.error("Nama dan email administrator wajib diisi.");
      return;
    }

    setDesignating(true);
    try {
      const targetOrg = targetOrgId === "global" ? undefined : targetOrgId;

      if (designateAdminMutation) {
        await designateAdminMutation({
          targetUserId: designateMode === "existing" ? (selectedUserId as Id<"users">) : undefined,
          email: designateMode === "new" ? newAdminEmail.trim() : undefined,
          name: designateMode === "new" ? newAdminName.trim() : undefined,
          jobTitle: designateMode === "new" ? newAdminJobTitle.trim() : undefined,
          organizationId: targetOrg ? (targetOrg as Id<"organizations">) : undefined,
          role: selectedRole,
          isPrimary: setAsPrimary,
          confirmationPhrase,
        });
      }

      // Also call REST backend
      await fetch("/api/platform/super-admins/designate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: designateMode === "existing" ? selectedUserId : undefined,
          email: designateMode === "new" ? newAdminEmail.trim() : undefined,
          name: designateMode === "new" ? newAdminName.trim() : undefined,
          jobTitle: designateMode === "new" ? newAdminJobTitle.trim() : undefined,
          organizationId: targetOrg,
          role: selectedRole,
          isPrimary: setAsPrimary,
          confirmationPhrase,
        }),
      });

      toast.success(
        setAsPrimary
          ? "Super Administrator Utama berhasil ditetapkan dan dikonfirmasi."
          : `Akun ${selectedRole === "super_admin" ? "Super Admin" : "Admin Organisasi"} berhasil ditetapkan.`
      );

      setDesignateDialogOpen(false);
      setConfirmationPhrase("");
      setSelectedUserId("");
      setNewAdminEmail("");
      setNewAdminName("");
      setSetAsPrimary(false);
      fetchRestData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menetapkan administrator";
      toast.error(message);
    } finally {
      setDesignating(false);
    }
  };

  return (
    <div id="initial-platform-setup-container" className="space-y-6">
      {/* Top Banner: Status & Security Checklist */}
      <Card id="platform-security-status-card" className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    Konfigurasi Awal Platform & Penetapan Super Admin
                  </CardTitle>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
                    Keamanan Aktif
                  </Badge>
                </div>
                <CardDescription className="text-sm mt-1 text-muted-foreground">
                  Atur identitas sistem, kebijakan tata kelola multi-tenant, dan tetapkan penanggung jawab Super Admin utama platform.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <Button
                id="btn-open-designate-dialog"
                onClick={() => {
                  setConfirmationPhrase("");
                  setDesignateDialogOpen(true);
                }}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tetapkan Super Admin</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-3">
              <div className="p-2 rounded-md bg-background text-primary border border-border">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Super Admin Terdaftar</p>
                <p className="text-base font-bold text-foreground">{superAdminsList.length} Akun</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-3">
              <div className="p-2 rounded-md bg-background text-primary border border-border">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Entitas Organisasi</p>
                <p className="text-base font-bold text-foreground">{organizationsList.length} Tenant</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-3">
              <div className="p-2 rounded-md bg-background text-emerald-600 dark:text-emerald-400 border border-border">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Isolasi Multi-Tenant</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Terenkripsi & Ketat</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-3">
              <div className="p-2 rounded-md bg-background text-primary border border-border">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Audit Governance</p>
                <p className="text-base font-bold text-foreground">{auditLogRetentionDays} Hari Retensi</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs for Settings and Super Admin Roster */}
      <Tabs defaultValue="settings" className="w-full space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-muted/60 p-1">
          <TabsTrigger value="settings" className="gap-2 font-medium">
            <Server className="w-4 h-4" />
            <span>Pengaturan Platform</span>
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2 font-medium">
            <Crown className="w-4 h-4" />
            <span>Daftar Super Admin ({superAdminsList.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Platform Settings Form */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Platform Identity & General Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card id="platform-identity-card" className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">1. Identitas & Informasi Platform</CardTitle>
                  </div>
                  <CardDescription>
                    Informasi master yang akan ditampilkan pada landing page, surat resmi, dan notifikasi sistem.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-platform-name" className="text-sm font-medium">Nama Platform / Aplikasi</Label>
                    <Input
                      id="input-platform-name"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      placeholder="e.g. Sistem Informasi Manajemen Terpadu"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-platform-description" className="text-sm font-medium">Deskripsi & Tagline Platform</Label>
                    <Input
                      id="input-platform-description"
                      value={platformDescription}
                      onChange={(e) => setPlatformDescription(e.target.value)}
                      placeholder="e.g. Platform Enterprise HRIS & Tata Kelola Organisasi"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="input-support-email" className="text-sm font-medium">Email Bantuan & Notifikasi Sistem</Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <Input
                          id="input-support-email"
                          type="email"
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          className="pl-9"
                          placeholder="admin@enterprise.local"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="input-primary-superadmin-email" className="text-sm font-medium">Email Super Admin Utama (Designated)</Label>
                      <div className="relative">
                        <Crown className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                        <Input
                          id="input-primary-superadmin-email"
                          type="email"
                          value={primarySuperAdminEmail}
                          onChange={(e) => setPrimarySuperAdminEmail(e.target.value)}
                          className="pl-9 font-medium"
                          placeholder="parno86@gmail.com"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Multi-Tenant & Onboarding Policies */}
              <Card id="tenant-onboarding-card" className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">2. Pendaftaran Mandiri & Ketentuan Uji Coba</CardTitle>
                  </div>
                  <CardDescription>
                    Kendali atas bagaimana organisasi baru dapat mendaftar dan parameter paket awal mereka.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground">Izinkan Registrasi Organisasi Baru</Label>
                      <p className="text-xs text-muted-foreground">
                        Memungkinkan calon tenant/perusahaan baru mendaftar secara mandiri melalui halaman pendaftaran.
                      </p>
                    </div>
                    <Switch
                      id="switch-allow-self-registration"
                      checked={allowSelfRegistration}
                      onCheckedChange={setAllowSelfRegistration}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground">Wajibkan Verifikasi & Persetujuan Super Admin</Label>
                      <p className="text-xs text-muted-foreground">
                        Organisasi baru akan berstatus "Menunggu Persetujuan" dan membutuhkan review dari Super Admin sebelum aktif.
                      </p>
                    </div>
                    <Switch
                      id="switch-require-org-approval"
                      checked={requireOrgApproval}
                      onCheckedChange={setRequireOrgApproval}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="input-default-trial-days" className="text-sm font-medium">Durasi Uji Coba Default (Hari)</Label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <Input
                          id="input-default-trial-days"
                          type="number"
                          min="1"
                          max="365"
                          value={defaultTrialDays}
                          onChange={(e) => setDefaultTrialDays(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="input-default-max-employees" className="text-sm font-medium">Batas Karyawan Default Paket Awal</Label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <Input
                          id="input-default-max-employees"
                          type="number"
                          min="5"
                          max="500"
                          value={defaultMaxEmployees}
                          onChange={(e) => setDefaultMaxEmployees(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Security & Governance */}
            <div className="space-y-6">
              <Card id="security-governance-card" className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">3. Keamanan & Tata Kelola</CardTitle>
                  </div>
                  <CardDescription>
                    Kebijakan proteksi sesi, enkripsi akses, dan audit trail.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="select-session-timeout" className="text-sm font-medium">Batas Waktu Ketidakaktifan Sesi</Label>
                    <Select value={sessionTimeoutMinutes} onValueChange={setSessionTimeoutMinutes}>
                      <SelectTrigger id="select-session-timeout">
                        <SelectValue placeholder="Pilih batas waktu sesi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Menit (Sangat Ketat)</SelectItem>
                        <SelectItem value="30">30 Menit</SelectItem>
                        <SelectItem value="60">60 Menit (Standar)</SelectItem>
                        <SelectItem value="240">4 Jam</SelectItem>
                        <SelectItem value="480">8 Jam (Sepanjang Hari Kerja)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input-audit-retention" className="text-sm font-medium">Retensi Log Audit (Hari)</Label>
                    <Input
                      id="input-audit-retention"
                      type="number"
                      min="30"
                      max="3650"
                      value={auditLogRetentionDays}
                      onChange={(e) => setAuditLogRetentionDays(e.target.value)}
                    />
                  </div>

                  <div className="pt-2 border-t border-border space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div className="space-y-0.5 pr-3">
                        <Label className="text-xs font-semibold text-foreground">Isolasi Tenant Ketat</Label>
                        <p className="text-[11px] text-muted-foreground">
                          Mencegah query silang antar tenant tanpa persetujuan izin aktif.
                        </p>
                      </div>
                      <Switch
                        id="switch-strict-tenant-isolation"
                        checked={strictTenantIsolation}
                        onCheckedChange={setStrictTenantIsolation}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div className="space-y-0.5 pr-3">
                        <Label className="text-xs font-semibold text-foreground">Wajibkan Verifikasi 2FA untuk Admin</Label>
                        <p className="text-[11px] text-muted-foreground">
                          Memerlukan konfirmasi keamanan ganda untuk akun Super Admin & Admin.
                        </p>
                      </div>
                      <Switch
                        id="switch-enforce-2fa"
                        checked={enforceTwoFactorForAdmins}
                        onCheckedChange={setEnforceTwoFactorForAdmins}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                      <div className="space-y-0.5 pr-3">
                        <Label className="text-xs font-semibold text-red-600 dark:text-red-400">Mode Pemeliharaan (Maintenance)</Label>
                        <p className="text-[11px] text-muted-foreground">
                          Hanya Super Admin yang dapat mengakses sistem saat aktif.
                        </p>
                      </div>
                      <Switch
                        id="switch-maintenance-mode"
                        checked={maintenanceMode}
                        onCheckedChange={setMaintenanceMode}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Save Box */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Siap Menerapkan Kebijakan</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Perubahan konfigurasi akan segera disinkronkan ke seluruh entitas tenant dan aturan akses sistem.
                  </p>
                  <Button
                    id="btn-save-platform-settings"
                    onClick={handleSavePlatformSettings}
                    disabled={loading}
                    className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan & Terapkan Konfigurasi</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Designated Super Admins & Org Admins Roster */}
        <TabsContent value="admins" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Daftar Super Administrator Platform</h3>
              <p className="text-sm text-muted-foreground">
                Akun yang memiliki hak kendali penuh untuk mengelola konfigurasi sistem, database, dan seluruh organisasi.
              </p>
            </div>
            <Button
              id="btn-add-super-admin-secondary"
              onClick={() => {
                setConfirmationPhrase("");
                setDesignateDialogOpen(true);
              }}
              className="gap-2 bg-primary text-primary-foreground font-medium"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tetapkan Super Admin Baru</span>
            </Button>
          </div>

          {/* Super Admins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {superAdminsList.map((admin, idx) => {
              const isPrimary = admin.email === primarySuperAdminEmail || idx === 0;
              return (
                <Card
                  key={admin._id || String(admin.id) || idx}
                  className={cn(
                    "border transition-all",
                    isPrimary ? "border-amber-500/40 bg-amber-500/5 shadow-sm" : "border-border bg-card"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-foreground leading-tight">
                            {admin.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{admin.email}</p>
                        </div>
                      </div>
                      {isPrimary && (
                        <Badge className="bg-amber-500 text-white hover:bg-amber-600 gap-1 text-[11px] font-semibold px-2 py-0.5">
                          <Crown className="w-3 h-3" />
                          <span>Utama</span>
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-t border-border/60">
                      <span className="text-muted-foreground">Jabatan:</span>
                      <span className="font-medium text-foreground">{admin.jobTitle || "Super Administrator"}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-t border-border/60">
                      <span className="text-muted-foreground">Lingkup Akses:</span>
                      <Badge variant="outline" className="text-[11px] bg-background">
                        {admin.orgName || "Platform Global (Seluruh Tenant)"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-1 border-t border-border/60">
                      <span className="text-muted-foreground">Status Akun:</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                        {admin.accountStatus === "active" ? "Aktif & Terverifikasi" : admin.accountStatus}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    {!isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-medium gap-1.5"
                        onClick={() => {
                          setPrimarySuperAdminEmail(admin.email);
                          toast.success(`${admin.name} dipilih sebagai kandidat Super Admin Utama. Klik simpan untuk mengonfirmasi.`);
                        }}
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Jadikan Super Admin Utama</span>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Organizational Admins Section */}
          {orgAdminsList.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Administrator Organisasi (Tenant Leads)</h3>
                <p className="text-xs text-muted-foreground">
                  Administrator yang bertanggung jawab atas pengelolaan internal masing-masing entitas perusahaan.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Nama Administrator</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Organisasi</th>
                        <th className="py-3 px-4">Peran</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orgAdminsList.map((oa) => (
                        <tr key={oa._id || String(oa.id)} className="hover:bg-muted/20">
                          <td className="py-3 px-4 font-medium text-foreground">{oa.name}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{oa.email}</td>
                          <td className="py-3 px-4 font-medium">{oa.orgName || "Organisasi"}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">
                              {oa.role === "admin" ? "Admin Organisasi" : oa.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs gap-1 text-primary hover:text-primary"
                              onClick={() => {
                                setSelectedUserId(oa._id || String(oa.id));
                                setSelectedRole("super_admin");
                                setDesignateMode("existing");
                                setDesignateDialogOpen(true);
                              }}
                            >
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>Promosikan ke Super Admin</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Security-Guarded Super Admin Designation Modal */}
      <Dialog open={designateDialogOpen} onOpenChange={setDesignateDialogOpen}>
        <DialogContent id="dialog-designate-superadmin" className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold">Penetapan Super Administrator Platform</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Tentukan pengguna yang akan diberikan hak akses administratif tertinggi di seluruh sistem.
            </DialogDescription>
          </DialogHeader>

          {/* Security Warning Alert */}
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">Perhatian Keamanan Hak Akses Tertinggi:</p>
              <p>
                Peran <strong>Super Admin</strong> memiliki akses tanpa batas untuk membaca data semua tenant, mengelola database,
                mengubah struktur peran, serta melihat seluruh audit log. Pastikan pengguna tersebut adalah pihak terpercaya.
              </p>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <Tabs
              value={designateMode}
              onValueChange={(val) => setDesignateMode(val as "existing" | "new")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="existing" className="text-xs font-semibold">
                  Pilih Pengguna Yang Ada
                </TabsTrigger>
                <TabsTrigger value="new" className="text-xs font-semibold">
                  Buat Administrator Baru
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="select-existing-user" className="text-sm font-medium">Pilih Pengguna</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="select-existing-user">
                      <SelectValue placeholder="-- Pilih Pengguna Terdaftar --" />
                    </SelectTrigger>
                    <SelectContent>
                      {superAdminsList.map((u) => (
                        <SelectItem key={u._id || String(u.id)} value={u._id || String(u.id)}>
                          {u.name} ({u.email}) — [Super Admin Saat Ini]
                        </SelectItem>
                      ))}
                      {orgAdminsList.map((u) => (
                        <SelectItem key={u._id || String(u.id)} value={u._id || String(u.id)}>
                          {u.name} ({u.email}) — {u.orgName || "Admin"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="new" className="space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="input-new-admin-name" className="text-xs font-medium">Nama Lengkap</Label>
                    <Input
                      id="input-new-admin-name"
                      placeholder="e.g. Budi Rahardjo"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="input-new-admin-email" className="text-xs font-medium">Alamat Email</Label>
                    <Input
                      id="input-new-admin-email"
                      type="email"
                      placeholder="admin@enterprise.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="input-new-admin-jobtitle" className="text-xs font-medium">Jabatan / Job Title</Label>
                  <Input
                    id="input-new-admin-jobtitle"
                    placeholder="Super Administrator & IT Governance"
                    value={newAdminJobTitle}
                    onChange={(e) => setNewAdminJobTitle(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Role & Scope Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="select-role-type" className="text-xs font-medium">Tingkat Peran (Role Level)</Label>
                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as "super_admin" | "admin")}>
                  <SelectTrigger id="select-role-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin (Platform Global)</SelectItem>
                    <SelectItem value="admin">Admin Organisasi (Tenant Scoped)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="select-org-assignment" className="text-xs font-medium">Penugasan Organisasi / Tenant</Label>
                <Select value={targetOrgId} onValueChange={setTargetOrgId}>
                  <SelectTrigger id="select-org-assignment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Platform Global (Semua Tenant)</SelectItem>
                    {organizationsList.map((org) => (
                      <SelectItem key={org._id || String(org.id)} value={org._id || String(org.id)}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Option to Set as Primary Super Admin */}
            {selectedRole === "super_admin" && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="space-y-0.5 pr-2">
                  <Label className="text-xs font-semibold text-foreground">Tetapkan Sebagai Super Admin Utama</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Akun ini akan dicatat sebagai kontak darurat dan master administrator sistem.
                  </p>
                </div>
                <Switch
                  id="switch-set-primary"
                  checked={setAsPrimary}
                  onCheckedChange={setSetAsPrimary}
                />
              </div>
            )}

            {/* Verification Step: Explicit Confirmation Phrase */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label htmlFor="input-confirmation-phrase" className="text-xs font-bold text-foreground">
                Verifikasi Keamanan: Ketik <span className="text-primary underline">KONFIRMASI SUPER ADMIN</span> di bawah:
              </Label>
              <Input
                id="input-confirmation-phrase"
                value={confirmationPhrase}
                onChange={(e) => setConfirmationPhrase(e.target.value)}
                placeholder="KONFIRMASI SUPER ADMIN"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDesignateDialogOpen(false)}
              disabled={designating}
            >
              Batal
            </Button>
            <Button
              id="btn-confirm-designate"
              onClick={handleDesignateSubmit}
              disabled={designating || !confirmationPhrase}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {designating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Konfirmasi & Tetapkan Peran</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
