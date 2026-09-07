import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  ArrowLeft,
  PartyPopper,
  Star,
  Sparkles,
  FileText,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import AwardFormDialog from "./_components/AwardFormDialog.tsx";
import {
  getCategoryConfig,
  getInitials,
  formatAwardDate,
  formatBonus,
} from "./_lib/awards-utils.ts";
import { cn } from "@/lib/utils.ts";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
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
import { isAdminRole } from "@/convex/roles.ts";

export default function AwardDetailPage() {
  const { awardId } = useParams<{ awardId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const award = useQuery(
    api.awards.getAwardById,
    awardId ? { awardId: awardId as Id<"awards"> } : "skip",
  );
  const congratulations = useQuery(
    api.awards.listCongratulations,
    awardId ? { awardId: awardId as Id<"awards"> } : "skip",
  );
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const toggleCongrats = useMutation(api.awards.toggleCongratulations);
  const deleteAward = useMutation(api.awards.deleteAward);

  const isAdmin = isAdminRole(currentUser?.role);

  if (award === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 lg:p-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (award === null) {
    return (
      <div className="mx-auto max-w-4xl p-4 lg:p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyTitle>Penghargaan tidak ditemukan</EmptyTitle>
            <EmptyDescription>
              Mungkin sudah dihapus atau Anda tidak memiliki akses.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => navigate("/awards")}>
            Kembali ke daftar
          </Button>
        </Empty>
      </div>
    );
  }

  const cfg = getCategoryConfig(award.category);
  const Icon = cfg.icon;

  const handleSendCongrats = async () => {
    setSending(true);
    try {
      const result = await toggleCongrats({
        awardId: award._id,
        message: message.trim() || undefined,
      });
      if (result.congratulated) {
        toast.success("Ucapan selamat terkirim!");
        setMessage("");
      } else {
        toast.info("Ucapan selamat dibatalkan");
      }
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal mengirim ucapan");
      } else {
        toast.error("Gagal mengirim ucapan");
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAward({ awardId: award._id });
      toast.success("Penghargaan dihapus");
      navigate("/awards");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus penghargaan");
      } else {
        toast.error("Gagal menghapus penghargaan");
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/awards")}
          className="cursor-pointer gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        {isAdmin ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditOpen(true)}
              className="cursor-pointer gap-1.5"
            >
              <Pencil className="size-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus penghargaan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan.
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
        ) : null}
      </div>

      {/* Trophy hero */}
      <Card
        className={cn(
          "overflow-hidden bg-gradient-to-br",
          cfg.gradient,
          "ring-2 ring-offset-2 ring-offset-background",
          cfg.ring,
        )}
      >
        <CardContent className="space-y-5 py-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("gap-1 font-semibold", cfg.badge)}
            >
              <Icon className="size-3.5" />
              {cfg.label}
            </Badge>
            {award.periodLabel ? (
              <Badge variant="secondary">
                <Calendar className="mr-1 size-3" />
                {award.periodLabel}
              </Badge>
            ) : null}
            {award.isFeatured ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
              >
                <Sparkles className="size-3" />
                Featured
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <Avatar className="size-28 ring-4 ring-background shadow-xl">
                {award.recipientAvatar ? (
                  <AvatarImage src={award.recipientAvatar} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-3xl font-bold">
                  {getInitials(award.recipientName)}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full bg-background shadow-lg ring-2 ring-background",
                )}
              >
                <Icon className={cn("size-5", cfg.iconColor)} />
              </div>
            </div>
            <div>
              <Link
                to={`/directory`}
                className="text-3xl font-bold tracking-tight hover:underline"
              >
                {award.recipientName ?? "Karyawan"}
              </Link>
              {award.recipientJobTitle ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {award.recipientJobTitle}
                  {award.recipientDepartment
                    ? ` • ${award.recipientDepartment}`
                    : ""}
                </p>
              ) : null}
            </div>
            <h1 className="max-w-2xl text-2xl font-bold text-balance">
              {award.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Diberikan pada {formatAwardDate(award.awardedOn)} oleh{" "}
              {award.awardedByName ?? "Admin"}
            </p>
          </div>

          {/* Description */}
          {award.description ? (
            <div className="rounded-xl border bg-card/80 p-4 backdrop-blur-sm">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {award.description}
              </p>
            </div>
          ) : null}

          {/* Extras */}
          <div className="grid gap-3 md:grid-cols-2">
            {award.bonusAmount && award.bonusAmount > 0 ? (
              <div className="flex items-center gap-3 rounded-lg border bg-card/80 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bonus</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatBonus(award.bonusAmount)}
                  </p>
                </div>
              </div>
            ) : null}
            {award.certificateUrl ? (
              <a
                href={award.certificateUrl}
                target="_blank"
                rel="noreferrer"
                className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card/80 p-3 transition-colors hover:bg-card"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <FileText className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Sertifikat</p>
                  <p className="text-sm font-semibold">Lihat sertifikat</p>
                </div>
                <ExternalLink className="size-4 text-muted-foreground" />
              </a>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Congratulations */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="size-5 text-muted-foreground" />
              Ucapan Selamat
              <Badge variant="secondary">
                {award.congratulationCount ?? 0}
              </Badge>
            </h2>
          </div>

          <div className="space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis ucapan selamat (opsional)..."
              rows={2}
              maxLength={500}
              disabled={sending}
            />
            <div className="flex items-center justify-end">
              <Button
                onClick={handleSendCongrats}
                disabled={sending}
                className={cn(
                  "cursor-pointer gap-2",
                  award.hasCongratulated &&
                    "bg-amber-500 text-white hover:bg-amber-600",
                )}
              >
                {award.hasCongratulated ? (
                  <>
                    <Star className="size-4 fill-current" />
                    Sudah mengucapkan selamat
                  </>
                ) : (
                  <>
                    <PartyPopper className="size-4" />
                    Kirim Selamat
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3 pt-2">
            {congratulations === undefined ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : congratulations.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Belum ada ucapan selamat. Jadilah yang pertama!
              </p>
            ) : (
              congratulations.map((c) => (
                <div
                  key={c._id}
                  className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
                >
                  <Avatar className="size-9 shrink-0">
                    {c.userAvatar ? <AvatarImage src={c.userAvatar} /> : null}
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold">
                      {getInitials(c.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-sm font-semibold">
                        {c.userName ?? "Seseorang"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c._creationTime), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                    </div>
                    {c.message ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                        {c.message}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm italic text-muted-foreground">
                        Mengucapkan selamat
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AwardFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={award}
      />
    </div>
  );
}
