import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { ArrowLeft, Save, Send, Trash2, Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import StarRating from "./_components/StarRating.tsx";
import {
  RATING_DIMENSIONS,
  STATUS_BADGES,
  STATUS_LABELS,
  ratingColor,
  ratingLabel,
  type RatingKey,
  type ReviewStatus,
} from "./_lib/performance-utils.ts";
import { cn } from "@/lib/utils.ts";
import type { ReviewWithUsers } from "@/convex/performance.ts";

type EditState = {
  overallRating?: number;
  qualityRating?: number;
  productivityRating?: number;
  communicationRating?: number;
  teamworkRating?: number;
  initiativeRating?: number;
  strengths: string;
  improvements: string;
  goals: string;
  reviewerComments: string;
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fromReview(review: ReviewWithUsers): EditState {
  return {
    overallRating: review.overallRating,
    qualityRating: review.qualityRating,
    productivityRating: review.productivityRating,
    communicationRating: review.communicationRating,
    teamworkRating: review.teamworkRating,
    initiativeRating: review.initiativeRating,
    strengths: review.strengths ?? "",
    improvements: review.improvements ?? "",
    goals: review.goals ?? "",
    reviewerComments: review.reviewerComments ?? "",
  };
}

function ReviewerHeader({ review }: { review: ReviewWithUsers }) {
  const status = review.status as ReviewStatus;
  return (
    <Card>
      <CardContent className="flex flex-wrap items-start gap-4 p-5">
        <Avatar className="size-14">
          {review.revieweeAvatar ? (
            <AvatarImage src={review.revieweeAvatar} />
          ) : null}
          <AvatarFallback>{getInitials(review.revieweeName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight">
            {review.revieweeName ?? "Karyawan"}
          </h2>
          {review.revieweeJobTitle ? (
            <p className="text-sm text-muted-foreground">
              {review.revieweeJobTitle}
              {review.revieweeDepartment
                ? ` · ${review.revieweeDepartment}`
                : ""}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn(STATUS_BADGES[status])}>
              {STATUS_LABELS[status]}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {review.periodLabel}
            </div>
            <div className="text-xs text-muted-foreground">
              Reviewer: {review.reviewerName ?? "-"}
            </div>
          </div>
        </div>
        {review.overallRating !== undefined ? (
          <div className="rounded-xl border bg-muted/40 px-4 py-3 text-center">
            <div
              className={`text-2xl font-bold ${ratingColor(review.overallRating)}`}
            >
              {review.overallRating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              {ratingLabel(review.overallRating)}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReviewerEditor({ review }: { review: ReviewWithUsers }) {
  const [state, setState] = useState<EditState>(fromReview(review));
  const [saving, setSaving] = useState(false);
  const updateDraft = useMutation(api.performance.updateDraft);
  const submitReview = useMutation(api.performance.submit);
  const removeReview = useMutation(api.performance.remove);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isReadOnly = review.status !== "draft";

  // Sync external updates (e.g. when the review changes via another tab).
  useEffect(() => {
    setState(fromReview(review));
  }, [review]);

  const setField = <K extends keyof EditState>(key: K, value: EditState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDraft({
        id: review._id,
        overallRating: state.overallRating,
        qualityRating: state.qualityRating,
        productivityRating: state.productivityRating,
        communicationRating: state.communicationRating,
        teamworkRating: state.teamworkRating,
        initiativeRating: state.initiativeRating,
        strengths: state.strengths,
        improvements: state.improvements,
        goals: state.goals,
        reviewerComments: state.reviewerComments,
      });
      toast.success("Draf disimpan");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menyimpan");
      } else {
        toast.error("Gagal menyimpan");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Save latest changes first
      await updateDraft({
        id: review._id,
        overallRating: state.overallRating,
        qualityRating: state.qualityRating,
        productivityRating: state.productivityRating,
        communicationRating: state.communicationRating,
        teamworkRating: state.teamworkRating,
        initiativeRating: state.initiativeRating,
        strengths: state.strengths,
        improvements: state.improvements,
        goals: state.goals,
        reviewerComments: state.reviewerComments,
      });
      await submitReview({ id: review._id });
      toast.success("Penilaian dikirim ke karyawan");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal mengirim");
      } else {
        toast.error("Gagal mengirim");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await removeReview({ id: review._id });
      toast.success("Draf dihapus");
      navigate("/performance");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal menghapus");
      }
    }
  };

  const RatingRow = ({ dim }: { dim: (typeof RATING_DIMENSIONS)[number] }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <span className="text-sm font-medium">{dim.label}</span>
      <StarRating
        value={state[dim.key as RatingKey]}
        onChange={(v) => setField(dim.key as RatingKey, v)}
        readOnly={isReadOnly}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rating Keseluruhan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Skor Keseluruhan</p>
              <p className="text-xs text-muted-foreground">
                Wajib diisi sebelum dikirim ke karyawan
              </p>
            </div>
            <StarRating
              value={state.overallRating}
              onChange={(v) => setField("overallRating", v)}
              readOnly={isReadOnly}
              size="lg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aspek Kinerja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {RATING_DIMENSIONS.map((dim) => (
            <RatingRow key={dim.key} dim={dim} />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kekuatan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              placeholder="Apa yang menonjol dari karyawan ini?"
              value={state.strengths}
              onChange={(e) => setField("strengths", e.target.value)}
              disabled={isReadOnly}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Area Pengembangan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              placeholder="Hal apa yang perlu ditingkatkan?"
              value={state.improvements}
              onChange={(e) => setField("improvements", e.target.value)}
              disabled={isReadOnly}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tujuan Periode Berikutnya</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="Contoh: Menyelesaikan sertifikasi X, memimpin proyek Y..."
            value={state.goals}
            onChange={(e) => setField("goals", e.target.value)}
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Komentar Reviewer</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            placeholder="Catatan atau pesan tambahan untuk karyawan..."
            value={state.reviewerComments}
            onChange={(e) => setField("reviewerComments", e.target.value)}
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      {!isReadOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="gap-2 text-destructive">
                <Trash2 className="size-4" />
                Hapus Draf
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus draf penilaian?</DialogTitle>
                <DialogDescription>
                  Draf ini akan dihapus permanen. Karyawan tidak akan pernah
                  melihatnya.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Batal
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Hapus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              <Save className="size-4" />
              {saving ? "Menyimpan..." : "Simpan Draf"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || state.overallRating === undefined}
              className="gap-2"
            >
              <Send className="size-4" />
              Kirim ke Karyawan
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmployeeView({ review }: { review: ReviewWithUsers }) {
  const [comment, setComment] = useState(review.employeeComments ?? "");
  const [saving, setSaving] = useState(false);
  const acknowledge = useMutation(api.performance.acknowledge);

  const handleAcknowledge = async () => {
    setSaving(true);
    try {
      await acknowledge({ id: review._id, employeeComments: comment });
      toast.success("Penilaian dikonfirmasi");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Gagal mengonfirmasi");
      }
    } finally {
      setSaving(false);
    }
  };

  const RatingItem = ({ dim }: { dim: (typeof RATING_DIMENSIONS)[number] }) => {
    const value = review[dim.key as RatingKey];
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <span className="text-sm font-medium">{dim.label}</span>
        <StarRating value={value} readOnly />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rating Keseluruhan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Skor Keseluruhan</p>
              <p
                className={`text-xs font-medium ${ratingColor(review.overallRating)}`}
              >
                {ratingLabel(review.overallRating)}
              </p>
            </div>
            <StarRating value={review.overallRating} readOnly size="lg" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aspek Kinerja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {RATING_DIMENSIONS.map((dim) => (
            <RatingItem key={dim.key} dim={dim} />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {review.strengths ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Kekuatan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.strengths}
              </p>
            </CardContent>
          </Card>
        ) : null}
        {review.improvements ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Area Pengembangan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.improvements}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {review.goals ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Tujuan Periode Berikutnya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {review.goals}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {review.reviewerComments ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Komentar Reviewer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {review.reviewerComments}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tanggapan Karyawan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {review.status === "acknowledged" ? (
            <div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.employeeComments || "—"}
              </p>
              {review.acknowledgedAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Dikonfirmasi{" "}
                  {format(new Date(review.acknowledgedAt), "dd MMM yyyy HH:mm", {
                    locale: idLocale,
                  })}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <Textarea
                rows={4}
                placeholder="Tulis tanggapan atau apresiasi Anda (opsional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAcknowledge}
                  disabled={saving}
                  className="gap-2"
                >
                  <Send className="size-4" />
                  {saving ? "Mengirim..." : "Konfirmasi Penilaian"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceDetailInner() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const review = useQuery(
    api.performance.getById,
    reviewId ? { id: reviewId as Id<"performanceReviews"> } : "skip",
  );

  const role = useMemo<"reviewer" | "reviewee" | "admin" | null>(() => {
    if (!review || !currentUser) return null;
    if (review.reviewerId === currentUser._id) return "reviewer";
    if (review.revieweeId === currentUser._id) return "reviewee";
    return "admin";
  }, [review, currentUser]);

  if (review === undefined || currentUser === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (review === null) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate("/performance")}
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Penilaian tidak ditemukan atau sudah dihapus.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => navigate("/performance")}
      >
        <ArrowLeft className="size-4" />
        Kembali ke daftar
      </Button>

      <ReviewerHeader review={review} />

      {role === "reviewer" ? (
        <ReviewerEditor review={review} />
      ) : (
        <EmployeeView review={review} />
      )}
    </div>
  );
}

export default function PerformanceDetailPage() {
  return (
    <>
      <AuthLoading>
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-10">
          <p className="text-muted-foreground">
            Silakan masuk untuk melihat penilaian.
          </p>
          <SignInButton signInText="Masuk" />
        </div>
      </Unauthenticated>
      <Authenticated>
        <PerformanceDetailInner />
      </Authenticated>
    </>
  );
}
