import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowLeft,
  Bell,
  Moon,
  Save,
  Mail,
  Smartphone,
  CalendarCheck,
  Clock,
  Receipt,
  CheckSquare,
  Megaphone,
  ReceiptText,
  LifeBuoy,
  MessageSquare,
  GraduationCap,
  Target,
  ShieldCheck,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

interface PrefsState {
  catLeave: boolean;
  catAttendance: boolean;
  catExpenses: boolean;
  catTasks: boolean;
  catForum: boolean;
  catAnnouncements: boolean;
  catPolicies: boolean;
  catEvents: boolean;
  catRecognitions: boolean;
  catAwards: boolean;
  catTraining: boolean;
  catPayroll: boolean;
  catOkr: boolean;
  catTickets: boolean;
  catMessages: boolean;
  catSystem: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
}

const DEFAULT_PREFERENCES: PrefsState = {
  catLeave: true,
  catAttendance: true,
  catExpenses: true,
  catTasks: true,
  catForum: true,
  catAnnouncements: true,
  catPolicies: true,
  catEvents: true,
  catRecognitions: true,
  catAwards: true,
  catTraining: true,
  catPayroll: true,
  catOkr: true,
  catTickets: true,
  catMessages: true,
  catSystem: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
};

export default function NotificationSettingsPage() {
  const navigate = useNavigate();

  // Local storage state fallback
  const [prefs, setPrefs] = useState<PrefsState>(() => {
    try {
      const saved = localStorage.getItem("starfa_notification_preferences");
      if (saved) return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_PREFERENCES;
  });

  const [isSaving, setIsSaving] = useState(false);

  // Convex Integration
  const convexPrefs = useQuery(api.notificationPreferences.getMyPreferences, {});
  const updatePrefsMutation = useMutation(api.notificationPreferences.updateMyPreferences);

  useEffect(() => {
    if (convexPrefs) {
      setPrefs((prev) => ({
        ...prev,
        catLeave: convexPrefs.catLeave ?? true,
        catAttendance: convexPrefs.catAttendance ?? true,
        catExpenses: convexPrefs.catExpenses ?? true,
        catTasks: convexPrefs.catTasks ?? true,
        catForum: convexPrefs.catForum ?? true,
        catAnnouncements: convexPrefs.catAnnouncements ?? true,
        catPolicies: convexPrefs.catPolicies ?? true,
        catEvents: convexPrefs.catEvents ?? true,
        catRecognitions: convexPrefs.catRecognitions ?? true,
        catAwards: convexPrefs.catAwards ?? true,
        catTraining: convexPrefs.catTraining ?? true,
        catPayroll: convexPrefs.catPayroll ?? true,
        catOkr: convexPrefs.catOkr ?? true,
        catTickets: convexPrefs.catTickets ?? true,
        catMessages: convexPrefs.catMessages ?? true,
        catSystem: convexPrefs.catSystem ?? true,
        quietHoursEnabled: convexPrefs.quietHoursEnabled ?? false,
        quietHoursStart: convexPrefs.quietHoursStart ?? "22:00",
        quietHoursEnd: convexPrefs.quietHoursEnd ?? "07:00",
      }));
    }
  }, [convexPrefs]);

  const handleToggle = (key: keyof PrefsState) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTextChange = (key: keyof PrefsState, value: string) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("starfa_notification_preferences", JSON.stringify(prefs));

      await updatePrefsMutation({
        catLeave: prefs.catLeave,
        catAttendance: prefs.catAttendance,
        catExpenses: prefs.catExpenses,
        catTasks: prefs.catTasks,
        catForum: prefs.catForum,
        catAnnouncements: prefs.catAnnouncements,
        catPolicies: prefs.catPolicies,
        catEvents: prefs.catEvents,
        catRecognitions: prefs.catRecognitions,
        catAwards: prefs.catAwards,
        catTraining: prefs.catTraining,
        catPayroll: prefs.catPayroll,
        catOkr: prefs.catOkr,
        catTickets: prefs.catTickets,
        catMessages: prefs.catMessages,
        catSystem: prefs.catSystem,
        quietHoursEnabled: prefs.quietHoursEnabled,
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
      }).catch(() => null);

      toast.success("Pengaturan notifikasi berhasil disimpan");
    } catch {
      toast.success("Pengaturan notifikasi disimpan secara lokal");
    } finally {
      setIsSaving(false);
    }
  };

  const categoryConfigs = [
    {
      key: "catLeave" as const,
      title: "Pengajuan Cuti & Izin",
      desc: "Status persetujuan, penolakan, dan sisa kuota cuti",
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60",
    },
    {
      key: "catAttendance" as const,
      title: "Absensi & Jam Kerja",
      desc: "Pengingat clock-in, clock-out, dan keterlambatan",
      icon: Clock,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-950/60",
    },
    {
      key: "catExpenses" as const,
      title: "Reimbursement & Biaya",
      desc: "Update pencairan klaim dan klaim perjalanan dinas",
      icon: Receipt,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-950/60",
    },
    {
      key: "catPayroll" as const,
      title: "Payroll & Slip Gaji",
      desc: "Pemberitahuan rilis slip gaji bulanan",
      icon: ReceiptText,
      color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/60",
    },
    {
      key: "catTasks" as const,
      title: "Tugas & Proyek",
      desc: "Penugasan baru, tenggat waktu, dan komentar tugas",
      icon: CheckSquare,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-950/60",
    },
    {
      key: "catAnnouncements" as const,
      title: "Pengumuman & Kebijakan",
      desc: "Berita perusahaan, pengumuman HR, dan pembaruan aturan",
      icon: Megaphone,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-950/60",
    },
    {
      key: "catTickets" as const,
      title: "Tiket Bantuan & IT Support",
      desc: "Balasan tiket, perubahan status, dan resolusi kendala",
      icon: LifeBuoy,
      color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/60",
    },
    {
      key: "catMessages" as const,
      title: "Pesan & Chat Diskusi",
      desc: "Pesan masuk pribadi dan sebutan (mention) di forum",
      icon: MessageSquare,
      color: "text-teal-600 bg-teal-100 dark:bg-teal-950/60",
    },
    {
      key: "catTraining" as const,
      title: "Pelatihan & Sertifikasi",
      desc: "Jadwal training kerja dan pengingat tes kompetensi",
      icon: GraduationCap,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-950/60",
    },
    {
      key: "catOkr" as const,
      title: "OKR & Target Kerja",
      desc: "Pemberitahuan pencapaian target dan evaluasi berkala",
      icon: Target,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-950/60",
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground mb-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5 mr-1" />
            Kembali ke Pusat Notifikasi
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Pengaturan Notifikasi
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola preferensi pemberitahuan, saluran pengiriman, dan jam hening
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-10 px-5 gap-2 font-semibold shadow-xs cursor-pointer"
        >
          <Save className="size-4" />
          <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
        </Button>
      </div>

      {/* Saluran Pengiriman (Channels) */}
      <Card className="rounded-2xl border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Saluran Pengiriman
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih metode di mana Anda ingin menerima notifikasi dari sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 divide-y divide-border/60">
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Bell className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Aplikasi (In-App Bell)</p>
                <p className="text-xs text-muted-foreground">Tampilkan lencana dan daftar notifikasi di dalam aplikasi</p>
              </div>
            </div>
            <Switch
              checked={prefs.inAppNotifications}
              onCheckedChange={() => handleToggle("inAppNotifications")}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Mail className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Email Notifikasi</p>
                <p className="text-xs text-muted-foreground">Kirim ringkasan dan pemberitahuan penting ke email Anda</p>
              </div>
            </div>
            <Switch
              checked={prefs.emailNotifications}
              onCheckedChange={() => handleToggle("emailNotifications")}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Smartphone className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Push Notification</p>
                <p className="text-xs text-muted-foreground">Notifikasi langsung ke perangkat seluler dan browser</p>
              </div>
            </div>
            <Switch
              checked={prefs.pushNotifications}
              onCheckedChange={() => handleToggle("pushNotifications")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Jam Hening (Quiet Hours) */}
      <Card className="rounded-2xl border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Moon className="size-4 text-indigo-500" />
            Jam Hening (Quiet Hours)
          </CardTitle>
          <CardDescription className="text-xs">
            Senyapkan suara notifikasi pada jam istirahat malam Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <VolumeX className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Aktifkan Jam Hening</p>
                <p className="text-xs text-muted-foreground">Hanya notifikasi darurat/kritis yang akan dikirim pada rentang jam ini</p>
              </div>
            </div>
            <Switch
              checked={prefs.quietHoursEnabled}
              onCheckedChange={() => handleToggle("quietHoursEnabled")}
            />
          </div>

          {prefs.quietHoursEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 pl-12">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Mulai Jam Hening</label>
                <input
                  type="time"
                  value={prefs.quietHoursStart}
                  onChange={(e) => handleTextChange("quietHoursStart", e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Selesai Jam Hening</label>
                <input
                  type="time"
                  value={prefs.quietHoursEnd}
                  onChange={(e) => handleTextChange("quietHoursEnd", e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kategori Notifikasi Module */}
      <Card className="rounded-2xl border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            Preferensi Kategori Modul
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih topik notifikasi mana saja yang ingin Anda terima
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 divide-y divide-border/60">
          {categoryConfigs.map((item, idx) => {
            const Icon = item.icon;
            const isChecked = prefs[item.key];

            return (
              <div key={item.key} className={cn("flex items-center justify-between", idx !== 0 && "pt-3")}>
                <div className="flex items-center gap-3">
                  <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(item.key)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bottom Save Action */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="h-11 px-8 gap-2 font-semibold shadow-md cursor-pointer"
        >
          <Save className="size-4" />
          <span>{isSaving ? "Menyimpan..." : "Simpan Semua Pengaturan"}</span>
        </Button>
      </div>
    </div>
  );
}
