import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import {
  ArrowLeft,
  Pin,
  Pencil,
  CheckCircle2,
  AlertCircle,
  ScrollText,
  Paperclip,
  Download,
  Eye,
  Archive,
  ShieldCheck,
  FileText,
  Users,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { cn } from "@/lib/utils.ts";
import { isAdminRole } from "@/convex/roles.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import MarkdownContent from "@/pages/wiki/_components/MarkdownContent.tsx";
import PolicyEditorDialog from "./_components/PolicyEditorDialog.tsx";
import {
  formatEffectiveDate,
  formatRelative,
  getPolicyCategory,
} from "./_lib/policy-utils.ts";
import type { PolicyListItem } from "@/convex/policies.ts";

function PolicyDetailInner({ policyId }: { policyId: Id<"policies"> }) {
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const policy = useQuery(api.policies.getById, { policyId });
  const canManage = isAdminRole(currentUser?.role ?? null);
  const acknowledgments = useQuery(
    api.policies.getAcknowledgments,
    canManage ? { policyId } : "skip",
  );
  const pending = useQuery(
    api.policies.getPendingAcknowledgments,
    canManage ? { policyId } : "skip",
  );

  const acknowledge = useMutation(api.policies.acknowledge);
  const archive = useMutation(api.policies.archive);
  const publish = useMutation(api.policies.publish);
  const incrementView = useMutation(api.policies.incrementView);

  const [editorOpen, setEditorOpen] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);

  // Increment view count once on mount
  useEffect(() => {
    if (policy) {
      void incrementView({ policyId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyId, policy === null]);

  if (policy === undefined) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 lg:p-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (policy === null) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon">
              <ScrollText />
            </ErrorStateMedia>
            <ErrorStateTitle>Kebijakan tidak ditemukan</ErrorStateTitle>
            <ErrorStateDescription>
              Kebijakan mungkin telah dihapus atau belum dipublikasikan.
            </ErrorStateDescription>
          </ErrorStateHeader>
          <ErrorStateContent>
            <Button onClick={() => navigate("/policies")}>
              <ArrowLeft className="size-4" />
              Kembali ke Daftar
            </Button>
          </ErrorStateContent>
        </ErrorState>
      </div>
    );
  }

  const category = getPolicyCategory(policy.category);
  const CategoryIcon = category.icon;
  const isDraft = policy.status === "draft";
  const isArchived = policy.status === "archived";

  const handleAcknowledge = async () => {
    setAckLoading(true);
    try {
      await acknowledge({ policyId });
      toast.success("Terima kasih, konfirmasi Anda tercatat.");
    } catch (err) {
      if (err instanceof ConvexError) {
        const { message } = err.data as { message?: string };
        toast.error(message ?? "Gagal mengkonfirmasi");
      } else {
        toast.error("Gagal mengkonfirmasi");
      }
    } finally {
      setAckLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await publish({ policyId });
      toast.success("Kebijakan dipublikasikan");
    } catch {
      toast.error("Gagal mempublikasikan");
    }
  };

  const handleArchive = async () => {
    const ok = window.confirm("Arsipkan kebijakan ini?");
    if (!ok) return;
    try {
      await archive({ policyId });
      toast.success("Kebijakan diarsipkan");
    } catch {
      toast.error("Gagal mengarsipkan");
    }
  };

  // A simplified PolicyListItem that the editor dialog can consume
  const editingListItem: PolicyListItem = {
    _id: policy._id,
    _creationTime: policy._creationTime,
    title: policy.title,
    summary: policy.summary,
    category: policy.category,
    version: policy.version,
    status: policy.status,
    requiresAcknowledgment: policy.requiresAcknowledgment,
    effectiveDate: policy.effectiveDate,
    isPinned: Boolean(policy.isPinned),
    tags: policy.tags,
    viewCount: policy.viewCount,
    acknowledgmentCount: policy.acknowledgmentCount,
    publishedAt: policy.publishedAt,
    lastEditedAt: policy.lastEditedAt,
    hasAcknowledged: policy.hasAcknowledged,
    authorName: policy.authorName,
  };

  const totalUsers = (acknowledgments?.length ?? 0) + (pending?.length ?? 0);
  const ackPct =
    totalUsers === 0
      ? 0
      : Math.round(((acknowledgments?.length ?? 0) / totalUsers) * 100);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 lg:p-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/policies")}>
          <ArrowLeft className="size-4" />
          Kembali ke Daftar
        </Button>
      </div>

      {/* Header card */}
      <Card
        className={cn(
          "overflow-hidden",
          policy.isPinned && "border-primary/40",
        )}
      >
        <CardContent className="space-y-4 p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {policy.isPinned ? (
              <Badge variant="secondary" className="gap-1">
                <Pin className="size-3" />
                Disematkan
              </Badge>
            ) : null}
            <Badge variant="outline" className={cn("gap-1", category.tone)}>
              <CategoryIcon className="size-3" />
              {category.label}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              v{policy.version}
            </Badge>
            {isDraft ? (
              <Badge variant="outline" className="gap-1">
                <FileText className="size-3" />
                Draf
              </Badge>
            ) : null}
            {isArchived ? (
              <Badge variant="outline" className="gap-1">
                <Archive className="size-3" />
                Diarsip
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl text-balance">
                {policy.title}
              </h1>
              <p className="max-w-3xl text-muted-foreground">
                {policy.summary}
              </p>
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditorOpen(true)}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                {isDraft ? (
                  <Button size="sm" onClick={handlePublish}>
                    <ShieldCheck className="size-4" />
                    Publikasikan
                  </Button>
                ) : null}
                {!isArchived ? (
                  <Button variant="ghost" size="sm" onClick={handleArchive}>
                    <Archive className="size-4" />
                    Arsipkan
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              Berlaku: {formatEffectiveDate(policy.effectiveDate)}
            </span>
            {policy.expiresAt ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                Berakhir: {formatEffectiveDate(policy.expiresAt)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4" />
              {policy.viewCount} dibaca
            </span>
            <span>Diperbarui {formatRelative(policy.lastEditedAt)}</span>
            {policy.authorName ? (
              <span>oleh {policy.authorName}</span>
            ) : null}
          </div>

          {(policy.tags ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {(policy.tags ?? []).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}

          {policy.attachmentUrl && policy.attachmentFileName ? (
            <a
              href={policy.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Paperclip className="size-4" />
              <span className="truncate max-w-[24ch]">
                {policy.attachmentFileName}
              </span>
              <Download className="size-4 text-muted-foreground" />
            </a>
          ) : null}
        </CardContent>
      </Card>

      {/* Acknowledgment banner */}
      {policy.requiresAcknowledgment && policy.status === "published" ? (
        <Card
          className={cn(
            policy.hasAcknowledged
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-amber-500/30 bg-amber-500/5",
          )}
        >
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            {policy.hasAcknowledged ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold">
                    Anda telah mengkonfirmasi kebijakan ini
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Konfirmasi Anda tercatat untuk versi {policy.version}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold">
                    Kebijakan ini wajib Anda konfirmasi
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bacalah keseluruhan isi kebijakan sebelum mengkonfirmasi.
                  </p>
                </div>
              </div>
            )}
            {!policy.hasAcknowledged ? (
              <Button onClick={handleAcknowledge} disabled={ackLoading}>
                <CheckCircle2 className="size-4" />
                {ackLoading ? "Menyimpan..." : "Saya paham & setuju"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Content */}
      <Card>
        <CardContent className="p-6 lg:p-8">
          <MarkdownContent content={policy.content} />
        </CardContent>
      </Card>

      {/* Admin-only acknowledgment tracking */}
      {canManage && policy.requiresAcknowledgment ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              Status Konfirmasi Karyawan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {acknowledgments?.length ?? 0} dari {totalUsers} karyawan
                </span>
                <span className="text-muted-foreground">{ackPct}%</span>
              </div>
              <Progress value={ackPct} className="h-2" />
            </div>

            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">
                  Belum Konfirmasi ({pending?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="done">
                  Sudah Konfirmasi ({acknowledgments?.length ?? 0})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                {pending === undefined ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : pending.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Semua karyawan sudah mengkonfirmasi.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {pending.map((u) => (
                      <li
                        key={u.userId}
                        className="flex items-center gap-3 rounded-lg border p-2"
                      >
                        <Avatar className="size-8">
                          <AvatarImage src={u.userAvatar} alt={u.userName} />
                          <AvatarFallback>
                            {u.userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {u.userName}
                          </p>
                          {u.userDepartment ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {u.userDepartment}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="done" className="mt-4">
                {acknowledgments === undefined ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : acknowledgments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada konfirmasi.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {acknowledgments.map((a) => (
                      <li
                        key={a._id}
                        className="flex items-center gap-3 rounded-lg border p-2"
                      >
                        <Avatar className="size-8">
                          <AvatarImage src={a.userAvatar} alt={a.userName} />
                          <AvatarFallback>
                            {a.userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {a.userName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {a.userDepartment ?? "-"} &middot; v{a.version}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelative(a.acknowledgedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      <PolicyEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editingListItem}
        fullPolicy={policy}
      />
    </div>
  );
}

export default function PolicyDetailPage() {
  const { policyId } = useParams<{ policyId: string }>();
  if (!policyId) return null;
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-4xl space-y-4 p-4 lg:p-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Silakan masuk untuk melihat kebijakan ini.
        </div>
      </Unauthenticated>
      <Authenticated>
        <PolicyDetailInner policyId={policyId as Id<"policies">} />
      </Authenticated>
    </>
  );
}
