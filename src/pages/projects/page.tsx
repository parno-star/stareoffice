import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { FolderKanban, Settings2 } from "lucide-react";
import ProjectCard from "./_components/ProjectCard.tsx";
import CreateProjectDialog from "./_components/CreateProjectDialog.tsx";
import MyTasksList from "./_components/MyTasksList.tsx";
import OperationsSettingsPanel from "./_components/OperationsSettingsPanel.tsx";
import { canManageOperations } from "@/convex/roles.ts";

export default function ProjectsPage() {
  const projects = useQuery(api.projects.listProjects, {});
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const canManage = canManageOperations(currentUser?.role);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tugas & Proyek Tim
          </h1>
          <p className="text-muted-foreground">
            Kelola proyek, tugaskan ke tim, dan pantau progres bersama.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2 cursor-pointer">
                  <Settings2 className="size-4" />
                  Tahapan & Prioritas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Pengaturan Operasi</DialogTitle>
                  <DialogDescription>
                    Sesuaikan tahapan tugas dan tingkat prioritas untuk
                    organisasi Anda.
                  </DialogDescription>
                </DialogHeader>
                <OperationsSettingsPanel />
              </DialogContent>
            </Dialog>
          )}
          <CreateProjectDialog />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Proyek Saya</h2>
          {projects === undefined ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanban />
                </EmptyMedia>
                <EmptyTitle>Belum ada proyek</EmptyTitle>
                <EmptyDescription>
                  Buat proyek pertama Anda untuk mulai berkolaborasi dengan
                  tim.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateProjectDialog />
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
        <div>
          <MyTasksList />
        </div>
      </div>
    </div>
  );
}
