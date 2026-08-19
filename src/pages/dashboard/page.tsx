import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import WelcomeCard from "@/components/WelcomeCard.tsx";
import BannerCarousel from "@/components/BannerCarousel.tsx";
import CompanyValues from "@/components/CompanyValues.tsx";
import ChatbotFab from "@/pages/chatbot/_components/ChatbotFab.tsx";
import TodayCelebrationsBanner from "@/components/TodayCelebrationsBanner.tsx";
import {
  Mail,
  Users,
  FileText,
  Clock,
  MessageSquare,
  Sparkles,
  GraduationCap,
  CalendarDays,
  FolderKanban,
  Send,
} from "lucide-react";

export default function DashboardHome() {
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const welcomeData = useQuery(api.welcomePage.getContent, {});
  const eofficeStats = useQuery(api.dashboardStats.getEOfficeStats, {});

  const userName = currentUser?.name || currentUser?.nip || "CIP 2017";
  const userAvatar = currentUser?.avatarUrl;

  const slogan = welcomeData?.slogan || "Bersama Membangun Masa Depan Digital";
  const slides = welcomeData?.bannerSlides || [
    {
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1080",
      caption: "Inovasi Digital Tanpa Batas",
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1080",
      caption: "Kolaborasi Tim yang Solid",
    },
  ];
  const values = welcomeData?.values || [
    {
      icon: "🎯",
      title: "Integritas",
      description: "Menjunjung tinggi kejujuran dan transparansi dalam setiap keputusan dan tindakan.",
    },
    {
      icon: "🚀",
      title: "Inovasi",
      description: "Terus berinovasi untuk memberikan solusi terbaik dan meningkatkan efisiensi kerja.",
    },
    {
      icon: "🤝",
      title: "Kolaborasi",
      description: "Bekerja sama sebagai tim yang solid untuk mencapai tujuan bersama organisasi.",
    },
    {
      icon: "⭐",
      title: "Keunggulan",
      description: "Berkomitmen untuk memberikan kualitas terbaik dalam setiap layanan dan produk.",
    },
  ];
  const spotlightText = welcomeData?.spotlightText || "#TransformasiDigital #KerjaCerdas #TimHebat";

  const quickAccessItems = [
    {
      label: "Kelola Surat",
      path: "/letters",
      icon: Mail,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Absensi",
      path: "/attendance",
      icon: Clock,
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Direktori",
      path: "/directory",
      icon: Users,
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Tugas & Proyek",
      path: "/projects",
      icon: FolderKanban,
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Forum",
      path: "/forum",
      icon: MessageSquare,
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
      label: "Asisten AI",
      path: "/chatbot",
      icon: Sparkles,
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Pelatihan",
      path: "/training",
      icon: GraduationCap,
      bgColor: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Kalender",
      path: "/calendar",
      icon: CalendarDays,
      bgColor: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Hero Welcome Card */}
        <WelcomeCard
          name={userName}
          avatarUrl={userAvatar}
          slogan={slogan}
        />

        {/* Hashtag Spotlight Bar */}
        {spotlightText && (
          <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 dark:text-primary-foreground px-1">
            <span className="text-lg">#</span>
            <p className="tracking-wide">{spotlightText.replace(/^#\s*/, "")}</p>
          </div>
        )}

        {/* Today's Celebrations / Announcements Banner */}
        <TodayCelebrationsBanner />

        {/* Section 1: SOROTAN & KEGIATAN */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-muted-foreground uppercase">
              SOROTAN & KEGIATAN
            </h2>
          </div>
          <BannerCarousel
            slides={slides}
            settings={welcomeData?.carouselSettings}
          />
        </div>

        {/* Section 2: NILAI-NILAI PERUSAHAAN */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-muted-foreground uppercase">
              NILAI-NILAI PERUSAHAAN
            </h2>
          </div>
          <CompanyValues values={values} />
        </div>

        {/* Section 3: RINGKASAN */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs sm:text-sm font-bold tracking-wider text-muted-foreground uppercase">
            RINGKASAN
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Surat Masuk */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Mail className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight">
                  {eofficeStats?.suratMasuk ?? 0}
                </p>
                <p className="text-xs text-muted-foreground font-medium truncate">
                  Surat Masuk
                </p>
              </div>
            </div>

            {/* Total Karyawan */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Users className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight">
                  {eofficeStats?.totalKaryawan ?? 0}
                </p>
                <p className="text-xs text-muted-foreground font-medium truncate">
                  Total Karyawan
                </p>
              </div>
            </div>

            {/* Surat Bulan Ini */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight">
                  {eofficeStats?.suratBulanIni ?? 0}
                </p>
                <p className="text-xs text-muted-foreground font-medium truncate">
                  Surat Bulan Ini
                </p>
              </div>
            </div>

            {/* Menunggu Persetujuan */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border bg-card text-card-foreground shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <CalendarDays className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight">
                  {eofficeStats?.approvalPending ?? 0}
                </p>
                <p className="text-xs text-muted-foreground font-medium truncate">
                  Menunggu Per...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: AKSES CEPAT */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs sm:text-sm font-bold tracking-wider text-muted-foreground uppercase">
            AKSES CEPAT
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickAccessItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md hover:bg-accent/40 transition-all cursor-pointer group text-center gap-3"
                >
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl ${item.bgColor} ${item.iconColor} transition-transform group-hover:scale-105`}
                  >
                    <IconComp className="size-6" />
                  </div>
                  <span className="text-sm font-semibold text-foreground tracking-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Sparkles Chatbot FAB */}
      <ChatbotFab />
    </div>
  );
}

