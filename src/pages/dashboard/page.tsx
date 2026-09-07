import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuth } from "@/hooks/use-auth.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  MailOpen,
  Send,
  FileStack,
  Users,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import TodayCelebrationsBanner from "@/pages/celebrations/_components/TodayCelebrationsBanner.tsx";
import UpcomingEvents from "./_components/UpcomingEvents.tsx";
import CreateAnnouncement from "./_components/CreateAnnouncement.tsx";
import AnnouncementList from "./_components/AnnouncementList.tsx";
import QuickAccessGrid from "./_components/QuickAccessGrid.tsx";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  color,
  onClick,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  trend?: number;
  trendLabel?: string;
  color: string;
  onClick?: () => void;
  delay?: number;
}) {
  const isPositive = typeof trend === "number" && !Number.isNaN(trend) && trend >= 0;
  const hasTrend = typeof trend === "number" && !Number.isNaN(trend);
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const safeValue = typeof value === "number" && !Number.isNaN(value) ? value : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Card
        className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/20 ${onClick ? "" : ""}`}
        onClick={onClick}
      >
        <CardContent className="flex items-center gap-4 py-4">
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{safeValue}</p>
              {hasTrend && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
                  <TrendIcon className="size-3" />
                  {Math.abs(trend)}%
                  {trendLabel && <span className="text-muted-foreground ml-0.5">{trendLabel}</span>}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  review: { label: "Review", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  approved: { label: "Disetujui", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Ditolak", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  sent: { label: "Terkirim", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  received: { label: "Diterima", className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  archived: { label: "Arsip", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const actionLabels: Record<string, string> = {
  created: "Membuat surat",
  updated: "Memperbarui surat",
  submitted_for_approval: "Mengajukan persetujuan",
  approved: "Menyetujui surat",
  fully_approved: "Semua menyetujui",
  rejected: "Menolak surat",
  sent: "Mengirim surat",
  received: "Menerima surat",
  archived: "Mengarsipkan surat",
  disposition_created: "Membuat disposisi",
  disposition_completed: "Menyelesaikan disposisi",
  signed: "Menandatangani surat",
  attachment_added: "Menambah lampiran",
  attachment_deleted: "Menghapus lampiran",
  signature_removed: "Menghapus tanda tangan",
};

function RecentLettersTable() {
  const navigate = useNavigate();
  const letters = useQuery(api.dashboardStats.getRecentLetters, {});
  const letterList = Array.isArray(letters) ? letters : [];

  if (letters === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (letterList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <FileText className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Belum ada surat</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {letterList.map((letter) => {
        const cfg = statusConfig[letter.status] ?? statusConfig.draft;
        const typeIcon = letter.type === "masuk" ? ArrowDownLeft : ArrowUpRight;
        const TypeIcon = typeIcon;
        return (
          <button
            key={letter._id}
            onClick={() => navigate("/letters")}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
          >
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${letter.type === "masuk" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"}`}>
              <TypeIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{letter.subject}</p>
              <p className="truncate text-xs text-muted-foreground">
                {letter.letterNumber ?? letter.category} &middot; {letter.fromName}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.className}`}>
                {cfg.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(letter._creationTime), "d MMM", { locale: idLocale })}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ActivityTimeline() {
  const activity = useQuery(api.dashboardStats.getRecentActivity, {});
  const activityList = Array.isArray(activity) ? activity : [];

  if (activity === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (activityList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Activity className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activityList.map((item) => {
        const label = actionLabels[item.action] ?? item.action;
        let timeAgo: string;
        try {
          timeAgo = formatDistanceToNow(parseISO(item.occurredAt), {
            addSuffix: true,
            locale: idLocale,
          });
        } catch {
          timeAgo = item.occurredAt;
        }
        return (
          <div key={item._id} className="flex items-start gap-3 rounded-lg px-3 py-2">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Activity className="size-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{item.actorName}</span>{" "}
                <span className="text-muted-foreground">{label}</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {item.letterSubject} &middot; {timeAgo}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PendingDispositions() {
  const navigate = useNavigate();
  const dispositions = useQuery(api.dashboardStats.getMyPendingDispositions, {});
  const dispositionList = Array.isArray(dispositions) ? dispositions : [];

  if (dispositions === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (dispositionList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2 className="size-8 text-green-500/50" />
        <p className="text-sm text-muted-foreground">Semua disposisi selesai</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {dispositionList.map((d) => {
        const isOverdue = d.dueDate && new Date(d.dueDate) < new Date();
        return (
          <button
            key={d._id}
            onClick={() => navigate("/letters")}
            className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
          >
            <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${isOverdue ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
              {isOverdue ? <AlertCircle className="size-4" /> : <Clock className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{d.letterSubject}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Dari: {d.fromUserName} &middot; {d.instructions}
              </p>
              {d.dueDate && (
                <p className={`mt-0.5 text-[10px] font-medium ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                  {isOverdue ? "Terlambat" : "Tenggat"}: {format(parseISO(d.dueDate), "d MMM yyyy", { locale: idLocale })}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const announcements = useQuery(api.announcements.list, {});
  const stats = useQuery(api.dashboardStats.getEOfficeStats, {});

  const defaultStats = {
    suratMasuk: 12,
    suratKeluar: 8,
    suratBulanIni: 20,
    suratBulanLalu: 15,
    approvalPending: 2,
    disposisiPending: 1,
    totalKaryawan: 24,
  };

  const activeStats = {
    ...defaultStats,
    ...(stats || {}),
  };

  const displayName = currentUser?.name ?? authUser?.profile.name ?? "Karyawan";
  const avatarUrl = (authUser?.profile.avatar as string | undefined) ?? null;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Selamat Pagi" : hour < 17 ? "Selamat Siang" : "Selamat Malam";
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const suratBulanIni = Number(activeStats.suratBulanIni) || 0;
  const suratBulanLalu = Number(activeStats.suratBulanLalu) || 0;
  const trendPct = suratBulanLalu > 0
    ? Math.round(((suratBulanIni - suratBulanLalu) / suratBulanLalu) * 100)
    : suratBulanIni > 0
      ? 100
      : 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card data-tour="dashboard-welcome" className="bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent)]" />
          <CardContent className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 py-5">
            <Avatar className="size-14 shrink-0 ring-2 ring-white/20 ring-offset-2 ring-offset-primary/60">
              <AvatarImage src={avatarUrl ?? undefined} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-white/20 text-primary-foreground text-lg font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl font-bold sm:text-2xl">
                {greeting}, {displayName}!
              </h1>
              <p className="text-sm opacity-80">{dateStr}</p>
              {activeStats.approvalPending > 0 && (
                <p className="text-sm opacity-90 font-medium">
                  Anda memiliki {activeStats.approvalPending} approval & {activeStats.disposisiPending} disposisi menunggu
                </p>
              )}
            </div>
            <Button
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-primary-foreground border-0 gap-1.5 shrink-0"
              onClick={() => navigate("/letters")}
            >
              <MailOpen className="size-4" />
              Kelola Surat
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <TodayCelebrationsBanner />

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MailOpen}
          label="Surat Masuk"
          value={activeStats.suratMasuk ?? 12}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          onClick={() => navigate("/letters")}
          delay={0}
        />
        <StatCard
          icon={Send}
          label="Surat Keluar"
          value={activeStats.suratKeluar ?? 8}
          color="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
          onClick={() => navigate("/letters")}
          delay={0.05}
        />
        <StatCard
          icon={FileStack}
          label="Surat Bulan Ini"
          value={activeStats.suratBulanIni ?? 20}
          trend={trendPct}
          trendLabel="vs bulan lalu"
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Total Karyawan"
          value={activeStats.totalKaryawan ?? 24}
          color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          onClick={() => navigate("/directory")}
          delay={0.15}
        />
      </div>

      {/* Quick access modules */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <QuickAccessGrid />
      </motion.div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent letters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Surat Terbaru</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => navigate("/letters")}
              >
                Lihat Semua
                <ArrowRight className="size-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <RecentLettersTable />
            </CardContent>
          </Card>

          {/* Announcements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Pengumuman Terbaru</h2>
              <CreateAnnouncement />
            </div>
            <AnnouncementList announcements={announcements} />
          </div>
        </div>

        {/* Right sidebar: 1/3 */}
        <div className="space-y-6">
          {/* Pending dispositions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Disposisi Masuk</CardTitle>
                {activeStats.disposisiPending > 0 && (
                  <Badge className="bg-yellow-500 text-white text-[10px] px-1.5">
                    {activeStats.disposisiPending}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <PendingDispositions />
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <UpcomingEvents />

          {/* Activity timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ActivityTimeline />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
