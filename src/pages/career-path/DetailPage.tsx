import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  ArrowLeft,
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  Layers,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useCurrentRole } from "@/hooks/use-current-role.ts";
import LevelCard from "./_components/LevelCard.tsx";
import CareerPathFormDialog from "./_components/CareerPathFormDialog.tsx";
import LevelFormDialog from "./_components/LevelFormDialog.tsx";
import AssignEmployeeDialog from "./_components/AssignEmployeeDialog.tsx";
import AssignmentCard from "./_components/AssignmentCard.tsx";
import {
  coverGradient,
  trackLabel,
} from "./_lib/career-utils.ts";
import { cn } from "@/lib/utils.ts";

function DetailInner({ pathId }: { pathId: Id<"careerPaths"> }) {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentRole();
  const data = useQuery(api.careerPath.getPath, { pathId });
  const assignments = useQuery(api.careerPath.listPathAssignments, { pathId });
  const deletePath = useMutation(api.careerPath.deletePath);
  const deleteLevel = useMutation(api.careerPath.deleteLevel);
  const updatePath = useMutation(api.careerPath.updatePath);
  const promote = useMutation(api.careerPath.promoteToNextLevel);
  const removeAssignment = useMutation(api.careerPath.removeAssignment);

  if (data === undefined) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyTitle>Jenjang karier tidak ditemukan</EmptyTitle>
            <EmptyDescription>
              Mungkin sudah dihapus atau link tidak valid.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => navigate(isAdmin ? "/career-planning" : "/career-path")}>
              Kembali ke daftar
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const { path, levels } = data;

  const listPath = isAdmin ? "/career-planning" : "/career-path";

  const handleDelete = async () => {
    try {
      await deletePath({ pathId });
      toast.success("Jenjang karier dihapus");
      navigate(listPath);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus");
      } else {
        toast.error("Gagal menghapus");
      }
    }
  };

  const handleTogglePublish = async () => {
    try {
      await updatePath({ pathId, isPublished: !path.isPublished });
      toast.success(
        path.isPublished
          ? "Jenjang karier disembunyikan"
          : "Jenjang karier dipublikasikan",
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal memperbarui");
      } else {
        toast.error("Gagal memperbarui");
      }
    }
  };

  const handleRemoveLevel = async (levelId: Id<"careerPathLevels">) => {
    try {
      await deleteLevel({ levelId });
      toast.success("Level dihapus");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus level");
      } else {
        toast.error("Gagal menghapus level");
      }
    }
  };

  const handlePromote = async (assignmentId: Id<"careerPathAssignments">) => {
    try {
      await promote({ assignmentId });
      toast.success("Karyawan dipromosikan ke level berikutnya");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal mempromosikan");
      } else {
        toast.error("Gagal mempromosikan");
      }
    }
  };

  const handleRemoveAssignment = async (
    assignmentId: Id<"careerPathAssignments">,
  ) => {
    try {
      await removeAssignment({ assignmentId });
      toast.success("Penugasan dihapus");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus");
      } else {
        toast.error("Gagal menghapus");
      }
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1"
        onClick={() => navigate(listPath)}
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Button>

      {/* Hero */}
      <Card className="overflow-hidden pt-0">
        <div
          className={cn(
            "flex flex-col gap-2 bg-gradient-to-br p-6 text-white",
            coverGradient(path.coverColor),
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-3xl leading-none">{path.icon ?? "🚀"}</span>
            <Badge className="bg-white/20 text-white">
              {trackLabel(path.track)}
            </Badge>
            {path.department ? (
              <Badge className="bg-white/20 text-white">
                {path.department}
              </Badge>
            ) : null}
            {!path.isPublished ? (
              <Badge className="bg-black/40 text-white">Draf</Badge>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{path.title}</h1>
          <p className="max-w-3xl text-sm text-white/90 md:text-base">
            {path.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/90">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <Layers className="size-3.5" /> {path.levelCount} level
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <Users className="size-3.5" /> {path.assigneeCount} karyawan
            </span>
          </div>
        </div>
        {isAdmin ? (
          <CardContent className="flex flex-wrap gap-2 p-4">
            <CareerPathFormDialog
              path={path}
              trigger={
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <Edit className="size-4" /> Edit
                </Button>
              }
            />
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={handleTogglePublish}
            >
              {path.isPublished ? (
                <>
                  <EyeOff className="size-4" /> Sembunyikan
                </>
              ) : (
                <>
                  <Eye className="size-4" /> Publikasikan
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" /> Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus jenjang karier?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus semua level dan penugasan pada
                    jenjang ini. Tidak dapat dibatalkan.
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
          </CardContent>
        ) : null}
      </Card>

      <Tabs defaultValue="levels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="levels" className="cursor-pointer">
            <Layers className="size-4" /> Level
          </TabsTrigger>
          <TabsTrigger value="people" className="cursor-pointer">
            <Users className="size-4" /> Karyawan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="space-y-4">
          {isAdmin ? (
            <div className="flex justify-end">
              <LevelFormDialog pathId={pathId} />
            </div>
          ) : null}
          {levels.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Layers />
                </EmptyMedia>
                <EmptyTitle>Belum ada level</EmptyTitle>
                <EmptyDescription>
                  {isAdmin
                    ? "Tambahkan level pertama untuk memulai roadmap ini."
                    : "Admin belum menambahkan level pada jenjang ini."}
                </EmptyDescription>
              </EmptyHeader>
              {isAdmin ? (
                <EmptyContent>
                  <LevelFormDialog
                    pathId={pathId}
                    trigger={
                      <Button className="gap-2">
                        <Plus className="size-4" /> Level Baru
                      </Button>
                    }
                  />
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="space-y-3">
              {levels.map((l) => (
                <div key={l._id} className="space-y-2">
                  <LevelCard level={l} />
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                      <LevelFormDialog
                        pathId={pathId}
                        level={l}
                        trigger={
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1.5"
                          >
                            <Pencil className="size-3.5" /> Edit Level
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" /> Hapus Level
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus level?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Level "{l.title}" akan dihapus dari jenjang ini.
                              Karyawan yang berada di level ini akan tetap di
                              jenjang, namun referensi level akan dihapus.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveLevel(l._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          {isAdmin ? (
            <div className="flex justify-end">
              <AssignEmployeeDialog pathId={pathId} levels={levels} />
            </div>
          ) : null}
          {assignments === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>Belum ada karyawan di jenjang ini</EmptyTitle>
                <EmptyDescription>
                  {isAdmin
                    ? "Tugaskan karyawan untuk mulai memantau progres karier mereka."
                    : "Admin belum menugaskan karyawan ke jenjang ini."}
                </EmptyDescription>
              </EmptyHeader>
              {isAdmin ? (
                <EmptyContent>
                  <AssignEmployeeDialog pathId={pathId} levels={levels} />
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {assignments.map((a) => (
                <div key={a._id} className="space-y-2">
                  <AssignmentCard assignment={a} showEmployee />
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5"
                        onClick={() => handlePromote(a._id)}
                        disabled={
                          a.status === "completed" ||
                          levels.length === 0
                        }
                      >
                        <CheckCircle2 className="size-3.5" />
                        Promosikan
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" /> Hapus
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Hapus penugasan?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {a.userName ?? "Karyawan"} akan dikeluarkan dari
                              jenjang ini. Progres training dan riwayat tetap
                              tersimpan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveAssignment(a._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {isAdmin ? (
        <div className="flex items-center gap-2 rounded-lg border-l-4 border-sky-500 bg-sky-500/5 p-3 text-xs text-muted-foreground">
          <UserPlus className="size-4 text-sky-500" />
          <span>
            Tip: Tambahkan level lebih dari satu agar karyawan memiliki jalur
            progres yang jelas. Progres dihitung otomatis dari training dan KPI.
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function CareerPathDetailPage() {
  const { pathId } = useParams<{ pathId: string }>();
  if (!pathId) {
    return null;
  }
  return (
    <>
      <AuthLoading>
        <div className="space-y-6 p-6">
          <Skeleton className="h-32 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk melihat jenjang karier.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <DetailInner pathId={pathId as Id<"careerPaths">} />
      </Authenticated>
    </>
  );
}
