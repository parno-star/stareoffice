import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Cake,
  Award,
  MessageSquare,
  HeartHandshake,
  Copy,
  Check,
  Users as UsersIcon,
  Sparkles,
  UserCog,
  ExternalLink,
  Star,
  Pencil,
  Trash2,
  IdCard,
  Hourglass,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  formatIsoFullDate,
  formatMonthDay,
} from "@/pages/celebrations/_lib/celebrations-utils.ts";
import CreateRecognitionDialog from "@/pages/recognitions/_components/CreateRecognitionDialog.tsx";
import EmployeeHistorySection from "./_components/EmployeeHistorySection.tsx";
import SkDocumentsCard from "./_components/SkDocumentsCard.tsx";
import AdminEditEmployeeDialog from "./_components/AdminEditEmployeeDialog.tsx";
import { isAdminRole } from "@/convex/roles.ts";
import { computeAge, computeTenure } from "./_lib/directory-columns.ts";
import { computeCompleteness } from "./_lib/directory-completeness.ts";
import { DataAccessBanner } from "@/components/DataAccessBanner.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  colorForDepartment,
  COLOR_CLASSES,
  getInitials,
  SKILL_CATEGORY_LABELS,
} from "./_lib/directory-utils.ts";
import { ConvexError } from "convex/values";

