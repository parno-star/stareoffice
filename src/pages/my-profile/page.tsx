import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  Hash,
  User,
  Fingerprint,
  Mail,
  Briefcase,
  Building2,
  Phone,
  MapPin,
  Award,
  Cake,
  UserCheck,
  Info,
  Sparkles,
  Plus,
  X,
  MessageSquare,
  Users2,
  FileText,
  History,
  Trash2,
  Check,
  Copy,
} from "lucide-react";
import ProfileAvatarUploader from "@/components/ui/ProfileAvatarUploader.tsx";
import EditProfileDialog from "@/components/ui/EditProfileDialog.tsx";
import ProfileDocumentsSection from "@/components/ProfileDocumentsSection.tsx";
import EmployeeHistorySection from "@/components/EmployeeHistorySection.tsx";
import { MOCK_CURRENT_USER } from "@/lib/convex-mock-data.ts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function formatDateID(dateStr?: string) {
  if (!dateStr || dateStr === "—") return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function EmployeeDataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  const displayValue = value && value.trim() !== "" ? value : "—";

  return (
    <div className="flex items-center gap-3.5 py-2.5 px-3 rounded-xl hover:bg-muted/40 transition-colors">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 dark:bg-muted/30 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground mt-0.5 truncate">
          {displayValue}
        </p>
      </div>
    </div>
  );
}

