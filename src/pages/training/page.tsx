import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  Award,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  DollarSign,
  GraduationCap,
  Plus,
  Route,
  Search,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  UploadCloud,
  Lightbulb,
  Layers,
  Activity,
  Milestone,
  BrainCircuit,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce.ts";
import CourseCard from "./_components/CourseCard.tsx";
import CourseFormDialog from "./_components/CourseFormDialog.tsx";
import LearningPathFormDialog from "./_components/LearningPathFormDialog.tsx";
import TrainingAnalyticsDashboard from "./_components/TrainingAnalyticsDashboard.tsx";
import GamificationPanel from "./_components/GamificationPanel.tsx";
import LeaderboardPanel from "./_components/LeaderboardPanel.tsx";
import RecommendationsPanel from "./_components/RecommendationsPanel.tsx";
import SkillGapPanel from "./_components/SkillGapPanel.tsx";
import ExternalTrainingsList from "./_components/ExternalTrainingsList.tsx";
import ExternalTrainingDialog from "./_components/ExternalTrainingDialog.tsx";
import BudgetPanel from "./_components/BudgetPanel.tsx";
import UpcomingSessionsWidget from "./_components/UpcomingSessionsWidget.tsx";
import AICourseBuilderDialog from "./_components/AICourseBuilderDialog.tsx";
import MicrolearningTab from "./_components/MicrolearningTab.tsx";
import FlashcardsTab from "./_components/FlashcardsTab.tsx";
import RoiDashboard from "./_components/RoiDashboard.tsx";
import MyCareerPanel from "./_components/MyCareerPanel.tsx";
import CareerAdminPanel from "./_components/CareerAdminPanel.tsx";
import {
  CATEGORY_OPTIONS,
  formatDuration,
} from "./_lib/training-utils.ts";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { isAdminRole } from "@/convex/roles.ts";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PathsTab({ isAdmin }: { isAdmin: boolean }) {
  const paths = useQuery(api.training.paths.listPaths, {});
  if (paths === undefined || paths === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }
  if (paths.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Route />
          </EmptyMedia>
          <EmptyTitle>Belum ada jalur pembelajaran</EmptyTitle>
          <EmptyDescription>
            Jalur pembelajaran membantu mengurutkan kelas menjadi program
            terstruktur.
          </EmptyDescription>
        </EmptyHeader>
        {isAdmin ? (
          <EmptyContent>
            <LearningPathFormDialog
              trigger={
                <Button size="sm" className="cursor-pointer gap-1">
                  <Plus className="size-4" /> Buat jalur
                </Button>
              }
            />
          </EmptyContent>
        ) : null}
      </Empty>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paths.map((p) => (
        <Link
          key={p._id}
          to={`/training/path/${p._id}`}
          className={cn(
            "relative flex flex-col overflow-hidden rounded-xl border transition-all hover:shadow-lg",
          )}
        >
          <div
            className={cn("p-5 text-white", {
              "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700":
                p.coverColor === "blue",
              "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700":
                p.coverColor === "green",
              "bg-gradient-to-br from-orange-500 via-orange-600 to-rose-600":
                p.coverColor === "orange",
              "bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-700":
                p.coverColor === "purple",
              "bg-gradient-to-br from-pink-500 via-rose-500 to-red-600":
                p.coverColor === "pink",
              "bg-gradient-to-br from-red-500 via-red-600 to-rose-700":
                p.coverColor === "red",
              "bg-gradient-to-br from-teal-500 via-cyan-600 to-sky-700":
                p.coverColor === "teal",
              "bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700":
                p.coverColor === "indigo" ||
                !["blue", "green", "orange", "purple", "pink", "red", "teal", "indigo"].includes(
                  p.coverColor,
                ),
            })}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{p.icon ?? "🎯"}</span>
              {!p.isPublished ? (
                <span className="rounded-full border border-white/40 px-2 py-0.5 text-[11px] font-medium">
                  Draft
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 text-lg font-bold leading-tight text-balance">
              {p.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/85">
              {p.description}
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-2 bg-card p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{p.totalCount} kelas</span>
              <span className="font-medium">
                {p.completedCount}/{p.totalCount} selesai
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary"
                style={{ width: `${p.percent}%` }}
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function BookmarksTab() {
  const bookmarks = useQuery(api.training.budget.listMyBookmarks, {});
  if (bookmarks === undefined || bookmarks === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }
  if (bookmarks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bookmark />
          </EmptyMedia>
          <EmptyTitle>Belum ada wishlist</EmptyTitle>
          <EmptyDescription>
            Simpan kelas favorit dengan ikon bookmark di kartu kelas.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map((c) => (
        <Link
          key={c._id}
          to={`/training/${c._id}`}
          className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <h4 className="line-clamp-2 font-semibold">{c.title}</h4>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {c.description}
          </p>
          <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {c.lessonCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatDuration(c.durationMinutes)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function TrainingPageInner() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const isAdmin = isAdminRole(currentUser?.role);
  const statsQuery = useQuery(api.courses.getStats, {});
  const stats = statsQuery ?? { enrolledCount: 0, inProgressCount: 0, completedCount: 0 };
  const myStats = useQuery(api.training.gamification.getMyStats, {});
  const myAssignments = useQuery(
    api.training.assignments.getMyAssignments,
    {},
  );
  const myCertificates = useQuery(
    api.training.analytics.getMyCertificates,
    {},
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 300);
  const [category, setCategory] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "browse";
  const visibleTabs = new Set([
    "browse",
    "recommend",
    "enrolled",
    "mandatory",
    "paths",
    "microlearning",
    "flashcards",
    "bookmarks",
    "career",
    "gamification",
    "skills",
    "external",
    "certificates",
    ...(isAdmin ? ["drafts", "budget", "roi", "careers-admin", "admin"] : []),
  ]);
  const tab = visibleTabs.has(rawTab) ? rawTab : "browse";
  const handleTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === "browse") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    setSearchParams(params, { replace: true });
  };

  const browseCourses = useQuery(api.courses.listCourses, {
    category,
    search: debouncedSearch,
    filter: "all",
  });
  const enrolledCourses = useQuery(api.courses.getMyEnrollments, {});
  const mandatoryCourses = useQuery(api.courses.listCourses, {
    filter: "mandatory",
  });
  const draftCourses = useQuery(
    api.courses.listCourses,
    isAdmin ? { filter: "draft" } : "skip",
  );

  const pendingMandatory = (mandatoryCourses ?? []).filter(
    (c) => !c.enrollment?.completedAt,
  ).length;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pelatihan & E-learning
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelas, kuis, sertifikat, jalur pembelajaran, sesi live, dan
            gamifikasi dalam satu portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExternalTrainingDialog
            trigger={
              <Button
                size="sm"
                variant="secondary"
                className="cursor-pointer gap-1"
              >
                <UploadCloud className="size-4" /> Sertifikat eksternal
              </Button>
            }
          />
          {isAdmin ? (
            <>
              <AICourseBuilderDialog
                trigger={
                  <Button
                    size="sm"
                    variant="secondary"
                    className="cursor-pointer gap-1"
                  >
                    <Sparkles className="size-4" /> AI Builder
                  </Button>
                }
              />
              <LearningPathFormDialog
                trigger={
                  <Button
                    size="sm"
                    variant="secondary"
                    className="cursor-pointer gap-1"
                  >
                    <Route className="size-4" /> Jalur baru
                  </Button>
                }
              />
              <CourseFormDialog
                trigger={
                  <Button className="cursor-pointer gap-1" size="sm">
                    <Plus className="size-4" /> Kelas baru
                  </Button>
                }
              />
            </>
          ) : null}
        </div>
      </div>

      {statsQuery === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Kelas Diikuti"
            value={String(stats.enrolledCount)}
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Sedang Berjalan"
            value={String(stats.inProgressCount)}
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Sudah Selesai"
            value={String(stats.completedCount)}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={Trophy}
            label="XP & Level"
            value={
              myStats
                ? `Lv ${myStats.level} · ${myStats.totalXp}`
                : "Lv 1 · 0"
            }
            accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          />
        </div>
      )}

      <UpcomingSessionsWidget />

      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="no-scrollbar flex h-auto w-full justify-start gap-1 overflow-x-auto whitespace-nowrap lg:flex-wrap">
          <TabsTrigger value="browse" className="cursor-pointer">
            Jelajah
          </TabsTrigger>
          <TabsTrigger value="recommend" className="cursor-pointer gap-1">
            <Sparkles className="size-3.5" /> Rekomendasi
          </TabsTrigger>
          <TabsTrigger value="enrolled" className="cursor-pointer">
            Kelas Saya
          </TabsTrigger>
          <TabsTrigger value="mandatory" className="cursor-pointer gap-1">
            Wajib
            {pendingMandatory > 0 ? (
              <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {pendingMandatory}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="paths" className="cursor-pointer">
            Jalur
          </TabsTrigger>
          <TabsTrigger value="microlearning" className="cursor-pointer gap-1">
            <Lightbulb className="size-3.5" /> Microlearning
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="cursor-pointer gap-1">
            <Layers className="size-3.5" /> Flashcard
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="cursor-pointer gap-1">
            <Bookmark className="size-3.5" /> Wishlist
          </TabsTrigger>
          <TabsTrigger value="career" className="cursor-pointer gap-1">
            <Milestone className="size-3.5" /> Karir Saya
          </TabsTrigger>
          <TabsTrigger value="gamification" className="cursor-pointer gap-1">
            <Trophy className="size-3.5" /> Pencapaian
          </TabsTrigger>
          <TabsTrigger value="skills" className="cursor-pointer gap-1">
            <Target className="size-3.5" /> Keahlian
          </TabsTrigger>
          <TabsTrigger value="external" className="cursor-pointer">
            Eksternal
          </TabsTrigger>
          <TabsTrigger value="certificates" className="cursor-pointer">
            Sertifikat
          </TabsTrigger>
          {isAdmin ? (
            <>
              <TabsTrigger value="drafts" className="cursor-pointer">
                Draft
              </TabsTrigger>
              <TabsTrigger value="budget" className="cursor-pointer gap-1">
                <DollarSign className="size-3.5" /> Anggaran
              </TabsTrigger>
              <TabsTrigger value="roi" className="cursor-pointer gap-1">
                <Activity className="size-3.5" /> ROI & Prediksi
              </TabsTrigger>
              <TabsTrigger value="careers-admin" className="cursor-pointer gap-1">
                <BrainCircuit className="size-3.5" /> Kompetensi & Karir
              </TabsTrigger>
              <TabsTrigger value="admin" className="cursor-pointer">
                Dasbor Admin
              </TabsTrigger>
            </>
          ) : null}
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kelas pelatihan..."
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full cursor-pointer sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {browseCourses === undefined || browseCourses === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          ) : browseCourses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GraduationCap />
                </EmptyMedia>
                <EmptyTitle>Belum ada kelas tersedia</EmptyTitle>
                <EmptyDescription>
                  {debouncedSearch
                    ? "Coba kata kunci lain atau pilih kategori berbeda."
                    : isAdmin
                      ? "Mulai buat kelas pertama untuk tim Anda."
                      : "Kelas pelatihan akan muncul di sini setelah dipublikasikan."}
                </EmptyDescription>
              </EmptyHeader>
              {isAdmin ? (
                <EmptyContent>
                  <CourseFormDialog
                    trigger={
                      <Button size="sm" className="cursor-pointer gap-1">
                        <Plus className="size-4" /> Buat kelas
                      </Button>
                    }
                  />
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {browseCourses.map((c) => (
                <CourseCard key={c._id} course={c} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommend" className="space-y-4">
          <RecommendationsPanel />
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-4">
          {enrolledCourses === undefined || enrolledCourses === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          ) : enrolledCourses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>Belum ada kelas diikuti</EmptyTitle>
                <EmptyDescription>
                  Jelajahi katalog dan daftar kelas untuk mulai belajar.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((c) => (
                <CourseCard key={c._id} course={c} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mandatory" className="space-y-4">
          {myAssignments === undefined || myAssignments === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          ) : mandatoryCourses === undefined || mandatoryCourses === null ? null : mandatoryCourses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sparkles />
                </EmptyMedia>
                <EmptyTitle>Tidak ada kelas wajib</EmptyTitle>
                <EmptyDescription>
                  Anda tidak memiliki penugasan pelatihan saat ini.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mandatoryCourses.map((c) => (
                <CourseCard key={c._id} course={c} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paths">
          <PathsTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="microlearning">
          <MicrolearningTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="flashcards">
          <FlashcardsTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="bookmarks">
          <BookmarksTab />
        </TabsContent>

        <TabsContent value="career" className="space-y-4">
          <MyCareerPanel />
        </TabsContent>

        <TabsContent value="gamification" className="space-y-4">
          <GamificationPanel />
          <LeaderboardPanel />
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillGapPanel />
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          <ExternalTrainingsList isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          {myCertificates === undefined || myCertificates === null ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : myCertificates.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Award />
                </EmptyMedia>
                <EmptyTitle>Belum ada sertifikat</EmptyTitle>
                <EmptyDescription>
                  Selesaikan kelas dan lulus kuis untuk mendapatkan sertifikat.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myCertificates.map((c) => (
                <Link
                  key={c._id}
                  to={`/training/${c.courseId}`}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-5 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Award className="size-6" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-white/80">
                          Sertifikat
                        </p>
                        <p className="font-mono text-xs">{c.serial}</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-base font-semibold">
                      {c.courseTitle}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 text-xs text-muted-foreground">
                    <span>
                      Diterbitkan{" "}
                      {new Date(c.issuedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDuration(c.durationMinutes)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin ? (
          <>
            <TabsContent value="drafts" className="space-y-4">
              {draftCourses === undefined || draftCourses === null ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 w-full" />
                  ))}
                </div>
              ) : draftCourses.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <GraduationCap />
                    </EmptyMedia>
                    <EmptyTitle>Tidak ada draft</EmptyTitle>
                    <EmptyDescription>
                      Semua kelas Anda sudah dipublikasikan.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {draftCourses.map((c) => (
                    <CourseCard key={c._id} course={c} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="budget" className="space-y-4">
              <BudgetPanel />
            </TabsContent>

            <TabsContent value="roi" className="space-y-4">
              <RoiDashboard />
            </TabsContent>

            <TabsContent value="careers-admin" className="space-y-4">
              <CareerAdminPanel />
            </TabsContent>

            <TabsContent value="admin">
              <TrainingAnalyticsDashboard />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}

export default function TrainingPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk melihat kelas pelatihan.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <TrainingPageInner />
      </Authenticated>
    </>
  );
}
