import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
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
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  Crown,
  Search,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { isAdminRole } from "@/convex/roles.ts";
import TeamEditorDialog from "./_components/TeamEditorDialog.tsx";
import TeamMembersDialog from "./_components/TeamMembersDialog.tsx";
import EmployeeProfileDialog from "@/pages/directory/_components/EmployeeProfileDialog.tsx";
import { colorClasses, getInitials, type ColorToken } from "@/pages/organization/_lib/org-utils.ts";
import { cn } from "@/lib/utils.ts";

function TeamsContent() {
  const teams = useQuery(api.organization.listTeams, {});
  const users = useQuery(api.organization.listAll, {});
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const deleteTeam = useMutation(api.organization.deleteTeam);

  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Doc<"teams"> | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersTeam, setMembersTeam] = useState<Doc<"teams"> | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Doc<"teams"> | null>(null);
  const [profileUserId, setProfileUserId] = useState<Id<"users"> | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = isAdminRole(currentUser?.role);

  const filtered = (teams ?? []).filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      entry.team.name.toLowerCase().includes(q) ||
      (entry.team.description ?? "").toLowerCase().includes(q) ||
      entry.members.some(
        (m) =>
          (m.name ?? "").toLowerCase().includes(q) ||
          (m.jobTitle ?? "").toLowerCase().includes(q),
      )
    );
  });

  const handleDelete = async () => {
    if (!deletingTeam) return;
    try {
      await deleteTeam({ teamId: deletingTeam._id });
      toast.success("Tim dihapus");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus tim");
      } else {
        toast.error("Gagal menghapus tim");
      }
    } finally {
      setDeletingTeam(null);
    }
  };

  const isLoading = teams === undefined || users === undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <UsersRound className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tim Lintas Departemen
            </h1>
            <p className="text-sm text-muted-foreground">
              Squad dan tim kolaboratif yang melintasi batas departemen.
            </p>
          </div>
        </div>
        {isAdmin ? (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditingTeam(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="size-4" />
            Tim Baru
          </Button>
        ) : null}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari tim atau anggota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRound />
            </EmptyMedia>
            <EmptyTitle>
              {search ? "Tidak ada tim yang cocok" : "Belum ada tim"}
            </EmptyTitle>
            <EmptyDescription>
              {search
                ? "Coba kata kunci lain atau hapus pencarian."
                : isAdmin
                  ? "Buat tim lintas departemen untuk kolaborasi strategis."
                  : "Admin belum membuat tim lintas departemen."}
            </EmptyDescription>
          </EmptyHeader>
          {isAdmin && !search ? (
            <EmptyContent>
              <Button
                size="sm"
                onClick={() => {
                  setEditingTeam(null);
                  setEditorOpen(true);
                }}
              >
                Buat Tim Baru
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((entry) => {
            const color: ColorToken = (entry.team.color as ColorToken) ?? "blue";
            const c = colorClasses(color);
            return (
              <Card
                key={entry.team._id}
                className={cn("relative overflow-hidden pt-0")}
              >
                <div className={cn("h-2 w-full", c.bgSolid)} />
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl text-xl",
                          c.bg,
                          c.text,
                        )}
                      >
                        {entry.team.icon ?? <UsersRound className="size-5" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold">
                          {entry.team.name}
                        </h3>
                        {entry.team.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {entry.team.description}
                          </p>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn("gap-1 text-[10px]", c.border, c.text)}
                          >
                            <UsersRound className="size-3" />
                            {entry.members.length} anggota
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {isAdmin ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingTeam(entry.team);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeletingTeam(entry.team)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {/* Lead */}
                  {entry.lead ? (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2",
                        c.border,
                        c.bg,
                      )}
                    >
                      <Avatar className="size-8">
                        {entry.lead.avatarUrl ? (
                          <AvatarImage
                            src={entry.lead.avatarUrl}
                            alt={entry.lead.name ?? ""}
                          />
                        ) : null}
                        <AvatarFallback
                          className={cn("text-xs font-semibold", c.text)}
                        >
                          {getInitials(entry.lead.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <Crown className={cn("size-3", c.text)} />
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Team Lead
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold">
                          {entry.lead.name ?? "Tanpa Nama"}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Members avatars */}
                  <div className="flex items-center -space-x-2">
                    {entry.members.slice(0, 8).map((m) => (
                      <Avatar
                        key={m._id}
                        className="size-8 cursor-pointer border-2 border-background transition-transform hover:z-10 hover:scale-110"
                        onClick={() => {
                          setProfileUserId(m._id);
                          setProfileOpen(true);
                        }}
                      >
                        {m.avatarUrl ? (
                          <AvatarImage src={m.avatarUrl} alt={m.name ?? ""} />
                        ) : null}
                        <AvatarFallback className="bg-muted text-[10px] font-semibold">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {entry.members.length > 8 ? (
                      <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[11px] font-semibold">
                        +{entry.members.length - 8}
                      </div>
                    ) : null}
                    {entry.members.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Belum ada anggota
                      </p>
                    ) : null}
                  </div>

                  {isAdmin ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={() => {
                        setMembersTeam(entry.team);
                        setMembersOpen(true);
                      }}
                    >
                      <UserPlus className="size-3.5" />
                      Kelola Anggota
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={() => {
                        setMembersTeam(entry.team);
                        setMembersOpen(true);
                      }}
                    >
                      <UserMinus className="size-3.5" />
                      Lihat Anggota
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TeamEditorDialog
        open={editorOpen}
        onOpenChange={(v) => {
          setEditorOpen(v);
          if (!v) setEditingTeam(null);
        }}
        editing={editingTeam}
        allUsers={users ?? []}
      />

      <TeamMembersDialog
        team={membersTeam}
        open={membersOpen}
        onOpenChange={(v) => {
          setMembersOpen(v);
          if (!v) setMembersTeam(null);
        }}
        allUsers={users ?? []}
        isAdmin={isAdmin}
      />

      <EmployeeProfileDialog
        userId={profileUserId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      <AlertDialog
        open={deletingTeam !== null}
        onOpenChange={(v) => !v && setDeletingTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tim?</AlertDialogTitle>
            <AlertDialogDescription>
              Tim &ldquo;{deletingTeam?.name}&rdquo; akan dihapus beserta seluruh
              anggotanya. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-6xl p-4 lg:p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk melihat tim.
        </div>
      </Unauthenticated>
      <Authenticated>
        <TeamsContent />
      </Authenticated>
    </>
  );
}
