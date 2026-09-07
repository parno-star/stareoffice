import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Cake,
  Award,
  Sparkles,
  Star,
  Users as UsersIcon,
  Search,
  Hash,
  User as UserIcon,
  Fingerprint,
  CalendarDays,
  UserCog,
  Info,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input.tsx";
import {
  formatIsoFullDate,
} from "@/pages/celebrations/_lib/celebrations-utils.ts";
import {
  colorForDepartment,
  COLOR_CLASSES,
  getInitials,
  SKILL_CATEGORY_LABELS,
} from "@/pages/directory/_lib/directory-utils.ts";
import EditProfileDialog from "@/pages/directory/_components/EditProfileDialog.tsx";
import ProfileAvatarUploader from "@/pages/my-profile/_components/ProfileAvatarUploader.tsx";
import EmployeeHistorySection from "@/pages/directory/_components/EmployeeHistorySection.tsx";
import ProfileDocumentsSection from "./_components/ProfileDocumentsSection.tsx";
import {
  buildOrderedColumns,
  builtInValue,
  computeAge,
  computeTenure,
  formatNumberValue,
  isMasaKerjaLabel,
  isUsiaLabel,
  type OrderedColumn,
} from "@/pages/directory/_lib/directory-columns.ts";

export default function MyProfilePage() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const detail = useQuery(
    api.directory.getEmployeeDetail,
    currentUser?._id ? { userId: currentUser._id as Id<"users"> } : "skip",
  );
  const customFieldDefs = useQuery(api.directoryFields.list, {});
  const columnOrder = useQuery(api.directoryFields.getColumnOrder, {});

  const [searchColleague, setSearchColleague] = useState("");
  const navigate = useNavigate();

  if (
    currentUser === undefined ||
    detail === undefined ||
    customFieldDefs === undefined ||
    columnOrder === undefined
  ) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  const detailData =
    detail && typeof detail === "object" && !Array.isArray(detail)
      ? (detail as {
          user?: Doc<"users">;
          manager?: Doc<"users"> | null;
          directReports?: Array<Doc<"users">>;
          colleagues?: Array<Doc<"users">>;
          skills?: Array<{ skill: string; category: string; level: number }>;
        })
      : null;

  const user = detailData?.user ?? currentUser;
  const manager = detailData?.manager ?? null;
  const directReports = Array.isArray(detailData?.directReports)
    ? detailData.directReports
    : [];
  const colleagues = Array.isArray(detailData?.colleagues)
    ? detailData.colleagues
    : [];
  const skills = Array.isArray(detailData?.skills) ? detailData.skills : [];

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Data profil tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    );
  }

  const tone = COLOR_CLASSES[colorForDepartment(user?.department)] ?? COLOR_CLASSES["slate"] ?? {
    bg: "bg-slate-500",
    chip: "bg-slate-100 text-slate-700",
    accent: "bg-slate-500",
  };

  // Build the full ordered list of directory columns (built-in + custom) exactly
  // as HR configured it, so the profile mirrors the directory. Every column is
  // shown, including empty ones (rendered as "—").
  const orderedColumns = buildOrderedColumns(
    customFieldDefs ?? [],
    columnOrder ?? [],
  );
  const profileFields = orderedColumns.map((col) => resolveProfileField(col, user, manager?.name ?? null));

  // Filter colleagues by search
  const filteredColleagues = searchColleague.trim()
    ? colleagues.filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(searchColleague.toLowerCase()) ||
          (c.jobTitle ?? "").toLowerCase().includes(searchColleague.toLowerCase()),
      )
    : colleagues;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 lg:p-6">
      <h1 className="text-xl font-bold">Data Profil Saya</h1>

      {/* Hero profile card */}
      <Card className="overflow-hidden pt-0">
        <div className={`h-20 w-full ${tone.accent}/80`}>
          <div
            className={`h-full w-full ${tone.bg} bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.4),transparent_40%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.3),transparent_50%)]`}
          />
        </div>
        <CardContent className="-mt-10 pb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <ProfileAvatarUploader
              avatarUrl={user.avatarUrl}
              name={user.name}
              initials={getInitials(user.name)}
              toneClass={tone.chip}
            />
            <div className="min-w-0 flex-1 space-y-1 pt-2 sm:pt-8">
              <h2 className="text-xl font-bold leading-tight">
                {user.name ?? "Tanpa Nama"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {user.jobTitle ?? "Belum ada jabatan"}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {user.department ? (
                  <Badge
                    variant="secondary"
                    className={`${tone.chip} border-transparent`}
                  >
                    <Building2 className="mr-1 size-3" />
                    {user.department}
                  </Badge>
                ) : null}
                {user.location ? (
                  <Badge variant="secondary">
                    <MapPin className="mr-1 size-3" />
                    {user.location}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:pt-8">
              <EditProfileDialog currentUser={user} />
            </div>
          </div>

          {user.bio ? (
            <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
              {user.bio}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Tabs: Kontak & Keahlian, Rekan Kerja, Riwayat */}
      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contact" className="cursor-pointer">
            Kontak & Keahlian
          </TabsTrigger>
          <TabsTrigger value="colleagues" className="cursor-pointer">
            Rekan Kerja
          </TabsTrigger>
          <TabsTrigger value="documents" className="cursor-pointer">
            Dokumen
          </TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">
            Riwayat
          </TabsTrigger>
        </TabsList>

        {/* Tab: Kontak & Keahlian */}
        <TabsContent value="contact" className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data Karyawan
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {profileFields.map((f) => (
                  <InfoRow
                    key={f.token}
                    icon={f.icon}
                    label={f.label}
                    value={f.value}
                    computed={f.computed}
                  />
                ))}
              </div>

              <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Sebagian data dikelola oleh HR. Gunakan tombol "Edit Profil" untuk
                mengajukan perubahan pada data yang boleh Anda ubah.
              </p>

              {manager ? (
                <>
                  <Separator className="my-5" />
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Atasan Langsung
                  </h3>
                  <button
                    onClick={() => navigate(`/directory/${manager._id}`)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg border bg-background p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <Avatar className="size-9">
                      {manager.avatarUrl ? (
                        <AvatarImage src={manager.avatarUrl} alt={manager.name ?? ""} />
                      ) : null}
                      <AvatarFallback className="text-xs font-semibold">
                        {getInitials(manager.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{manager.name ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{manager.jobTitle ?? "—"}</p>
                    </div>
                  </button>
                </>
              ) : null}

              <Separator className="my-5" />

              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="mr-1 inline size-3" />
                Keahlian & Kompetensi
              </h3>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada keahlian yang terdaftar. Gunakan tombol "Edit Profil" untuk menambahkan keahlian Anda.
                </p>
              ) : (
                <div className="space-y-2">
                  {skills.map((s) => (
                    <div
                      key={`${s.skill}-${s.category}`}
                      className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.skill}</p>
                        <p className="text-xs text-muted-foreground">
                          {SKILL_CATEGORY_LABELS[s.category] ?? s.category}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < s.level
                                ? "fill-amber-500 text-amber-500"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Rekan Kerja */}
        <TabsContent value="colleagues" className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <UsersIcon className="mr-1 inline size-3" />
                  Rekan Kerja ({colleagues.length})
                </h3>
                {colleagues.length > 5 && (
                  <div className="relative w-full sm:w-56">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari rekan..."
                      value={searchColleague}
                      onChange={(e) => setSearchColleague(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}
              </div>

              {directReports.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                    Bawahan Langsung ({directReports.length})
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {directReports.map((r) => (
                      <ColleagueCard
                        key={r._id}
                        user={r}
                        onClick={() => navigate(`/directory/${r._id}`)}
                      />
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              {filteredColleagues.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {searchColleague.trim() ? "Tidak ada rekan yang cocok." : "Belum ada rekan kerja terdaftar."}
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredColleagues.map((c) => (
                    <ColleagueCard
                      key={c._id}
                      user={c}
                      onClick={() => navigate(`/directory/${c._id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Dokumen */}
        <TabsContent value="documents">
          <ProfileDocumentsSection userId={user._id} />
        </TabsContent>

        {/* Tab: Riwayat */}
        <TabsContent value="history">
          <EmployeeHistorySection userId={user._id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type ProfileField = {
  token: string;
  label: string;
  value: string | null;
  icon: React.ComponentType<{ className?: string }>;
  computed?: boolean;
};

// Icons for the built-in directory columns, keyed by their stable token.
const BUILT_IN_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  no: Hash,
  nama: UserIcon,
  nip: Fingerprint,
  email: Mail,
  jobTitle: Briefcase,
  department: Building2,
  phone: Phone,
  location: MapPin,
  startDate: Award,
  dateOfBirth: Cake,
  managerId: UserCog,
};

// Resolve a single ordered directory column into a displayable profile field.
// Mirrors the directory table: dates are formatted, numbers grouped, and the
// computed "Masa Kerja"/"Usia" fields are derived live from the employee's dates.
function resolveProfileField(
  col: OrderedColumn,
  user: Doc<"users">,
  managerName: string | null,
): ProfileField {
  if (col.kind === "builtin") {
    const raw = builtInValue(user, col.builtin.key, managerName);
    let value: string | null = raw ?? null;
    if (raw && col.builtin.type === "date") {
      value = formatIsoFullDate(raw);
    }
    return {
      token: col.token,
      label: col.builtin.label,
      value,
      icon: BUILT_IN_ICONS[col.builtin.key] ?? Info,
    };
  }

  const label = col.custom.label;
  // "Masa Kerja" is always computed live from the start date, never stored.
  if (isMasaKerjaLabel(label)) {
    return {
      token: col.token,
      label,
      value: computeTenure(user.startDate),
      icon: Clock,
      computed: true,
    };
  }
  // "Usia" is always computed live from the date of birth, never stored.
  if (isUsiaLabel(label)) {
    return {
      token: col.token,
      label,
      value: computeAge(user.dateOfBirth),
      icon: CalendarDays,
      computed: true,
    };
  }

  const raw = (user.customFields ?? {})[col.custom._id];
  let value: string | null = raw ?? null;
  if (raw) {
    if (col.custom.type === "date") value = formatIsoFullDate(raw);
    else if (col.custom.type === "number") value = formatNumberValue(raw);
  }
  return { token: col.token, label, value, icon: Info };
}

function InfoRow({
  icon: Icon,
  label,
  value,
  computed,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  computed?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${!value ? "opacity-60" : ""}`}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {label}
          {computed ? (
            <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
              Otomatis
            </span>
          ) : null}
        </p>
        <p className="truncate text-sm font-medium">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function ColleagueCard({
  user,
  onClick,
}: {
  user: { _id: string; name?: string; avatarUrl?: string; jobTitle?: string; department?: string };
  onClick: () => void;
}) {
  const tone = COLOR_CLASSES[colorForDepartment(user.department)];
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border bg-background p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <Avatar className="size-9">
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />
        ) : null}
        <AvatarFallback className={`${tone.chip} text-xs font-semibold`}>
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name ?? "Tanpa Nama"}</p>
        <p className="truncate text-xs text-muted-foreground">{user.jobTitle ?? "—"}</p>
      </div>
    </button>
  );
}
