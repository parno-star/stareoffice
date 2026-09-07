import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  Card,
  CardContent,
} from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  Sparkles,
  Users,
  CheckCircle2,
  TrendingUp,
  LayoutList,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Library,
  MessageCircleHeart,
  Smile,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import MyOnboardingView from "./_components/MyOnboardingView.tsx";
import StartOnboardingDialog from "./_components/StartOnboardingDialog.tsx";
import OnboardingCard from "./_components/OnboardingCard.tsx";
import OnboardingDetailDialog from "./_components/OnboardingDetailDialog.tsx";
import TemplateFormDialog from "./_components/TemplateFormDialog.tsx";
import ResourcesTab from "./_components/ResourcesTab.tsx";
import CheckinsTab from "./_components/CheckinsTab.tsx";
import {
  formatOffsetDays,
  getCategoryConfig,
  getOwnerConfig,
  getPhaseConfig,
} from "./_lib/onboarding-utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";

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

function TemplateRow({ template }: { template: Doc<"onboardingTemplates"> }) {
  const updateTpl = useMutation(api.onboarding.updateTemplate);
  const removeTpl = useMutation(api.onboarding.removeTemplate);
  const cat = getCategoryConfig(template.category);
  const owner = getOwnerConfig(template.ownerRole);
  const phase = getPhaseConfig(template.phase ?? null);
  const CatIcon = cat.icon;
  const PhaseIcon = phase.icon;

  const handleToggleActive = async () => {
    try {
      await updateTpl({ id: template._id, isActive: !template.isActive });
      toast.success(
        template.isActive
          ? "Template dinonaktifkan"
          : "Template diaktifkan",
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        const d = error.data as { message?: string };
        toast.error(d.message ?? "Gagal memperbarui");
      } else {
        toast.error("Gagal memperbarui");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await removeTpl({ id: template._id });
      toast.success("Template dihapus");
    } catch (error) {
      if (error instanceof ConvexError) {
        const d = error.data as { message?: string };
        toast.error(d.message ?? "Gagal menghapus");
      } else {
        toast.error("Gagal menghapus");
      }
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${cat.iconBg}`}>
        <CatIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{template.title}</p>
            {template.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {template.description}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className={cat.badge}>
                {cat.label}
              </Badge>
              <Badge variant="outline" className={phase.accent}>
                <PhaseIcon className={`size-3 ${phase.color}`} />
                {phase.short}
              </Badge>
              <Badge variant="outline">{owner.label}</Badge>
              <span className="text-muted-foreground">
                {formatOffsetDays(template.dueOffsetDays)}
              </span>
              {!template.isActive ? (
                <Badge variant="outline" className="bg-muted">
                  Nonaktif
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              className="cursor-pointer"
              onClick={handleToggleActive}
              title={template.isActive ? "Nonaktifkan" : "Aktifkan"}
            >
              {template.isActive ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </Button>
            <TemplateFormDialog
              template={template}
              trigger={
                <Button size="icon-sm" variant="ghost" className="cursor-pointer">
                  <Pencil className="size-4" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus template ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Template akan dihapus. Checklist karyawan yang sudah
                    dibuat tidak akan terpengaruh.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingPageInner() {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const isAdmin = currentUser?.role === "admin";
  const stats = useQuery(api.onboarding.getStats, {});
  const checkinStats = useQuery(api.onboarding.checkins.getStats, {});
  const activeOnboardings = useQuery(
    api.onboarding.listActive,
    isAdmin ? { status: "all" } : "skip",
  );
  const templates = useQuery(
    api.onboarding.listTemplates,
    isAdmin ? {} : "skip",
  );

  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (uid: Id<"users">) => {
    setSelectedUser(uid);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Onboarding Karyawan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bantu karyawan baru memulai perjalanannya dengan checklist
            terstruktur, resource sambutan, dan check-in 30/60/90 hari.
          </p>
        </div>
        {isAdmin ? (
          <StartOnboardingDialog
            excludeUserIds={(activeOnboardings ?? []).map((o) => o.userId)}
          />
        ) : null}
      </div>

      {isAdmin ? (
        stats === undefined || checkinStats === undefined ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={Users}
              label="Onboarding Aktif"
              value={String(stats.activeCount)}
              accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              icon={CheckCircle2}
              label="Sudah Selesai"
              value={String(stats.completedCount)}
              accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={TrendingUp}
              label="Rata-rata Progress"
              value={`${stats.averageProgress}%`}
              accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
            />
            <StatCard
              icon={MessageCircleHeart}
              label="Check-in Masuk"
              value={String(checkinStats.submitted)}
              accent="bg-pink-500/10 text-pink-600 dark:text-pink-400"
            />
            <StatCard
              icon={Smile}
              label="Rata-rata Mood"
              value={
                checkinStats.avgMood != null
                  ? `${checkinStats.avgMood} / 5`
                  : "-"
              }
              accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </div>
        )
      ) : null}

      <Tabs defaultValue={isAdmin ? "active" : "mine"} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="mine" className="cursor-pointer">
              <Route className="size-4" />
              Onboarding Saya
            </TabsTrigger>
            <TabsTrigger value="resources" className="cursor-pointer">
              <Library className="size-4" />
              Selamat Datang
            </TabsTrigger>
            {isAdmin ? (
              <>
                <TabsTrigger value="active" className="cursor-pointer">
                  <Users className="size-4" />
                  Semua Karyawan
                </TabsTrigger>
                <TabsTrigger value="checkins" className="cursor-pointer">
                  <MessageCircleHeart className="size-4" />
                  Check-ins
                </TabsTrigger>
                <TabsTrigger value="templates" className="cursor-pointer">
                  <LayoutList className="size-4" />
                  Template Tugas
                </TabsTrigger>
              </>
            ) : null}
          </TabsList>
        </div>

        <TabsContent value="mine" className="space-y-4">
          <MyOnboardingView />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourcesTab canManage={isAdmin} />
        </TabsContent>

        {isAdmin ? (
          <>
            <TabsContent value="active" className="space-y-3">
              {activeOnboardings === undefined ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                  ))}
                </div>
              ) : activeOnboardings.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Sparkles />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada onboarding</EmptyTitle>
                    <EmptyDescription>
                      Mulai onboarding untuk karyawan baru agar mereka bisa
                      mengikuti checklist yang sudah Anda siapkan.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <StartOnboardingDialog />
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {activeOnboardings.map((o) => (
                    <OnboardingCard
                      key={o._id}
                      onboarding={o}
                      onOpen={() => openDetail(o.userId)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="checkins" className="space-y-3">
              <CheckinsTab />
            </TabsContent>

            <TabsContent value="templates" className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Tugas yang otomatis ditambahkan ke checklist setiap karyawan
                  baru.
                </p>
                <TemplateFormDialog
                  trigger={
                    <Button className="gap-1 cursor-pointer" size="sm">
                      <Plus className="size-4" />
                      Template Baru
                    </Button>
                  }
                />
              </div>
              {templates === undefined ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <LayoutList />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada template</EmptyTitle>
                    <EmptyDescription>
                      Tambahkan template seperti "Tanda tangan kontrak",
                      "Setup laptop", atau "Onboarding meeting" untuk
                      mempercepat proses.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <TemplateFormDialog
                      trigger={
                        <Button size="sm" className="gap-1 cursor-pointer">
                          <Plus className="size-4" />
                          Template Baru
                        </Button>
                      }
                    />
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <TemplateRow key={t._id} template={t} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        ) : null}
      </Tabs>

      <OnboardingDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        userId={selectedUser}
        canManage={isAdmin}
      />
    </div>
  );
}

export default function OnboardingPage() {
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
            Silakan masuk untuk melihat onboarding.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <OnboardingPageInner />
      </Authenticated>
    </>
  );
}
