import { useState, useEffect } from "react";
import { Authenticated, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  Bell,
  Calendar,
  Clock,
  MessageSquare,
  Receipt,
  FolderKanban,
  MessagesSquare,
  Megaphone,
  ScrollText,
  PartyPopper,
  HeartHandshake,
  Trophy,
  GraduationCap,
  Wallet,
  Target,
  LifeBuoy,
  Settings,
  Moon,
  Save,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type CategoryConfig = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

const CATEGORIES: ReadonlyArray<CategoryConfig> = [
  { key: "catLeave", label: "Cuti", description: "Pengajuan, persetujuan, dan penolakan cuti", icon: Calendar, color: "text-blue-500" },
  { key: "catAttendance", label: "Absensi", description: "Clock in/out dan keterlambatan", icon: Clock, color: "text-emerald-500" },
  { key: "catExpenses", label: "Reimbursement", description: "Pengajuan biaya dan status review", icon: Receipt, color: "text-teal-500" },
  { key: "catTasks", label: "Tugas & Proyek", description: "Tugas baru, deadline, dan update status", icon: FolderKanban, color: "text-orange-500" },
  { key: "catForum", label: "Forum", description: "Balasan dan diskusi forum", icon: MessagesSquare, color: "text-indigo-500" },
  { key: "catAnnouncements", label: "Pengumuman", description: "Berita dan pengumuman perusahaan", icon: Megaphone, color: "text-amber-500" },
  { key: "catPolicies", label: "Kebijakan", description: "Kebijakan baru dan update kebijakan", icon: ScrollText, color: "text-primary" },
  { key: "catEvents", label: "Event", description: "Event perusahaan dan pengingat acara", icon: PartyPopper, color: "text-emerald-500" },
  { key: "catRecognitions", label: "Apresiasi", description: "Apresiasi yang diterima dari rekan kerja", icon: HeartHandshake, color: "text-pink-500" },
  { key: "catAwards", label: "Penghargaan", description: "Penghargaan dan nominasi", icon: Trophy, color: "text-amber-500" },
  { key: "catTraining", label: "Pelatihan", description: "Kursus baru, tugas, dan sertifikat", icon: GraduationCap, color: "text-blue-500" },
  { key: "catPayroll", label: "Payroll", description: "Slip gaji yang dipublikasikan", icon: Wallet, color: "text-emerald-500" },
  { key: "catOkr", label: "OKR & Goals", description: "OKR baru, check-in, dan review", icon: Target, color: "text-indigo-500" },
  { key: "catTickets", label: "Bantuan IT", description: "Tiket baru, komentar, dan perubahan status", icon: LifeBuoy, color: "text-rose-500" },
  { key: "catMessages", label: "Pesan", description: "Pesan langsung dari rekan kerja", icon: MessageSquare, color: "text-sky-500" },
  { key: "catSystem", label: "Sistem", description: "Notifikasi sistem, onboarding, dan aset", icon: Settings, color: "text-slate-500" },
];

type PrefsState = {
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
};

function NotificationSettingsInner() {
  const prefs = useQuery(api.notificationPreferences.getMyPreferences, {});
  const updatePrefs = useMutation(api.notificationPreferences.updateMyPreferences);
  const [localPrefs, setLocalPrefs] = useState<PrefsState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefs && !localPrefs) {
      setLocalPrefs({
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
      });
    }
  }, [prefs, localPrefs]);

  const handleToggle = (key: string, value: boolean) => {
    if (!localPrefs) return;
    setLocalPrefs({ ...localPrefs, [key]: value });
  };

  const handleSave = async () => {
    if (!localPrefs) return;
    setSaving(true);
    try {
      await updatePrefs({
        catLeave: localPrefs.catLeave,
        catAttendance: localPrefs.catAttendance,
        catExpenses: localPrefs.catExpenses,
        catTasks: localPrefs.catTasks,
        catForum: localPrefs.catForum,
        catAnnouncements: localPrefs.catAnnouncements,
        catPolicies: localPrefs.catPolicies,
        catEvents: localPrefs.catEvents,
        catRecognitions: localPrefs.catRecognitions,
        catAwards: localPrefs.catAwards,
        catTraining: localPrefs.catTraining,
        catPayroll: localPrefs.catPayroll,
        catOkr: localPrefs.catOkr,
        catTickets: localPrefs.catTickets,
        catMessages: localPrefs.catMessages,
        catSystem: localPrefs.catSystem,
        quietHoursEnabled: localPrefs.quietHoursEnabled,
        quietHoursStart: localPrefs.quietHoursStart || undefined,
        quietHoursEnd: localPrefs.quietHoursEnd || undefined,
      });
      toast.success("Preferensi notifikasi disimpan");
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message: string };
        toast.error(message);
      } else {
        toast.error("Gagal menyimpan preferensi");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAll = (enabled: boolean) => {
    if (!localPrefs) return;
    const updated = { ...localPrefs };
    for (const cat of CATEGORIES) {
      (updated as Record<string, boolean | string>)[cat.key] = enabled;
    }
    setLocalPrefs(updated);
  };

  const enabledCount = localPrefs
    ? CATEGORIES.filter((c) => (localPrefs as Record<string, boolean | string>)[c.key] === true).length
    : 0;

  if (!prefs || !localPrefs) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="size-5.5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengaturan Notifikasi</h1>
            <p className="text-sm text-muted-foreground">
              Atur jenis notifikasi yang ingin Anda terima
            </p>
          </div>
        </div>
        <Button className="cursor-pointer gap-2" onClick={handleSave} disabled={saving}>
          <Save className="size-4" />
          {saving ? "Menyimpan..." : "Simpan Preferensi"}
        </Button>
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex items-center gap-3">
        <Button size="sm" variant="secondary" className="cursor-pointer" onClick={() => handleToggleAll(true)}>
          Aktifkan Semua
        </Button>
        <Button size="sm" variant="secondary" className="cursor-pointer" onClick={() => handleToggleAll(false)}>
          Nonaktifkan Semua
        </Button>
        <span className="text-sm text-muted-foreground">
          {enabledCount}/{CATEGORIES.length} kategori aktif
        </span>
      </div>

      {/* Category cards */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kategori Notifikasi</CardTitle>
          <CardDescription>
            Aktifkan atau nonaktifkan notifikasi berdasarkan kategori
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-2 sm:p-6 pt-0 sm:pt-0">
          {CATEGORIES.map((cat) => {
            const isEnabled = (localPrefs as Record<string, boolean | string>)[cat.key] === true;
            return (
              <div
                key={cat.key}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                  isEnabled ? "bg-transparent" : "bg-muted/30 opacity-60",
                )}
              >
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-muted")}>
                  <cat.icon className={cn("size-4.5", cat.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <Label htmlFor={cat.key} className="cursor-pointer text-sm font-medium">
                    {cat.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                <Switch
                  id={cat.key}
                  checked={isEnabled}
                  onCheckedChange={(val) => handleToggle(cat.key, val)}
                  className="cursor-pointer"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="size-5 text-violet-500" />
            <CardTitle>Jam Tenang</CardTitle>
          </div>
          <CardDescription>
            Tunda notifikasi non-kritis selama jam tertentu agar tidak terganggu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="quietHours"
              checked={localPrefs.quietHoursEnabled}
              onCheckedChange={(val) => handleToggle("quietHoursEnabled", val)}
              className="cursor-pointer"
            />
            <Label htmlFor="quietHours" className="cursor-pointer">
              {localPrefs.quietHoursEnabled ? "Jam tenang aktif" : "Jam tenang nonaktif"}
            </Label>
          </div>

          {localPrefs.quietHoursEnabled && (
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <Label htmlFor="qhStart" className="text-xs text-muted-foreground">Mulai</Label>
                <Input
                  id="qhStart"
                  type="time"
                  value={localPrefs.quietHoursStart}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, quietHoursStart: e.target.value })}
                  className="w-32"
                />
              </div>
              <span className="mt-5 text-muted-foreground">s/d</span>
              <div className="space-y-1">
                <Label htmlFor="qhEnd" className="text-xs text-muted-foreground">Selesai</Label>
                <Input
                  id="qhEnd"
                  type="time"
                  value={localPrefs.quietHoursEnd}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, quietHoursEnd: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotificationSettingsPage() {
  return (
    <Authenticated>
      <NotificationSettingsInner />
    </Authenticated>
  );
}