function SkillsSection({ user }: { user: any }) {
  const [skills, setSkills] = useState<string[]>([
    "Manajemen SDM",
    "Administrasi Umum",
    "Pengelolaan Arsip",
    "Komunikasi Publik",
    "Kepemimpinan Tim",
  ]);
  const [newSkill, setNewSkill] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast.error("Keahlian sudah ada");
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
    setAdding(false);
    toast.success("Keahlian ditambahkan");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
    toast.success("Keahlian dihapus");
  };

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          Keahlian & Kompetensi
        </CardTitle>
        {!adding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
            className="gap-1.5 text-xs rounded-lg h-8"
          >
            <Plus className="size-3.5" />
            Tambah Keahlian
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <div className="flex items-center gap-2 max-w-md">
            <Input
              placeholder="Masukkan keahlian (misal: Ms. Office, Payroll)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
              autoFocus
              className="text-sm h-9 rounded-xl"
            />
            <Button size="sm" onClick={handleAddSkill} className="h-9 rounded-xl">
              Simpan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAdding(false)}
              className="h-9 rounded-xl"
            >
              Batal
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ColleaguesSection({ department }: { department?: string }) {
  const employees = useQuery(api.users.listEmployees, {}) ?? [];
  const navigate = useNavigate();

  const colleagues = employees.length > 0 ? employees : [MOCK_CURRENT_USER];

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Users2 className="size-4 text-primary" />
          Rekan Kerja ({colleagues.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colleagues.map((colleague: any) => (
            <div
              key={colleague._id || colleague.email}
              className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all flex items-start gap-3.5 group"
            >
              <Avatar className="size-11 rounded-xl">
                {colleague.avatarUrl ? (
                  <AvatarImage src={colleague.avatarUrl} alt={colleague.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm rounded-xl">
                  {getInitials(colleague.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                  {colleague.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {colleague.jobTitle || "Karyawan"}
                </p>
                {colleague.department && (
                  <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">
                    {colleague.department}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => navigate("/messages")}
                title="Kirim pesan"
              >
                <MessageSquare className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyProfilePage() {
  const currentUserQuery = useQuery(api.users.getCurrentUser, {});
  const user = currentUserQuery ?? MOCK_CURRENT_USER;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Data Profil Saya
        </h1>
      </div>

      {/* Profile Main Header Card */}
      <Card className="overflow-hidden border shadow-sm rounded-2xl bg-card">
        {/* Banner Section */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-sky-100 via-sky-50 to-indigo-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-b relative" />

        <CardContent className="relative p-5 sm:p-6 pt-0 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar Photo with Delete / Upload Button */}
            <div className="shrink-0">
              <ProfileAvatarUploader
                avatarUrl={user.avatarUrl}
                name={user.name}
                initials={getInitials(user.name)}
                toneClass="bg-primary/10 text-primary"
              />
            </div>

            {/* Profile Info Summary */}
            <div className="flex-1 min-w-0 space-y-2 pt-1 sm:pt-0">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {user.name || "CIP 2017"}
                </h2>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">
                  {user.jobTitle || "Belum ada jabatan"}
                </p>
              </div>

              {/* Department Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 hover:bg-sky-100 font-medium px-2.5 py-1 text-xs flex items-center gap-1.5 border border-sky-200/60 dark:border-sky-800/50 rounded-lg"
                >
                  <Building2 className="size-3.5 text-sky-600 dark:text-sky-400" />
                  {user.department || "SDM DAN UMUM"}
                </Badge>
              </div>

              {/* Edit Profile Action Button */}
              <div className="pt-1">
                <EditProfileDialog currentUser={user as any} />
              </div>
            </div>
          </div>

          {/* Address / Status Box */}
          <div className="mt-5 p-3.5 bg-muted/40 rounded-xl text-sm border text-foreground font-medium">
            {user.address || user.bio || "Pensiun BUMN"}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="kontak" className="w-full space-y-6">
        <TabsList className="w-full flex justify-start gap-2 bg-transparent p-0 border-b rounded-none overflow-x-auto pb-2">
          <TabsTrigger
            value="kontak"
            className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-sky-50 dark:data-[state=active]:bg-sky-950/50 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all flex items-center gap-2 shrink-0"
          >
            Kontak & Keahlian
          </TabsTrigger>
          <TabsTrigger
            value="rekan"
            className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-sky-50 dark:data-[state=active]:bg-sky-950/50 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all flex items-center gap-2 shrink-0"
          >
            Rekan Kerja
          </TabsTrigger>
          <TabsTrigger
            value="dokumen"
            className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-sky-50 dark:data-[state=active]:bg-sky-950/50 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all flex items-center gap-2 shrink-0"
          >
            Dokumen
          </TabsTrigger>
          <TabsTrigger
            value="riwayat"
            className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-sky-50 dark:data-[state=active]:bg-sky-950/50 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all flex items-center gap-2 shrink-0"
          >
            Riwayat
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: DATA KARYAWAN & Keahlian */}
        <TabsContent value="kontak" className="space-y-6">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Title Section */}
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">
                DATA KARYAWAN
              </p>

              {/* Employee Data Fields matching exact screenshot */}
              <div className="space-y-1 divide-y divide-border/40">
                <EmployeeDataRow
                  icon={Hash}
                  label="NO."
                  value={user.employeeId || user.no}
                />
                <EmployeeDataRow
                  icon={User}
                  label="NAMA"
                  value={user.name || "CIP 2017"}
                />
                <EmployeeDataRow
                  icon={Fingerprint}
                  label="NIP"
                  value={user.nip}
                />
                <EmployeeDataRow
                  icon={Mail}
                  label="EMAIL"
                  value={user.email || "cipkai2017@gmail.com"}
                />
                <EmployeeDataRow
                  icon={Briefcase}
                  label="JABATAN"
                  value={user.jobTitle}
                />
                <EmployeeDataRow
                  icon={Building2}
                  label="DEPARTEMEN"
                  value={user.department || "SDM DAN UMUM"}
                />
                <EmployeeDataRow
                  icon={Phone}
                  label="TELEPON"
                  value={user.phone || "+628128052324"}
                />
                <EmployeeDataRow
                  icon={MapPin}
                  label="LOKASI"
                  value={user.location}
                />
                <EmployeeDataRow
                  icon={Award}
                  label="TANGGAL MULAI KERJA"
                  value={formatDateID(user.startDate || user.joinDate || "2024-03-05")}
                />
                <EmployeeDataRow
                  icon={Cake}
                  label="TANGGAL LAHIR"
                  value={formatDateID(user.birthDate)}
                />
                <EmployeeDataRow
                  icon={UserCheck}
                  label="ATASAN"
                  value={user.managerName || user.atasan}
                />
              </div>

              {/* HR Notice box */}
              <div className="mt-4 pt-3 flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/50">
                <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Sebagian data dikelola oleh HR. Gunakan tombol &quot;Edit Profil&quot; untuk mengajukan perubahan pada data yang boleh Anda ubah.
                </p>
              </div>
            </CardContent>
          </Card>

          <SkillsSection user={user} />
        </TabsContent>

        {/* Tab 2: Rekan Kerja */}
        <TabsContent value="rekan">
          <ColleaguesSection department={user.department} />
        </TabsContent>

        {/* Tab 3: Dokumen */}
        <TabsContent value="dokumen">
          <ProfileDocumentsSection userId={user._id} />
        </TabsContent>

        {/* Tab 4: Riwayat */}
        <TabsContent value="riwayat">
          <EmployeeHistorySection userId={user._id} isSelf={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
