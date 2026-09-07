import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  ErrorState,
  ErrorStateContent,
  ErrorStateDescription,
  ErrorStateHeader,
  ErrorStateMedia,
  ErrorStateTitle,
} from "@/components/ui/error-state.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Pin,
  Pencil,
  Trash2,
  Send,
  Newspaper,
  FileEdit,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { cn } from "@/lib/utils.ts";
import { isAdminRole } from "@/convex/roles.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import type { EnrichedAnnouncement } from "@/convex/announcements";
import {
  getCategoryMeta,
  getPriorityMeta,
} from "./_lib/news-utils.ts";
import NewsEditorDialog from "./_components/NewsEditorDialog.tsx";

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: idLocale,
    });
  } catch {
    return "";
  }
}

function absoluteDate(iso: string): string {
  try {
    return format(new Date(iso), "EEEE, d MMMM yyyy • HH:mm", {
      locale: idLocale,
    });
  } catch {
    return iso;
  }
}

export default function NewsDetailPage() {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const typedId = newsId as Id<"announcements"> | undefined;

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const news = useQuery(
    api.announcements.getById,
    typedId ? { id: typedId } : "skip",
  );
  const comments = useQuery(
    api.announcements.listComments,
    typedId ? { id: typedId } : "skip",
  );

  const toggleLike = useMutation(api.announcements.toggleLike);
  const togglePin = useMutation(api.announcements.togglePin);
  const remove = useMutation(api.announcements.remove);
  const addComment = useMutation(api.announcements.addComment);
  const deleteComment = useMutation(api.announcements.deleteComment);

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const canManage = isAdminRole(currentUser?.role ?? null);

  if (!typedId) {
    return (
      <div className="p-6">
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon">
              <Newspaper />
            </ErrorStateMedia>
            <ErrorStateTitle>Berita tidak ditemukan</ErrorStateTitle>
            <ErrorStateDescription>
              Tautan berita tidak valid.
            </ErrorStateDescription>
          </ErrorStateHeader>
          <ErrorStateContent>
            <Button onClick={() => navigate("/news")}>Kembali ke Berita</Button>
          </ErrorStateContent>
        </ErrorState>
      </div>
    );
  }

  if (news === undefined) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (news === null) {
    return (
      <div className="p-6">
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon">
              <Newspaper />
            </ErrorStateMedia>
            <ErrorStateTitle>Berita tidak ditemukan</ErrorStateTitle>
            <ErrorStateDescription>
              Berita mungkin telah dihapus atau tidak tersedia.
            </ErrorStateDescription>
          </ErrorStateHeader>
          <ErrorStateContent>
            <Button onClick={() => navigate("/news")}>Kembali ke Berita</Button>
          </ErrorStateContent>
        </ErrorState>
      </div>
    );
  }

  const categoryMeta = getCategoryMeta(news.category);
  const priorityMeta = getPriorityMeta(news.priority);
  const CategoryIcon = categoryMeta.icon;
  const PriorityIcon = priorityMeta.icon;
  const isDraft = (news.status ?? "published") === "draft";
  const canEdit = canManage || news.authorId === currentUser?._id;

  const authorInitial = (news.authorName || "?").trim().charAt(0).toUpperCase();

  const handleLike = async () => {
    try {
      await toggleLike({ id: news._id });
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message?: string };
        toast.error(message ?? "Gagal menyukai");
      }
    }
  };

  const handlePin = async () => {
    try {
      await togglePin({ id: news._id });
      toast.success(news.isPinned ? "Sematan dilepas" : "Berita disematkan");
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message?: string };
        toast.error(message ?? "Gagal menyematkan");
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Hapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    try {
      await remove({ id: news._id });
      toast.success("Pengumuman dihapus");
      navigate("/news");
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message?: string };
        toast.error(message ?? "Gagal menghapus");
      }
    }
  };

  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (trimmed.length === 0) return;
    setSubmittingComment(true);
    try {
      await addComment({ id: news._id, content: trimmed });
      setCommentText("");
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message?: string };
        toast.error(message ?? "Gagal mengirim komentar");
      } else {
        toast.error("Gagal mengirim komentar");
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: Id<"announcementComments">) => {
    if (!window.confirm("Hapus komentar ini?")) return;
    try {
      await deleteComment({ commentId });
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message?: string };
        toast.error(message ?? "Gagal menghapus komentar");
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/news")}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {canManage ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePin}
              className="gap-2"
            >
              <Pin className={cn("size-4", news.isPinned && "text-primary")} />
              {news.isPinned ? "Lepas sematan" : "Sematkan"}
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditorOpen(true)}
              className="gap-2"
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Hapus
            </Button>
          ) : null}
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border bg-card">
        {news.coverImageUrl ? (
          <div className="relative aspect-[21/9] w-full bg-muted">
            <img
              src={news.coverImageUrl}
              alt={news.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : null}

        <div className="space-y-4 p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("gap-1 border-0", categoryMeta.chipClass)}>
              <CategoryIcon className="size-3" />
              {categoryMeta.label}
            </Badge>
            {news.priority !== "normal" ? (
              <Badge
                className={cn("gap-1 border-0", priorityMeta.className)}
              >
                <PriorityIcon className="size-3" />
                {priorityMeta.label}
              </Badge>
            ) : null}
            {news.isPinned ? (
              <Badge className="gap-1 border-0 bg-primary/90 text-primary-foreground">
                <Pin className="size-3" />
                Disematkan
              </Badge>
            ) : null}
            {isDraft ? (
              <Badge className="gap-1 border-0 bg-zinc-900/80 text-white">
                <FileEdit className="size-3" />
                Draf
              </Badge>
            ) : null}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-balance lg:text-4xl">
            {news.title}
          </h1>

          {news.summary ? (
            <p className="text-lg leading-relaxed text-muted-foreground">
              {news.summary}
            </p>
          ) : null}

          <div className="flex items-center gap-3 border-y py-3">
            <Avatar className="size-10">
              {news.authorAvatarUrl ? (
                <AvatarImage src={news.authorAvatarUrl} alt={news.authorName} />
              ) : null}
              <AvatarFallback>{authorInitial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-medium">{news.authorName}</div>
              <div className="text-xs text-muted-foreground">
                {news.authorDepartment ? `${news.authorDepartment} • ` : ""}
                {absoluteDate(news.publishedAt)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "gap-2",
                news.isLikedByMe && "text-red-600 dark:text-red-400",
              )}
            >
              <Heart
                className={cn("size-4", news.isLikedByMe && "fill-current")}
              />
              <span className="tabular-nums">{news.likeCount ?? 0}</span>
            </Button>
          </div>

          <div className="prose prose-sm max-w-none whitespace-pre-line text-[15px] leading-relaxed text-foreground dark:prose-invert">
            {news.content}
          </div>
        </div>
      </article>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="size-5 text-muted-foreground" />
            Komentar
            <span className="text-sm text-muted-foreground tabular-nums">
              ({comments?.length ?? 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-3">
            <Avatar className="size-9 shrink-0">
              {currentUser?.avatarUrl ? (
                <AvatarImage
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                />
              ) : null}
              <AvatarFallback>
                {(currentUser?.name ?? "?").trim().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                rows={3}
                placeholder="Tulis komentar Anda..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={1000}
                disabled={submittingComment}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={submittingComment || commentText.trim().length === 0}
                  className="gap-2"
                >
                  <Send className="size-4" />
                  {submittingComment ? "Mengirim..." : "Kirim"}
                </Button>
              </div>
            </div>
          </div>

          {comments === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Belum ada komentar. Jadilah yang pertama memberikan tanggapan.
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => {
                const canDelete =
                  canManage || c.authorId === currentUser?._id;
                const cInitial = (c.authorName || "?")
                  .trim()
                  .charAt(0)
                  .toUpperCase();
                return (
                  <div key={c._id} className="flex gap-3">
                    <Avatar className="size-9 shrink-0">
                      {c.authorAvatarUrl ? (
                        <AvatarImage
                          src={c.authorAvatarUrl}
                          alt={c.authorName}
                        />
                      ) : null}
                      <AvatarFallback>{cInitial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 rounded-lg bg-muted/50 px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {c.authorName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.authorJobTitle ? `${c.authorJobTitle} • ` : ""}
                            {relativeTime(
                              new Date(c._creationTime).toISOString(),
                            )}
                          </div>
                        </div>
                        {canDelete ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDeleteComment(c._id)}
                            aria-label="Hapus komentar"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                      <p className="mt-1.5 whitespace-pre-line text-sm">
                        {c.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <NewsEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          editing={news}
        />
      ) : null}
    </div>
  );
}