export default function DirectoryEmployeeDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const detail = useQuery(
    api.directory.getEmployeeDetail,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const customFieldDefs = useQuery(api.directoryFields.list, {});
  const startConversation = useMutation(api.messages.startConversation);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [adminEditOpen, setAdminEditOpen] = useState(false);

  const isSelf =
    currentUser && detail && currentUser._id === detail.user._id;
  const isAdmin = isAdminRole(currentUser?.role);

  const handleCopy = async (value: string, field: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(`${label} disalin`);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const handleSendMessage = async () => {
    if (!detail || isSelf) return;
    setStartingChat(true);
    try {
      const conversationId = await startConversation({
        otherUserId: detail.user._id,
      });
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal memulai percakapan");
      } else {
        toast.error("Gagal memulai percakapan");
      }
    } finally {
      setStartingChat(false);
    }
  };

  if (detail === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  if (detail === null || !detail?.user) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1.5"
          onClick={() => navigate("/directory")}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Direktori
        </Button>
        <DataAccessBanner category="directory" className="mb-4" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Karyawan tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, manager, directReports, colleagues, skills, departmentHead } =
    detail;
  const tone = COLOR_CLASSES[colorForDepartment(user.department)] ?? COLOR_CLASSES["slate"] ?? {
    bg: "bg-slate-500",
    chip: "bg-slate-100 text-slate-700",
    accent: "bg-slate-500",
  };

  // Find the "NIP" custom field and the employee's value for it
  const customValues = (user.customFields ?? {}) as Record<string, string>;
  const nipDef = (customFieldDefs ?? []).find((def) =>
    def.label.trim().toLowerCase().includes("nip"),
  );
  const nipValue = nipDef ? customValues[nipDef._id] : undefined;

  // Data completeness: admins see it for any employee; regular employees only
  // for their own profile as a personal reminder.
  const showCompleteness = isAdmin || isSelf;
  const completeness = computeCompleteness(user, customFieldDefs ?? []);

  // Sensitive detail rows (start date, tenure, age) are only shown to admins or
  // when viewing your own profile. The server also redacts these values for
  // other viewers, so this keeps the layout clean.
  const canSeeSensitive = isAdmin || Boolean(isSelf);

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 lg:p-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => navigate("/directory")}
      >
        <ArrowLeft className="size-4" />
        Kembali ke Direktori
      </Button>

      {showCompleteness && !completeness.isComplete ? (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Data belum lengkap ({completeness.filled}/{completeness.total}{" "}
                  terisi &middot; {completeness.percent}%)
                </p>
                <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
                  {isSelf
                    ? "Lengkapi data berikut agar profil Anda lebih lengkap:"
                    : "Data berikut masih kosong dan perlu dilengkapi:"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {completeness.missing.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
              {isAdmin ? (
                <Button
                  size="sm"
                  className="mt-1 gap-1.5"
                  onClick={() => setAdminEditOpen(true)}
                >
                  <Pencil className="size-3.5" />
                  Lengkapi Sekarang
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Hero profile */}
      <Card className="overflow-hidden pt-0">
        <div className={`h-24 w-full ${tone.accent}/80`}>
          <div
            className={`h-full w-full ${tone.bg} bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.4),transparent_40%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.3),transparent_50%)]`}
          />
        </div>
        <CardContent className="-mt-12 pb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <Avatar className="size-24 shrink-0 ring-4 ring-background">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />
                ) : null}
                <AvatarFallback
                  className={`${tone.chip} text-2xl font-bold`}
                >
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {nipValue && canSeeSensitive ? (
                <Badge variant="secondary" className="gap-1 font-mono text-xs">
                  <IdCard className="size-3" />
                  {nipDef?.label ?? "NIP"}: {nipValue}
                </Badge>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-1 pt-2 sm:pt-12">
              <h1 className="text-2xl font-bold leading-tight">
                {user.name ?? "Tanpa Nama"}
              </h1>
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
                {directReports.length > 0 ? (
                  <Badge variant="secondary">
                    <UsersIcon className="mr-1 size-3" />
                    {directReports.length} bawahan langsung
                  </Badge>
                ) : null}
              </div>
            </div>
            {!isSelf ? (
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:pt-12">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    void handleSendMessage();
                  }}
                  disabled={startingChat}
                >
                  <MessageSquare className="size-4" />
                  {startingChat ? "Membuka..." : "Kirim Pesan"}
                </Button>
                <CreateRecognitionDialog
                  initialRecipientId={user._id}
                  trigger={
                    <Button variant="secondary" size="sm" className="gap-1.5">
                      <HeartHandshake className="size-4" />
                      Apresiasi
                    </Button>
                  }
                />
                {isAdmin ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setAdminEditOpen(true)}
                  >
                    <Pencil className="size-4" />
                    Edit Data
                  </Button>
                ) : null}
              </div>
            ) : isAdmin ? (
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:pt-12">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setAdminEditOpen(true)}
                >
                  <Pencil className="size-4" />
                  Edit Data
                </Button>
              </div>
            ) : null}
          </div>

          {user.bio ? (
            <div className="mt-5 rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
              {user.bio}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Contact & Details */}
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Informasi Kontak & Detail
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow
                icon={Mail}
                label="Email"
                value={user.email ?? null}
                copyable
                copied={copiedField === "email"}
                onCopy={() => {
                  if (user.email)
                    void handleCopy(user.email, "email", "Email");
                }}
              />
              <DetailRow
                icon={Phone}
                label="Telepon"
                value={user.phone ?? null}
                copyable
                copied={copiedField === "phone"}
                onCopy={() => {
                  if (user.phone)
                    void handleCopy(user.phone, "phone", "Telepon");
                }}
              />
              <DetailRow
                icon={Briefcase}
                label="Jabatan"
                value={user.jobTitle ?? null}
              />
              <DetailRow
                icon={Building2}
                label="Departemen"
                value={user.department ?? null}
              />
              <DetailRow
                icon={MapPin}
                label="Lokasi"
                value={user.location ?? null}
              />
              <DetailRow
                icon={Cake}
                label="Ulang Tahun"
                value={user.birthday ? formatMonthDay(user.birthday) : null}
              />
              {canSeeSensitive ? (
                <>
                  <DetailRow
                    icon={Hourglass}
                    label="Usia"
                    value={computeAge(user.dateOfBirth)}
                  />
                  <DetailRow
                    icon={Award}
                    label="Mulai Bekerja"
                    value={
                      user.startDate ? formatIsoFullDate(user.startDate) : null
                    }
                  />
                  <DetailRow
                    icon={Hourglass}
                    label="Masa Kerja"
                    value={computeTenure(user.startDate)}
                  />
                </>
              ) : null}
            </div>

            <Separator className="my-5" />

            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="mr-1 inline size-3" />
              Keahlian & Kompetensi
            </h2>
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada keahlian yang terdaftar.
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

        {/* Reporting line */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <UserCog className="mr-1 inline size-3" />
                Jalur Pelaporan
              </h2>
              {manager ? (
                <RelatedPersonButton
                  user={manager}
                  label="Atasan Langsung"
                  onClick={() => navigate(`/directory/${manager._id}`)}
                />
              ) : (
                <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  Tidak memiliki atasan langsung.
                </p>
              )}
            </div>

            {directReports.length > 0 ? (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bawahan Langsung ({directReports.length})
                </h3>
                <div className="space-y-1.5">
                  {directReports.map((r) => (
                    <RelatedPersonButton
                      key={r._id}
                      user={r}
                      compact
                      onClick={() => navigate(`/directory/${r._id}`)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {colleagues.length > 0 ? (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rekan Setim ({colleagues.length})
                </h3>
                <div className="space-y-1.5">
                  {colleagues.slice(0, 6).map((c) => (
                    <RelatedPersonButton
                      key={c._id}
                      user={c}
                      compact
                      onClick={() => navigate(`/directory/${c._id}`)}
                    />
                  ))}
                  {colleagues.length > 6 ? (
                    <p className="pt-1 text-xs text-muted-foreground">
                      +{colleagues.length - 6} rekan setim lainnya
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {departmentHead && departmentHead._id !== user._id ? (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kepala Departemen
                </h3>
                <RelatedPersonButton
                  user={departmentHead}
                  compact
                  onClick={() => navigate(`/directory/${departmentHead._id}`)}
                />
              </div>
            ) : null}

            <Separator />
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => navigate("/organization")}
            >
              <ExternalLink className="size-4" />
              Lihat Bagan Lengkap
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SK / Kontrak documents (visible to admins & the employee themselves) */}
      <SkDocumentsCard userId={user._id} canView={isAdmin || Boolean(isSelf)} />

      {/* Employee history: positions, education, training */}
      <EmployeeHistorySection userId={user._id} />

      {/* Admin edit dialog - only rendered when opened */}
      {isAdmin && adminEditOpen ? (
        <AdminEditEmployeeDialog
          open={adminEditOpen}
          onOpenChange={setAdminEditOpen}
          employee={user}
        />
      ) : null}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  copyable,
  copied,
  onCopy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: () => void;
}) {
  if (!value) {
    return (
      <div className="flex items-start gap-3 opacity-60">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-muted-foreground">—</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
      {copyable && onCopy ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCopy}
          className="shrink-0"
          aria-label={`Salin ${label}`}
        >
          {copied ? (
            <Check className="size-4 text-primary" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      ) : null}
    </div>
  );
}

function RelatedPersonButton({
  user,
  label,
  compact,
  onClick,
}: {
  user: Doc<"users">;
  label?: string;
  compact?: boolean;
  onClick: () => void;
}) {
  const tone = COLOR_CLASSES[colorForDepartment(user.department)];
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border bg-background p-2 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
    >
      <Avatar className={compact ? "size-8" : "size-10"}>
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />
        ) : null}
        <AvatarFallback className={`${tone.chip} text-xs font-semibold`}>
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        {label ? (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        ) : null}
        <p className="truncate text-sm font-medium">
          {user.name ?? "Tanpa Nama"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {user.jobTitle ?? "—"}
        </p>
      </div>
    </button>
  );
}
