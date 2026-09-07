import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
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
  HeartPulse,
  Plus,
  Search,
  Activity,
  Sparkles,
  Users2,
  TrendingUp,
  Flame,
  ClipboardCheck,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { isAdminRole } from "@/convex/roles.ts";
import type { Id } from "@/convex/_generated/dataModel.js";
import SurveyCard from "@/pages/engagement/_components/SurveyCard.tsx";
import SurveyFormDialog from "@/pages/engagement/_components/SurveyFormDialog.tsx";
import RespondSurveyDialog from "@/pages/engagement/_components/RespondSurveyDialog.tsx";
import SurveyResultsDialog from "@/pages/engagement/_components/SurveyResultsDialog.tsx";
import WellnessCheckinDialog from "@/pages/engagement/_components/WellnessCheckinDialog.tsx";
import WellnessPanel from "@/pages/engagement/_components/WellnessPanel.tsx";
import { formatScorePercent } from "@/pages/engagement/_lib/engagement-utils.ts";

function EngagementInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const departments = useQuery(api.users.listDepartments, {});
  const stats = useQuery(api.engagement.getStats, {});
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const surveys = useQuery(api.engagement.listSurveys, { filter });

  const [createOpen, setCreateOpen] = useState(false);
  const [wellnessOpen, setWellnessOpen] = useState(false);
  const [respondId, setRespondId] = useState<Id<"engagementSurveys"> | null>(
    null,
  );
  const [resultsId, setResultsId] = useState<Id<"engagementSurveys"> | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<Id<"engagementSurveys"> | null>(
    null,
  );

  const publishSurvey = useMutation(api.engagement.publishSurvey);
  const closeSurvey = useMutation(api.engagement.closeSurvey);
  const removeSurvey = useMutation(api.engagement.removeSurvey);

  const isAdmin = isAdminRole(currentUser?.role);

  // Deep-link from notification: ?id=<surveyId> opens the respond dialog
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && !respondId) {
      setRespondId(id as Id<"engagementSurveys">);
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, respondId, setSearchParams]);

  const filteredSurveys = useMemo(() => {
    if (!surveys) return [];
    const q = search.trim().toLowerCase();
    if (!q) return surveys;
    return surveys.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q),
    );
  }, [surveys, search]);

  async function handlePublish(id: Id<"engagementSurveys">) {
    try {
      await publishSurvey({ surveyId: id });
      toast.success("Survei berhasil diterbitkan");
    } catch (err) {
      toast.error(
        err instanceof ConvexError
          ? ((err.data as { message?: string }).message ??
              "Gagal menerbitkan survei")
          : "Gagal menerbitkan survei",
      );
    }
  }
  async function handleClose(id: Id<"engagementSurveys">) {
    try {
      await closeSurvey({ surveyId: id });
      toast.success("Survei ditutup");
    } catch {
      toast.error("Gagal menutup survei");
    }
  }
  async function handleDelete() {
    if (!deleteId) return;
    try {
      await removeSurvey({ surveyId: deleteId });
      toast.success("Survei dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus survei");
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
              <HeartPulse className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Survei Engagement & Wellness
              </h1>
              <p className="text-sm text-muted-foreground">
                Dengarkan suara karyawan dan pantau kesejahteraan tim.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setWellnessOpen(true)}
            className="cursor-pointer"
          >
            <HeartPulse className="size-4" />
            Check-in Harian
          </Button>
          {isAdmin && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="cursor-pointer"
            >
              <Plus className="size-4" />
              Buat Survei
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Activity}
          label="Survei Aktif"
          value={stats ? String(stats.activeSurveys) : "-"}
          loading={!stats}
          color="text-emerald-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Sentimen Rata-rata"
          value={stats ? formatScorePercent(stats.averageScore) : "-"}
          loading={!stats}
          color="text-blue-500"
        />
        <StatCard
          icon={Users2}
          label="Partisipasi"
          value={stats ? `${stats.participationRate}%` : "-"}
          loading={!stats}
          color="text-violet-500"
        />
        <StatCard
          icon={Flame}
          label="Streak Wellness"
          value={stats ? `${stats.myStreakDays} hari` : "-"}
          loading={!stats}
          color="text-orange-500"
        />
      </div>

      {/* Pending surveys banner */}
      {stats && stats.mySurveysPending > 0 && (
        <Card className="p-4 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-violet-500/10 border-rose-200/50 dark:border-rose-500/20">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="size-10 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
              <ClipboardCheck className="size-5 text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">
                Ada {stats.mySurveysPending} survei menunggu pendapat Anda
              </h3>
              <p className="text-sm text-muted-foreground">
                Suara Anda penting untuk membangun tempat kerja yang lebih baik.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setFilter("active");
                document
                  .getElementById("engagement-tabs")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="cursor-pointer"
            >
              Lihat Survei
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="surveys" id="engagement-tabs">
        <TabsList>
          <TabsTrigger value="surveys" className="cursor-pointer">
            <Sparkles className="size-4" />
            Survei
          </TabsTrigger>
          <TabsTrigger value="wellness" className="cursor-pointer">
            <HeartPulse className="size-4" />
            Wellness Saya
          </TabsTrigger>
        </TabsList>

        <TabsContent value="surveys" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari survei..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-md bg-muted/50 p-1">
              {[
                { key: "all", label: "Semua" },
                { key: "active", label: "Aktif" },
                ...(isAdmin
                  ? [{ key: "draft", label: "Draft" }]
                  : []),
                { key: "closed", label: "Ditutup" },
                ...(isAdmin
                  ? [{ key: "mine", label: "Saya Buat" }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`text-sm px-3 py-1 rounded cursor-pointer transition-colors ${
                    filter === tab.key
                      ? "bg-background font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {surveys === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filteredSurveys.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HeartPulse />
                </EmptyMedia>
                <EmptyTitle>Belum ada survei</EmptyTitle>
                <EmptyDescription>
                  {isAdmin
                    ? "Buat survei pertama untuk mulai mengumpulkan umpan balik karyawan."
                    : "Survei baru akan muncul di sini saat diterbitkan oleh HR."}
                </EmptyDescription>
              </EmptyHeader>
              {isAdmin && (
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    className="cursor-pointer"
                  >
                    <Plus className="size-4" />
                    Buat Survei
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSurveys.map((s) => (
                <SurveyCard
                  key={s._id}
                  survey={s}
                  isAdmin={isAdmin}
                  isOwner={s.authorId === currentUser?._id}
                  onRespond={() => setRespondId(s._id)}
                  onViewResults={() => setResultsId(s._id)}
                  onPublish={() => handlePublish(s._id)}
                  onClose={() => handleClose(s._id)}
                  onDelete={() => setDeleteId(s._id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wellness" className="mt-4">
          <WellnessPanel onCheckin={() => setWellnessOpen(true)} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {isAdmin && (
        <SurveyFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          departments={departments ?? []}
        />
      )}
      <RespondSurveyDialog
        open={respondId !== null}
        onOpenChange={(o) => {
          if (!o) setRespondId(null);
        }}
        surveyId={respondId}
      />
      <SurveyResultsDialog
        open={resultsId !== null}
        onOpenChange={(o) => {
          if (!o) setResultsId(null);
        }}
        surveyId={resultsId}
      />
      <WellnessCheckinDialog
        open={wellnessOpen}
        onOpenChange={setWellnessOpen}
      />
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus survei ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua jawaban yang terkait dengan survei ini akan ikut terhapus
              dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground cursor-pointer"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${color}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16 mt-2" />
      ) : (
        <p className="mt-1 text-2xl font-bold">{value}</p>
      )}
    </Card>
  );
}

export default function EngagementPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
          <HeartPulse className="size-10 text-rose-500" />
          <p className="text-sm text-muted-foreground">
            Silakan masuk untuk mengakses survei engagement.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <EngagementInner />
      </Authenticated>
    </>
  );
}
